// Événements planifiés : mêmes horaires et même type pour tous les joueurs (déterministe, sans serveur).
import { EVENTS, EVENT_DURATION_MIN, EVENT_HOURS_UTC, type EventDef } from './data';
import { hashStr } from './rng';

export interface EventWindow {
  key: string;
  def: EventDef;
  start: number;
  end: number;
}

export function utcDateStr(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function windowFor(dayStartMs: number, hour: number): EventWindow {
  const start = dayStartMs + hour * 3600_000;
  const date = utcDateStr(start);
  const key = `${date}T${String(hour).padStart(2, '0')}`;
  const def = EVENTS[hashStr('evt:' + key) % EVENTS.length];
  return { key, def, start, end: start + EVENT_DURATION_MIN * 60_000 };
}

function dayStart(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function activeEvent(now: number): EventWindow | null {
  const ds = dayStart(now);
  for (const h of EVENT_HOURS_UTC) {
    const w = windowFor(ds, h);
    if (now >= w.start && now < w.end) return w;
  }
  return null;
}

export function upcomingEvents(now: number, n: number): EventWindow[] {
  const out: EventWindow[] = [];
  let ds = dayStart(now);
  while (out.length < n) {
    for (const h of EVENT_HOURS_UTC) {
      const w = windowFor(ds, h);
      if (w.end > now) out.push(w);
      if (out.length >= n) break;
    }
    ds += 86400_000;
  }
  return out;
}

/** Fichier .ics pour ajouter les événements récurrents à son agenda. */
export function buildIcs(): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KrazyIdle//Echos de Lignee//FR', 'CALSCALE:GREGORIAN'];
  const today = new Date();
  const y = today.getUTCFullYear(), m = String(today.getUTCMonth() + 1).padStart(2, '0'), d = String(today.getUTCDate()).padStart(2, '0');
  for (const h of EVENT_HOURS_UTC) {
    const hh = String(h).padStart(2, '0');
    const endMin = EVENT_DURATION_MIN;
    lines.push(
      'BEGIN:VEVENT',
      `UID:krazyidle-event-${hh}@krazyidle`,
      `DTSTAMP:${y}${m}${d}T000000Z`,
      `DTSTART:${y}${m}${d}T${hh}0000Z`,
      `DTEND:${y}${m}${d}T${hh}${String(endMin).padStart(2, '0')}00Z`,
      'RRULE:FREQ=DAILY',
      'SUMMARY:⏳ Échos de Lignée — Événement',
      'DESCRIPTION:Un événement commence ! Bonus de production et Éclats célestes à gagner.',
      'BEGIN:VALARM', 'TRIGGER:-PT5M', 'ACTION:DISPLAY', 'DESCRIPTION:Événement dans 5 minutes', 'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
