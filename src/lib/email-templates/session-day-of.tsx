import { Link, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { Checklist, LifecycleLayout, SectionLabel, bodyText, hand, ink, linkStyle, type LifecycleProps } from "./lifecycle-layout";

interface Props extends LifecycleProps {
  idea?: string;
}

const SessionDayOfEmail = ({ name, date, time, passUrl, idea }: Props) => (
  <LifecycleLayout preview="Today's the day. Here's everything you need." eyebrow="TODAY" heading={`Today's the day${name ? `, ${name}` : ""}!`} showLocation date={date} time={time}>
    <SectionLabel>BEFORE YOU COME</SectionLabel>
    <Checklist items={["Eat a real meal and drink plenty of water", "Skip alcohol for 24 hours before", "Wear comfy clothes with easy access to the spot"]} />
    <SectionLabel>BRING</SectionLabel>
    <Checklist items={["A photo ID", "Headphones or a book if you like"]} />
    <SectionLabel>ARRIVAL</SectionLabel>
    <Text style={bodyText}>Please arrive 10 minutes early. The studio is appointment only, so head up to suite N201.</Text>
    {idea ? (
      <>
        <SectionLabel>YOUR IDEA</SectionLabel>
        <Text style={{ margin: "0 0 14px", padding: "10px 12px", borderLeft: `2px solid ${ink}`, color: ink, fontFamily: hand, fontSize: "15px", lineHeight: "23px" }}>{idea}</Text>
      </>
    ) : null}
    {passUrl ? <Text style={bodyText}><Link href={passUrl} style={linkStyle}>Your session pass</Link> has all the details.</Text> : null}
  </LifecycleLayout>
);

export const template = {
  component: SessionDayOfEmail,
  subject: "Today's the day — see you at the studio",
  displayName: "Day-of briefing",
  previewData: { name: "Sara", date: "2026-10-03", time: "2:00 PM", passUrl: "https://freshink.art/pass/example", idea: "Fine-line peony on the forearm" },
} satisfies TemplateEntry;
