"use strict";

(() => {
  const SAVE_KEY = "k_typer_save_v1";
  const SAVE_VERSION = 1;
  const TICK_MS = 200;
  const SAVE_MS = 10000;
  const MAX_WORDS = 5;
  const SPAWN_MS = 1800;
  const BASE_LIFETIME_MS = 8000;
  const LONG_WORD_THRESHOLD = 5;
  const PULL_COST = 10;
  const PITY_LIMIT = 20;
  const FREE_PULL_MS = 10 * 60 * 1000;
  const RARITY_WEIGHTS = [["commune", 70], ["rare", 24], ["epique", 5], ["legendaire", 1]];
  const RARITY_LABELS = { commune: "COMMUNE", rare: "RARE", epique: "ÉPIQUE", legendaire: "LÉGENDAIRE" };
  const TUTORIAL_STEPS = [
    "Tapez les mots qui apparaissent dans la zone et validez avec Entrée pour gagner de l'Essence.",
    "Invoquez une créature avec 10 Essence. Le premier tirage est offert.",
    "Sélectionnez deux créatures différentes dans le bestiaire et fusionnez-les. La première recette est inconnue."
  ];

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

  const creatures = [
    { id: "gelee", name: "Gelée", rarity: "commune", shape: "round", color: "#7fe39a", passive: { type: "gain", value: 0.1 } },
    { id: "pixo", name: "Pixo", rarity: "commune", shape: "square", color: "#6de7e0", passive: { type: "longWord", value: 1 } },
    { id: "glyphe", name: "Glyphe", rarity: "commune", shape: "triangle", color: "#f2c66d", passive: { type: "fuzzy", value: 1 } },
    { id: "phalene", name: "Phalène", rarity: "commune", shape: "round", color: "#c7a6ff", passive: { type: "echo", value: 1 } },
    { id: "tic", name: "Tic", rarity: "commune", shape: "square", color: "#ff827c", passive: { type: "lifetime", value: 1.5 } },
    { id: "crabe", name: "Crabe", rarity: "rare", shape: "diamond", color: "#ff9d5c", passive: { type: "crit", value: 0.15 } },
    { id: "luciole", name: "Luciole", rarity: "rare", shape: "round", color: "#fff27a", passive: { type: "gain", value: 0.25 } },
    { id: "golem", name: "Golem", rarity: "rare", shape: "square", color: "#9aa7b8", passive: { type: "longWord", value: 2 } },
    { id: "spectre", name: "Spectre", rarity: "rare", shape: "triangle", color: "#8fd3ff", passive: { type: "lifetime", value: 2.5 } },
    { id: "dragonnet", name: "Dragonnet", rarity: "epique", shape: "diamond", color: "#ff5ad6", passive: { type: "gain", value: 0.5 } },
    { id: "titan", name: "Titan", rarity: "epique", shape: "square", color: "#ffd166", passive: { type: "crit", value: 0.3 } },
    { id: "oracle", name: "Oracle", rarity: "legendaire", shape: "triangle", color: "#ffffff", passive: { type: "crit", value: 0.5 } },
    { id: "lanterne", name: "Lanterne", rarity: "rare", shape: "round", color: "#ffe066", passive: { type: "gain", value: 0.35 }, fusion: true },
    { id: "cerbere", name: "Cerbère", rarity: "epique", shape: "triangle", color: "#ff6b6b", passive: { type: "fuzzy", value: 2 }, fusion: true },
    { id: "chimere", name: "Chimère", rarity: "epique", shape: "diamond", color: "#5ce1a6", passive: { type: "longWord", value: 3 }, fusion: true },
    { id: "revenant", name: "Revenant", rarity: "epique", shape: "round", color: "#b388ff", passive: { type: "echo", value: 2 }, fusion: true },
    { id: "horloge", name: "Horloge", rarity: "epique", shape: "square", color: "#ffb347", passive: { type: "lifetime", value: 4 }, fusion: true },
    { id: "sphinx", name: "Sphinx", rarity: "legendaire", shape: "diamond", color: "#e0e0ff", passive: { type: "crit", value: 0.6 }, fusion: true }
  ];

  const fusions = [
    { a: "gelee", b: "luciole", result: "lanterne" },
    { a: "glyphe", b: "crabe", result: "cerbere" },
    { a: "pixo", b: "golem", result: "chimere" },
    { a: "phalene", b: "spectre", result: "revenant" },
    { a: "tic", b: "titan", result: "horloge" },
    { a: "dragonnet", b: "oracle", result: "sphinx" }
  ];

  const creatureMap = new Map(creatures.map(creature => [creature.id, creature]));
  const el = {};
  let storageOk = true;
  let nextSpawnAt = 0;

  const state = {
    essence: 0,
    collection: defaultCollection(),
    pityCounter: 0,
    lastFreePull: 0,
    knownFusions: [],
    tutorialStep: 0,
    selection: [],
    words: []
  };

  function defaultCollection() {
    return Object.fromEntries(creatures.map(creature => [creature.id, 0]));
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(node, text) {
    if (node.textContent !== text) node.textContent = text;
  }

  function setMessage(text) {
    setText(el["system-message"], text);
  }

  function formatNumber(value) {
    return Math.floor(value).toLocaleString("fr-FR");
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

  function normalize(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function hammingDistance(a, b) {
    let distance = 0;
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) distance += 1;
    }
    return distance;
  }

  function passiveText(passive) {
    const { type, value } = passive;
    const percent = Math.round(value * 100);
    if (type === "gain") return `+${percent} % d'Essence`;
    if (type === "longWord") return `+${value} Essence par lettre au-delà de ${LONG_WORD_THRESHOLD}`;
    if (type === "fuzzy") return `Tolère ${value} lettre${value > 1 ? "s" : ""} différente${value > 1 ? "s" : ""}`;
    if (type === "echo") return `Valide aussi ${value} mot${value > 1 ? "s" : ""} plus court${value > 1 ? "s" : ""}`;
    if (type === "lifetime") return `+${value} s d'affichage des mots`;
    return `${percent} % de chance de doubler le gain`;
  }

  function getModifiers() {
    const mods = { gain: 0, longWord: 0, fuzzy: 0, echo: 0, lifetime: 0, crit: 0 };
    Object.entries(state.collection).forEach(([id, count]) => {
      const creature = creatureMap.get(id);
      if (!creature || count <= 0) return;
      const { type, value } = creature.passive;
      if (type === "fuzzy") mods.fuzzy = Math.max(mods.fuzzy, value);
      else mods[type] += value * count;
    });
    mods.crit = Math.min(1, mods.crit);
    return mods;
  }

  function wordGain(text, mods) {
    const bonus = Math.max(0, text.length - LONG_WORD_THRESHOLD) * mods.longWord;
    const critical = Math.random() < mods.crit ? 2 : 1;
    return (text.length + bonus) * (1 + mods.gain) * critical;
  }

  function spawnWord(now, mods) {
    const visible = new Set(state.words.map(word => word.text));
    const candidates = WORDS.filter(word => !visible.has(word));
    const text = candidates[Math.floor(Math.random() * candidates.length)];
    const life = BASE_LIFETIME_MS + mods.lifetime * 1000;
    const node = document.createElement("div");
    node.className = `word${text.length >= 8 ? " is-long" : ""}`;
    node.textContent = text;
    node.style.left = `${Math.random() * 80}%`;
    node.style.top = `${Math.random() * 75}%`;
    const bar = document.createElement("span");
    bar.className = "word-timer";
    node.append(bar);
    el["word-zone"].append(node);
    state.words.push({ text, node, bar, life, expiresAt: now + life });
  }

  function removeWord(word) {
    word.node.remove();
    state.words = state.words.filter(item => item !== word);
  }

  function tickWords() {
    const now = Date.now();
    if (now >= nextSpawnAt && state.words.length < MAX_WORDS) {
      spawnWord(now, getModifiers());
      nextSpawnAt = now + SPAWN_MS;
    }
    state.words = state.words.filter(word => {
      const remaining = word.expiresAt - now;
      if (remaining <= 0) {
        word.node.remove();
        return false;
      }
      word.bar.style.transform = `scaleX(${remaining / word.life})`;
      return true;
    });
  }

  function findTarget(typed, mods) {
    const exact = state.words.find(word => word.text === typed);
    if (exact || !mods.fuzzy) return exact || null;
    return state.words.find(word => word.text.length === typed.length && hammingDistance(word.text, typed) <= mods.fuzzy) || null;
  }

  function submitWord(event) {
    event.preventDefault();
    const typed = normalize(el["word-input"].value);
    if (!typed) return;
    const mods = getModifiers();
    const target = findTarget(typed, mods);
    if (!target) {
      setMessage("Aucun mot visible ne correspond.");
      return;
    }
    let gained = wordGain(target.text, mods);
    removeWord(target);
    state.words
      .filter(word => word.text.length < target.text.length)
      .slice(0, mods.echo)
      .forEach(word => {
        gained += wordGain(word.text, mods);
        removeWord(word);
      });
    state.essence += gained;
    el["word-input"].value = "";
    if (state.tutorialStep === 0) state.tutorialStep = 1;
    renderEssence();
    renderTutorial();
    setMessage(`+${formatNumber(gained)} ESSENCE`);
    save();
  }

  function renderEssence() {
    setText(el["essence-value"], formatNumber(state.essence));
  }

  function renderTutorial() {
    const step = state.tutorialStep;
    el.tutorial.hidden = step >= TUTORIAL_STEPS.length;
    if (!el.tutorial.hidden) setText(el["tutorial-text"], TUTORIAL_STEPS[step]);
  }

  function save() {
    if (!storageOk) return;
    const payload = {
      version: SAVE_VERSION,
      essence: state.essence,
      collection: state.collection,
      pityCounter: state.pityCounter,
      lastFreePull: state.lastFreePull,
      knownFusions: state.knownFusions,
      tutorialStep: state.tutorialStep
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

  function load() {
    let raw;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch (error) {
      storageOk = false;
      return;
    }
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (!data || data.version !== SAVE_VERSION) throw new Error("version");
      if (!Number.isFinite(data.essence) || data.essence < 0 || data.essence > 1e12) throw new Error("essence");
      const collection = defaultCollection();
      creatures.forEach(creature => {
        const count = data.collection ? data.collection[creature.id] : 0;
        if (count === undefined) return;
        if (!isCount(count)) throw new Error("collection");
        collection[creature.id] = count;
      });
      if (!isCount(data.pityCounter) || data.pityCounter > PITY_LIMIT) throw new Error("pity");
      if (!Number.isFinite(data.lastFreePull) || data.lastFreePull < 0) throw new Error("free pull");
      if (!Number.isInteger(data.tutorialStep) || data.tutorialStep < 0 || data.tutorialStep > TUTORIAL_STEPS.length) throw new Error("tutorial");
      state.essence = data.essence;
      state.collection = collection;
      state.pityCounter = data.pityCounter;
      state.lastFreePull = data.lastFreePull;
      state.knownFusions = Array.isArray(data.knownFusions)
        ? [...new Set(data.knownFusions)].filter(key => fusions.some(fusion => pairKey(fusion.a, fusion.b) === key))
        : [];
      state.tutorialStep = data.tutorialStep;
    } catch (error) {
      setMessage("Sauvegarde invalide ignorée. Une nouvelle partie démarre.");
    }
  }

  function freePullReady(now) {
    return now - state.lastFreePull >= FREE_PULL_MS;
  }

  function rollRarity() {
    const total = RARITY_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;
    for (const [rarity, weight] of RARITY_WEIGHTS) {
      roll -= weight;
      if (roll < 0) return rarity;
    }
    return "commune";
  }

  function pickCreature(rarity) {
    const pool = creatures.filter(creature => !creature.fusion && creature.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function pull() {
    const now = Date.now();
    const free = freePullReady(now);
    if (!free && state.essence < PULL_COST) return;
    if (free) {
      state.lastFreePull = now;
    } else {
      state.essence -= PULL_COST;
    }
    const guaranteed = state.pityCounter + 1 >= PITY_LIMIT;
    const rolled = rollRarity();
    const rarity = guaranteed && !["epique", "legendaire"].includes(rolled) ? "epique" : rolled;
    const creature = pickCreature(rarity);
    state.collection[creature.id] += 1;
    state.pityCounter = ["epique", "legendaire"].includes(rarity) ? 0 : state.pityCounter + 1;
    if (state.tutorialStep === 1) state.tutorialStep = 2;
    setText(el["pull-result"], `Obtenu : ${creature.name} · ${RARITY_LABELS[creature.rarity]}`);
    setMessage(`${creature.name} rejoint le bestiaire.`);
    renderAll();
    save();
  }

  function renderPull() {
    const now = Date.now();
    const free = freePullReady(now);
    setText(el["pull-button"], free ? "INVOQUER · GRATUIT" : `INVOQUER · ${PULL_COST} ESSENCE`);
    el["pull-button"].disabled = !free && state.essence < PULL_COST;
    const remaining = Math.max(0, FREE_PULL_MS - (now - state.lastFreePull));
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const freeText = free ? "Tirage gratuit disponible." : `Prochain tirage gratuit dans ${minutes} min ${String(seconds).padStart(2, "0")} s.`;
    setText(el["pull-info"], `${freeText} Tirages sans épique : ${state.pityCounter}/${PITY_LIMIT}`);
  }

  function createCreatureCard(creature) {
    const count = state.collection[creature.id];
    const known = count > 0;
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.id = creature.id;
    card.disabled = !known;
    card.className = `creature${known ? "" : " is-unknown"}${state.selection.includes(creature.id) ? " is-selected" : ""}`;
    const sprite = document.createElement("span");
    sprite.className = `sprite${known ? ` is-${creature.shape}` : " is-hidden"}`;
    if (known) sprite.style.setProperty("--c", creature.color);
    const body = document.createElement("span");
    const name = document.createElement("span");
    name.className = "creature-name";
    name.textContent = known ? `${creature.name} × ${count}` : "???";
    const meta = document.createElement("span");
    meta.className = "creature-meta";
    meta.textContent = known ? RARITY_LABELS[creature.rarity] : "NON DÉCOUVERTE";
    body.append(name, meta);
    if (known) {
      const passive = document.createElement("span");
      passive.className = "creature-passive";
      passive.textContent = passiveText(creature.passive);
      body.append(passive);
      const recipe = fusions.find(item => item.result === creature.id);
      if (recipe && isKnownFusion(recipe)) {
        const line = document.createElement("span");
        line.className = "creature-recipe";
        line.textContent = `Recette : ${creatureMap.get(recipe.a).name} + ${creatureMap.get(recipe.b).name}`;
        body.append(line);
      }
    }
    card.append(sprite, body);
    return card;
  }

  function renderBestiary() {
    const discovered = creatures.filter(creature => state.collection[creature.id] > 0).length;
    setText(el["bestiary-count"], `${discovered} / ${creatures.length} découvertes`);
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
    }
    renderBestiary();
    renderFusion();
  }

  function handleSlotClick(event) {
    const button = event.target.closest("button[data-index]");
    if (!button) return;
    state.selection.splice(Number(button.dataset.index), 1);
    renderBestiary();
    renderFusion();
  }

  function renderFusion() {
    el["fusion-slots"].replaceChildren(...[0, 1].map(index => {
      const creature = creatureMap.get(state.selection[index]);
      const slot = document.createElement("div");
      slot.className = `fusion-slot${creature ? " is-filled" : ""}`;
      if (!creature) {
        slot.textContent = `Emplacement ${index + 1}`;
        return slot;
      }
      const name = document.createElement("span");
      name.textContent = creature.name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.index = index;
      remove.textContent = "RETIRER";
      slot.append(name, remove);
      return slot;
    }));
    let info = "Sélectionnez deux créatures différentes dans le bestiaire.";
    let canFuse = false;
    if (state.selection.length === 2) {
      const [a, b] = state.selection;
      const fusion = findFusion(a, b);
      if (!fusion) {
        info = "Aucune recette pour cette combinaison.";
      } else if (isKnownFusion(fusion)) {
        const result = creatureMap.get(fusion.result);
        info = `Résultat : ${result.name} · ${passiveText(result.passive)}`;
        canFuse = true;
      } else {
        info = "Recette inconnue : le résultat est masqué.";
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
    state.collection[fusion.result] += 1;
    const wasKnown = isKnownFusion(fusion);
    if (!wasKnown) state.knownFusions.push(pairKey(fusion.a, fusion.b));
    state.selection = [];
    if (state.tutorialStep === 2) state.tutorialStep = 3;
    const result = creatureMap.get(fusion.result);
    setMessage(wasKnown ? `${result.name} obtenue.` : `Recette découverte : ${result.name} obtenue.`);
    renderAll();
    save();
  }

  function renderAll() {
    renderEssence();
    renderTutorial();
    renderBestiary();
    renderFusion();
    renderPull();
  }

  function initialize() {
    [
      "essence-value", "word-zone", "word-form", "word-input", "tutorial", "tutorial-text",
      "tutorial-next", "pull-button", "pull-info", "pull-result", "fusion-slots", "fusion-info",
      "fuse-button", "bestiary-list", "bestiary-count", "system-message"
    ].forEach(id => { el[id] = byId(id); });
    load();
    renderAll();
    el["word-form"].addEventListener("submit", submitWord);
    el["pull-button"].addEventListener("click", pull);
    el["fuse-button"].addEventListener("click", fuse);
    el["fusion-slots"].addEventListener("click", handleSlotClick);
    el["bestiary-list"].addEventListener("click", handleBestiaryClick);
    el["tutorial-next"].addEventListener("click", () => {
      state.tutorialStep = TUTORIAL_STEPS.length;
      renderTutorial();
      save();
    });
    document.addEventListener("visibilitychange", save);
    window.addEventListener("beforeunload", save);
    window.setInterval(() => {
      if (document.hidden) return;
      tickWords();
      renderPull();
    }, TICK_MS);
    window.setInterval(save, SAVE_MS);
    save();
  }

  initialize();
})();
