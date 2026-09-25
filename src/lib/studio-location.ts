export const STUDIO_ADDRESS = "332 Minnesota St Ste N201, Saint Paul, MN 55101";
export const STUDIO_HOURS = "Appointment only";
export const STUDIO_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STUDIO_ADDRESS)}`;
// Fixed public origin for links in client emails (pass, confirm, reschedule),
// so emails never point at localhost or a preview URL.
export const APP_ORIGIN = "https://freshink.art";