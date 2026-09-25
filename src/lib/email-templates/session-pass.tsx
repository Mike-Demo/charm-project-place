import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

import type { TemplateEntry } from "./registry";

interface SessionPassProps {
  name?: string;
  date?: string;
  time?: string;
  passUrl?: string;
}

const SessionPassEmail = ({ name, date, time, passUrl }: SessionPassProps) => (
  <Html>
    <Head />
    <Preview>Your session pass is ready</Preview>
    <Body style={{ backgroundColor: "#ffffff", fontFamily: "Georgia, serif", color: "#1f1b16" }}>
      <Container style={{ padding: "24px", maxWidth: "520px" }}>
        <Heading style={{ fontSize: "24px" }}>Session Pass // Studio Copy</Heading>
        <Text>Hi {name || "there"}, your slot is locked in.</Text>
        <Text>
          <strong>{date || "Your date"}</strong> at <strong>{time || "your time"}</strong>
        </Text>
        <Text>Keep this private link to view or reschedule your booking any time.</Text>
        {passUrl ? (
          <Button
            href={passUrl}
            style={{ backgroundColor: "#1f1b16", color: "#ffffff", padding: "12px 20px", borderRadius: "4px" }}
          >
            Open your session pass
          </Button>
        ) : null}
        <Text style={{ fontSize: "12px", color: "#6b6258" }}>
          Rescheduling is available until 24 hours before your session.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: SessionPassEmail,
  subject: "Your session pass",
  displayName: "Session pass",
  previewData: { name: "Sara", date: "Oct 3, 2026", time: "2:00 PM", passUrl: "https://example.com/pass/abc" },
} satisfies TemplateEntry;
