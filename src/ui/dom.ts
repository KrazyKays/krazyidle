// Mini-boîte à outils DOM : création, liaisons dynamiques, toasts, modales.
type Child = Node | string | number | null | undefined | false | Child[];

export function h(tag: string, attrs: Record<string, any> | null = null, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') {
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith('--')) el.style.setProperty(sk, String(sv));
          else (el.style as any)[sk] = sv;
        }
      }
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  append(el, children);
  return el;
}

function append(el: HTMLElement, children: Child[]) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

/** Registre de mises à jour : chaque panneau enregistre ses liaisons lors du rendu. */
export class Binder {
  private fns: (() => void)[] = [];
  reset() {
    this.fns = [];
  }
  add(fn: () => void) {
    this.fns.push(fn);
  }
  text(el: HTMLElement, fn: () => string) {
    let last = '';
    this.add(() => {
      const v = fn();
      if (v !== last) { el.textContent = v; last = v; }
    });
    return el;
  }
  width(el: HTMLElement, fn: () => number) {
    let last = -1;
    this.add(() => {
      const v = Math.max(0, Math.min(100, fn() * 100));
      if (Math.abs(v - last) > 0.05) { el.style.width = v.toFixed(2) + '%'; last = v; }
    });
    return el;
  }
  cls(el: HTMLElement, name: string, fn: () => boolean) {
    let last: boolean | null = null;
    this.add(() => {
      const v = fn();
      if (v !== last) { el.classList.toggle(name, v); last = v; }
    });
    return el;
  }
  run() {
    for (const f of this.fns) f();
  }
}

// --- Toasts -------------------------------------------------------------
export function toast(text: string, kind = 'info', ms = 3200) {
  const root = document.getElementById('toasts')!;
  const el = h('div', { class: `toast toast-${kind}`, role: 'status' }, text);
  root.appendChild(el);
  while (root.children.length > 4) root.firstChild!.remove();
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, ms);
}

// --- Modales ------------------------------------------------------------
export interface ModalHandle {
  close: () => void;
  el: HTMLElement;
}
const stack: ModalHandle[] = [];

export function modal(content: HTMLElement, opts: { dismissable?: boolean; wide?: boolean; onClose?: () => void; cls?: string } = {}): ModalHandle {
  const root = document.getElementById('modal-root')!;
  const box = h('div', { class: `modal ${opts.wide ? 'modal-wide' : ''} ${opts.cls ?? ''}`, role: 'dialog', 'aria-modal': 'true' }, content);
  const back = h('div', { class: 'modal-back' }, box);
  const handle: ModalHandle = {
    el: box,
    close: () => {
      back.classList.remove('show');
      setTimeout(() => back.remove(), 200);
      const i = stack.indexOf(handle);
      if (i >= 0) stack.splice(i, 1);
      opts.onClose?.();
    },
  };
  if (opts.dismissable !== false) {
    back.addEventListener('click', (e) => { if (e.target === back) handle.close(); });
    box.prepend(h('button', { class: 'modal-x', 'aria-label': 'Fermer', onclick: () => handle.close() }, '✕'));
  }
  root.appendChild(back);
  stack.push(handle);
  requestAnimationFrame(() => back.classList.add('show'));
  return handle;
}

export function modalOpen() {
  return stack.length > 0;
}

export function closeTopModal() {
  const m = stack[stack.length - 1];
  if (m && m.el.querySelector('.modal-x')) m.close();
}

export function confirmBox(text: string, okLabel = 'Confirmer', danger = false): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const m = modal(
      h('div', { class: 'confirm' },
        h('p', null, text),
        h('div', { class: 'row-end' },
          h('button', { class: 'btn', onclick: () => { done = true; m.close(); resolve(false); } }, 'Annuler'),
          h('button', { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, onclick: () => { done = true; m.close(); resolve(true); } }, okLabel),
        ),
      ),
      { onClose: () => { if (!done) resolve(false); } },
    );
  });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }) as HTMLTextAreaElement;
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function download(name: string, content: string, type: string) {
  const a = h('a', { href: URL.createObjectURL(new Blob([content], { type })), download: name }) as HTMLAnchorElement;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
