import { Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailButton, LifecycleLayout, bodyText, type LifecycleProps } from "./lifecycle-layout";

export const MAYO_AFTERCARE_URL = "https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/tattoos-and-piercings/art-20045067";

const SessionAftercareEmail = ({ name }: LifecycleProps) => (
  <LifecycleLayout preview="How to care for your new tattoo while it heals." eyebrow="AFTERCARE" heading={`Thanks for sitting with us${name ? `, ${name}` : ""}.`}>
    <Text style={bodyText}>Your new ink needs a little care while it heals:</Text>
    <Text style={bodyText}>✎ Keep the bandage on for as long as your artist said.<br />✎ Wash gently with mild soap and water, then pat dry.<br />✎ Use a thin layer of fragrance-free moisturizer.<br />✎ Keep it out of the sun, pools and hot tubs while healing.<br />✎ Don&apos;t pick or scratch — let it flake on its own.</Text>
    <Text style={bodyText}>Signs of infection like spreading redness, pus or fever? Call a doctor.</Text>
    <EmailButton href={MAYO_AFTERCARE_URL}>Read the Mayo Clinic guide ↗</EmailButton>
  </LifecycleLayout>
);

export const template = {
  component: SessionAftercareEmail,
  subject: "Caring for your new tattoo",
  displayName: "Aftercare",
  previewData: { name: "Sara" },
} satisfies TemplateEntry;
