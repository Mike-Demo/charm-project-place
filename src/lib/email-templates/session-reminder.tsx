import { Link, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { Checklist, EmailButton, LifecycleLayout, SectionLabel, bodyText, linkStyle, type LifecycleProps } from "./lifecycle-layout";

interface Props extends LifecycleProps {
  confirmUrl?: string;
}

const SessionReminderEmail = ({ name, date, time, passUrl, confirmUrl }: Props) => (
  <LifecycleLayout preview="Your session is tomorrow. Tap to confirm you'll be there." eyebrow="REMINDER" heading={`See you tomorrow${name ? `, ${name}` : ""}!`} showLocation date={date} time={time}>
    <Text style={bodyText}>Quick check-in: are you still good for your session? One tap lets us know to have your station ready.</Text>
    {confirmUrl ? (
      <>
        <EmailButton href={confirmUrl}>Yes, I&apos;ll be there ✓</EmailButton>
        <Text style={{ ...bodyText, fontSize: "13px" }}>Button not working? <Link href={confirmUrl} style={linkStyle}>Confirm here</Link>.</Text>
      </>
    ) : null}
    <SectionLabel>WHAT TO BRING</SectionLabel>
    <Checklist items={["A photo ID", "Any reference images you want to revisit", "Water and a snack"]} />
    <Text style={bodyText}>
      Need a different time? {passUrl ? <Link href={passUrl} style={linkStyle}>Open your session pass</Link> : "Reply to this email"}. Changes can be made up to 24 hours before your session.
    </Text>
  </LifecycleLayout>
);

export const template = {
  component: SessionReminderEmail,
  subject: "Your session is tomorrow — please confirm",
  displayName: "Reminder (day before)",
  previewData: { name: "Sara", date: "2026-10-03", time: "2:00 PM", passUrl: "https://freshink.art/pass/example", confirmUrl: "https://freshink.art/pass/example/confirm" },
} satisfies TemplateEntry;
