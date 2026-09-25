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

export type LineBoil = { cancel: () => void };

export type StepArtTransition = { cancel: () => void };

export const animateStepArtOut = (
  group: SVGGElement | null,
  direction: "forward" | "backward",
  onComplete: () => void,
): StepArtTransition | null => {
  if (!group || prefersReducedMotion()) {
    onComplete();
    return null;
  }
  const paths = Array.from(group.querySelectorAll<SVGPathElement>("path"));
  paths.forEach((path) => {
    if (path.dataset.trace === "false") return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = "0";
  });
  const animation = animate(paths, {
    strokeDashoffset: (_target, index) => {
      const path = paths[index];
      return path?.dataset.trace === "false" ? 0 : path?.getTotalLength() ?? 0;
    },
    opacity: [1, 0],
    x: direction === "forward" ? -3 : 3,
    delay: stagger(12, { reversed: direction === "forward" }),
    duration: 130,
    ease: "inQuad",
    onComplete,
  });
  return { cancel: () => animation.cancel() };
};

export const animateStepArtIn = (
  group: SVGGElement | null,
  direction: "forward" | "backward",
): StepArtTransition | null => {
  if (!group) return null;
  const paths = Array.from(group.querySelectorAll<SVGPathElement>("path"));
  if (prefersReducedMotion()) {
    group.style.opacity = "1";
    paths.forEach((path) => {
      path.style.opacity = "1";
      path.style.strokeDasharray = "";
      path.style.strokeDashoffset = "";
    });
    return null;
  }
  paths.forEach((path) => {
    path.style.opacity = "0";
    if (path.dataset.trace === "false") return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
  });
  const animation = animate(paths, {
    strokeDashoffset: 0,
    opacity: [0, 1],
    x: [direction === "forward" ? 3 : -3, 0],
    delay: stagger(24, { reversed: direction === "backward" }),
    duration: 280,
    ease: "outQuad",
    onComplete: () => {
      paths.forEach((path) => {
        path.style.strokeDasharray = "";
        path.style.strokeDashoffset = "";
      });
    },
  });
  return { cancel: () => animation.cancel() };
};

const BOIL_SEEDS = [1, 7, 13, 21];
const BOIL_OPACITY = [0.95, 0.92, 0.97, 0.94];

// Stepped (not tweened) seed swaps read as hand-inked animation frames.
export const startLineBoil = (
  turbulence: SVGFETurbulenceElement | null,
  inkEl: SVGElement | null,
  fps = 8,
): LineBoil | null => {
  if (!turbulence || prefersReducedMotion()) return null;
  let frame = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const tick = () => {
    frame = (frame + 1) % BOIL_SEEDS.length;
    const seed = String(BOIL_SEEDS[frame]);
    turbulence.setAttribute("seed", seed);
    document
      .querySelectorAll<SVGFETurbulenceElement>("[data-boil-seed]")
      .forEach((node) => node.setAttribute("seed", seed));
    if (inkEl) inkEl.style.opacity = String(BOIL_OPACITY[frame]);
  };
  const start = () => {
    if (timer === null) timer = setInterval(tick, 1000 / fps);
  };
  const stop = () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);
  if (!document.hidden) start();
  return {
    cancel: () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
};
