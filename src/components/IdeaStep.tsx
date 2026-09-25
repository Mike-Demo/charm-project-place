import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { streamImage } from "@/lib/stream-image";

export const MAX_SKETCH_ATTEMPTS = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export interface IdeaDraft {
  description: string;
  referenceImage: string | null;
  conceptSketch: string | null;
  sketchAttempts: number;
}

export const EMPTY_IDEA: IdeaDraft = { description: "", referenceImage: null, conceptSketch: null, sketchAttempts: 0 };

function friendlyError(message: string): string {
  if (/\b402\b/.test(message)) return "The sketch artist is out of ink right now (AI credits used up). You can still book — the studio will see your photo.";
  if (/\b429\b/.test(message)) return "Lots of sketches in progress. Give it a minute and try again.";
  if (/\b403\b|content_policy|moderation/i.test(message)) return "That photo couldn't be sketched. Try a different reference — your booking can continue without it.";
  if (/\b400\b/.test(message)) return "Please upload a JPG, PNG or WEBP photo under 10 MB.";
  return "The sketch didn't come through. You can try again or skip this for now.";
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

interface IdeaStepProps {
  value: IdeaDraft;
  onChange: (next: IdeaDraft) => void;
}

export function IdeaStep({ value, onChange }: IdeaStepProps) {
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!value.referenceImage) fileRef.current = null;
  }, [value.referenceImage]);

  const pickFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ALLOWED.includes(file.type) || file.size > MAX_BYTES) {
      setError("Please upload a JPG, PNG or WEBP photo under 10 MB.");
      return;
    }
    fileRef.current = file;
    const url = await readAsDataUrl(file);
    setPreview(null);
    onChange({ ...value, referenceImage: url, conceptSketch: null });
  };

  const dataUrlToFile = async (url: string): Promise<File> => {
    const blob = await (await fetch(url)).blob();
    return new File([blob], "reference", { type: blob.type });
  };

  const sketch = async () => {
    if (!value.referenceImage || working || value.sketchAttempts >= MAX_SKETCH_ATTEMPTS) return;
    setWorking(true);
    setError(null);
    const attempts = value.sketchAttempts + 1;
    onChange({ ...value, sketchAttempts: attempts, conceptSketch: null });
    const form = new FormData();
    form.append("image", fileRef.current ?? (await dataUrlToFile(value.referenceImage)));
    form.append("description", value.description);
    let latest: string | null = null;
    try {
      await streamImage("/api/sketch-concept", form, (src, final) => {
        latest = src;
        setPreview(src);
        setIsFinal(final);
      });
      onChange({ ...value, sketchAttempts: attempts, conceptSketch: latest });
    } catch (caught) {
      setPreview(null);
      setError(friendlyError(caught instanceof Error ? caught.message : ""));
    } finally {
      setWorking(false);
    }
  };

  const shownSketch = working ? preview : value.conceptSketch;
  const attemptsLeft = MAX_SKETCH_ATTEMPTS - value.sketchAttempts;

  return (
    <section className="flex min-h-[280px] flex-col justify-center">
      <p className="mb-2 font-mono text-sm text-ink-pencil/60">Optional // Your idea</p>
      <h2 className="mb-4 text-3xl font-normal leading-snug sm:text-4xl">What are we tattooing?</h2>

      <label htmlFor="idea-notes" className="mb-1 font-mono text-sm text-ink-pencil">Describe it — placement, size, style, meaning</label>
      <textarea
        id="idea-notes"
        maxLength={1000}
        rows={4}
        value={value.description}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
        placeholder="e.g. A small fine-line peony on my inner forearm, for my grandma…"
        className="w-full resize-y rounded-lg border-0 bg-transparent p-2 text-lg leading-8 text-foreground outline-none [background-image:repeating-linear-gradient(transparent_0_31px,var(--paper-line)_31px_32px)]"
      />
      <p className="mt-1 text-right font-mono text-xs text-ink-pencil">{value.description.length}/1000</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-sm text-ink-pencil">Reference photo</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); void pickFile(e.dataTransfer.files[0]); }}
            className={`sketch-card flex aspect-square w-full items-center justify-center overflow-hidden p-2 text-center transition-colors ${dragging ? "border-cyan-draft" : ""}`}
          >
            {value.referenceImage ? (
              <img src={value.referenceImage} alt="Your reference" className="h-full w-full rounded-md object-cover" />
            ) : (
              <span className="px-4 font-hand text-lg text-ink-pencil">✎ Drop a photo or tap to upload<br /><span className="font-mono text-xs">JPG · PNG · WEBP · 10 MB</span></span>
            )}
          </button>
          <input ref={inputRef} type="file" accept={ALLOWED.join(",")} className="sr-only" aria-label="Upload reference photo" onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = ""; }} />
          {value.referenceImage && (
            <Button variant="link" className="h-11 p-0 font-hand text-base text-ink-pencil" onClick={() => { setPreview(null); onChange({ ...value, referenceImage: null, conceptSketch: null }); }}>
              Remove photo ✕
            </Button>
          )}
        </div>

        <div>
          <p className="mb-2 font-mono text-sm text-ink-pencil">Pencil concept</p>
          <div className="sketch-card flex aspect-square w-full items-center justify-center overflow-hidden p-2 text-center" aria-live="polite">
            {shownSketch ? (
              <img src={shownSketch} alt="Pencil concept sketch of your idea" className={`h-full w-full rounded-md object-cover transition-[filter] duration-500 ${working && !isFinal ? "blur-2xl" : "blur-0"}`} />
            ) : working ? (
              <span className="animate-pulse font-hand text-lg text-ink-pencil">Sharpening pencils…<br />this can take up to a minute</span>
            ) : (
              <span className="px-4 font-hand text-lg text-ink-pencil">Upload a photo and we&apos;ll rough out a graphite concept for you and the artist.</span>
            )}
          </div>
          <Button
            aria-disabled={!value.referenceImage || working || attemptsLeft <= 0}
            onClick={() => void sketch()}
            className={`ink-stamp-btn mt-3 h-auto w-full rounded-2xl px-5 py-3 font-hand text-lg font-bold ${!value.referenceImage || working || attemptsLeft <= 0 ? "opacity-60" : ""}`}
          >
            {working ? "Sketching…" : value.conceptSketch ? "Redraw ✎" : "Sketch my concept ✎"}
          </Button>
          <p className="mt-2 font-mono text-xs text-ink-pencil">{attemptsLeft > 0 ? `${attemptsLeft} sketch${attemptsLeft === 1 ? "" : "es"} left` : "Sketch limit reached — the artist will refine it with you."}</p>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-pencil-red">{error}</p>}
      <p className="mt-4 text-sm text-ink-pencil">This step is optional — press Continue to skip it.</p>
    </section>
  );
}
