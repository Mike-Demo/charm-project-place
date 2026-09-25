import { useEffect, useRef, useState, type ReactNode } from "react";
import { animateStepArtIn, animateStepArtOut, prefersReducedMotion, startLineBoil, type StepArtTransition } from "@/lib/motion";
import { NEEDLE_MARK_D } from "@/lib/logo-marks";

type StepArtworkProps = {
  step: number;
  direction: "forward" | "backward";
};

const lineStyle = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
} as const;

const artwork: ReadonlyArray<ReactNode> = [
  <>
    <path data-trace="false" d={NEEDLE_MARK_D} fill="currentColor" />
    <path d="M178 232 C194 240 214 246 236 248" {...lineStyle} strokeWidth="2" opacity="0.45" />
  </>,
  <>
    <path d="M104 177 C139 156 203 153 259 166 L327 145 L315 229 C257 247 185 247 112 224 Z" {...lineStyle} strokeWidth="5" />
    <path d="M143 194 C190 183 240 184 285 190 M155 211 C196 202 232 202 271 205" {...lineStyle} strokeWidth="3" opacity="0.65" />
    <path d="M166 245 C210 230 271 233 326 251 L354 232 L344 310 C287 324 221 315 159 292 Z" {...lineStyle} strokeWidth="5" />
    <path d="M203 265 C244 254 284 257 318 266 M211 283 C247 276 278 278 307 284" {...lineStyle} strokeWidth="3" opacity="0.65" />
  </>,
  <>
    <path d="M125 119 C177 104 274 105 333 121 L326 349 C274 365 179 363 123 345 Z" {...lineStyle} strokeWidth="5" />
    <path d="M124 173 C191 183 268 178 330 166 M166 91 L166 139 M285 92 L285 136" {...lineStyle} strokeWidth="5" />
    <path d="M173 229 C203 209 251 210 280 229 C263 254 231 273 195 270 C181 258 174 243 173 229 Z" {...lineStyle} strokeWidth="5" />
    <path d="M194 235 C212 242 231 247 257 224" {...lineStyle} strokeWidth="4" />
    <path d="M146 321 C188 311 260 312 304 322" {...lineStyle} strokeWidth="3" opacity="0.55" />
  </>,
  <>
    <path d="M133 90 C178 77 286 78 333 100 C349 139 348 341 326 368 C273 387 168 382 123 365 C112 295 113 151 133 90 Z" {...lineStyle} strokeWidth="5" />
    <path d="M133 90 C111 123 108 329 123 365 M158 112 C205 103 273 105 319 117 M158 146 C205 137 273 138 317 149 M158 180 C203 171 271 172 316 183 M158 214 C203 205 271 206 315 217 M158 248 C204 239 271 240 315 251 M158 282 C204 273 270 274 314 285 M158 316 C204 307 269 308 313 319" {...lineStyle} strokeWidth="3" opacity="0.55" />
    <path d="M285 98 L285 368" {...lineStyle} strokeWidth="4" strokeDasharray="8 7" />
    <path d="M199 74 L204 159 L199 168 L194 159 L199 74 Z" fill="currentColor" data-trace="false" />
  </>,
  <>
    <path d="M139 131 C158 107 185 99 208 108 L231 155 C237 170 228 185 213 190 L190 198 C176 205 169 222 177 235 L208 279 C216 291 233 294 245 285 L263 268 C275 257 291 259 301 270 L337 309 C333 339 308 365 279 373 C201 335 137 270 99 190 C105 163 118 143 139 131 Z" {...lineStyle} strokeWidth="6" />
    <path d="M150 124 L187 191 M273 275 L326 321" {...lineStyle} strokeWidth="3" opacity="0.65" />
    <path d="M300 350 C342 365 354 394 318 414 C282 433 267 402 300 388 C331 376 371 407 352 438" {...lineStyle} strokeWidth="4" />
  </>,
  <>
    <path d="M105 145 C165 129 282 130 344 149 L337 339 C272 355 165 354 106 336 Z" {...lineStyle} strokeWidth="5" />
    <path d="M106 145 L223 242 L344 149 M106 336 L193 242 M337 339 L253 242" {...lineStyle} strokeWidth="4" />
    <path d="M137 185 L165 181 L165 216 L137 219 Z M177 179 L205 176 L205 215 L177 216 Z M217 176 L245 176 L245 215 L217 215 Z M257 176 L285 179 L285 216 L257 215 Z M297 181 L325 185 L325 219 L297 216 Z" {...lineStyle} strokeWidth="3" />
  </>,
  <>
    <path d="M96 155 C158 130 287 130 351 156 L342 337 C275 360 162 359 99 335 Z" {...lineStyle} strokeWidth="5" />
    <path d="M99 159 L222 254 L349 159 M99 334 L193 248 M342 337 L253 248" {...lineStyle} strokeWidth="4" />
    <path d="M220 206 L225 230 L220 237 L215 230 L220 206 Z" fill="currentColor" data-trace="false" />
    <path d="M198 196 C211 188 231 188 244 197" {...lineStyle} strokeWidth="3" />
  </>,
  <>
    <path d="M112 96 C170 84 276 86 336 102 L330 372 C268 386 172 384 110 366 Z" {...lineStyle} strokeWidth="5" />
    <path d="M150 150 C190 140 244 142 290 152 M150 190 C182 184 214 184 240 188" {...lineStyle} strokeWidth="3" opacity="0.55" />
    <path d="M168 318 C184 262 232 236 262 262 C288 286 256 322 222 306 C196 294 210 258 244 250" {...lineStyle} strokeWidth="4" opacity="0.8" />
    <path d="M300 128 L372 356 L360 392 L338 364 L266 136 Z M266 136 L300 128 M338 364 L372 356" {...lineStyle} strokeWidth="5" />
  </>,
  <>
    <path d="M117 81 C176 69 278 74 331 91 L325 382 C264 395 171 391 113 373 Z" {...lineStyle} strokeWidth="5" />
    <path d="M147 132 C193 122 257 124 298 137 M147 170 C191 162 254 163 297 176 M147 208 C191 200 254 201 296 214 M147 246 C191 238 252 239 294 252 M147 284 C188 277 230 278 259 284" {...lineStyle} strokeWidth="3" opacity="0.62" />
    <path d="M248 289 C278 270 323 277 344 306 C359 332 351 366 323 382 C292 399 252 387 237 357 C226 334 232 308 248 289 Z" {...lineStyle} strokeWidth="5" />
    <path d="M256 334 L280 354 L327 303" {...lineStyle} strokeWidth="7" />
  </>,
];

export function StepArtwork({ step, direction }: StepArtworkProps) {
  const safeStep = Math.min(Math.max(step, 1), artwork.length);
  const [displayedStep, setDisplayedStep] = useState(safeStep);
  const groupRef = useRef<SVGGElement | null>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement | null>(null);
  const transitionRef = useRef<StepArtTransition | null>(null);
  const boilRef = useRef<{ cancel: () => void } | null>(null);
  const initialRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      boilRef.current = startLineBoil(turbulenceRef.current, groupRef.current);
    }, 600);
    return () => {
      clearTimeout(timer);
      boilRef.current?.cancel();
      transitionRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    transitionRef.current?.cancel();
    if (prefersReducedMotion()) {
      setDisplayedStep(safeStep);
      return;
    }
    transitionRef.current = animateStepArtOut(groupRef.current, direction, () => {
      setDisplayedStep(safeStep);
    });
  }, [safeStep, direction]);

  useEffect(() => {
    if (initialRef.current) return;
    transitionRef.current?.cancel();
    transitionRef.current = animateStepArtIn(groupRef.current, direction);
  }, [displayedStep, direction]);

  return (
    <div className="flex h-48 w-48 items-center justify-center overflow-visible">
      <svg aria-hidden="true" className="doodle-hover h-44 w-44 overflow-visible text-foreground opacity-95 mix-blend-multiply" viewBox="0 0 450 460">
        <defs>
          <filter id="atelier-step-line-boil" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence ref={turbulenceRef} type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="atelier-boil-fine" x="-20%" y="-150%" width="140%" height="400%">
            <feTurbulence data-boil-seed="" type="fractalNoise" baseFrequency="0.09" numOctaves="1" seed="1" result="fine-noise" />
            <feDisplacementMap in="SourceGraphic" in2="fine-noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g ref={groupRef} filter="url(#atelier-step-line-boil)" transform={displayedStep === 1 ? "translate(0 -18) scale(.93)" : undefined}>
          {artwork[displayedStep - 1]}
        </g>
      </svg>
    </div>
  );
}