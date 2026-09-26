import { Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailButton, LifecycleLayout, SectionLabel, bodyText, hand, ink, type LifecycleProps } from "./lifecycle-layout";

const SITE = "https://freshink.art";
export const SHARE_CAPTION = "Fresh ink from Fresh Ink in Saint Paul ✦ #freshink #tattooatelier #saintpaultattoo";

const SessionShareEmail = ({ name }: LifecycleProps) => (
  <LifecycleLayout preview="Healed up? We'd love to see it." eyebrow="SHOW IT OFF" heading={`Show off your new ink${name ? `, ${name}` : ""}!`}>
    <Text style={bodyText}>Only if you want to: if you&apos;re happy with how it turned out, we&apos;d love to see a photo.</Text>
    <SectionLabel>CAPTION TO COPY</SectionLabel>
    <Text style={{ margin: "0 0 16px", padding: "12px 14px", border: "1px dashed #aaa69a", color: ink, fontFamily: hand, fontSize: "15px", lineHeight: "23px" }}>{SHARE_CAPTION}</Text>
    <EmailButton href="https://www.instagram.com/">Post on Instagram ↗</EmailButton>
    <EmailButton href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE)}&quote=${encodeURIComponent(SHARE_CAPTION)}`}>Share on Facebook ↗</EmailButton>
    <Text style={bodyText}>Tag the studio so we can cheer you on. Thanks again for trusting us with your skin.</Text>
  </LifecycleLayout>
);

export const template = {
  component: SessionShareEmail,
  subject: "Show off your fresh ink",
  displayName: "Share on social",
  previewData: { name: "Sara" },
} satisfies TemplateEntry;
