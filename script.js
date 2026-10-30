"use strict";

(() => {
  const SAVE_KEY = "k_typer_save_v1";
  const SAVE_VERSION = 4;
  const TICK_MS = 200;
  const SAVE_MS = 10000;
  const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
  const OFFLINE_MIN_MS = 30000;
  const ROWS = 7;
  const BASE_WORDS = 4;
  const SPAWN_MS = 1800;
  const BASE_LIFETIME_MS = 8000;
  const LONG_WORD_THRESHOLD = 5;
  const PULL_BASE_COST = 10;
  const PULL_GROWTH = 1.15;
  const MULTI_PULL = 10;
  const PASSIVE_MAX_STACKS = 5;
  const PITY_LIMIT = 20;
  const JACKPOT_CHANCE = 0.02;
  const JACKPOT_ID = "oracle";
  const FREE_PULL_MS = 10 * 60 * 1000;
  const COMBO_STEP = 0.1;
  const BASE_COMBO_CAP = 3;
  const GOLD_CHANCE = 0.03;
  const GOLD_MULT = 5;
  const RATE_PER_LETTER = 0.1;
  const MAX_ESSENCE = 1e15;
  const BUBBLE_FIRST_MS = 30000;
  const BUBBLE_MS = 75000;
  const BUBBLE_LIFE_MS = 9000;
  const FRENZY_MS = 20000;
  const FRENZY_MULT = 3;
  const STAR_UNIT = 1e6;
  const STAR_BONUS = 0.1;
  const RARITY_LABELS = { commune: "COMMUNE", rare: "RARE", epique: "ÉPIQUE", legendaire: "LÉGENDAIRE", mythique: "MYTHIQUE" };
  const PULL_WEIGHTS = { commune: 3, rare: 2 };
  const UNITS = ["", " k", " M", " Md", " Bn", " Bd"];

  const WORDS = `
    lumiere terminal clavier ecran pixel memoire reseau fichier dossier navire foret riviere
    montagne nuage orage etoile lune soleil cristal metal dragon licorne sorcier chevalier
    bouclier epee potion grimoire parchemin royaume donjon tresor gobelin golem phoenix cavalier
    voyage aventure mystere secret enigme hibou renard loup ours serpent lapin abeille papillon
    fourmi tortue baleine dauphin requin poisson grenouille champignon cactus bambou racine
    feuille branche pomme cerise citron melon chocolat biscuit gateau sucre miel cafe the lait
    fromage pain tomate carotte oignon jardin verger prairie desert volcan glacier ocean plage
    sable caillou rocher falaise vallee cascade tempete eclair brume aurore crepuscule minuit
    horloge boussole lanterne bougie miroir couronne anneau rubis saphir emeraude diamant perle
    ambre obsidienne fusee planete comete galaxie orbite satellite astronaute robot engrenage
    ressort levier piston moteur turbine catapulte trebuchet bonbon guimauve sucette nuage
    arc ciel pirate perroquet trampoline toboggan ballon cerf volant pingouin koala panda
  `.trim().split(/\s+/).filter((word, index, list) => list.indexOf(word) === index);

  // prod = Essence par seconde et par exemplaire ; le passif plafonne à PASSIVE_MAX_STACKS exemplaires.
  const creatures = [
    { id: "gelee", name: "Gelée", rarity: "commune", shape: "round", color: "#7fe39a", prod: 0.5, passive: { type: "gain", value: 0.1 } },
    { id: "pixo", name: "Pixo", rarity: "commune", shape: "square", color: "#6de7e0", prod: 0.5, passive: { type: "longWord", value: 1 } },
    { id: "glyphe", name: "Glyphe", rarity: "commune", shape: "triangle", color: "#f2c66d", prod: 0.5, passive: { type: "fuzzy", value: 1 } },
    { id: "phalene", name: "Phalène", rarity: "commune", shape: "round", color: "#c7a6ff", prod: 0.5, passive: { type: "echo", value: 1 } },
    { id: "crabe", name: "Crabe", rarity: "rare", shape: "diamond", color: "#ff9d5c", prod: 2, passive: { type: "crit", value: 0.15 } },
    { id: "luciole", name: "Luciole", rarity: "rare", shape: "round", color: "#fff27a", prod: 2, passive: { type: "gain", value: 0.25 } },
    { id: "oracle", name: "Oracle", rarity: "legendaire", shape: "triangle", color: "#ffffff", prod: 40, passive: { type: "crit", value: 0.5 } },
    { id: "tic", name: "Tic", rarity: "commune", shape: "square", color: "#ff827c", prod: 2, passive: { type: "lifetime", value: 1.5 }, fusion: true },
    { id: "metronome", name: "Métronome", rarity: "commune", shape: "square", color: "#e8c07a", prod: 2, passive: { type: "spawn", value: 0.15 }, fusion: true },
    { id: "golem", name: "Golem", rarity: "rare", shape: "square", color: "#9aa7b8", prod: 6, passive: { type: "longWord", value: 2 }, fusion: true },
    { id: "spectre", name: "Spectre", rarity: "rare", shape: "triangle", color: "#8fd3ff", prod: 6, passive: { type: "lifetime", value: 2.5 }, fusion: true },
    { id: "lanterne", name: "Lanterne", rarity: "rare", shape: "round", color: "#ffe066", prod: 6, passive: { type: "prod", value: 0.2 }, fusion: true },
    { id: "revenant", name: "Revenant", rarity: "rare", shape: "round", color: "#b388ff", prod: 6, passive: { type: "echo", value: 2 }, fusion: true },
    { id: "horloge", name: "Horloge", rarity: "rare", shape: "square", color: "#ffb347", prod: 6, passive: { type: "lifetime", value: 4 }, fusion: true },
    { id: "dragonnet", name: "Dragonnet", rarity: "epique", shape: "diamond", color: "#ff5ad6", prod: 15, passive: { type: "gain", value: 0.5 }, fusion: true },
    { id: "hydre", name: "Hydre", rarity: "epique", shape: "triangle", color: "#4dd0a1", prod: 25, passive: { type: "echo", value: 3 }, fusion: true },
    { id: "titan", name: "Titan", rarity: "epique", shape: "square", color: "#ffd166", prod: 80, passive: { type: "crit", value: 0.3 }, fusion: true },
    { id: "cerbere", name: "Cerbère", rarity: "epique", shape: "triangle", color: "#ff6b6b", prod: 80, passive: { type: "fuzzy", value: 2 }, fusion: true },
    { id: "chimere", name: "Chimère", rarity: "epique", shape: "diamond", color: "#5ce1a6", prod: 80, passive: { type: "longWord", value: 3 }, fusion: true },
    { id: "comete", name: "Comète", rarity: "epique", shape: "triangle", color: "#9fe8ff", prod: 80, passive: { type: "spawn", value: 0.4 }, fusion: true },
    { id: "sphinx", name: "Sphinx", rarity: "legendaire", shape: "diamond", color: "#e0e0ff", prod: 150, passive: { type: "crit", value: 0.6 }, fusion: true },
    { id: "leviathan", name: "Léviathan", rarity: "legendaire", shape: "diamond", color: "#3fa7ff", prod: 300, passive: { type: "gain", value: 1 }, fusion: true },
    { id: "ouroboros", name: "Ouroboros", rarity: "mythique", shape: "round", color: "#ff3b6b", prod: 1500, passive: { type: "prod", value: 1 }, fusion: true }
  ];

  const fusions = [
    { a: "glyphe", b: "phalene", result: "tic" },
    { a: "gelee", b: "pixo", result: "metronome" },
    { a: "pixo", b: "crabe", result: "golem" },
    { a: "glyphe", b: "luciole", result: "spectre" },
    { a: "gelee", b: "luciole", result: "lanterne" },
    { a: "phalene", b: "crabe", result: "revenant" },
    { a: "gelee", b: "crabe", result: "horloge" },
    { a: "crabe", b: "luciole", result: "dragonnet" },
    { a: "revenant", b: "spectre", result: "hydre" },
    { a: "gelee", b: "oracle", result: "titan" },
    { a: "glyphe", b: "oracle", result: "cerbere" },
    { a: "pixo", b: "oracle", result: "chimere" },
    { a: "phalene", b: "oracle", result: "comete" },
    { a: "crabe", b: "oracle", result: "sphinx" },
    { a: "dragonnet", b: "chimere", result: "leviathan" },
    { a: "sphinx", b: "leviathan", result: "ouroboros" }
  ];

  const upgrades = [
    { id: "clavier", name: "⌨️ Clavier magique", desc: "+25 % d'Essence par mot", base: 25, growth: 1.7, max: Infinity },
    { id: "cpu", name: "🍲 Chaudron bouillonnant", desc: "+20 % de production des créatures", base: 60, growth: 1.8, max: Infinity },
    { id: "ram", name: "📋 Grand tableau", desc: "+1 mot affiché en même temps", base: 150, growth: 10, max: 3 },
    { id: "tampon", name: "🌀 Ressort à combo", desc: "+0,5 au multiplicateur de combo maximal", base: 300, growth: 6, max: 4 },
    { id: "antenne", name: "🍀 Trèfle doré", desc: "+2 % de chance de mot doré (×5)", base: 400, growth: 4, max: 5 },
    { id: "filet", name: "🦋 Filet à bulles", desc: "Bulles bonus 25 % plus fréquentes", base: 500, growth: 5, max: 4 }
  ];

  const QUESTS = [
    { text: "Tapez 5 mots", hint: "Un mot se valide dès qu'il est complet, sans appuyer sur Entrée.", goal: 5, value: () => state.stats.words, reward: 15 },
    { text: "Invoquez une créature", hint: "Onglet ✨ Invoquer : le premier tirage est offert, puis un toutes les 10 minutes.", goal: 1, value: () => state.stats.pulls, reward: 20 },
    { text: "Atteignez un combo de 10", hint: "Chaque mot augmente le multiplicateur. Un mot raté divise le combo par deux.", goal: 10, value: () => state.stats.bestCombo, reward: 40 },
    { text: "Achetez une amélioration", hint: "Onglet 🛒 Boutique : les objets apparaissent à mesure que vous gagnez de l'Essence.", goal: 1, value: upgradeTotal, reward: 60 },
    { text: "Éclatez une bulle bonus", hint: "Une bulle 🎁 apparaît parfois dans le ciel : cliquez-la vite !", goal: 1, value: () => state.stats.bubbles, reward: 80 },
    { text: "Possédez 5 créatures", hint: "Chaque créature produit de l'Essence en continu, même hors ligne (8 h max).", goal: 5, value: ownedCount, reward: 80 },
    { text: "Réussissez une fusion", hint: "Onglet 🧪 Fusion : choisissez deux créatures. Le bestiaire donne des indices.", goal: 1, value: () => state.stats.fusions, reward: 150 },
    { text: "Tapez un mot doré", hint: "Les mots dorés rapportent cinq fois plus.", goal: 1, value: () => state.stats.golden, reward: 200 },
    { text: "Produisez 10 Essence/s", hint: "Les créatures fusionnées produisent bien plus que leurs ingrédients.", goal: 10, value: () => mods.rate, reward: 400 },
    { text: "Découvrez 8 créatures", goal: 8, value: () => state.discovered.length, reward: 800 },
    { text: "Atteignez un combo de 25", goal: 25, value: () => state.stats.bestCombo, reward: 1500 },
    { text: "Invoquez l'Oracle", hint: "2 % de chance par tirage, garanti au bout de 20 tirages.", goal: 1, value: () => discoveredCount(c => c.id === JACKPOT_ID), reward: 3000 },
    { text: "Produisez 100 Essence/s", goal: 100, value: () => mods.rate, reward: 5000 },
    { text: "Découvrez une créature épique", goal: 1, value: () => discoveredCount(c => c.rarity === "epique"), reward: 15000 },
    { text: "Atteignez un combo de 50", goal: 50, value: () => state.stats.bestCombo, reward: 30000 },
    { text: "Produisez 1 000 Essence/s", goal: 1000, value: () => mods.rate, reward: 100000 },
    { text: "Faites une Renaissance", hint: "Onglet ⭐ Étoiles : repartez avec un bonus permanent.", goal: 1, value: () => state.rebirths, reward: 50000 },
    { text: "Découvrez 18 créatures", goal: 18, value: () => state.discovered.length, reward: 300000 },
    { text: "Fusionnez une créature légendaire", goal: 1, value: () => discoveredCount(c => c.fusion && c.rarity === "legendaire"), reward: 1e6 },
    { text: "Produisez 10 000 Essence/s", goal: 10000, value: () => mods.rate, reward: 3e6 },
    { text: "Complétez le bestiaire", goal: creatures.length, value: () => state.discovered.length, reward: 2e7 }
  ];

  const BONUSES = [
    { id: "frenzy", weight: 3 },
    { id: "rain", weight: 3 },
    { id: "combo", weight: 2 },
    { id: "pull", weight: 1 }
  ];

  const creatureMap = new Map(creatures.map(creature => [creature.id, creature]));
  const el = {};
  const upgradeNodes = {};
  const tabNodes = {};
  let storageOk = true;
  let nextSpawnAt = 0;
  let nextBubbleAt = Date.now() + BUBBLE_FIRST_MS;
  let bubble = null;
  let frenzyUntil = 0;
  let lastTick = Date.now();
  let mods = null;

  const state = freshState();

  function freshState() {
    return {
      essence: 0,
      collection: Object.fromEntries(creatures.map(creature => [creature.id, 0])),
      discovered: [],
      pulls: 0,
      pityCounter: 0,
      lastFreePull: 0,
      knownFusions: [],
      upgrades: Object.fromEntries(upgrades.map(upgrade => [upgrade.id, 0])),
      questIndex: 0,
      stars: 0,
      rebirths: 0,
      stats: { words: 0, golden: 0, pulls: 0, fusions: 0, bestCombo: 0, earned: 0, bubbles: 0 },
      combo: 0,
      selection: [],
      words: []
    };
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(node, text) {
    if (node.textContent !== text) node.textContent = text;
  }

  function setWidth(node, ratio) {
    const width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
    if (node.style.width !== width) node.style.width = width;
  }

  function restartAnimation(node, className) {
    node.classList.remove(className);
    void node.offsetWidth;
    node.classList.add(className);
  }

  function setMessage(text) {
    setText(el["system-message"], text);
    restartAnimation(el["system-message"].parentNode, "is-talking");
  }

  function showNotice(text) {
    setText(el["notice-text"], text);
    el.notice.hidden = false;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function pickWeighted(list) {
    let roll = Math.random() * list.reduce((sum, item) => sum + item.weight, 0);
    return list.find(item => (roll -= item.weight) < 0) || list[0];
  }

  function formatNumber(value) {
    if (value < 1e4) return Math.floor(value).toLocaleString("fr-FR");
    let unit = 0;
    while (value >= 1000 && unit < UNITS.length - 1) {
      value /= 1000;
      unit += 1;
    }
    return `${value.toLocaleString("fr-FR", { maximumFractionDigits: value < 100 ? 1 : 0 })}${UNITS[unit]}`;
  }

  function formatRate(value) {
    return value < 100 ? value.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : formatNumber(value);
  }

  function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    return hours ? `${hours} h ${String(minutes % 60).padStart(2, "0")} min` : `${minutes} min`;
  }

  function pairKey(a, b) {
    return [a, b].sort().join("+");
  }

  function findFusion(a, b) {
    const key = pairKey(a, b);
    return fusions.find(fusion => pairKey(fusion.a, fusion.b) === key) || null;
  }

  function isKnownFusion(fusion) {
    return state.knownFusions.includes(pairKey(fusion.a, fusion.b));
  }

  function isDiscovered(id) {
    return state.discovered.includes(id);
  }

  function discoveredCount(filter) {
    return creatures.filter(creature => isDiscovered(creature.id) && filter(creature)).length;
  }

  function ownedCount() {
    return Object.values(state.collection).reduce((sum, count) => sum + count, 0);
  }

  function upgradeTotal() {
    return Object.values(state.upgrades).reduce((sum, level) => sum + level, 0);
  }

  function normalize(text) {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  function hammingDistance(a, b) {
    let distance = 0;
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) distance += 1;
    }
    return distance;
  }

  function passiveText(type, value) {
    const percent = Math.round(value * 100);
    const plural = value > 1 ? "s" : "";
    if (type === "gain") return `+${percent} % d'Essence par mot`;
    if (type === "longWord") return `Lettres au-delà de ${LONG_WORD_THRESHOLD} : ×${1 + value}`;
    if (type === "fuzzy") return `Tolère ${value} faute${plural} (avec Entrée)`;
    if (type === "echo") return `Valide aussi ${value} mot${plural} plus court${plural}`;
    if (type === "lifetime") return `+${value.toLocaleString("fr-FR")} s d'affichage des mots`;
    if (type === "spawn") return `+${percent} % d'apparition des mots`;
    if (type === "prod") return `+${percent} % de production`;
    return `${Math.min(100, percent)} % de chance de gain doublé`;
  }

  function starMult() {
    return 1 + STAR_BONUS * state.stars;
  }

  function frenzyMult(now) {
    return now < frenzyUntil ? FRENZY_MULT : 1;
  }

  function pendingStars() {
    return Math.max(0, Math.floor(Math.sqrt(state.stats.earned / STAR_UNIT)) - state.stars);
  }

  // Recalculé uniquement quand la collection, les améliorations ou les étoiles changent.
  function refreshMods() {
    const next = { gain: 0, longWord: 0, fuzzy: 0, echo: 0, lifetime: 0, crit: 0, spawn: 0, prod: 0 };
    let baseRate = 0;
    creatures.forEach(creature => {
      const count = state.collection[creature.id];
      if (count <= 0) return;
      baseRate += creature.prod * count;
      const { type, value } = creature.passive;
      if (type === "fuzzy") next.fuzzy = Math.max(next.fuzzy, value);
      else next[type] += value * Math.min(count, PASSIVE_MAX_STACKS);
    });
    next.crit = Math.min(1, next.crit);
    next.rate = baseRate * (1 + next.prod + 0.2 * state.upgrades.cpu) * starMult();
    next.wordMult = (1 + next.gain + 0.25 * state.upgrades.clavier) * starMult();
    next.maxWords = BASE_WORDS + state.upgrades.ram;
    next.comboCap = BASE_COMBO_CAP + 0.5 * state.upgrades.tampon;
    next.gold = GOLD_CHANCE + 0.02 * state.upgrades.antenne;
    next.bubbleMs = BUBBLE_MS / (1 + 0.25 * state.upgrades.filet);
    mods = next;
  }

  function earn(amount) {
    state.essence = Math.min(MAX_ESSENCE, state.essence + amount);
    state.stats.earned = Math.min(MAX_ESSENCE, state.stats.earned + amount);
  }

  function comboMult() {
    return Math.min(mods.comboCap, 1 + state.combo * COMBO_STEP);
  }

  function breakCombo() {
    if (state.combo === 0) return;
    state.combo = Math.floor(state.combo / 2);
    restartAnimation(el["combo-text"], "is-broken");
    renderCombo();
  }

  // Les mots rapportent aussi une fraction de la production : la frappe reste utile en fin de partie.
  function wordGain(word, now) {
    const length = word.text.length;
    const bonus = Math.max(0, length - LONG_WORD_THRESHOLD) * mods.longWord;
    const crit = Math.random() < mods.crit;
    const value = (length + bonus) * (1 + mods.rate * RATE_PER_LETTER) * mods.wordMult * comboMult()
      * (crit ? 2 : 1) * (word.gold ? GOLD_MULT : 1) * frenzyMult(now);
    return { value, crit };
  }

  /* ---------- Mots ---------- */

  function spawnWord(now) {
    const usedRows = new Set(state.words.map(word => word.row));
    const rows = [...Array(ROWS).keys()].filter(row => !usedRows.has(row));
    if (!rows.length) return;
    const visible = new Set(state.words.map(word => word.text));
    const text = pick(WORDS.filter(word => !visible.has(word)));
    const row = pick(rows);
    const gold = Math.random() < mods.gold;
    const life = BASE_LIFETIME_MS + mods.lifetime * 1000;
    const node = document.createElement("div");
    node.className = `word${gold ? " is-gold" : text.length >= 8 ? " is-long" : ""}`;
    node.style.top = `calc((100% - 46px) * ${row / (ROWS - 1)} + 4px)`;
    const typed = document.createElement("span");
    typed.className = "typed";
    const rest = document.createElement("span");
    rest.textContent = text;
    const bar = document.createElement("span");
    bar.className = "word-timer";
    bar.style.animationDuration = `${life}ms`;
    node.append(typed, rest, bar);
    el["word-zone"].append(node);
    const maxLeft = Math.max(0, el["word-zone"].clientWidth - node.offsetWidth - 12);
    node.style.left = `${6 + Math.random() * maxLeft}px`;
    const word = { text, node, typed, rest, row, gold, hl: 0, expiresAt: now + life };
    state.words.push(word);
    highlightWord(word, normalize(el["word-input"].value));
  }

  function removeWord(word) {
    word.node.remove();
    state.words = state.words.filter(item => item !== word);
  }

  function clearWords() {
    state.words.forEach(word => word.node.remove());
    state.words = [];
  }

  function tickWords(now) {
    if (!state.words.length) nextSpawnAt = Math.min(nextSpawnAt, now);
    if (now >= nextSpawnAt && state.words.length < mods.maxWords) {
      spawnWord(now);
      nextSpawnAt = now + SPAWN_MS / (1 + mods.spawn);
    }
    let missed = false;
    state.words = state.words.filter(word => {
      if (word.expiresAt > now) return true;
      word.node.remove();
      missed = true;
      return false;
    });
    if (missed) breakCombo();
  }

  function highlightWord(word, typed) {
    const count = typed && word.text.startsWith(typed) ? typed.length : 0;
    if (count === word.hl) return;
    word.hl = count;
    word.typed.textContent = word.text.slice(0, count);
    word.rest.textContent = word.text.slice(count);
    word.node.classList.toggle("is-target", count > 0);
  }

  function highlightWords() {
    const typed = normalize(el["word-input"].value);
    state.words.forEach(word => highlightWord(word, typed));
  }

  function floatText(left, top, text, big) {
    const node = document.createElement("span");
    node.className = `float${big ? " is-big" : ""}`;
    node.textContent = text;
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
    node.addEventListener("animationend", () => node.remove());
    el["word-zone"].append(node);
  }

  function findTarget(typed, allowFuzzy) {
    const exact = state.words.find(word => word.text === typed);
    if (exact || !allowFuzzy || !mods.fuzzy) return exact || null;
    return state.words.find(word => word.text.length === typed.length && hammingDistance(word.text, typed) <= mods.fuzzy) || null;
  }

  function validateWord(typed, allowFuzzy) {
    const target = findTarget(typed, allowFuzzy);
    if (!target) return false;
    const now = Date.now();
    const echoes = state.words.filter(word => word !== target && word.text.length < target.text.length).slice(0, mods.echo);
    let total = 0;
    let golden = false;
    [target, ...echoes].forEach(word => {
      const { value, crit } = wordGain(word, now);
      total += value;
      state.combo += 1;
      state.stats.words += 1;
      if (word.gold) {
        state.stats.golden += 1;
        golden = true;
      }
      floatText(word.node.offsetLeft, word.node.offsetTop, `+${formatNumber(value)}${crit ? " CRIT !" : ""}`, word.gold || crit);
      removeWord(word);
    });
    state.stats.bestCombo = Math.max(state.stats.bestCombo, state.combo);
    earn(total);
    renderCombo();
    renderEssence();
    setMessage(`${golden ? "Wouah, un mot doré ! " : ""}+${formatNumber(total)} Essence${echoes.length ? ` · écho ×${echoes.length}` : ""}`);
    return true;
  }

  function rejectInput() {
    restartAnimation(el["word-input"], "is-error");
    setMessage("Oups, aucun mot visible ne correspond.");
  }

  function handleWordInput() {
    const raw = el["word-input"].value;
    const typed = normalize(raw);
    const validated = typed !== "" && validateWord(typed, /\s/.test(raw));
    if (validated || /\s/.test(raw)) {
      el["word-input"].value = "";
      if (!validated && typed !== "") rejectInput();
    }
    highlightWords();
  }

  function submitWord(event) {
    event.preventDefault();
    const typed = normalize(el["word-input"].value);
    el["word-input"].value = "";
    if (typed !== "" && !validateWord(typed, true)) rejectInput();
    highlightWords();
  }

  function focusOnType(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
    if (event.target === el["word-input"] || !el.notice.hidden) return;
    el["word-input"].focus();
  }

  /* ---------- Bulles bonus ---------- */

  function spawnBubble(now) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "bubble";
    node.textContent = "🎁";
    node.setAttribute("aria-label", "Bulle bonus");
    const zone = el["word-zone"];
    node.style.left = `${8 + Math.random() * Math.max(0, zone.clientWidth - 80)}px`;
    node.style.top = `${8 + Math.random() * Math.max(0, zone.clientHeight - 80)}px`;
    node.addEventListener("pointerdown", event => event.preventDefault());
    node.addEventListener("click", popBubble);
    zone.append(node);
    bubble = { node, expiresAt: now + BUBBLE_LIFE_MS };
  }

  function removeBubble(now) {
    if (bubble) bubble.node.remove();
    bubble = null;
    nextBubbleAt = now + mods.bubbleMs * (0.7 + Math.random() * 0.6);
  }

  function tickBubble(now) {
    if (bubble && now >= bubble.expiresAt) removeBubble(now);
    else if (!bubble && now >= nextBubbleAt) spawnBubble(now);
  }

  function popBubble() {
    if (!bubble) return;
    const now = Date.now();
    const { offsetLeft, offsetTop } = bubble.node;
    removeBubble(now);
    state.stats.bubbles += 1;
    let bonus = pickWeighted(BONUSES).id;
    if (bonus === "pull" && freePullReady(now)) bonus = "rain";
    let label;
    if (bonus === "frenzy") {
      frenzyUntil = now + FRENZY_MS;
      label = `FRÉNÉSIE ×${FRENZY_MULT} !`;
      setMessage(`Frénésie ! Tous les gains sont multipliés par ${FRENZY_MULT} pendant ${FRENZY_MS / 1000} secondes.`);
    } else if (bonus === "rain") {
      const gain = Math.max(50 * starMult(), mods.rate * 90);
      earn(gain);
      label = `+${formatNumber(gain)}`;
      setMessage(`Pluie d'Essence : +${formatNumber(gain)} !`);
    } else if (bonus === "combo") {
      state.combo += 10;
      state.stats.bestCombo = Math.max(state.stats.bestCombo, state.combo);
      label = "COMBO +10";
      setMessage("Coup de pouce : +10 au combo !");
      renderCombo();
    } else {
      state.lastFreePull = 0;
      label = "TIRAGE OFFERT";
      setMessage("Un tirage gratuit vous attend dans l'onglet Invoquer !");
    }
    floatText(offsetLeft, offsetTop, label, true);
    renderEssence();
    renderPull();
    el["word-input"].focus({ preventScroll: true });
  }

  /* ---------- Info-bulle des compagnons ---------- */

  function showTip(target) {
    const creature = creatureMap.get(target.dataset.tip);
    if (!creature) return;
    const count = state.collection[creature.id];
    const { type, value } = creature.passive;
    const stacks = Math.max(1, Math.min(count, PASSIVE_MAX_STACKS));
    const tip = el.tooltip;
    tip.replaceChildren();
    [
      [`${creature.name} · ${RARITY_LABELS[creature.rarity]}`, "tip-title"],
      [`+${formatRate(creature.prod)} Essence/s par exemplaire`, "tip-prod"],
      [passiveText(type, type === "fuzzy" ? value : value * stacks), ""],
      [`Possédé : ×${count}${count > PASSIVE_MAX_STACKS && type !== "fuzzy" ? ` (pouvoir plafonné à ${PASSIVE_MAX_STACKS})` : ""}`, "tip-own"]
    ].forEach(([text, className]) => addLine(tip, className, text));
    tip.hidden = false;
    const rect = target.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, rect.left + rect.width / 2 - tip.offsetWidth / 2));
    const above = rect.top - tip.offsetHeight - 10;
    tip.style.left = `${left}px`;
    tip.style.top = `${above >= 8 ? above : rect.bottom + 10}px`;
  }

  function hideTip() {
    el.tooltip.hidden = true;
  }

  function handleTipOver(event) {
    const target = event.target.closest("[data-tip]");
    if (target) showTip(target);
    else hideTip();
  }

  function handleTipClick(event) {
    const target = event.target.closest("[data-tip]");
    if (target && window.matchMedia("(hover: none)").matches) showTip(target);
    else if (!target) hideTip();
  }

  /* ---------- Invocation ---------- */

  function freePullReady(now) {
    return now - state.lastFreePull >= FREE_PULL_MS;
  }

  function pullCost(count) {
    return PULL_BASE_COST * PULL_GROWTH ** state.pulls * (PULL_GROWTH ** count - 1) / (PULL_GROWTH - 1);
  }

  function pickPullable() {
    const pool = creatures.filter(creature => !creature.fusion && creature.id !== JACKPOT_ID);
    let roll = Math.random() * pool.reduce((sum, creature) => sum + PULL_WEIGHTS[creature.rarity], 0);
    return pool.find(creature => (roll -= PULL_WEIGHTS[creature.rarity]) < 0) || pool[0];
  }

  function rollCreature() {
    const jackpot = state.pityCounter + 1 >= PITY_LIMIT || Math.random() < JACKPOT_CHANCE;
    state.pityCounter = jackpot ? 0 : state.pityCounter + 1;
    return jackpot ? creatureMap.get(JACKPOT_ID) : pickPullable();
  }

  function addCreature(creature) {
    const isNew = !isDiscovered(creature.id);
    state.collection[creature.id] += 1;
    if (isNew) state.discovered.push(creature.id);
    return isNew;
  }

  function createSprite(creature, known, mini) {
    const sprite = document.createElement("span");
    sprite.className = `sprite${mini ? " is-mini" : ""}${known ? ` is-${creature.shape}` : " is-hidden"}`;
    if (known) sprite.style.setProperty("--c", creature.color);
    sprite.setAttribute("aria-hidden", "true");
    return sprite;
  }

  function createChip(creature, isNew) {
    const chip = document.createElement("span");
    chip.className = `chip r-${creature.rarity}`;
    chip.dataset.tip = creature.id;
    chip.append(createSprite(creature, true, true), creature.name);
    if (isNew) {
      const badge = document.createElement("span");
      badge.className = "chip-new";
      badge.textContent = "NOUVEAU";
      chip.append(badge);
    }
    return chip;
  }

  function pull(count) {
    const now = Date.now();
    const free = count === 1 && freePullReady(now);
    const cost = free ? 0 : pullCost(count);
    if (state.essence < cost) return;
    if (free) {
      state.lastFreePull = now;
    } else {
      state.essence -= cost;
      state.pulls += count;
    }
    const chips = [];
    let best = null;
    for (let index = 0; index < count; index += 1) {
      const creature = rollCreature();
      const isNew = addCreature(creature);
      chips.push(createChip(creature, isNew));
      if (creature.id === JACKPOT_ID || isNew) best = creature;
    }
    chips.forEach((chip, index) => { chip.style.animationDelay = `${index * 60}ms`; });
    hideTip();
    el["pull-result"].replaceChildren(...chips);
    state.stats.pulls += count;
    refreshMods();
    setMessage(best && best.id === JACKPOT_ID ? "L'Oracle répond à l'appel ! ✨" : best ? `${best.name} rejoint la bande !` : "Invocation terminée.");
    renderAll();
    save();
  }

  /* ---------- Rendu ---------- */

  function renderEssence() {
    setText(el["essence-value"], formatNumber(state.essence));
    setText(el["rate-value"], `+${formatRate(mods.rate * frenzyMult(Date.now()))}/s`);
    setText(el["header-stars"], formatNumber(state.stars));
  }

  function renderCombo() {
    const mult = comboMult();
    setText(el["combo-text"], `🔥 Combo ${state.combo} · ×${mult.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`);
    el["combo-text"].classList.toggle("is-max", mult >= mods.comboCap);
    setWidth(el["combo-bar"], (mult - 1) / (mods.comboCap - 1));
  }

  function renderFrenzy(now) {
    const remaining = frenzyUntil - now;
    const active = remaining > 0;
    el["word-card"].classList.toggle("is-frenzy", active);
    el["frenzy-text"].hidden = !active;
    if (active) setText(el["frenzy-text"], `FRÉNÉSIE ×${FRENZY_MULT} · ${Math.ceil(remaining / 1000)} s`);
  }

  function renderPull() {
    const now = Date.now();
    const free = freePullReady(now);
    const cost = pullCost(1);
    const multi = pullCost(MULTI_PULL);
    setText(el["pull-button"], free ? "Invoquer · GRATUIT 🎉" : `Invoquer · ${formatNumber(cost)}`);
    el["pull-button"].disabled = !free && state.essence < cost;
    setText(el["pull10-button"], `×${MULTI_PULL} · ${formatNumber(multi)}`);
    el["pull10-button"].disabled = state.essence < multi;
    const remaining = Math.max(0, FREE_PULL_MS - (now - state.lastFreePull));
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const freeText = free ? "Tirage gratuit disponible !" : `Gratuit dans ${minutes} min ${String(seconds).padStart(2, "0")} s.`;
    setText(el["pull-info"], `${freeText} Oracle garanti dans ${PITY_LIMIT - state.pityCounter} tirage(s).`);
  }

  function renderQuest() {
    const quest = QUESTS[state.questIndex];
    if (!quest) {
      setText(el["quest-step"], "Objectifs terminés 🏆");
      setText(el["quest-text"], "Bravo ! Visez maintenant les étoiles et le combo ultime.");
      setText(el["quest-hint"], "");
      setWidth(el["quest-bar"], 1);
      el["quest-claim"].hidden = true;
      el.quest.classList.remove("is-done");
      return;
    }
    const current = Math.min(quest.value(), quest.goal);
    const done = current >= quest.goal;
    setText(el["quest-step"], `Objectif ${state.questIndex + 1}/${QUESTS.length}`);
    setText(el["quest-text"], `${quest.text} · ${formatNumber(current)}/${formatNumber(quest.goal)}`);
    setText(el["quest-hint"], quest.hint || "");
    setWidth(el["quest-bar"], current / quest.goal);
    setText(el["quest-claim"], `${done ? "Réclamer " : "🎁 "}+${formatNumber(quest.reward)}`);
    el["quest-claim"].hidden = false;
    el["quest-claim"].disabled = !done;
    el.quest.classList.toggle("is-done", done);
  }

  function claimQuest() {
    const quest = QUESTS[state.questIndex];
    if (!quest || quest.value() < quest.goal) return;
    earn(quest.reward);
    state.questIndex += 1;
    setMessage(`Objectif accompli : +${formatNumber(quest.reward)} Essence ! 🎉`);
    renderEssence();
    renderQuest();
    save();
  }

  function buildUpgrades() {
    upgrades.forEach(upgrade => {
      const node = document.createElement("button");
      node.type = "button";
      node.className = "upgrade";
      node.dataset.id = upgrade.id;
      const name = document.createElement("span");
      name.className = "upgrade-name";
      const cost = document.createElement("span");
      cost.className = "upgrade-cost";
      const desc = document.createElement("span");
      desc.className = "upgrade-desc";
      desc.textContent = upgrade.desc;
      node.append(name, cost, desc);
      el["upgrade-list"].append(node);
      upgradeNodes[upgrade.id] = { node, name, cost };
    });
  }

  function upgradeCost(upgrade) {
    return upgrade.base * upgrade.growth ** state.upgrades[upgrade.id];
  }

  function upgradeVisible(upgrade) {
    return state.upgrades[upgrade.id] > 0 || state.stats.earned >= upgrade.base / 2;
  }

  function canBuy(upgrade) {
    return state.upgrades[upgrade.id] < upgrade.max && state.essence >= upgradeCost(upgrade);
  }

  function renderUpgrades() {
    let anyVisible = false;
    upgrades.forEach(upgrade => {
      const nodes = upgradeNodes[upgrade.id];
      const level = state.upgrades[upgrade.id];
      const visible = upgradeVisible(upgrade);
      nodes.node.hidden = !visible;
      if (!visible) return;
      anyVisible = true;
      const maxed = level >= upgrade.max;
      setText(nodes.name, `${upgrade.name} · niv. ${level}${upgrade.max < Infinity ? `/${upgrade.max}` : ""}`);
      setText(nodes.cost, maxed ? "MAX" : formatNumber(upgradeCost(upgrade)));
      nodes.node.disabled = !canBuy(upgrade);
    });
    el["upgrade-empty"].hidden = anyVisible;
  }

  function buyUpgrade(event) {
    const node = event.target.closest("button[data-id]");
    if (!node) return;
    const upgrade = upgrades.find(item => item.id === node.dataset.id);
    if (!canBuy(upgrade)) return;
    state.essence -= upgradeCost(upgrade);
    state.upgrades[upgrade.id] += 1;
    refreshMods();
    setMessage(`${upgrade.name} passe au niveau ${state.upgrades[upgrade.id]} !`);
    renderEssence();
    renderCombo();
    renderUpgrades();
    save();
  }

  /* ---------- Bestiaire ---------- */

  function addLine(body, className, text) {
    const line = document.createElement("span");
    if (className) line.className = className;
    line.textContent = text;
    body.append(line);
  }

  function createCreatureCard(creature) {
    const count = state.collection[creature.id];
    const known = isDiscovered(creature.id);
    const card = document.createElement("div");
    card.className = `creature r-${creature.rarity}${known ? "" : " is-unknown"}${known && count < 1 ? " is-empty" : ""}`;
    const body = document.createElement("span");
    body.className = "creature-body";
    const name = document.createElement("span");
    name.className = "creature-name";
    const label = document.createElement("span");
    label.textContent = known ? creature.name : "???";
    name.append(label);
    if (known) {
      const amount = document.createElement("span");
      amount.textContent = `×${count}`;
      name.append(amount);
    }
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = `${RARITY_LABELS[creature.rarity]} · ${creature.fusion ? "FUSION" : "INVOCATION"}`;
    body.append(name, tag);
    if (known) {
      const { type, value } = creature.passive;
      const stacks = Math.min(count, PASSIVE_MAX_STACKS);
      const pips = type === "fuzzy" ? "" : ` ${"●".repeat(stacks)}${"○".repeat(PASSIVE_MAX_STACKS - stacks)}`;
      addLine(body, "creature-prod", `+${formatRate(creature.prod)}/s par exemplaire`);
      addLine(body, "", `${passiveText(type, type === "fuzzy" ? value : value * Math.max(1, stacks))}${pips}`);
      fusions.filter(item => item.result === creature.id && isKnownFusion(item)).forEach(recipe => {
        addLine(body, "creature-recipe", `🧪 ${creatureMap.get(recipe.a).name} + ${creatureMap.get(recipe.b).name}`);
      });
    } else if (creature.fusion) {
      const recipe = fusions.find(item => item.result === creature.id);
      addLine(body, "creature-recipe", `Indice : ${isDiscovered(recipe.a) ? creatureMap.get(recipe.a).name : "???"} + ???`);
    } else {
      addLine(body, "", creature.id === JACKPOT_ID ? `2 % par tirage, garanti tous les ${PITY_LIMIT}` : "Disponible à l'invocation");
    }
    card.append(createSprite(creature, known, false), body);
    return card;
  }

  function renderBestiary() {
    setText(el["bestiary-count"], `${state.discovered.length}/${creatures.length}`);
    el["bestiary-list"].replaceChildren(...creatures.map(createCreatureCard));
  }

  /* ---------- Fusion ---------- */

  function toggleSelection(id) {
    if (state.selection.includes(id)) {
      state.selection = state.selection.filter(item => item !== id);
    } else if (state.selection.length < 2) {
      state.selection.push(id);
    } else {
      state.selection = [state.selection[1], id];
    }
    renderFusion();
  }

  function handlePickerClick(event) {
    const node = event.target.closest("button[data-id]");
    if (node) toggleSelection(node.dataset.id);
  }

  function handleSlotClick(event) {
    const slot = event.target.closest("[data-index]");
    if (!slot) return;
    state.selection.splice(Number(slot.dataset.index), 1);
    renderFusion();
  }

  function handleRecipeClick(event) {
    const node = event.target.closest("button[data-a]");
    if (!node) return;
    state.selection = [node.dataset.a, node.dataset.b];
    fuse();
  }

  function createSlot(index) {
    const creature = creatureMap.get(state.selection[index]);
    const slot = document.createElement("div");
    if (!creature) {
      slot.className = "fusion-slot";
      slot.textContent = "Choisissez une créature";
      return slot;
    }
    slot.className = `fusion-slot is-filled r-${creature.rarity}`;
    slot.dataset.index = index;
    slot.dataset.tip = creature.id;
    slot.append(createSprite(creature, true, false), `${creature.name} ×${state.collection[creature.id]}`);
    return slot;
  }

  function renderPicker() {
    const owned = creatures.filter(creature => state.collection[creature.id] > 0);
    if (!owned.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Invoquez des créatures pour pouvoir les fusionner.";
      el["fusion-picker"].replaceChildren(empty);
      return;
    }
    el["fusion-picker"].replaceChildren(...owned.map(creature => {
      const node = document.createElement("button");
      node.type = "button";
      node.dataset.id = creature.id;
      node.dataset.tip = creature.id;
      node.className = `pick r-${creature.rarity}${state.selection.includes(creature.id) ? " is-selected" : ""}`;
      node.append(createSprite(creature, true, true), `${creature.name} ×${state.collection[creature.id]}`);
      return node;
    }));
  }

  function renderRecipes() {
    const known = fusions.filter(isKnownFusion);
    if (!known.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Aucune recette découverte. Expérimentez !";
      el["recipe-list"].replaceChildren(empty);
      return;
    }
    el["recipe-list"].replaceChildren(...known.map(fusion => {
      const row = document.createElement("div");
      row.className = "recipe";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-green";
      button.dataset.a = fusion.a;
      button.dataset.b = fusion.b;
      button.textContent = "Fusionner";
      button.disabled = state.collection[fusion.a] < 1 || state.collection[fusion.b] < 1;
      row.append(
        createChip(creatureMap.get(fusion.a), false), "+",
        createChip(creatureMap.get(fusion.b), false), "→",
        createChip(creatureMap.get(fusion.result), false), button
      );
      return row;
    }));
  }

  function renderFusion() {
    hideTip();
    const plus = document.createElement("span");
    plus.className = "fusion-plus";
    plus.textContent = "+";
    el["fusion-slots"].replaceChildren(createSlot(0), plus, createSlot(1));
    let info = "Choisissez deux créatures ci-dessous pour tenter une fusion.";
    let canFuse = false;
    if (state.selection.length === 2) {
      const [a, b] = state.selection;
      const fusion = findFusion(a, b);
      if (!fusion) {
        info = "Hmm… ces deux-là ne s'entendent pas. Essayez autre chose !";
      } else {
        const result = creatureMap.get(fusion.result);
        info = isKnownFusion(fusion)
          ? `Résultat : ${result.name} · +${formatRate(result.prod)}/s · ${passiveText(result.passive.type, result.passive.value)}`
          : `Recette mystère · résultat ${RARITY_LABELS[result.rarity]} !`;
        const last = [a, b].filter(id => state.collection[id] === 1).map(id => creatureMap.get(id).name);
        if (last.length) info += ` Attention : dernier exemplaire de ${last.join(" et ")}.`;
        canFuse = true;
      }
    }
    setText(el["fusion-info"], info);
    el["fuse-button"].disabled = !canFuse;
    renderPicker();
    renderRecipes();
  }

  function fuse() {
    if (state.selection.length !== 2) return;
    const [a, b] = state.selection;
    const fusion = findFusion(a, b);
    if (!fusion || state.collection[a] < 1 || state.collection[b] < 1) return;
    state.collection[a] -= 1;
    state.collection[b] -= 1;
    const result = creatureMap.get(fusion.result);
    const isNew = addCreature(result);
    const wasKnown = isKnownFusion(fusion);
    if (!wasKnown) state.knownFusions.push(pairKey(fusion.a, fusion.b));
    state.stats.fusions += 1;
    if (state.collection[a] < 1 || state.collection[b] < 1) state.selection = [];
    refreshMods();
    el["fusion-result"].replaceChildren(createChip(result, isNew));
    setMessage(wasKnown ? `Pouf ! Voici ${result.name}.` : `Nouvelle recette découverte : ${result.name} ! 🧪`);
    renderAll();
    save();
  }

  /* ---------- Renaissance ---------- */

  function renderStars() {
    const pending = pendingStars();
    setText(el["stars-value"], formatNumber(state.stars));
    setText(el["stars-bonus"], `+${formatNumber(state.stars * STAR_BONUS * 100)} % sur tous les gains`);
    const next = STAR_UNIT * (state.stars + pending + 1) ** 2;
    setText(el["stars-info"], `Essence récoltée au total : ${formatNumber(state.stats.earned)}. Prochaine étoile à ${formatNumber(next)}.`);
    setText(el["rebirth-button"], pending >= 1 ? `Renaissance · +${formatNumber(pending)} ⭐` : "Renaissance");
    el["rebirth-button"].disabled = pending < 1;
  }

  function rebirth() {
    const gain = pendingStars();
    if (gain < 1) return;
    if (!window.confirm(`Renaître avec ${gain} étoile(s) de plus ? Essence, créatures et améliorations seront remises à zéro.`)) return;
    const kept = {
      discovered: state.discovered,
      knownFusions: state.knownFusions,
      questIndex: state.questIndex,
      stats: state.stats,
      stars: state.stars + gain,
      rebirths: state.rebirths + 1
    };
    clearWords();
    Object.assign(state, freshState(), kept);
    refreshMods();
    el["pull-result"].replaceChildren();
    el["fusion-result"].replaceChildren();
    renderAll();
    setMessage(`Renaissance ! Vous avez maintenant ${state.stars} étoile(s). ⭐`);
    save();
  }

  /* ---------- Onglets ---------- */

  function showTab(name) {
    Object.entries(tabNodes).forEach(([key, { tab, panel }]) => {
      const active = key === name;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      panel.hidden = !active;
    });
  }

  function renderBadges(now) {
    tabNodes.invoke.tab.classList.toggle("has-badge", freePullReady(now));
    tabNodes.shop.tab.classList.toggle("has-badge", upgrades.some(upgrade => upgradeVisible(upgrade) && canBuy(upgrade)));
    tabNodes.stars.tab.classList.toggle("has-badge", pendingStars() >= 1);
  }

  function renderAll() {
    renderEssence();
    renderCombo();
    renderQuest();
    renderPull();
    renderUpgrades();
    renderFusion();
    renderBestiary();
    renderStars();
  }

  function tick() {
    const now = Date.now();
    const elapsed = Math.min(Math.max(0, now - lastTick), OFFLINE_CAP_MS);
    lastTick = now;
    if (mods.rate > 0) earn((mods.rate * frenzyMult(now) * elapsed) / 1000);
    if (document.hidden) return;
    tickWords(now);
    tickBubble(now);
    renderFrenzy(now);
    renderEssence();
    renderPull();
    renderUpgrades();
    renderQuest();
    renderStars();
    renderBadges(now);
  }

  /* ---------- Sauvegarde ---------- */

  function save() {
    if (!storageOk) return;
    const payload = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      essence: state.essence,
      collection: state.collection,
      discovered: state.discovered,
      pulls: state.pulls,
      pityCounter: state.pityCounter,
      lastFreePull: state.lastFreePull,
      knownFusions: state.knownFusions,
      upgrades: state.upgrades,
      questIndex: state.questIndex,
      stars: state.stars,
      rebirths: state.rebirths,
      stats: state.stats
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (error) {
      storageOk = false;
      setMessage("Sauvegarde indisponible : la partie continue sans enregistrement.");
    }
  }

  function isCount(value) {
    return Number.isInteger(value) && value >= 0 && value <= 1e6;
  }

  function isAmount(value) {
    return Number.isFinite(value) && value >= 0 && value <= MAX_ESSENCE;
  }

  // Retourne la durée d'absence à créditer (0 si aucune sauvegarde valide).
  function load() {
    let raw;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch (error) {
      storageOk = false;
      return 0;
    }
    if (!raw) return 0;
    try {
      const data = JSON.parse(raw);
      if (!data || data.version !== SAVE_VERSION) throw new Error("version");
      const loaded = freshState();
      if (!isAmount(data.essence)) throw new Error("essence");
      creatures.forEach(creature => {
        const count = data.collection ? data.collection[creature.id] : undefined;
        if (count === undefined) return;
        if (!isCount(count)) throw new Error("collection");
        loaded.collection[creature.id] = count;
      });
      upgrades.forEach(upgrade => {
        const level = data.upgrades ? data.upgrades[upgrade.id] : undefined;
        if (level === undefined) return;
        if (!isCount(level) || level > upgrade.max) throw new Error("upgrades");
        loaded.upgrades[upgrade.id] = level;
      });
      Object.keys(loaded.stats).forEach(key => {
        const value = data.stats ? data.stats[key] : undefined;
        if (value === undefined) return;
        if (!isAmount(value)) throw new Error("stats");
        loaded.stats[key] = value;
      });
      if (!isCount(data.pulls) || !isCount(data.pityCounter) || data.pityCounter > PITY_LIMIT) throw new Error("pulls");
      if (!isCount(data.stars) || !isCount(data.rebirths)) throw new Error("stars");
      if (![data.lastFreePull, data.savedAt].every(time => Number.isFinite(time) && time >= 0)) throw new Error("time");
      if (!Number.isInteger(data.questIndex) || data.questIndex < 0 || data.questIndex > QUESTS.length) throw new Error("quest");
      const discovered = Array.isArray(data.discovered) ? data.discovered : [];
      loaded.discovered = creatures.map(creature => creature.id).filter(id => loaded.collection[id] > 0 || discovered.includes(id));
      loaded.knownFusions = Array.isArray(data.knownFusions)
        ? [...new Set(data.knownFusions)].filter(key => fusions.some(fusion => pairKey(fusion.a, fusion.b) === key))
        : [];
      loaded.essence = data.essence;
      loaded.pulls = data.pulls;
      loaded.pityCounter = data.pityCounter;
      loaded.lastFreePull = data.lastFreePull;
      loaded.questIndex = data.questIndex;
      loaded.stars = data.stars;
      loaded.rebirths = data.rebirths;
      Object.assign(state, loaded);
      return Math.min(Math.max(0, Date.now() - data.savedAt), OFFLINE_CAP_MS);
    } catch (error) {
      showNotice("Nouvelle version ou sauvegarde invalide : une nouvelle partie démarre !");
      return 0;
    }
  }

  function resetGame() {
    if (!window.confirm("Effacer la partie et repartir de zéro ?")) return;
    clearWords();
    removeBubble(Date.now());
    frenzyUntil = 0;
    Object.assign(state, freshState());
    refreshMods();
    el["word-input"].value = "";
    el["pull-result"].replaceChildren();
    el["fusion-result"].replaceChildren();
    el.notice.hidden = true;
    renderAll();
    setMessage("Nouvelle partie démarrée. Bonne chance !");
    save();
  }

  function initialize() {
    [
      "essence-value", "rate-value", "header-stars", "notice", "notice-text", "notice-close", "quest",
      "quest-step", "tooltip", "quest-text", "quest-hint", "quest-bar", "quest-claim", "word-card", "combo-text",
      "combo-bar", "frenzy-text", "word-zone", "word-form", "word-input", "system-message", "tabs",
      "pull-button", "pull10-button", "pull-info", "pull-result", "fusion-slots", "fusion-info",
      "fuse-button", "fusion-result", "fusion-picker", "recipe-list", "upgrade-empty", "upgrade-list",
      "bestiary-list", "bestiary-count", "stars-value", "stars-bonus", "stars-info", "rebirth-button",
      "reset-button"
    ].forEach(id => { el[id] = byId(id); });
    el.tabs.querySelectorAll("[data-tab]").forEach(tab => {
      tabNodes[tab.dataset.tab] = { tab, panel: document.querySelector(`[data-panel="${tab.dataset.tab}"]`) };
    });
    buildUpgrades();
    const offline = load();
    refreshMods();
    if (offline >= OFFLINE_MIN_MS && mods.rate > 0) {
      const gained = (mods.rate * offline) / 1000;
      earn(gained);
      showNotice(`Pendant votre absence (${formatDuration(offline)}), vos créatures ont récolté ${formatNumber(gained)} Essence !`);
    }
    lastTick = Date.now();
    renderAll();
    setMessage("Salut ! Tapez les mots qui flottent dans le ciel pour gagner de l'Essence.");
    el["word-form"].addEventListener("submit", submitWord);
    el["word-input"].addEventListener("input", handleWordInput);
    el["reset-button"].addEventListener("click", resetGame);
    el["pull-button"].addEventListener("click", () => pull(1));
    el["pull10-button"].addEventListener("click", () => pull(MULTI_PULL));
    el["fuse-button"].addEventListener("click", fuse);
    el["fusion-slots"].addEventListener("click", handleSlotClick);
    el["fusion-picker"].addEventListener("click", handlePickerClick);
    el["recipe-list"].addEventListener("click", handleRecipeClick);
    el["upgrade-list"].addEventListener("click", buyUpgrade);
    el["quest-claim"].addEventListener("click", claimQuest);
    el["rebirth-button"].addEventListener("click", rebirth);
    el.tabs.addEventListener("click", event => {
      const tab = event.target.closest("[data-tab]");
      if (tab) showTab(tab.dataset.tab);
    });
    el["notice-close"].addEventListener("click", () => { el.notice.hidden = true; });
    document.addEventListener("mouseover", handleTipOver);
    document.addEventListener("click", handleTipClick);
    document.addEventListener("scroll", hideTip, true);
    document.addEventListener("keydown", focusOnType);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) save();
      else clearWords();
    });
    window.addEventListener("beforeunload", save);
    window.setInterval(tick, TICK_MS);
    window.setInterval(save, SAVE_MS);
    save();
  }

  initialize();
})();
