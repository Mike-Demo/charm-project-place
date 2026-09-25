import { Link, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { Checklist, EmailButton, LifecycleLayout, SectionLabel, SketchDivider, bodyText, linkStyle, type LifecycleProps } from "./lifecycle-layout";

export const MAYO_AFTERCARE_URL = "https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/tattoos-and-piercings/art-20045067";

const SessionAftercareEmail = ({ name }: LifecycleProps) => (
  <LifecycleLayout preview="How to care for your new tattoo while it heals." eyebrow="AFTERCARE" heading={`Thanks for sitting with us${name ? `, ${name}` : ""}.`}>
    <Text style={bodyText}>Your new ink needs a little care while it heals.</Text>
    <SectionLabel>FIRST 48 HOURS</SectionLabel>
    <Checklist items={["Keep the bandage on as long as your artist said", "Wash gently with mild soap and lukewarm water", "Pat dry with a clean paper towel"]} />
    <SectionLabel>WEEKS 1–2</SectionLabel>
    <Checklist items={["Use a thin layer of fragrance-free moisturizer", "Keep it out of the sun, pools and hot tubs", "Don't pick or scratch. Let it flake on its own"]} />
    <SectionLabel>WARNING SIGNS</SectionLabel>
    <Text style={bodyText}>Spreading redness, swelling, pus or fever? Call a doctor.</Text>
    <SketchDivider />
    <EmailButton href={MAYO_AFTERCARE_URL}>Read the Mayo Clinic guide ↗</EmailButton>
    <Text style={{ ...bodyText, fontSize: "13px" }}>Or open it here: <Link href={MAYO_AFTERCARE_URL} style={linkStyle}>mayoclinic.org tattoo care</Link></Text>
  </LifecycleLayout>
);

export const template = {
  component: SessionAftercareEmail,
  subject: "Caring for your new tattoo",
  displayName: "Aftercare",
  previewData: { name: "Sara" },
} satisfies TemplateEntry;
