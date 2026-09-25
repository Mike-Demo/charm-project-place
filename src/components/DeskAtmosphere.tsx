import coffeeRing from "@/assets/coffee-ring.png.asset.json";
import inkSmudge from "@/assets/ink-smudge.png.asset.json";
import inkSplatter from "@/assets/ink-splatter.png.asset.json";
import warmWash from "@/assets/warm-wash.png.asset.json";

type DeskMark = {
  readonly src: string;
  readonly className: string;
  readonly style: React.CSSProperties;
};

/**
 * Accidental-looking marks on the studio desk: a mug ring, needle spray,
 * an inky thumb smudge and a tea wash. Purely decorative and never
 * interactive, so the booking form stays fully usable underneath.
 */
const MARKS: readonly DeskMark[] = [
  {
    src: coffeeRing.url,
    className: "w-[150px] sm:w-[220px] -top-8 -left-10 sm:-top-10 sm:-left-14",
    style: { opacity: 0.32, transform: "rotate(-12deg)" },
  },
  {
    src: inkSplatter.url,
    className: "w-[150px] sm:w-[260px] top-[46%] -right-16 sm:top-[30%] sm:-right-10",
    style: { opacity: 0.2, transform: "rotate(14deg)" },
  },
  {
    src: inkSmudge.url,
    className: "w-[130px] sm:w-[185px] bottom-24 -left-9 sm:-left-10",
    style: { opacity: 0.22, transform: "rotate(8deg)" },
  },
  {
    src: warmWash.url,
    className: "w-[160px] sm:w-[240px] -bottom-10 -right-9 sm:-right-12",
    style: { opacity: 0.38, transform: "rotate(-6deg)" },
  },
];

export function DeskAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden select-none"
    >
      {MARKS.map((mark) => (
        <img
          key={mark.src}
          src={mark.src}
          alt=""
          draggable={false}
          className={`absolute mix-blend-multiply ${mark.className}`}
          style={mark.style}
        />
      ))}
    </div>
  );
}
