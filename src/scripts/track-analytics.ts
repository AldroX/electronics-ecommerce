/// ============================================================
/// Frontend analytics tracker - browser module (zero dependencies)
/// Task: frontend analytics ingest
///
/// Fires a `page_view` once on load and a `whatsapp_click` via event
/// delegation when the user clicks a wa.me link that carries a product
/// slug. Fire-and-forget: sendBeacon when available, fetch keepalive
/// otherwise. Never blocks or delays navigation.
/// ============================================================

const INGEST_ENDPOINT = '/api/analytics/ingest';
const SESSION_STORAGE_KEY = 'et_session_id';

// One session id per tab, persisted across reloads.
function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // sessionStorage unavailable (e.g. private mode) — ephemeral id is fine.
  }
  const id = randomUuid();
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  } catch {
    // Ignore storage failures; the id still lives for this page load.
  }
  return id;
}

// crypto.randomUUID() when available, tiny v4 fallback otherwise.
function randomUuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes =
    c && typeof c.getRandomValues === 'function'
      ? Array.from(c.getRandomValues(new Uint8Array(16)))
      : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    if (i === 4 || i === 6 || i === 8 || i === 10) hex += '-';
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Fire-and-forget send: beacon first, fetch keepalive as fallback. Any
// failure is swallowed silently — analytics must never break the page.
function send(payload: Record<string, unknown>): void {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator.sendBeacon === 'function') {
      if (navigator.sendBeacon(INGEST_ENDPOINT, new Blob([body], { type: 'application/json' }))) {
        return;
      }
      // Beacon rejected the payload — fall through to fetch.
    }
    fetch(INGEST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Ignore all tracking errors.
  }
}

// Page view on load. Defensive: skip API/admin routes the script should
// never run on, even though it is only wired into Base.astro.
(function trackPageView(): void {
  const { pathname } = location;
  if (pathname.startsWith('/api/') || pathname.startsWith('/admin/')) return;
  const referrer =
    document.referrer && document.referrer.startsWith('http') ? document.referrer : null;
  send({ type: 'page_view', path: pathname, referrer, session_id: getSessionId() });
})();

// Event delegation (document-level, bubble phase): track clicks on wa.me
// links that carry a product slug. Anchors without a slug are not tracked.
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const waLink = target.closest('a[href^="https://wa.me/"]');
  if (!waLink) return;
  const slugEl = waLink.closest('a[data-product-slug]');
  const productSlug = slugEl ? slugEl.getAttribute('data-product-slug') : null;
  if (!productSlug) return;
  send({
    type: 'whatsapp_click',
    product_slug: productSlug,
    source_page: location.pathname,
    session_id: getSessionId(),
  });
});

export {};