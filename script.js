"use strict";

(() => {
  const SAVE_KEY = "k_typer_save_v1";
  const SAVE_VERSION = 3;
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
    ressort levier piston moteur turbine catapulte trebuchet
  `.trim().split(/\s+/);

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
    { id: "clavier", name: "Clavier mécanique", desc: "+25 % d'Essence par mot", base: 25, growth: 1.7, max: Infinity },
    { id: "cpu", name: "Processeur", desc: "+20 % de production des créatures", base: 60, growth: 1.8, max: Infinity },
    { id: "ram", name: "Mémoire vive", desc: "+1 mot affiché simultanément", base: 150, growth: 10, max: 3 },
    { id: "tampon", name: "Tampon de combo", desc: "+0,5 au multiplicateur de combo maximal", base: 300, growth: 6, max: 4 },
    { id: "antenne", name: "Antenne dorée", desc: "+2 % de chance de mot doré (×5)", base: 400, growth: 4, max: 5 }
  ];

  const QUESTS = [
    { text: "Tapez 5 mots", hint: "Un mot se valide dès qu'il est complet, sans appuyer sur Entrée.", goal: 5, value: () => state.stats.words, reward: 15 },
    { text: "Invoquez une créature", hint: "Le premier tirage est offert, puis un toutes les 10 minutes.", goal: 1, value: () => state.stats.pulls, reward: 20 },
    { text: "Atteignez un combo de 10", hint: "Chaque mot augmente le multiplicateur. Un mot expiré divise le combo par deux.", goal: 10, value: () => state.stats.bestCombo, reward: 40 },
    { text: "Achetez une amélioration", hint: "Les améliorations apparaissent à mesure que vous accumulez de l'Essence.", goal: 1, value: upgradeTotal, reward: 60 },
    { text: "Possédez 5 créatures", hint: "Chaque créature produit de l'Essence en continu, même hors ligne (8 h max).", goal: 5, value: ownedCount, reward: 80 },
    { text: "Réussissez une fusion", hint: "Cliquez deux créatures du bestiaire. Les cartes ??? donnent un ingrédient en indice.", goal: 1, value: () => state.stats.fusions, reward: 150 },
    { text: "Tapez un mot doré", hint: "Les mots dorés rapportent cinq fois plus.", goal: 1, value: () => state.stats.golden, reward: 200 },
    { text: "Produisez 10 Essence/s", hint: "Les créatures fusionnées produisent bien plus que leurs ingrédients.", goal: 10, value: () => mods.rate, reward: 400 },
    { text: "Découvrez 8 créatures", goal: 8, value: () => state.discovered.length, reward: 800 },
    { text: "Atteignez un combo de 25", goal: 25, value: () => state.stats.bestCombo, reward: 1500 },
    { text: "Invoquez l'Oracle", hint: "2 % de chance par tirage, garanti au bout de 20 tirages.", goal: 1, value: () => discoveredCount(c => c.id === JACKPOT_ID), reward: 3000 },
    { text: "Produisez 100 Essence/s", goal: 100, value: () => mods.rate, reward: 5000 },
    { text: "Découvrez une créature épique", goal: 1, value: () => discoveredCount(c => c.rarity === "epique"), reward: 15000 },
    { text: "Atteignez un combo de 50", goal: 50, value: () => state.stats.bestCombo, reward: 30000 },
    { text: "Produisez 1 000 Essence/s", goal: 1000, value: () => mods.rate, reward: 100000 },
    { text: "Découvrez 18 créatures", goal: 18, value: () => state.discovered.length, reward: 300000 },
    { text: "Fusionnez une créature légendaire", goal: 1, value: () => discoveredCount(c => c.fusion && c.rarity === "legendaire"), reward: 1e6 },
    { text: "Produisez 10 000 Essence/s", goal: 10000, value: () => mods.rate, reward: 3e6 },
    { text: "Complétez le bestiaire", goal: creatures.length, value: () => state.discovered.length, reward: 2e7 }
  ];

  const creatureMap = new Map(creatures.map(creature => [creature.id, creature]));
  const el = {};
  const upgradeNodes = {};
  let storageOk = true;
  let nextSpawnAt = 0;
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
      stats: { words: 0, golden: 0, pulls: 0, fusions: 0, bestCombo: 0, earned: 0 },
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

  function setMessage(text) {
    setText(el["system-message"], text);
  }

  function showNotice(text) {
    setText(el["notice-text"], text);
    el.notice.hidden = false;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
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

  // Recalculé uniquement quand la collection ou les améliorations changent.
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
    next.rate = baseRate * (1 + next.prod + 0.2 * state.upgrades.cpu);
    next.wordMult = 1 + next.gain + 0.25 * state.upgrades.clavier;
    next.maxWords = BASE_WORDS + state.upgrades.ram;
    next.comboCap = BASE_COMBO_CAP + 0.5 * state.upgrades.tampon;
    next.gold = GOLD_CHANCE + 0.02 * state.upgrades.antenne;
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
    const node = el["combo-text"];
    node.classList.remove("is-broken");
    void node.offsetWidth;
    node.classList.add("is-broken");
    renderCombo();
  }

  // Les mots rapportent aussi une fraction de la production : la frappe reste utile en fin de partie.
  function wordGain(word) {
    const length = word.text.length;
    const bonus = Math.max(0, length - LONG_WORD_THRESHOLD) * mods.longWord;
    const crit = Math.random() < mods.crit;
    const value = (length + bonus) * (1 + mods.rate * RATE_PER_LETTER) * mods.wordMult * comboMult()
      * (crit ? 2 : 1) * (word.gold ? GOLD_MULT : 1);
    return { value, crit };
  }

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
    node.style.top = `${(row * 100) / ROWS}%`;
    const typed = document.createElement("span");
    typed.className = "typed";
    const rest = document.createElement("span");
    rest.textContent = text;
    const bar = document.createElement("span");
    bar.className = "word-timer";
    bar.style.animationDuration = `${life}ms`;
    node.append(typed, rest, bar);
    el["word-zone"].append(node);
    const maxLeft = Math.max(0, el["word-zone"].clientWidth - node.offsetWidth - 8);
    node.style.left = `${4 + Math.random() * maxLeft}px`;
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

  function floatText(word, text, big) {
    const node = document.createElement("span");
    node.className = `float${big ? " is-big" : ""}`;
    node.textContent = text;
    node.style.left = `${word.node.offsetLeft}px`;
    node.style.top = `${word.node.offsetTop}px`;
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
    const echoes = state.words.filter(word => word !== target && word.text.length < target.text.length).slice(0, mods.echo);
    let total = 0;
    let golden = false;
    [target, ...echoes].forEach(word => {
      const { value, crit } = wordGain(word);
      total += value;
      state.combo += 1;
      state.stats.words += 1;
      if (word.gold) {
        state.stats.golden += 1;
        golden = true;
      }
      floatText(word, `+${formatNumber(value)}${crit ? " CRIT" : ""}`, word.gold || crit);
      removeWord(word);
    });
    state.stats.bestCombo = Math.max(state.stats.bestCombo, state.combo);
    earn(total);
    renderCombo();
    renderEssence();
    setMessage(`${golden ? "MOT DORÉ ! " : ""}+${formatNumber(total)} ESSENCE${echoes.length ? ` · ÉCHO ×${echoes.length}` : ""}`);
    return true;
  }

  function rejectInput() {
    const input = el["word-input"];
    input.classList.remove("is-error");
    void input.offsetWidth;
    input.classList.add("is-error");
    setMessage("Aucun mot visible ne correspond.");
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
    if (event.target === el["word-input"]) return;
    el["word-input"].focus();
  }

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
    return sprite;
  }

  function createChip(creature, isNew) {
    const chip = document.createElement("span");
    chip.className = `chip r-${creature.rarity}`;
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
    el["pull-result"].replaceChildren(...chips);
    state.stats.pulls += count;
    refreshMods();
    setMessage(best && best.id === JACKPOT_ID ? "L'ORACLE répond à l'appel !" : best ? `${best.name} rejoint le bestiaire.` : "Invocation terminée.");
    renderAll();
    save();
  }

  function renderEssence() {
    setText(el["essence-value"], formatNumber(state.essence));
    setText(el["rate-value"], `+${formatRate(mods.rate)}/s`);
  }

  function renderCombo() {
    const mult = comboMult();
    setText(el["combo-text"], `COMBO ${state.combo} · ×${mult.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`);
    el["combo-text"].classList.toggle("is-max", mult >= mods.comboCap);
    setWidth(el["combo-bar"], (mult - 1) / (mods.comboCap - 1));
  }

  function renderPull() {
    const now = Date.now();
    const free = freePullReady(now);
    const cost = pullCost(1);
    const multi = pullCost(MULTI_PULL);
    setText(el["pull-button"], free ? "INVOQUER · GRATUIT" : `INVOQUER · ${formatNumber(cost)}`);
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
      setText(el["quest-step"], "OBJECTIFS TERMINÉS");
      setText(el["quest-text"], "Toutes les missions sont accomplies. Visez le combo et la production ultimes !");
      setText(el["quest-hint"], "");
      setWidth(el["quest-bar"], 1);
      el["quest-claim"].hidden = true;
      el.quest.classList.remove("is-done");
      return;
    }
    const current = Math.min(quest.value(), quest.goal);
    const done = current >= quest.goal;
    setText(el["quest-step"], `OBJECTIF ${state.questIndex + 1}/${QUESTS.length}`);
    setText(el["quest-text"], `${quest.text} · ${formatNumber(current)}/${formatNumber(quest.goal)}`);
    setText(el["quest-hint"], quest.hint || "");
    setWidth(el["quest-bar"], current / quest.goal);
    setText(el["quest-claim"], `${done ? "RÉCLAMER " : ""}+${formatNumber(quest.reward)}`);
    el["quest-claim"].hidden = false;
    el["quest-claim"].disabled = !done;
    el.quest.classList.toggle("is-done", done);
  }

  function claimQuest() {
    const quest = QUESTS[state.questIndex];
    if (!quest || quest.value() < quest.goal) return;
    earn(quest.reward);
    state.questIndex += 1;
    setMessage(`Objectif accompli : +${formatNumber(quest.reward)} ESSENCE.`);
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

  function renderUpgrades() {
    let anyVisible = false;
    upgrades.forEach(upgrade => {
      const nodes = upgradeNodes[upgrade.id];
      const level = state.upgrades[upgrade.id];
      const visible = level > 0 || state.stats.earned >= upgrade.base / 2;
      nodes.node.hidden = !visible;
      if (!visible) return;
      anyVisible = true;
      const maxed = level >= upgrade.max;
      const cost = upgradeCost(upgrade);
      setText(nodes.name, `${upgrade.name} · NV ${level}${upgrade.max < Infinity ? `/${upgrade.max}` : ""}`);
      setText(nodes.cost, maxed ? "MAX" : formatNumber(cost));
      nodes.node.disabled = maxed || state.essence < cost;
    });
    el["upgrade-empty"].hidden = anyVisible;
  }

  function buyUpgrade(event) {
    const node = event.target.closest("button[data-id]");
    if (!node) return;
    const upgrade = upgrades.find(item => item.id === node.dataset.id);
    const cost = upgradeCost(upgrade);
    if (state.upgrades[upgrade.id] >= upgrade.max || state.essence < cost) return;
    state.essence -= cost;
    state.upgrades[upgrade.id] += 1;
    refreshMods();
    setMessage(`${upgrade.name} niveau ${state.upgrades[upgrade.id]} installé.`);
    renderEssence();
    renderCombo();
    renderUpgrades();
    save();
  }

  function addLine(body, className, text) {
    const line = document.createElement("span");
    line.className = `creature-line ${className}`;
    line.textContent = text;
    body.append(line);
  }

  function createCreatureCard(creature) {
    const count = state.collection[creature.id];
    const known = isDiscovered(creature.id);
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.id = creature.id;
    card.disabled = count < 1;
    card.className = `creature r-${creature.rarity}${known ? "" : " is-unknown"}${known && count < 1 ? " is-empty" : ""}${state.selection.includes(creature.id) ? " is-selected" : ""}`;
    const body = document.createElement("span");
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
    const meta = document.createElement("span");
    meta.className = "creature-meta";
    meta.textContent = `${RARITY_LABELS[creature.rarity]} · ${creature.fusion ? "FUSION" : "INVOCATION"}`;
    body.append(name, meta);
    if (known) {
      const { type, value } = creature.passive;
      const stacks = Math.min(count, PASSIVE_MAX_STACKS);
      const pips = type === "fuzzy" ? "" : ` ${"■".repeat(stacks)}${"□".repeat(PASSIVE_MAX_STACKS - stacks)}`;
      addLine(body, "creature-prod", `+${formatRate(creature.prod)}/s par exemplaire`);
      addLine(body, "", `${passiveText(type, type === "fuzzy" ? value : value * Math.max(1, stacks))}${pips}`);
      fusions.filter(item => item.result === creature.id && isKnownFusion(item)).forEach(recipe => {
        addLine(body, "creature-recipe", `${creatureMap.get(recipe.a).name} + ${creatureMap.get(recipe.b).name}`);
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
    setText(el["bestiary-count"], `${state.discovered.length} / ${creatures.length} découvertes`);
    el["bestiary-list"].replaceChildren(...creatures.map(creature => createCreatureCard(creature)));
  }

  function handleBestiaryClick(event) {
    const card = event.target.closest("button[data-id]");
    if (!card || card.disabled) return;
    const id = card.dataset.id;
    if (state.selection.includes(id)) {
      state.selection = state.selection.filter(item => item !== id);
    } else if (state.selection.length < 2) {
      state.selection.push(id);
    } else {
      state.selection = [state.selection[1], id];
    }
    renderBestiary();
    renderFusion();
  }

  function handleSlotClick(event) {
    const slot = event.target.closest("[data-index]");
    if (!slot) return;
    state.selection.splice(Number(slot.dataset.index), 1);
    renderBestiary();
    renderFusion();
  }

  function renderFusion() {
    el["fusion-slots"].replaceChildren(...[0, 1].map(index => {
      const creature = creatureMap.get(state.selection[index]);
      const slot = document.createElement("div");
      if (!creature) {
        slot.className = "fusion-slot";
        slot.textContent = `Emplacement ${index + 1}`;
        return slot;
      }
      slot.className = `fusion-slot is-filled r-${creature.rarity}`;
      slot.dataset.index = index;
      slot.title = "Retirer";
      slot.append(createSprite(creature, true, true), `${creature.name} ×${state.collection[creature.id]}`);
      return slot;
    }));
    let info = "Cliquez deux créatures du bestiaire pour tenter une fusion.";
    let canFuse = false;
    if (state.selection.length === 2) {
      const [a, b] = state.selection;
      const fusion = findFusion(a, b);
      if (!fusion) {
        info = "Aucune recette pour cette combinaison.";
      } else {
        const result = creatureMap.get(fusion.result);
        info = isKnownFusion(fusion)
          ? `Résultat : ${result.name} · +${formatRate(result.prod)}/s · ${passiveText(result.passive.type, result.passive.value)}`
          : `Recette inconnue · résultat ${RARITY_LABELS[result.rarity]}.`;
        const last = [a, b].filter(id => state.collection[id] === 1).map(id => creatureMap.get(id).name);
        if (last.length) info += ` Attention : dernier exemplaire de ${last.join(" et ")}.`;
        canFuse = true;
      }
    }
    setText(el["fusion-info"], info);
    el["fuse-button"].disabled = !canFuse;
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
    setMessage(wasKnown ? `Fusion réussie : ${result.name}.` : `Recette découverte : ${result.name} !`);
    renderAll();
    save();
  }

  function renderAll() {
    renderEssence();
    renderCombo();
    renderQuest();
    renderPull();
    renderUpgrades();
    renderFusion();
    renderBestiary();
  }

  function tick() {
    const now = Date.now();
    const elapsed = Math.min(Math.max(0, now - lastTick), OFFLINE_CAP_MS);
    lastTick = now;
    if (mods.rate > 0) earn((mods.rate * elapsed) / 1000);
    if (document.hidden) return;
    tickWords(now);
    renderEssence();
    renderPull();
    renderUpgrades();
    renderQuest();
  }

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
      Object.assign(state, loaded);
      return Math.min(Math.max(0, Date.now() - data.savedAt), OFFLINE_CAP_MS);
    } catch (error) {
      showNotice("Nouvelle version ou sauvegarde invalide : une nouvelle partie démarre.");
      return 0;
    }
  }

  function resetGame() {
    if (!window.confirm("Effacer la partie et repartir de zéro ?")) return;
    clearWords();
    Object.assign(state, freshState());
    refreshMods();
    el["word-input"].value = "";
    el["pull-result"].replaceChildren();
    el["fusion-result"].replaceChildren();
    el.notice.hidden = true;
    renderAll();
    setMessage("Nouvelle partie démarrée.");
    save();
  }

  function initialize() {
    [
      "essence-value", "rate-value", "notice", "notice-text", "notice-close", "quest", "quest-step",
      "quest-text", "quest-hint", "quest-bar", "quest-claim", "combo-text", "combo-bar", "word-zone",
      "word-form", "word-input", "pull-button", "pull10-button", "pull-info", "pull-result",
      "fusion-slots", "fusion-info", "fuse-button", "fusion-result", "upgrade-empty", "upgrade-list",
      "bestiary-list", "bestiary-count", "system-message", "reset-button"
    ].forEach(id => { el[id] = byId(id); });
    buildUpgrades();
    const offline = load();
    refreshMods();
    if (offline >= OFFLINE_MIN_MS && mods.rate > 0) {
      const gained = (mods.rate * offline) / 1000;
      earn(gained);
      showNotice(`Pendant votre absence (${formatDuration(offline)}), vos créatures ont récolté ${formatNumber(gained)} Essence.`);
    }
    lastTick = Date.now();
    renderAll();
    setMessage("Terminal prêt. Tapez un mot pour commencer.");
    el["word-form"].addEventListener("submit", submitWord);
    el["word-input"].addEventListener("input", handleWordInput);
    el["reset-button"].addEventListener("click", resetGame);
    el["pull-button"].addEventListener("click", () => pull(1));
    el["pull10-button"].addEventListener("click", () => pull(MULTI_PULL));
    el["fuse-button"].addEventListener("click", fuse);
    el["fusion-slots"].addEventListener("click", handleSlotClick);
    el["bestiary-list"].addEventListener("click", handleBestiaryClick);
    el["upgrade-list"].addEventListener("click", buyUpgrade);
    el["quest-claim"].addEventListener("click", claimQuest);
    el["notice-close"].addEventListener("click", () => { el.notice.hidden = true; });
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
