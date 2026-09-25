import { animate, stagger } from "animejs";

type Target = Element | null | undefined;

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fadeOnly = (target: Element | NodeListOf<Element>) =>
  animate(target, { opacity: [0, 1], duration: 100, ease: "linear" });

export const animateSheetIn = (el: Target, direction: "forward" | "backward"): void => {
  if (!el) return;
  if (prefersReducedMotion()) {
    fadeOnly(el);
    return;
  }
  animate(el, {
    opacity: [0, 1],
    y: [direction === "forward" ? 6 : -6, 0],
    scale: [0.99, 1],
    duration: 220,
    ease: "outExpo",
  });
};

export const stampPill = (el: Target): void => {
  if (!el || prefersReducedMotion()) return;
  animate(el, { scale: [0.88, 1.05, 1], duration: 260, ease: "outBack(1.2)" });
};

export const pickPop = (el: Target): void => {
  if (!el || prefersReducedMotion()) return;
  animate(el, { scale: [0.96, 1.02, 1], rotate: [0, -0.6, 0], duration: 240, ease: "outQuad" });
};

export const shakeField = (el: Target): void => {
  if (!el || prefersReducedMotion()) return;
  animate(el, { x: [0, -5, 5, -3, 3, 0], duration: 320, ease: "inOutSine" });
};

export const staggerRows = (container: Target): void => {
  if (!container) return;
  const rows = container.querySelectorAll("[data-review-row]");
  if (rows.length === 0) return;
  if (prefersReducedMotion()) {
    fadeOnly(rows);
    return;
  }
  animate(rows, { opacity: [0, 1], x: [-8, 0], delay: stagger(40), duration: 240, ease: "outQuart" });
};

export const stampPress = (el: Target): void => {
  if (!el || prefersReducedMotion()) return;
  animate(el, { scale: [1, 0.95, 1], duration: 200, ease: "outQuad" });
};

export const noteDrop = (el: Target): void => {
  if (!el) return;
  if (prefersReducedMotion()) {
    fadeOnly(el);
    return;
  }
  animate(el, { y: [-18, 0], rotate: [-2, 0], opacity: [0, 1], duration: 420, ease: "outBack(1.4)" });
};

export const inkSettle = (el: Target): void => {
  if (!el || prefersReducedMotion()) return;
  animate(el, { opacity: [0, 0.95], scale: [0.9, 1], rotate: [-4, 0], duration: 600, ease: "outElastic(1, .6)" });
};

type StudioDraftTargets = {
  linework: Element | null;
  paper: Element | null;
  header: Element | null;
  stepIndicator: Element | null;
  question: Element | null;
};

export const animateStudioDraftEntrance = ({ linework, paper, header, stepIndicator, question }: StudioDraftTargets): void => {
  if (prefersReducedMotion()) return;

  linework?.querySelectorAll<SVGPathElement>("[data-draft-stroke]").forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    animate(path, { "stroke-dashoffset": [length, 0], duration: 240, ease: "outQuad" });
  });

  if (paper) animate(paper, { scale: [0.995, 1], opacity: [0.85, 1], delay: 100, duration: 280, ease: "outQuad" });
  if (header) animate(header, { y: [6, 0], opacity: [0.7, 1], delay: 180, duration: 170, ease: "outQuad" });
  if (stepIndicator) animate(stepIndicator, { y: [6, 0], opacity: [0.7, 1], delay: 215, duration: 170, ease: "outQuad" });
  if (question) animate(question, { y: [8, 0], opacity: [0.75, 1], delay: 250, duration: 170, ease: "outQuad" });
};
