import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StepArtwork } from "@/components/StepArtwork";
import {
  PRONOUN_OPTIONS,
  TIME_SLOTS,
  addDays,
  buildAvailability,
  formatLongDate,
  formatPhone,

  generateVerificationCode,
  isDayFull,
  isSlotTaken,
  sameDay,
  startOfDay,
  toDateKey,
  type Appointment,
} from "@/lib/atelier";
import { ConfirmedPass } from "@/components/ConfirmedPass";
import { ConfirmingSketch } from "@/components/ConfirmingSketch";

import { fetchUnavailableSlots, fetchConfirmedBooking, fetchBookingByToken, fetchBookingToken, getBookingStatus, holdAppointment, releaseAppointment, type BookingInput } from "@/lib/atelier-service";
import { openSlotCheckout, setPaddleEventListener } from "@/lib/paddle";
import { animateSheetIn, animateStudioDraftEntrance, pickPop, prefersReducedMotion, shakeField, stampPill, stampPress, staggerRows } from "@/lib/motion";

const stepMeta = [
  { badge: "Step 01 // 07", hint: "Your name", title: "Step 1: Name" },
  { badge: "Step 02 // 07", hint: "Your pronouns", title: "Step 2: Pronouns" },
  { badge: "Step 03 // 07", hint: "Preferred day", title: "Step 3: Day" },
  { badge: "Step 04 // 07", hint: "Date & time", title: "Step 4: Date & Time" },
  { badge: "Step 05 // 07", hint: "Phone number", title: "Step 5: Phone" },
  { badge: "Step 06 // 07", hint: "SMS pass code", title: "Step 6: Verify" },
  { badge: "Step 07 // 07", hint: "Digital stencil", title: "Step 7: Email" },
  { badge: "Review // Final", hint: "Ready to ink", title: "Review & Lock In" },
] as const;

const TOTAL_STEPS = stepMeta.length;

type DayChoice = "today" | "tomorrow" | "weekend" | "other";

const DAY_OPTIONS: ReadonlyArray<{ id: DayChoice; label: string; note: string; mark: string }> = [
  { id: "today", label: "Today", note: "If a station is still open", mark: "✦" },
  { id: "tomorrow", label: "Tomorrow", note: "Fresh sheet, fresh ink", mark: "✧" },
  { id: "weekend", label: "This weekend", note: "Saturday or Sunday", mark: "✸" },
  { id: "other", label: "Another day", note: "Pick it on the calendar", mark: "✎" },
];

const WEEKDAY_MARKS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function resolveChoiceDate(choice: DayChoice, today: Date): Date {
  if (choice === "today") return today;
  if (choice === "tomorrow") return addDays(today, 1);
  if (choice === "weekend") {
    const offset = (6 - today.getDay() + 7) % 7;
    return addDays(today, offset === 0 ? 7 : offset);
  }
  return addDays(today, 2);
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Session Details — Tattoo Atelier" },
      { name: "description", content: "Confirm your custom linework session at Tattoo Atelier." },
      { property: "og:title", content: "Session Details — Tattoo Atelier" },
      { property: "og:description", content: "Confirm your custom linework session at Tattoo Atelier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TattooAtelier,
});

function WaveUnderline() {
  return (
    <svg aria-hidden="true" className="absolute -bottom-2 left-0 h-2.5 w-full overflow-visible text-pencil-red" fill="none" preserveAspectRatio="none" viewBox="0 0 160 8">
      <path d="M 0 4 Q 10 1, 20 4 T 40 4 T 60 4 T 80 4 T 100 4 T 120 4 T 140 4 T 160 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

// Second-pass pencil trace under an answer line; wobbles with the logo's boil.
function BoilRule({ tone = "text-ink-dim/50" }: { tone?: string }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute -bottom-1.5 left-0 h-2 w-full overflow-visible ${tone}`} fill="none" preserveAspectRatio="none" viewBox="0 0 160 8">
      <path d="M 1 5 C 40 3.4, 80 6, 120 4.2 S 150 5.4, 159 4.6" filter="url(#atelier-boil-fine)" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function TattooAtelier() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pronounChoice, setPronounChoice] = useState<string | null>(null);
  const [customPronouns, setCustomPronouns] = useState("");
  const [dayChoice, setDayChoice] = useState<DayChoice | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [passToken, setPassToken] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState<string | null>(null);
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const pillsRef = useRef<HTMLDivElement | null>(null);
  const draftRef = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const initialStepEffect = useRef(true);

  const firstName = name.trim().split(/\s+/)[0] || "";
  const hasFullName = name.trim().split(/\s+/).filter(Boolean).length >= 2;
  const nameValid = name.trim().length >= 2;

  const phoneValid = phone.replace(/\D/g, "").length >= 10;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const scheduleValid = selectedDate !== null && selectedTime !== null;
  const pronounsValid = pronounChoice !== null && (pronounChoice !== "custom" || customPronouns.trim().length > 0);
  const pronounsValue =
    pronounChoice === null ? "" : pronounChoice === "custom" ? customPronouns.trim() : pronounChoice === "private" ? "" : pronounChoice;
  const pronounsLabel = pronounChoice === "private" ? "Prefer not to say" : pronounsValue;
  const joinedCode = codeDigits.join("");
  const codeValid = smsCode !== null && joinedCode === smsCode;
  const allValid = nameValid && pronounsValid && scheduleValid && phoneValid && codeValid && emailValid;
  const currentMeta = stepMeta[step - 1] ?? stepMeta[0];

  const sessionLabel = selectedDate && selectedTime ? `${formatLongDate(selectedDate)} @ ${selectedTime}` : "Not picked yet";

  const rangeEnd = useMemo(() => addDays(today, 120), [today]);
  const availabilityQuery = useQuery({
    queryKey: ["availability", toDateKey(today), toDateKey(rangeEnd)],
    queryFn: () => fetchUnavailableSlots(today, rangeEnd),
    refetchOnWindowFocus: true,
  });
  const availability = useMemo(
    () => buildAvailability(availabilityQuery.data ?? []),
    [availabilityQuery.data],
  );

  const [paymentState, setPaymentState] = useState<"idle" | "checkout" | "confirming">(() =>
    new URLSearchParams(window.location.search).get("paid") ? "confirming" : "idle",
  );

  const heldIdRef = useRef<string | null>(null);
  const paidRef = useRef(false);

  const waitForConfirmation = async (id: string) => {
    setPaymentState("confirming");
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const status = await getBookingStatus(id).catch(() => null);
      if (status === "confirmed") {
        const booking = await fetchConfirmedBooking(id).catch(() => null);
        setPaymentState("idle");
        heldIdRef.current = null;
        if (booking) {
          setConfirmed(booking);
          void fetchBookingToken(id).then(setPassToken).catch(() => undefined);
        } else {
          setBookingError("Payment received, but we couldn't load your confirmation pass. We'll email you the details.");
        }
        void availabilityQuery.refetch();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    setPaymentState("idle");
    setBookingError("Payment received, but confirmation is taking a while. We'll email you once it's locked in.");
  };

  useEffect(() => {
    setPaddleEventListener((event) => {
      const id = heldIdRef.current;
      if (!id) return;
      if (event.name === "checkout.completed") {
        paidRef.current = true;
        void waitForConfirmation(id);
      } else if (event.name === "checkout.closed" && !paidRef.current) {
        heldIdRef.current = null;
        setPaymentState("idle");
        setBookingError("Checkout closed — your slot hold was released. Try again whenever you're ready.");
        void releaseAppointment(id).finally(() => void availabilityQuery.refetch());
      }
    });
    const paidId = new URLSearchParams(window.location.search).get("paid");
    if (paidId) {
      window.history.replaceState(null, "", window.location.pathname);
      void waitForConfirmation(paidId);
    }
    return () => setPaddleEventListener(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookingMutation = useMutation({
    mutationFn: async (input: BookingInput) => {
      const id = await holdAppointment(input);
      heldIdRef.current = id;
      paidRef.current = false;
      try {
        await openSlotCheckout({ appointmentId: id, email: input.email });
      } catch (error) {
        heldIdRef.current = null;
        await releaseAppointment(id).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: () => setPaymentState("checkout"),
    onError: (error: Error) => {
      setBookingError(error.message);
      void availabilityQuery.refetch();
    },
  });

  const firstOpenDate = (from: Date): Date => {
    let candidate = from;
    for (let index = 0; index < 60; index += 1) {
      if (!isDayFull(availability, candidate)) return candidate;
      candidate = addDays(candidate, 1);
    }
    return from;
  };

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const params = new URLSearchParams(window.location.search);
    const forced = ["replay", "intro", "sketch"].some((key) => {
      const value = params.get(key);
      return value !== null && value !== "0" && value !== "false";
    });
    if (!forced) {
      try {
        if (sessionStorage.getItem("tattoo-atelier-studio-draft-seen") === "1") return;
        sessionStorage.setItem("tattoo-atelier-studio-draft-seen", "1");
      } catch {
        // Storage can be unavailable in private browsing; the entrance remains optional.
      }
    }
  animateStudioDraftEntrance({
    linework: draftRef.current,
    paper: paperRef.current,
    header: headerRef.current,
    stepIndicator: indicatorRef.current,
    question: paneRef.current,
  });
  }, []);

  useEffect(() => {
    if (initialStepEffect.current) {
      initialStepEffect.current = false;
      return;
    }
    animateSheetIn(paneRef.current, direction);
    stampPill(pillsRef.current?.children[step - 1]);
    if (step === TOTAL_STEPS) staggerRows(paneRef.current);
  }, [step, direction]);

  // Demo SMS: mint a studio pass when the verification step opens, focus the first box.
  useEffect(() => {
    if (step !== 6) return;
    if (smsCode === null) setSmsCode(generateVerificationCode());
    setResendIn(30);
    codeInputRefs.current[0]?.focus();
  }, [step, smsCode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  // Once all six digits are in: stamp through and glide on, or shake and flag the sketch.
  useEffect(() => {
    if (step !== 6 || smsCode === null || joinedCode.length < 6) return undefined;
    if (joinedCode !== smsCode) {
      setCodeError(true);
      shakeField(codeInputRefs.current[0]);
      return undefined;
    }
    setCodeError(false);
    const timer = setTimeout(() => goToStep(7), 450);
    return () => clearTimeout(timer);
  }, [step, smsCode, joinedCode]);

  const handlePaneClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target.closest("button:not(:disabled)") : null;
    if (target) pickPop(target);
  };

  const goToStep = (next: number) => {
    if (next < 1 || next > TOTAL_STEPS || next === step) return;
    setDirection(next > step ? "forward" : "backward");
    setStep(next);
  };

  const pickDayChoice = (choice: DayChoice) => {
    setDayChoice(choice);
    const requested = resolveChoiceDate(choice, today);
    const target = choice === "other" ? requested : firstOpenDate(requested);
    setMonthCursor(new Date(target.getFullYear(), target.getMonth(), 1));
    if (choice === "other") {
      setSelectedDate(null);
    } else {
      setSelectedDate(target);
    }
    setSelectedTime(null);
  };

  const resetFlow = () => {
    setConfirmed(null);
    setPassToken(null);
    setStep(1);
    setDirection("forward");
    setName("");
    setPhone("");
    setEmail("");
    setPronounChoice(null);
    setCustomPronouns("");
    setDayChoice(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSmsCode(null);
    setCodeDigits(["", "", "", "", "", ""]);
    setCodeError(false);
    setBookingError(null);
  };


  const setCodeDigit = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, "");
    setCodeDigits((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const char of value) {
        if (cursor > 5) break;
        next[cursor] = char;
        cursor += 1;
      }
      return next;
    });
    if (value.length > 0) codeInputRefs.current[Math.min(index + value.length, 5)]?.focus();
  };

  const handleCodeKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace" || codeDigits[index] !== "" || index === 0) return;
    codeInputRefs.current[index - 1]?.focus();
    setCodeDigits((prev) => prev.map((digit, position) => (position === index - 1 ? "" : digit)));
  };

  const resendCode = () => {
    if (resendIn > 0) return;
    setSmsCode(generateVerificationCode());
    setCodeDigits(["", "", "", "", "", ""]);
    setCodeError(false);
    codeInputRefs.current[0]?.focus();
  };

  const continueFlow = () => {
    const blocked = (step === 1 && !nameValid) || (step === 2 && !pronounsValid) || (step === 5 && !phoneValid) || (step === 6 && !codeValid) || (step === 7 && !emailValid);
    if (blocked) shakeField(paneRef.current?.querySelector("input"));
    if (step === 1 && !nameValid) return;
    if (step === 2 && !pronounsValid) return;
    if (step === 3 && dayChoice === null) return;
    if (step === 4 && !scheduleValid) return;
    if (step === 5 && !phoneValid) return;
    if (step === 6 && !codeValid) return;
    if (step === 7 && !emailValid) return;
    if (step === TOTAL_STEPS) {
      if (!allValid || selectedDate === null || selectedTime === null) return;
      setBookingError(null);
      bookingMutation.mutate({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        date: selectedDate,
        timeSlot: selectedTime,
        pronouns: pronounsValue,
      });
      return;
    }
    goToStep(step + 1);
  };

  const handleEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") continueFlow();
  };

  const currentValid =
    step === 1 ? nameValid
      : step === 2 ? pronounsValid
      : step === 3 ? dayChoice !== null
      : step === 4 ? scheduleValid
      : step === 5 ? phoneValid
      : step === 6 ? codeValid
      : step === 7 ? emailValid
      : allValid;

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
    const leading = firstOfMonth.getDay();
    const cells: Array<Date | null> = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
    }
    return cells;
  }, [monthCursor]);

  const canGoPrevMonth = monthCursor > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="sketchbook-canvas relative flex min-h-screen flex-col overflow-x-hidden px-5 py-2.5 font-hand text-foreground selection:bg-paper-line sm:px-10 sm:py-5">
      <div aria-hidden="true" className="paper-fiber" />
      <div ref={draftRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 text-ink-dim/50">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
          <path data-draft-stroke="" d="M 48 40 H 18 V 72 M 952 40 H 982 V 72 M 18 928 V 960 H 48 M 982 928 V 960 H 952" />
          <path data-draft-stroke="" d="M 50 64 H 105 M 895 64 H 950 M 50 936 H 105 M 895 936 H 950" strokeDasharray="3 5" />
        </svg>
        <svg className="pointer-events-none absolute right-6 top-1/3 hidden h-7 w-7 text-cyan-draft/60 lg:block" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <path data-draft-stroke="" d="M 7 28 L 28 7 M 22 8 L 28 7 L 27 13 M 5 30 L 8 27 M 12 29 L 17 34" />
        </svg>
      </div>

      <header ref={headerRef} className="relative z-10 flex flex-col items-center text-center">
        <div className="group flex flex-col items-center">
          <StepArtwork step={step} direction={direction} />
        </div>
      </header>

      <main ref={paperRef} className="relative z-10 mx-auto w-full max-w-2xl pb-8 sm:pb-12">
        {confirmed ? <ConfirmedPass booking={confirmed} token={passToken} onReset={resetFlow} onRescheduled={() => { if (passToken) void fetchBookingByToken(passToken).then((b) => b && setConfirmed(b)); }} /> : paymentState === "confirming" ? (
          <ConfirmingSketch note={bookingError ?? undefined} />
        ) : (
        <>

        <div ref={indicatorRef} className="mb-8 flex flex-wrap items-center justify-between gap-3 gap-y-3 font-mono text-xs text-ink-pencil/70">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-full border border-ink-dim/30 bg-paper-deep/80 px-2 py-0.5 text-[11px] font-medium text-foreground">{currentMeta.badge}</span>
            <span className="hidden font-hand text-sm text-ink-pencil sm:inline">• {currentMeta.hint}</span>
          </div>
          <div ref={pillsRef} className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto sm:gap-1.5" aria-label="Appointment steps">
            {stepMeta.map((item, index) => (
              <Button key={item.title} variant="ghost" size="icon" onClick={() => goToStep(index + 1)} title={item.title} aria-label={item.title}
                className={`h-7 w-7 rounded-full p-0 font-mono text-xs shadow-none ${step === index + 1 ? "bg-foreground font-bold text-background ring-2 ring-cyan-draft/40 hover:bg-foreground hover:text-background" : "bg-paper-deep/80 text-ink-pencil hover:bg-paper-line hover:text-foreground"}`}>
                {index === TOTAL_STEPS - 1 ? "✦" : String(index + 1).padStart(2, "0")}
              </Button>
            ))}
          </div>
        </div>

        <div ref={paneRef} onClick={handlePaneClick} className="step-pane min-h-[300px]" key={step}>
          {step === 1 && (
            <section className="flex min-h-[280px] flex-col justify-center">
              <p className="mb-2 font-mono text-sm text-ink-pencil/60">Question 01 of 07</p>
              <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-3xl leading-snug sm:text-4xl">
                <h2 className="font-normal">What should we call you?</h2>
                <span className={`relative inline-block border-b-2 ${nameValid ? "border-foreground/70 focus-within:border-cyan-draft" : name.trim() ? "border-pencil-red" : "border-ink-dim/40"}`}>
                  <input autoFocus aria-label="Your name" className="paper-inline-input max-w-[75vw] font-bold focus:text-cyan-draft" onChange={(e) => setName(e.target.value)} onKeyDown={handleEnter} placeholder="e.g. Sara Tattoo" style={{ width: `${Math.max(17, name.length + 1)}ch` }} value={name} />
                  <BoilRule tone={nameValid ? "text-cyan-draft/60" : "text-ink-dim/50"} />
                </span>
              </div>
              <p className={`w-fit rotate-[-1deg] rounded-full border px-3 py-1 text-base font-bold sm:text-lg ${nameValid ? "border-pencil-green/25 bg-valid-soft text-pencil-green" : name.trim() ? "border-pencil-red/25 bg-invalid-soft text-pencil-red" : "border-ink-dim/30 bg-paper-deep/60 text-ink-pencil"}`}>
                {nameValid ? (hasFullName ? `(Looking great, ${firstName}! Full name locked in ✍️)` : `(Just "${firstName}"? Cool, I like it. ✨)`) : name.trim() ? "(let us know who to ink for ✏️)" : "(your name goes here)"}
              </p>
              <p className="mt-3 text-xs text-ink-pencil sm:text-sm">First &amp; last name is preferred for studio check-in, but whatever you go by is fine.</p>
              <p className="mt-1 text-xs text-ink-pencil sm:text-sm">Press Enter ↵ or click Continue below when ready.</p>

            </section>
          )}

          {step === 2 && (
            <section className="flex min-h-[280px] flex-col justify-center">
              <p className="mb-2 font-mono text-sm text-ink-pencil/60">Question 02 of 07</p>
              <h2 className="mb-2 text-3xl font-normal leading-snug sm:text-4xl">What are your pronouns{firstName ? `, ${firstName}` : ""}?</h2>
              <p className="mb-5 text-sm text-ink-pencil">So your artist addresses you right from the first sketch.</p>
              <div className="flex flex-wrap gap-2">
                {PRONOUN_OPTIONS.map((option) => {
                  const active = pronounChoice === option;
                  return (
                    <button key={option} type="button" aria-pressed={active}
                      onClick={() => { setPronounChoice(option); setCustomPronouns(""); }}
                      className={`rounded-full border px-4 py-2 text-lg transition-all ${active ? "ink-bloom border-foreground bg-foreground font-bold text-background" : "border-ink-dim/40 text-foreground hover:-translate-y-0.5 hover:border-foreground"}`}>
                      {option}
                    </button>
                  );
                })}
                <button type="button" aria-pressed={pronounChoice === "custom"} onClick={() => setPronounChoice("custom")}
                  className={`rounded-full border px-4 py-2 text-lg transition-all ${pronounChoice === "custom" ? "ink-bloom border-foreground bg-foreground font-bold text-background" : "border-ink-dim/40 text-foreground hover:-translate-y-0.5 hover:border-foreground"}`}>
                  ✎ Something else
                </button>
                <button type="button" aria-pressed={pronounChoice === "private"} onClick={() => { setPronounChoice("private"); setCustomPronouns(""); }}
                  className={`rounded-full border px-4 py-2 text-lg transition-all ${pronounChoice === "private" ? "ink-bloom border-foreground bg-foreground font-bold text-background" : "border-ink-dim/40 text-foreground hover:-translate-y-0.5 hover:border-foreground"}`}>
                  Prefer not to say
                </button>
              </div>
              {pronounChoice === "custom" && (
                  <span className={`relative mt-5 inline-block w-fit border-b-2 text-2xl sm:text-3xl ${customPronouns.trim() ? "border-foreground/70" : "border-ink-dim/40"}`}>
                    <input autoFocus aria-label="Your pronouns" className="paper-inline-input font-bold" onChange={(e) => setCustomPronouns(e.target.value)} onKeyDown={handleEnter} placeholder="e.g. ze / hir" style={{ width: `${Math.max(12, customPronouns.length + 1)}ch` }} value={customPronouns} />
                    <BoilRule />
                  </span>
              )}
              <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-pencil">
                <span className="h-2 w-2 shrink-0 rounded-full bg-pencil-green" />
                {pronounsValid ? (pronounChoice === "private" ? "Noted — we'll keep it neutral." : `Noted — we'll use ${pronounsValue}.`) : "Pick one so we get it right."}
              </p>
            </section>
          )}

          {step === 3 && (
            <section className="flex min-h-[280px] flex-col justify-center">
              <p className="mb-2 font-mono text-sm text-ink-pencil/60">Question 03 of 07</p>
              <h2 className="mb-6 text-3xl font-normal leading-snug sm:text-4xl">What day do you want?</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {DAY_OPTIONS.map((option) => {
                  const active = dayChoice === option.id;
                  const preview = option.id === "other" ? "You choose" : formatLongDate(resolveChoiceDate(option.id, today));
                  return (
                    <button key={option.id} type="button" onClick={() => pickDayChoice(option.id)} aria-pressed={active}
                      className={`group rounded-2xl border px-4 py-3 text-left transition-all ${active ? "border-foreground bg-paper-deep/90 shadow-[3px_3px_0_0_var(--color-cyan-draft,#22b8cf)]" : "border-ink-dim/30 bg-paper-deep/50 hover:-translate-y-0.5 hover:border-foreground/60"}`}>
                      <span className="flex items-baseline gap-2">
                        <span className={active ? "text-cyan-draft" : "text-ink-dim"}>{option.mark}</span>
                        <strong className="text-xl sm:text-2xl">{option.label}</strong>
                      </span>
                      <span className="mt-1 block font-mono text-[11px] uppercase tracking-wider text-ink-pencil/70">{preview}</span>
                      <span className="mt-0.5 block text-sm text-ink-pencil">{option.note}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-pencil"><span className="h-2 w-2 rounded-full bg-pencil-green" />You&apos;ll confirm the exact date and time next.</p>
            </section>
          )}

          {step === 4 && (
            <section className="flex min-h-[280px] flex-col justify-center">
              <p className="mb-2 font-mono text-sm text-ink-pencil/60">Question 04 of 07</p>
              <h2 className="mb-5 text-3xl font-normal leading-snug sm:text-4xl">Pick your exact date &amp; time</h2>

              <div className="rounded-2xl border border-ink-dim/30 bg-paper-deep/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Button variant="ghost" size="icon" disabled={!canGoPrevMonth} aria-label="Previous month"
                    onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                    className="h-8 w-8 rounded-full border border-ink-dim/30 text-ink-pencil hover:bg-paper-line">←</Button>
                  <strong className="font-mono text-sm uppercase tracking-[0.2em] text-foreground">
                    {monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </strong>
                  <Button variant="ghost" size="icon" aria-label="Next month"
                    onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                    className="h-8 w-8 rounded-full border border-ink-dim/30 text-ink-pencil hover:bg-paper-line">→</Button>
                </div>

                <div className="mb-1 grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase tracking-widest text-ink-pencil/60">
                  {WEEKDAY_MARKS.map((markLabel, index) => <span key={`${markLabel}-${index}`}>{markLabel}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((cell, index) => {
                    if (!cell) return <span key={`empty-${index}`} />;
                    const past = cell < today;
                    const full = isDayFull(availability, cell);
                    const disabled = past || full;
                    const active = selectedDate !== null && sameDay(cell, selectedDate);
                    const isToday = sameDay(cell, today);
                    return (
                      <button key={cell.toISOString()} type="button" disabled={disabled}
                        onClick={() => { setSelectedDate(cell); setSelectedTime(null); }}
                        aria-label={formatLongDate(cell)} aria-pressed={active}
                        className={`relative aspect-square rounded-full text-base transition-all sm:text-lg ${
                          disabled ? "cursor-not-allowed text-ink-dim/40 line-through" :
                          active ? "bg-foreground font-bold text-background ring-2 ring-cyan-draft/50" :
                          "text-foreground hover:bg-paper-line"}`}>
                        {cell.getDate()}
                        {isToday && !active && <span aria-hidden="true" className="absolute inset-x-0 bottom-1 mx-auto h-1 w-1 rounded-full bg-cyan-draft" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 border-t border-dashed border-ink-dim/30 pt-3">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-pencil/70">
                    {availabilityQuery.isLoading ? "Checking the studio calendar…" : "Open studio slots"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const active = selectedTime === slot;
                      const taken = selectedDate !== null && isSlotTaken(availability, selectedDate, slot);
                      const disabled = selectedDate === null || taken;
                      return (
                        <button key={slot} type="button" disabled={disabled} onClick={() => setSelectedTime(slot)} aria-pressed={active}
                          title={taken ? "Already taken" : undefined}
                          className={`rounded-full border px-3 py-1.5 text-base transition-all ${
                            taken ? "cursor-not-allowed border-ink-dim/20 text-ink-dim/50 line-through" :
                            selectedDate === null ? "cursor-not-allowed border-ink-dim/20 text-ink-dim/50" :
                            active ? "ink-bloom border-foreground bg-foreground font-bold text-background" :
                            "border-ink-dim/40 text-foreground hover:-translate-y-0.5 hover:border-foreground"}`}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-pencil">
                <span className="h-2 w-2 shrink-0 rounded-full bg-pencil-green" />
                {scheduleValid ? `${sessionLabel} • 90 min custom linework at Station 03` : "Choose a day on the sheet, then a time slot."}
              </p>
            </section>
          )}

          {step === 5 && (
            <section className="flex min-h-[280px] flex-col justify-center">
              <p className="mb-2 font-mono text-sm text-ink-pencil/60">Question 05 of 07</p>
              <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-3xl leading-snug sm:text-4xl">
                <h2 className="font-normal">Where can we text your reminder?</h2>
                <span className={`relative inline-block border-b-2 ${phoneValid ? "border-pencil-green" : phone.trim() ? "border-pencil-red" : "border-ink-dim/40"}`}>
                  <input autoFocus aria-label="Phone number" className="paper-inline-input max-w-[78vw] font-bold" inputMode="tel" onChange={(e) => setPhone(formatPhone(e.target.value))} onKeyDown={handleEnter} placeholder="e.g. (555) 019-2834" style={{ width: `${Math.max(20, phone.length + 1)}ch` }} type="tel" value={phone} />
                  {phoneValid ? <BoilRule tone="text-pencil-green/50" /> : null}
                  {!phoneValid && phone.trim() !== "" && <WaveUnderline />}
                </span>
              </div>
              {phoneValid ? <ValidNote>Perfect! Day-of session reminder will be texted here.</ValidNote> : phone.trim() === "" ? <p className="mt-3 text-sm text-ink-pencil">Type the number where we can text your day-of reminder.</p> : <ErrorNote icon="✏️" title="Just needs a couple more digits to reach you!">Tip: Format like +1 (555) 019-2834 so our atelier SMS system can connect.</ErrorNote>}
            </section>
          )}

          {step === 6 && (
            <section className="flex min-h-[280px] flex-col justify-center">
              <p className="mb-2 font-mono text-sm text-ink-pencil/60">Question 06 of 07</p>
              <h2 className="mb-2 text-3xl font-normal leading-snug sm:text-4xl">We just sketched a pass code to your phone</h2>
              <p className="mb-6 text-lg text-ink-pencil">Enter the 6-digit studio pass texted to <strong className="text-foreground">{formatPhone(phone)}</strong>.</p>
              <div className="mb-4 flex gap-2 sm:gap-3">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el; }}
                    aria-label={`Studio pass digit ${index + 1}`}
                    autoFocus={index === 0}
                    className={`code-box text-3xl font-bold ${codeError ? "code-box-error" : digit ? "code-box-filled" : ""}`}
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setCodeDigit(index, event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                    value={digit}
                  />
                ))}
              </div>
              {codeError ? <ErrorNote icon="✏️" title="That sketch didn't match the studio pass — check the banner below and try again.">Pass codes are always 6 digits.</ErrorNote> : null}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-sm text-ink-pencil">
                <button type="button" className="underline underline-offset-4 disabled:no-underline disabled:opacity-50" disabled={resendIn > 0} onClick={resendCode}>Resend code</button>
                {resendIn > 0 ? <span aria-live="polite">new pass in {resendIn}s</span> : null}
                <button type="button" className="underline underline-offset-4" onClick={() => goToStep(5)}>Wrong number?</button>
              </div>
              <p className="mt-5 rounded-lg border border-dashed border-cyan-draft/60 bg-paper-deep/50 px-4 py-3 font-mono text-sm">
                <span className="text-cyan-draft">◐ Demo studio SMS sent:</span> <strong className="tracking-[0.3em]">{smsCode ?? "······"}</strong>
              </p>
            </section>
          )}

          {step === 7 && (
            <section className="flex min-h-[280px] flex-col justify-center">
              <p className="mb-2 font-mono text-sm text-ink-pencil/60">Question 07 of 07</p>
              <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-3xl leading-snug sm:text-4xl">
                <h2 className="font-normal">Where should we send your stencil &amp; guide?</h2>
                <span className={`relative inline-block border-b-2 ${emailValid ? "border-pencil-green" : email.trim() ? "border-pencil-red" : "border-ink-dim/40"}`}>
                  <input autoFocus aria-label="Email address" className="paper-inline-input max-w-[78vw] font-bold" onChange={(e) => setEmail(e.target.value)} onKeyDown={handleEnter} placeholder="e.g. you@example.com" style={{ width: `${Math.max(21, email.length + 1)}ch` }} type="email" value={email} />
                  {emailValid ? <BoilRule tone="text-pencil-green/50" /> : null}
                  {!emailValid && email.trim() !== "" && <WaveUnderline />}
                </span>
              </div>
              {emailValid ? <ValidNote>Looks good! Stencil &amp; prep guides will head to your inbox.</ValidNote> : email.trim() === "" ? <p className="mt-3 text-sm text-ink-pencil">We&apos;ll send your stencil and prep guide here.</p> : <ErrorNote icon="✉️" title={firstName ? `Almost there, ${firstName}! Don't forget the .com at the end.` : "Almost there! Don't forget the .com at the end."}>We need a valid domain so your high-res linework and aftercare guide won&apos;t bounce!</ErrorNote>}
            </section>
          )}

          {step === TOTAL_STEPS && (
            <section className="flex min-h-[280px] flex-col justify-center">
              <p className="mb-2 font-mono text-sm text-ink-pencil/60">Review // Final Protocol</p>
              <h2 className="mb-4 text-3xl font-normal leading-snug sm:text-4xl">Almost ready to ink{firstName ? `, ${firstName}` : ""} <span className="animate-pulse text-2xl">✨</span></h2>
              <div className="space-y-3 rounded-lg border border-ink-dim/30 bg-paper-deep/50 p-4 text-lg">
                <ReviewRow label="Session:" value={scheduleValid ? `${sessionLabel} (Station 03)` : "—"} />
                <ReviewRow label="Client:" value={name.trim() || "—"} />
                <ReviewRow label="Pronouns:" value={pronounsValid ? pronounsLabel : "—"} />
                <ReviewRow label="SMS Reminder:" value={phone.trim() || "—"} />
                <ReviewRow label="Linework & Stencil:" value={email.trim() || "—"} last />
              </div>
              {!allValid && <p className="mt-4 text-pencil-red">Please revisit the marked details before locking in.</p>}
              <p className="mt-3 text-sm text-ink-dim">Test mode: use card 4242 4242 4242 4242, any future date, CVC 123. Your slot is held for 15 minutes while you pay.</p>
              {bookingError !== null && <p className="mt-3 text-pencil-red">{bookingError}</p>}
            </section>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-dashed border-ink-dim/30 pt-6 sm:flex-row">
          <Button variant="link" disabled={step === 1} onClick={() => goToStep(step - 1)} className="group h-auto p-0 font-hand text-lg text-ink-pencil hover:text-foreground">
            <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span><span className="underline decoration-ink-dim/40 underline-offset-4">Previous question</span>
          </Button>
          <Button disabled={!currentValid || bookingMutation.isPending} onClick={(event) => { stampPress(event.currentTarget); continueFlow(); }} className={`ink-stamp-btn h-auto w-full rounded-2xl px-8 py-3.5 font-hand text-xl font-bold sm:w-auto sm:text-2xl ${step === TOTAL_STEPS ? "final-stamp" : ""}`}>
            {step === TOTAL_STEPS ? (bookingMutation.isPending ? "Holding your slot…" : paymentState === "confirming" ? "Confirming payment…" : paymentState === "checkout" ? "Finish checkout…" : "Donate $1 & Lock In") : "Continue →"}<span className="text-cyan-draft">✦</span>
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center font-mono text-xs text-ink-pencil/80 sm:justify-between sm:text-left sm:text-sm">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pencil-green" />$1 donation to <a href="https://www.npr.org/2022/11/25/1138996633/pansy-tattoos-nonbinary-artist-trans-activism" target="_blank" rel="noreferrer" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">A Thousand Pansies</a> locks in your slot</span>
          <span>Free rescheduling up to 24h prior</span>
        </div>
        </>
        )}
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-ink-dim/20 pb-2 pt-4 text-xs text-ink-pencil">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Tattoo Atelier // Novo // P. 02</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">Atelier Session Protocol // Ink &amp; Needle</span>
      </footer>
    </div>
  );
}

function ValidNote({ children }: { children: string }) {
  return <div className="mt-3 flex items-start gap-2 text-pencil-green"><span className="mt-0.5 shrink-0">✓</span><strong className="text-base leading-snug">{children}</strong></div>;
}

function ErrorNote({ icon, title, children }: { icon: string; title: string; children: string }) {
  return <div className="mt-3 flex max-w-xl items-start gap-2"><span className="mt-0.5 shrink-0 text-lg">{icon}</span><div className="text-base leading-snug text-pencil-red"><strong>{title}</strong><span className="mt-0.5 block text-xs text-ink-pencil sm:text-sm">{children}</span></div></div>;
}

function ReviewRow({ label, value, last = false }: { label: string; value: ReactNode; last?: boolean }) {
  return <div data-review-row="" className={`flex flex-col justify-between gap-1 pb-2 sm:flex-row sm:items-center ${last ? "" : "border-b border-ink-dim/20"}`}><span className="shrink-0 font-mono text-sm text-ink-pencil">{label}</span><strong className="break-words text-left sm:text-right">{value}</strong></div>;
}
