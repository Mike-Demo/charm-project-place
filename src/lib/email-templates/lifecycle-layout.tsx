import type { ReactNode } from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import needleAsset from "@/assets/email-needle.png.asset.json";
import { STUDIO_ADDRESS, STUDIO_HOURS, STUDIO_MAP_URL } from "@/lib/studio-location";

export interface LifecycleProps {
  name?: string | undefined;
  date?: string | undefined;
  time?: string | undefined;
  passUrl?: string | undefined;
}

export const ink = "#292825";
export const graphite = "#575650";
export const cyan = "#237590";
const paper = "#f9f7f1";
export const hand = '"Segoe Print", "Comic Sans MS", cursive';
const mono = '"Courier New", Courier, monospace';
const needleUrl = `https://freshink.art${needleAsset.url}`;

export const bodyText = { margin: "0 0 14px", color: graphite, fontSize: "15px", lineHeight: "24px" };
export const linkStyle = { color: cyan, textDecoration: "underline" };

export function displayDate(value?: string): string {
  if (!value) return "your session date";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return value;
  const d = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(d);
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={{ margin: "18px 0 6px", color: cyan, fontFamily: mono, fontSize: "11px", lineHeight: "16px", letterSpacing: "1px" }}>{children}</Text>;
}

export function Checklist({ items }: { items: string[] }) {
  return (
    <Text style={bodyText}>
      {items.map((item, i) => (<span key={item}>{i > 0 ? <br /> : null}✎ {item}</span>))}
    </Text>
  );
}

export function SketchDivider() {
  return <Text style={{ margin: "14px 0", textAlign: "center", color: "#aaa69a", fontFamily: mono, fontSize: "12px", lineHeight: "14px" }}>~ ~ ~ ✦ ~ ~ ~</Text>;
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button href={href} style={{ display: "inline-block", backgroundColor: ink, border: `1px solid ${ink}`, borderRadius: "3px", color: "#ffffff", fontFamily: hand, fontSize: "16px", lineHeight: "22px", padding: "13px 20px", textDecoration: "none", margin: "4px 8px 8px 0" }}>
      {children}
    </Button>
  );
}

interface LayoutProps {
  preview: string;
  eyebrow: string;
  heading: string;
  showLocation?: boolean;
  date?: string | undefined;
  time?: string | undefined;
  children: ReactNode;
}

export function LifecycleLayout({ preview, eyebrow, heading, showLocation, date, time, children }: LayoutProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: "#ffffff", color: ink, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <Container style={{ width: "100%", maxWidth: "560px", margin: "0 auto", padding: "24px 12px 40px" }}>
          <Section style={{ border: "1px solid #d5d1c8", backgroundColor: paper, padding: "28px 24px 22px" }}>
            <Text style={{ margin: "0 0 18px", color: graphite, fontFamily: mono, fontSize: "11px", lineHeight: "18px" }}>
              FRESH INK <span style={{ color: cyan }}>✦</span> {eyebrow}
            </Text>
            <Img src={needleUrl} width="64" height="64" alt="Fresh Ink needle illustration" style={{ display: "block", width: "64px", height: "64px", margin: "0 auto 12px" }} />
            <Heading as="h1" style={{ margin: "0 0 18px", textAlign: "center", color: ink, fontFamily: hand, fontWeight: "normal", fontSize: "25px", lineHeight: "33px" }}>
              {heading}
            </Heading>
            {showLocation ? (
              <Section style={{ borderTop: "2px solid #34332f", borderBottom: "1px dashed #aaa69a", padding: "16px 0 14px", marginBottom: "18px" }}>
                <Text style={{ margin: 0, color: ink, fontFamily: hand, fontSize: "20px", lineHeight: "28px" }}>{displayDate(date)} · {time || "your session time"}</Text>
                <Text style={{ margin: "8px 0 0", fontSize: "14px", lineHeight: "22px" }}>
                  <Link href={STUDIO_MAP_URL} style={{ color: ink, textDecoration: "underline" }}>{STUDIO_ADDRESS}</Link>
                </Text>
                <Text style={{ margin: "2px 0 0", color: graphite, fontSize: "13px", lineHeight: "20px" }}>Hours: {STUDIO_HOURS}</Text>
              </Section>
            ) : null}
            {children}
            <Hr style={{ border: 0, borderTop: "1px dashed #aaa69a", margin: "22px 0 14px" }} />
            <Text style={{ margin: 0, color: graphite, fontFamily: mono, fontSize: "10px", lineHeight: "17px" }}>ATELIER SESSION PROTOCOL // INK &amp; NEEDLE</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
