/**
 * consent.ts — the one place that knows whether we may measure anything.
 *
 * ⚠️ NOTHING NON-ESSENTIAL MAY LOAD OR FIRE BEFORE A CHOICE IS MADE. Under
 * GDPR/ePrivacy, "strictly necessary" is a narrow test — a thing qualifies only
 * if the service literally cannot work without it. That covers the Supabase auth
 * session and the Paddle checkout (you cannot buy without the payment provider),
 * and it does NOT cover analytics. So analytics is dark until someone says yes,
 * and `readConsent()` returning `null` means "not answered", never "assume yes".
 *
 * ⚠️ THE CHOICE ITSELF IS STORED, AND THAT STORAGE IS ALLOWED. Remembering a
 * consent decision is explicitly exempt — the alternative is asking on every page
 * view, which is worse for the visitor and worse for us.
 *
 * ⚠️ AND IT MUST BE WITHDRAWABLE. Consent that cannot be taken back is not
 * consent; the footer carries a "Cookie settings" link that reopens the banner,
 * and choosing Reject after Accept clears the analytics identity.
 */

export type ConsentChoice = 'granted' | 'denied';

/** Versioned: if what we store ever changes materially, bump this and everyone
 *  is asked again rather than being bound by a decision about something else. */
const KEY = 'tr.consent.v1';
const EVENT = 'tr:consent';

export function readConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    // Private mode / storage blocked. Treat as "not answered": we ask again, and
    // nothing non-essential runs. Failing the other way would be a silent yes.
    return null;
  }
}

export function setConsent(choice: ConsentChoice): void {
  try { localStorage.setItem(KEY, choice); } catch { /* still honoured for this page */ }
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: choice }));
  } catch { /* no CustomEvent — the page still works, it just will not react live */ }
}

/** True only for an explicit yes. */
export function analyticsAllowed(): boolean {
  return readConsent() === 'granted';
}

export function onConsentChange(cb: (choice: ConsentChoice) => void): void {
  window.addEventListener(EVENT, (e) => cb((e as CustomEvent).detail as ConsentChoice));
}
