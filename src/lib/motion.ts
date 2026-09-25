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
