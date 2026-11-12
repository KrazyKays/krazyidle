const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
let mode: 'lettres' | 'scientifique' = 'lettres';
export function setNotation(m: 'lettres' | 'scientifique') {
  mode = m;
}

export function fmt(n: number, dec = 1): string {
  if (!Number.isFinite(n)) return '∞';
  const neg = n < 0;
  const a = Math.abs(n);
  let out: string;
  if (a < 1000) {
    out = a < 10 && a % 1 !== 0 ? a.toFixed(dec === 0 ? 0 : Math.max(dec, 1)) : a < 100 && a % 1 !== 0 && dec > 0 ? a.toFixed(1) : Math.floor(a).toString();
  } else if (mode === 'scientifique' || a >= 1e36) {
    out = a.toExponential(2).replace('+', '');
  } else {
    const k = Math.floor(Math.log10(a) / 3);
    const v = a / Math.pow(1000, k);
    out = (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v).toString()) + SUFFIX[k];
  }
  return (neg ? '−' : '') + out;
}

export function fmtInt(n: number) {
  return Math.floor(n).toLocaleString('fr-FR');
}

export function fmtDur(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`;
  if (m > 0) return `${m} min ${String(s).padStart(2, '0')}`;
  return `${s} s`;
}

export function fmtClock(ms: number): string {
  return new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDay(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const tom = new Date(Date.now() + 86400_000);
  if (d.toDateString() === today.toDateString()) return 'Aujourd\'hui';
  if (d.toDateString() === tom.toDateString()) return 'Demain';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' });
}
