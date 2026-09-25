import { Link, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { LifecycleLayout, bodyText, linkStyle, type LifecycleProps } from "./lifecycle-layout";

const SessionDayOfEmail = ({ name, date, time, passUrl }: LifecycleProps) => (
  <LifecycleLayout preview="Today's the day. Here's everything you need." eyebrow="TODAY" heading={`Today's the day${name ? `, ${name}` : ""}!`} showLocation date={date} time={time}>
    <Text style={bodyText}>A few things to bring and remember:</Text>
    <Text style={bodyText}>✎ Eat a real meal and drink water beforehand.<br />✎ Wear comfy clothes that give easy access to the spot.<br />✎ Bring a photo ID.<br />✎ Skip alcohol for 24 hours before.<br />✎ Arrive a few minutes early.</Text>
    {passUrl ? <Text style={bodyText}><Link href={passUrl} style={linkStyle}>Your session pass</Link> has all the details.</Text> : null}
  </LifecycleLayout>
);

export const template = {
  component: SessionDayOfEmail,
  subject: "Today's the day — see you at the studio",
  displayName: "Day-of briefing",
  previewData: { name: "Sara", date: "2026-10-03", time: "2:00 PM", passUrl: "https://freshink.art/pass/example" },
} satisfies TemplateEntry;
