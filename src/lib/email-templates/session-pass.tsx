import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { TemplateEntry } from "./registry";

interface SessionPassProps {
  name?: string;
  date?: string;
  time?: string;
  passUrl?: string;
}

const ink = "#292825";
const graphite = "#575650";
const cyan = "#237590";
const paper = "#f9f7f1";
const hand = '"Segoe Print", "Comic Sans MS", cursive';
const mono = '"Courier New", Courier, monospace';
const needleUrl = "https://freshink.art/email-needle.png";

function displayDate(value?: string): string {
  if (!value) return "Your session date";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const parsed = new Date(`${year}-${month}-${day}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(parsed);
}

const SessionPassEmail = ({ name, date, time, passUrl }: SessionPassProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your session is on the books. Your private pass is inside.</Preview>
    <Body style={{ margin: 0, backgroundColor: "#ffffff", color: ink, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <Container style={{ width: "100%", maxWidth: "560px", margin: "0 auto", padding: "24px 12px 40px" }}>
        <Section style={{ border: "1px solid #d5d1c8", backgroundColor: paper, padding: "28px 24px 22px" }}>
          <Text style={{ margin: "0 0 18px", color: graphite, fontFamily: mono, fontSize: "11px", lineHeight: "18px" }}>
            TATTOO ATELIER <span style={{ color: cyan }}>✦</span> STUDIO COPY
          </Text>

          <Img src={needleUrl} width="76" height="76" alt="Tattoo Atelier needle illustration" style={{ display: "block", width: "76px", height: "76px", margin: "0 auto 14px" }} />
          <Heading as="h1" style={{ margin: "0 0 8px", textAlign: "center", color: ink, fontFamily: hand, fontWeight: "normal", fontSize: "26px", lineHeight: "34px" }}>
            You&apos;re on the books{name ? `, ${name}` : ""}!
          </Heading>
          <Text style={{ margin: "0 0 24px", textAlign: "center", color: graphite, fontSize: "15px", lineHeight: "23px" }}>
            Your session is confirmed. Keep this studio copy close.
          </Text>

          <Section style={{ borderTop: "2px solid #34332f", borderBottom: "1px dashed #aaa69a", padding: "18px 0 16px" }}>
            <Text style={{ margin: "0 0 8px", color: cyan, fontFamily: mono, fontSize: "11px", lineHeight: "16px" }}>
              01 / SESSION DETAILS
            </Text>
            <Text style={{ margin: "0", color: ink, fontFamily: hand, fontSize: "21px", lineHeight: "30px" }}>
              {displayDate(date)}
            </Text>
            <Text style={{ margin: "3px 0 0", color: ink, fontSize: "18px", lineHeight: "26px" }}>
              {time || "Your session time"} <span style={{ color: graphite, fontSize: "14px" }}>· Station 03</span>
            </Text>
          </Section>

          <Text style={{ margin: "22px 0 14px", color: graphite, fontSize: "15px", lineHeight: "24px" }}>
            Your private pass holds your booking details and the option to reschedule. Please keep the link to yourself.
          </Text>
          {passUrl ? (
            <>
              <Button href={passUrl} style={{ display: "inline-block", backgroundColor: ink, border: `1px solid ${ink}`, borderRadius: "3px", color: "#ffffff", fontFamily: hand, fontSize: "16px", lineHeight: "22px", padding: "13px 20px", textDecoration: "none" }}>
                Open your session pass ↗
              </Button>
              <Text style={{ margin: "16px 0 0", color: graphite, fontSize: "12px", lineHeight: "19px", overflowWrap: "anywhere" }}>
                Button not working? <Link href={passUrl} style={{ color: cyan, textDecoration: "underline", overflowWrap: "anywhere" }}>Open your private pass here</Link>.
              </Text>
            </>
          ) : null}

          <Hr style={{ border: 0, borderTop: "1px dashed #aaa69a", margin: "24px 0 16px" }} />
          <Text style={{ margin: "0", color: graphite, fontSize: "13px", lineHeight: "21px" }}>
            ✎ Rescheduling is available until 24 hours before your session.
          </Text>
          <Text style={{ margin: "20px 0 0", color: graphite, fontFamily: mono, fontSize: "10px", lineHeight: "17px" }}>
            ATELIER SESSION PROTOCOL // INK &amp; NEEDLE
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: SessionPassEmail,
  subject: "Your session pass",
  displayName: "Session pass",
  previewData: { name: "Sara", date: "2026-10-03", time: "2:00 PM", passUrl: "https://freshink.art/pass/example" },
} satisfies TemplateEntry;