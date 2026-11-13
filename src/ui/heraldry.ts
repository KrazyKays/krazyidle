// Héraldique : meubles (emblèmes) et partitions dessinés en SVG.
// Rendu identique sur tous les appareils, contrairement aux emojis qui dépendent de la police du système.
// Les clés de meubles restent les emojis d'origine : les sauvegardes existantes n'ont rien à migrer.

/** Meubles en silhouette, viewBox 0 0 100 100, remplis de la couleur courante (le métal or). */
const CHARGES: Record<string, { name: string; svg: string }> = {
  '🦁': {
    name: 'Lion',
    svg: '<path d="M50.0 4.0L58.0 14.9L70.0 8.6L72.4 21.9L86.0 21.3L82.4 34.4L94.8 39.8L86.0 50.0L94.8 60.2L82.4 65.6L86.0 78.7L72.4 78.1L70.0 91.4L58.0 85.1L50.0 96.0L42.0 85.1L30.0 91.4L27.6 78.1L14.0 78.7L17.6 65.6L5.2 60.2L14.0 50.0L5.2 39.8L17.6 34.4L14.0 21.3L27.6 21.9L30.0 8.6L42.0 14.9Z"/>'
      + '<circle cx="50" cy="52" r="25" fill="var(--hd-field)"/>'
      + '<circle cx="33" cy="31" r="6"/><circle cx="67" cy="31" r="6"/>'
      + '<path d="M50 30c11 0 19 8 19 18 0 7-3 12-7 16l-6 8c-2 2-4 3-6 3s-4-1-6-3l-6-8c-4-4-7-9-7-16 0-10 8-18 19-18z"/>'
      + '<g fill="var(--hd-field)"><path d="M37 45l9 2-8 3z"/><path d="M63 45l-9 2 8 3z"/><path d="M44 59h12l-6 6z"/><path d="M45 69c3 2 7 2 10 0" stroke="var(--hd-field)" stroke-width="2" fill="none"/></g>',
  },
  '🦅': {
    name: 'Aigle',
    svg: '<circle cx="50" cy="20" r="8"/><path d="M56 17l9 4-9 3z"/><circle cx="52" cy="18" r="1.8" fill="var(--hd-field)"/>'
      + '<ellipse cx="50" cy="50" rx="10" ry="20"/>'
      + '<path d="M44 38L30 22 32 30 18 16 21 28 6 18 12 32 2 30 12 42 4 46 18 52 10 58 26 60 22 66 42 60z"/>'
      + '<path d="M56 38L70 22 68 30 82 16 79 28 94 18 88 32 98 30 88 42 96 46 82 52 90 58 74 60 78 66 58 60z"/>'
      + '<path d="M44 66L34 88 43 83 50 92 57 83 66 88 56 66z"/>'
      + '<path d="M42 66l-8 8 3 1-2 4 6-5zM58 66l8 8-3 1 2 4-6-5z"/>',
  },
  '🐺': {
    name: 'Loup',
    svg: '<path d="M22 14l14 16c4-2 9-3 14-3s10 1 14 3l14-16 2 26c3 5 4 10 2 15l-8 8-8 14c-3 6-9 10-16 10s-13-4-16-10l-8-14-8-8c-2-5-1-10 2-15z"/>'
      + '<g fill="var(--hd-field)"><path d="M34 48l10 4-9 2z"/><path d="M66 48l-10 4 9 2z"/><path d="M44 72h12l-6 7z"/><path d="M30 26l5 10-7-2z"/><path d="M70 26l-5 10 7-2z"/></g>',
  },
  '🐉': {
    name: 'Dragon',
    svg: '<path d="M30 86c-6-6-6-16 2-22 6-5 14-4 18-10 3-5 0-10-5-11l-12 6 2-8-10 2 6-8-10-1 9-6c8-5 18-4 24 2l6-10 2 12 12-8-4 12 14-2-10 8c6 6 8 15 4 23-4 9-14 12-22 16-5 3-6 7-2 9l10-1-4 6c-9 3-21 1-28-6z"/>'
      + '<g fill="var(--hd-field)"><circle cx="40" cy="31" r="2.2"/><path d="M24 33l8 3-8 2z"/></g>',
  },
  '🦌': {
    name: 'Cerf',
    svg: '<path d="M38 50c-6-4-12-10-14-18l-6-4 5-1-3-9 6 6 1-10 4 9 4-6v10l5 8c2 4 4 6 7 7 2-1 5-1 6 0 3-1 5-3 7-7l5-8V17l4 6 4-9 1 10 6-6-3 9 5 1-6 4c-2 8-8 14-14 18l-2 2c2 4 3 9 2 14l-4 14c-2 5-5 8-9 8s-7-3-9-8l-4-14c-1-5 0-10 2-14z"/>'
      + '<g fill="var(--hd-field)"><ellipse cx="43" cy="62" rx="2.6" ry="1.8"/><ellipse cx="57" cy="62" rx="2.6" ry="1.8"/><ellipse cx="50" cy="84" rx="4" ry="2.4"/></g>',
  },
  '🌙': {
    name: 'Croissant',
    svg: '<path d="M64 12A40 40 0 1 0 64 88 32 32 0 1 1 64 12z"/>',
  },
  '☀️': {
    name: 'Soleil',
    svg: '<g>' + Array.from({ length: 16 }, (_, i) => {
      const long = i % 2 === 0;
      return `<path transform="rotate(${i * 22.5} 50 50)" d="${long ? 'M50 4l5 20h-10z' : 'M50 12l4 14h-8z'}"/>`;
    }).join('') + '</g><circle cx="50" cy="50" r="22"/>'
      + '<g fill="var(--hd-field)"><ellipse cx="43" cy="46" rx="2.6" ry="2"/><ellipse cx="57" cy="46" rx="2.6" ry="2"/><path d="M42 57c4 4 12 4 16 0" stroke="var(--hd-field)" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>',
  },
  '🌹': {
    name: 'Rose',
    svg: '<g>' + Array.from({ length: 5 }, (_, i) => `<circle transform="rotate(${i * 72} 50 50)" cx="50" cy="27" r="17"/>`).join('')
      + Array.from({ length: 5 }, (_, i) => `<path transform="rotate(${i * 72 + 36} 50 50)" d="M50 10l4 10h-8z"/>`).join('') + '</g>'
      + '<circle cx="50" cy="50" r="13" fill="var(--hd-field)"/><circle cx="50" cy="50" r="9"/>'
      + '<g fill="var(--hd-field)">' + Array.from({ length: 6 }, (_, i) => `<circle transform="rotate(${i * 60} 50 50)" cx="50" cy="44" r="1.6"/>`).join('') + '</g>',
  },
  '🦉': {
    name: 'Chouette',
    svg: '<path d="M30 14l10 10c3-1 7-2 10-2s7 1 10 2l10-10 2 18c4 6 6 13 6 21 0 18-12 33-28 33S22 71 22 53c0-8 2-15 6-21z"/>'
      + '<g fill="var(--hd-field)"><circle cx="39" cy="42" r="9"/><circle cx="61" cy="42" r="9"/><path d="M46 52h8l-4 8z"/><path d="M36 68c4 3 8 3 14 0 6 3 10 3 14 0" stroke="var(--hd-field)" stroke-width="2" fill="none"/></g>'
      + '<circle cx="39" cy="42" r="4.5"/><circle cx="61" cy="42" r="4.5"/>',
  },
  '🐻': {
    name: 'Patte d\'ours',
    svg: '<path d="M50 46c13 0 24 10 24 22 0 10-7 16-15 16-4 0-6-2-9-2s-5 2-9 2c-8 0-15-6-15-16 0-12 11-22 24-22z"/>'
      + '<ellipse cx="22" cy="44" rx="8" ry="10" transform="rotate(-25 22 44)"/><ellipse cx="38" cy="26" rx="8" ry="11" transform="rotate(-8 38 26)"/>'
      + '<ellipse cx="62" cy="26" rx="8" ry="11" transform="rotate(8 62 26)"/><ellipse cx="78" cy="44" rx="8" ry="10" transform="rotate(25 78 44)"/>',
  },
  '⚔️': {
    name: 'Épées croisées',
    svg: '<g transform="rotate(40 50 50)"><path d="M47 6h6v58h-6z"/><path d="M50 0l4 8h-8z"/><path d="M36 62h28v6H36z"/><path d="M47 68h6v16h-6z"/><circle cx="50" cy="88" r="5"/></g>'
      + '<g transform="rotate(-40 50 50)"><path d="M47 6h6v58h-6z"/><path d="M50 0l4 8h-8z"/><path d="M36 62h28v6H36z"/><path d="M47 68h6v16h-6z"/><circle cx="50" cy="88" r="5"/></g>',
  },
  '🗝️': {
    name: 'Clé',
    svg: '<path d="M50 6c10 0 18 8 18 18s-8 18-18 18-18-8-18-18S40 6 50 6zm0 8a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>'
      + '<path d="M46 40h8v50h-8z"/><path d="M54 66h14v7H54z"/><path d="M54 78h10v7H54z"/><path d="M40 46h20v5H40z"/>',
  },
};

export const CHARGE_IDS = Object.keys(CHARGES);
export const chargeName = (id: string) => CHARGES[id]?.name ?? 'Emblème';

/** Partitions de l'écu : « plein » est offert, les autres s'achètent au Bazar céleste. */
export interface PartitionDef { id: string; name: string; path: string }
const S = 'M60 5 L111 18 V64 C111 101 88 123 60 135 C32 123 9 101 9 64 V18 Z';
export const PARTITIONS: PartitionDef[] = [
  { id: 'plein', name: 'Plein', path: '' },
  { id: 'parti', name: 'Parti', path: 'M60 0H120V140H60Z' },
  { id: 'coupe', name: 'Coupé', path: 'M0 70H120V140H0Z' },
  { id: 'tranche', name: 'Tranché', path: 'M0 5L120 135V140H0Z' },
  { id: 'chevron', name: 'Chevronné', path: 'M0 104L60 56L120 104V140H0Z' },
  { id: 'ecartele', name: 'Écartelé', path: 'M60 0H120V70H60ZM0 70H60V140H0Z' },
];
export const PARTITION: Record<string, PartitionDef> = Object.fromEntries(PARTITIONS.map((p) => [p.id, p]));

let uid = 0;

/**
 * Écu complet en SVG : champ de la couleur de la maison, partition en teinte assombrie,
 * bordure d'or et meuble d'or au centre.
 */
export function shieldSvg(crest: string, partition = 'plein', opts: { border?: boolean; charge?: boolean } = {}): string {
  const id = `hd${++uid}`;
  const part = PARTITION[partition]?.path;
  const border = opts.border !== false;
  const charge = CHARGES[crest];
  return `<svg viewBox="0 0 120 140" aria-hidden="true" class="hd-svg">`
    + `<defs><clipPath id="${id}c"><path d="${S}"/></clipPath>`
    + `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>`
    + `<path class="shield-body" d="${S}"/>`
    + (part ? `<path class="shield-part" clip-path="url(#${id}c)" d="${part}"/>` : '')
    + `<path d="${S}" fill="url(#${id}g)"/>`
    + (border ? `<path d="M60 13 L103 24 V64 C103 96 83 115 60 126 C37 115 17 96 17 64 V24 Z" fill="none" stroke="rgba(255,231,166,.5)" stroke-width="1.5"/><path d="${S}" fill="none" stroke="#f2c45a" stroke-width="5"/>` : `<path d="${S}" fill="none" stroke="#f2c45a" stroke-width="7"/>`)
    + (opts.charge === false || !charge ? '' : `<g class="hd-charge" transform="translate(23 26) scale(.74)">${charge.svg}</g>`)
    + `</svg>`;
}

/** Meuble seul (pour les pastilles de choix). */
export function chargeSvg(crest: string): string {
  const c = CHARGES[crest];
  return `<svg viewBox="0 0 100 100" aria-hidden="true" class="hd-svg hd-only"><g class="hd-charge">${c ? c.svg : ''}</g></svg>`;
}
