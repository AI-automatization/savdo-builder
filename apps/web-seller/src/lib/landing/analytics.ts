// Лёгкий трекер событий лендинга. Если внешний аналитический слой не
// подключён — тихо ничего не делает (не роняет лендинг). Когда появится
// gtag/dataLayer/Plausible — расширяется в одном месте.
type LandingEvent = 'landing_viewed' | 'landing_cta_clicked' | 'demo_store_opened' | 'showcase_store_opened';

export function landingTrack(event: LandingEvent, props?: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event, ...props });
  } catch {
    /* analytics никогда не должен ломать UI */
  }
}
