export type ImageConfig = {
  baseURL: string;
  apiKey: string;
  model: string;
};

export const imageSettings: Omit<ImageConfig, "apiKey"> = {
  baseURL: "https://ai.gateway.lovable.dev",
  model: "openai/gpt-image-2.5-sunburst",
};

export const CONCEPT_SKETCH_PROMPT = `Transform the uploaded reference photo into a rough hand-drawn tattoo concept sketch.

Preserve the subject, composition, proportions, and key details from the original image, but reinterpret it as if a professional tattoo artist quickly sketched the idea in a notebook before creating the final design.

Style requirements:
- graphite pencil sketch
- visible hand-drawn strokes
- loose construction lines
- natural imperfections
- light cross-hatching
- varied line weight
- unfinished sketchbook quality
- subtle paper texture
- monochrome black and gray
- authentic artist concept drawing
- tattoo flash design aesthetic

Avoid:
- polished digital illustration
- vector artwork
- cartoon styling
- anime styling
- comic book rendering
- clean ink outlines
- photorealistic rendering
- CGI or 3D effects
- smooth digital shading
- perfect symmetry
- artificial AI-art appearance

The final result should look like an early-stage tattoo design concept drawn by hand with pencil, suitable for discussion between a client and tattoo artist.

Maintain high adherence to the source image while converting textures, edges, and shading into pencil-based linework and sketch marks rather than generating a new composition.`;

export function buildSketchPrompt(description: string): string {
  const idea = description.trim();
  return idea ? `${CONCEPT_SKETCH_PROMPT}\n\nClient's notes about the tattoo idea (use only as context, keep the source composition): ${idea}` : CONCEPT_SKETCH_PROMPT;
}

export function editImage(config: ImageConfig, form: FormData): Promise<Response> {
  const streaming = form.get("stream") !== "false";
  form.set("model", config.model);
  if (streaming) {
    form.set("stream", "true");
    if (!form.has("partial_images")) form.set("partial_images", "1");
  } else {
    form.delete("stream");
    form.delete("partial_images");
  }
  return fetch(`${config.baseURL}/v1/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: form,
  });
}
