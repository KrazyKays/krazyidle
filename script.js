"use strict";

(() => {
  const SAVE_KEY = "digital_inkrementation_save_v1";
  const SAVE_VERSION = 1;
  const TICK_MS = 400;
  const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
  const MAX_SIMULATION_STEPS = 600;
  const RESOURCE_KEYS = ["bits", "data", "energy"];
  const RESOURCE_NAMES = { bits: "BITS", data: "DATA", energy: "ENERGY" };

  const buildings = [
    {
      id: "processor", name: "Processeur", description: "Cycle de calcul fondamental.",
      baseCost: { bits: 20 }, growth: 1.16, inputs: {}, outputs: { bits: 1.5 }
    },
    {
      id: "decoder", name: "Décodeur", description: "Convertit les BITS disponibles en DATA.",
      baseCost: { bits: 35 }, growth: 1.2, inputs: { bits: 0.75 }, outputs: { data: 0.4 }
    },
    {
      id: "generator", name: "Générateur", description: "Alimente les modules énergivores.",
      baseCost: { bits: 30 }, growth: 1.2, inputs: {}, outputs: { energy: 1.5 }
    },
    {
      id: "server", name: "Serveur", description: "Produit automatiquement de la DATA.",
      baseCost: { bits: 90, data: 20 }, growth: 1.25, inputs: { energy: 0.8 }, outputs: { data: 1.25 }
    }
  ];

  const technologies = [
    { id: "pipeline", name: "Pipeline optimisé", description: "+15 % de rendement pour toute l'infrastructure.", cost: { bits: 50 }, effects: { production: 1.15 } },
    { id: "parallel", name: "Calcul parallèle", description: "+20 % de vitesse de production.", cost: { bits: 90, data: 25 }, requires: ["pipeline"], effects: { speed: 1.2 } },
    { id: "cooling", name: "Refroidissement actif", description: "Réduit de 20 % la consommation d'énergie.", cost: { bits: 100, energy: 30 }, requires: ["pipeline"], effects: { energyUse: 0.8 } },
    { id: "compression", name: "Compression de données", description: "+50 % de DATA produite par les décodeurs.", cost: { bits: 130, data: 45 }, requires: ["parallel"], effects: { decoderData: 1.5 } },
    { id: "microcode", name: "Microcode compact", description: "Réduit de 10 % le coût des bâtiments.", cost: { bits: 200, data: 90 }, requires: ["cooling"], effects: { costs: 0.9 } },
    { id: "cluster", name: "Cluster distribué", description: "+25 % de production globale.", cost: { bits: 350, data: 180, energy: 80 }, requires: ["compression", "microcode"], effects: { production: 1.25 } }
  ];

  const specializations = [
    {
      id: "optimizer", name: "OPTIMIZER", description: "Rendement accru et achats moins coûteux.",
      effectText: "+15 % de production · bâtiments −15 % coût",
      effects: { production: 1.15, costs: 0.85 }
    },
    {
      id: "overclock", name: "OVERCLOCK", description: "Cycles accélérés, au prix d'une consommation énergétique accrue.",
      effectText: "+35 % de vitesse · consommation d'énergie +20 %",
      effects: { speed: 1.35, energyUse: 1.2 }
    },
    {
      id: "architect", name: "ARCHITECT", description: "Automatise les flux DATA avec une meilleure efficacité énergétique.",
      effectText: "DATA des décodeurs/serveurs +30 % · énergie −25 %",
      effects: { dataOutput: 1.3, energyUse: 0.75 }
    }
  ];

  const gameState = {
    resources: { bits: 25, data: 0, energy: 0 },
    buildings: { processor: 1, decoder: 0, generator: 0, server: 0 },
    technologies: [],
    specialization: null,
    lastSavedAt: Date.now(),
    pendingOffline: null,
    lastActivity: {},
    storageAvailable: true,
    loadedFromValidSave: false
  };

  const el = {};
  let tickTimer = null;
  let autosaveTimer = null;
  let lastTickAt = performance.now();
  let lastRenderedAt = 0;

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    [
      "system-status", "resource-bits", "resource-data", "resource-energy",
      "rate-bits", "rate-data", "rate-energy", "offline-panel", "offline-summary",
      "claim-offline", "storage-warning", "production-lines", "specialty-badge",
      "building-count", "building-list", "technology-list", "specialization-lock",
      "specialization-intro", "specialization-list", "system-message", "save-state"
    ].forEach(id => { el[id] = byId(id); });
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "0";
    const absolute = Math.abs(value);
    const units = [
      { limit: 1e9, suffix: "Md" },
      { limit: 1e6, suffix: "M" },
      { limit: 1e3, suffix: "K" }
    ];
    const unit = units.find(entry => absolute >= entry.limit);
    if (unit) {
      const amount = value / unit.limit;
      return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${unit.suffix}`;
    }
    return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remaining = total % 60;
    if (hours) return `${hours} h ${minutes} min`;
    if (minutes) return `${minutes} min ${remaining} s`;
    return `${remaining} s`;
  }

  function resourceCostText(cost) {
    return RESOURCE_KEYS.filter(key => cost[key] > 0)
      .map(key => `${formatNumber(cost[key])} ${RESOURCE_NAMES[key]}`)
      .join(" · ");
  }

  function canAfford(cost, resources = gameState.resources) {
    return RESOURCE_KEYS.every(key => (resources[key] || 0) + 1e-9 >= (cost[key] || 0));
  }

  function charge(cost) {
    RESOURCE_KEYS.forEach(key => {
      gameState.resources[key] = Math.max(0, gameState.resources[key] - (cost[key] || 0));
    });
  }

  function getModifiers(state = gameState) {
    const modifiers = {
      production: 1, speed: 1, energyUse: 1, costs: 1,
      decoderData: 1, dataOutput: 1
    };
    technologies.forEach(tech => {
      if (!state.technologies.includes(tech.id)) return;
      Object.entries(tech.effects).forEach(([key, value]) => { modifiers[key] *= value; });
    });
    const specialization = specializations.find(item => item.id === state.specialization);
    if (specialization) {
      Object.entries(specialization.effects).forEach(([key, value]) => { modifiers[key] *= value; });
    }
    return modifiers;
  }

  function getBuildingCost(building, state = gameState) {
    const quantity = state.buildings[building.id] || 0;
    const modifiers = getModifiers(state);
    const cost = {};
    RESOURCE_KEYS.forEach(key => {
      const base = building.baseCost[key] || 0;
      if (base) cost[key] = Math.max(1, Math.ceil(base * Math.pow(building.growth, quantity) * modifiers.costs));
    });
    return cost;
  }

  function getBuildingRates(building, state, modifiers) {
    const count = state.buildings[building.id] || 0;
    const rateMultiplier = count * modifiers.production * modifiers.speed;
    const output = {};
    Object.entries(building.outputs).forEach(([key, rate]) => {
      let resourceMultiplier = 1;
      if (key === "data" && building.id === "decoder") {
        resourceMultiplier *= modifiers.decoderData * modifiers.dataOutput;
      } else if (key === "data" && building.id === "server") {
        resourceMultiplier *= modifiers.dataOutput;
      }
      output[key] = rate * rateMultiplier * resourceMultiplier;
    });
    const input = {};
    Object.entries(building.inputs).forEach(([key, rate]) => {
      input[key] = rate * rateMultiplier * (key === "energy" ? modifiers.energyUse : 1);
    });
    return { input, output };
  }

  function addRates(resources, rates, duration, factor = 1) {
    Object.entries(rates).forEach(([key, rate]) => {
      resources[key] += rate * duration * factor;
    });
  }

  function simulateStep(state, duration) {
    const next = { ...state.resources };
    const modifiers = getModifiers(state);
    const activity = {};
    const consumers = [];

    buildings.forEach(building => {
      const count = state.buildings[building.id] || 0;
      if (!count) {
        activity[building.id] = 0;
        return;
      }
      const rates = getBuildingRates(building, state, modifiers);
      if (Object.keys(rates.input).length) {
        consumers.push({ building, rates });
      } else {
        addRates(next, rates.output, duration);
        activity[building.id] = 1;
      }
    });

    consumers.forEach(({ building, rates }) => {
      let fraction = 1;
      Object.entries(rates.input).forEach(([key, rate]) => {
        const requested = rate * duration;
        if (requested > 0) fraction = Math.min(fraction, next[key] / requested);
      });
      fraction = Math.max(0, Math.min(1, fraction));
      Object.entries(rates.input).forEach(([key, rate]) => {
        next[key] = Math.max(0, next[key] - rate * duration * fraction);
      });
      addRates(next, rates.output, duration, fraction);
      activity[building.id] = fraction;
    });

    RESOURCE_KEYS.forEach(key => {
      next[key] = Number.isFinite(next[key]) ? Math.max(0, Math.min(1e15, next[key])) : state.resources[key];
    });
    return { resources: next, activity };
  }

  function simulateElapsed(state, seconds) {
    const duration = Math.max(0, Math.min(MAX_OFFLINE_SECONDS, seconds));
    if (!duration) return { resources: { ...state.resources }, activity: { ...state.lastActivity } };
    const steps = Math.min(MAX_SIMULATION_STEPS, Math.max(1, Math.ceil(duration / 30)));
    const stepDuration = duration / steps;
    const working = { ...state, resources: { ...state.resources } };
    let activity = {};
    for (let index = 0; index < steps; index += 1) {
      const result = simulateStep(working, stepDuration);
      working.resources = result.resources;
      activity = result.activity;
    }
    return { resources: working.resources, activity };
  }

  function productionSnapshot() {
    const preview = simulateStep(gameState, 1);
    const rates = {};
    RESOURCE_KEYS.forEach(key => {
      rates[key] = preview.resources[key] - gameState.resources[key];
    });
    return { rates, activity: preview.activity };
  }

  function totalBuildings() {
    return Object.values(gameState.buildings).reduce((sum, count) => sum + count, 0);
  }

  function setMessage(text) {
    el["system-message"].textContent = text;
  }

  function saveGame() {
    if (!gameState.storageAvailable) return false;
    const payload = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      resources: gameState.resources,
      buildings: gameState.buildings,
      technologies: gameState.technologies,
      specialization: gameState.specialization,
      pendingOffline: gameState.pendingOffline
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      gameState.lastSavedAt = payload.savedAt;
      el["save-state"].textContent = "SAUVEGARDE AUTO // OK";
      return true;
    } catch (error) {
      gameState.storageAvailable = false;
      el["storage-warning"].hidden = false;
      el["save-state"].textContent = "SAUVEGARDE // INDISPONIBLE";
      setMessage("Écriture locale impossible : la partie continue sans sauvegarde.");
      return false;
    }
  }

  function validResourceValue(value) {
    return Number.isFinite(value) && value >= 0 && value <= 1e15;
  }

  function loadGame() {
    let raw;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch (error) {
      gameState.storageAvailable = false;
      el["storage-warning"].hidden = false;
      el["save-state"].textContent = "SAUVEGARDE // INDISPONIBLE";
      return;
    }
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      if (!data || data.version !== SAVE_VERSION || typeof data !== "object") throw new Error("Version de sauvegarde invalide");
      const resources = {};
      RESOURCE_KEYS.forEach(key => {
        const value = data.resources && data.resources[key];
        if (!validResourceValue(value)) throw new Error("Ressource invalide");
        resources[key] = value;
      });
      const counts = {};
      buildings.forEach(building => {
        const value = data.buildings && data.buildings[building.id];
        if (!Number.isInteger(value) || value < 0 || value > 1e6) throw new Error("Quantité de bâtiment invalide");
        counts[building.id] = value;
      });
      if (counts.processor < 1) throw new Error("Le processeur initial est requis");
      if (!Array.isArray(data.technologies) || data.technologies.some(id => !technologies.some(tech => tech.id === id)) ||
          new Set(data.technologies).size !== data.technologies.length) throw new Error("Technologies invalides");
      if (data.specialization !== null && !specializations.some(item => item.id === data.specialization)) throw new Error("Spécialisation invalide");
      if (!Number.isFinite(data.savedAt) || data.savedAt < 0) throw new Error("Date de sauvegarde invalide");

      gameState.resources = resources;
      gameState.buildings = counts;
      gameState.technologies = [...data.technologies];
      gameState.specialization = data.specialization;
      gameState.lastSavedAt = data.savedAt;
      gameState.loadedFromValidSave = true;
      if (data.pendingOffline && data.pendingOffline.version === SAVE_VERSION &&
          Number.isFinite(data.pendingOffline.duration) &&
          RESOURCE_KEYS.every(key => Number.isFinite(data.pendingOffline.gains && data.pendingOffline.gains[key]))) {
        gameState.pendingOffline = {
          duration: Math.max(0, Math.min(MAX_OFFLINE_SECONDS, data.pendingOffline.duration)),
          gains: Object.fromEntries(RESOURCE_KEYS.map(key => [key, data.pendingOffline.gains[key]]))
        };
      }
    } catch (error) {
      setMessage("Sauvegarde invalide ignorée. Une nouvelle partie démarre sans modifier le fichier existant.");
    }
  }

  function createOfflineRecovery(referenceTime = Date.now()) {
    if (gameState.pendingOffline || !gameState.loadedFromValidSave) return;
    const elapsed = Math.max(0, Math.min(MAX_OFFLINE_SECONDS, (referenceTime - gameState.lastSavedAt) / 1000));
    if (elapsed < 5) return;
    const result = simulateElapsed(gameState, elapsed);
    const gains = {};
    RESOURCE_KEYS.forEach(key => { gains[key] = result.resources[key] - gameState.resources[key]; });
    gameState.pendingOffline = { duration: elapsed, gains };
    saveGame();
    renderOfflinePanel();
  }

  function renderOfflinePanel() {
    const pending = gameState.pendingOffline;
    el["offline-panel"].hidden = !pending;
    if (!pending) return;
    const gainText = RESOURCE_KEYS
      .filter(key => Math.abs(pending.gains[key]) >= 0.05)
      .map(key => `${pending.gains[key] >= 0 ? "+" : ""}${formatNumber(pending.gains[key])} ${RESOURCE_NAMES[key]}`)
      .join(" · ") || "Aucun changement net";
    el["offline-summary"].textContent = `${formatDuration(pending.duration)} prise en compte (maximum 8 h). ${gainText}.`;
  }

  function claimOfflineProgress() {
    const pending = gameState.pendingOffline;
    if (!pending) return;
    RESOURCE_KEYS.forEach(key => {
      gameState.resources[key] = Math.max(0, Math.min(1e15, gameState.resources[key] + pending.gains[key]));
    });
    gameState.pendingOffline = null;
    saveGame();
    render();
    setMessage("Progression hors ligne récupérée. Les gains ont été crédités une seule fois.");
  }

  function buyBuilding(id) {
    const building = buildings.find(item => item.id === id);
    if (!building) return;
    const cost = getBuildingCost(building);
    if (!canAfford(cost)) return;
    charge(cost);
    gameState.buildings[id] += 1;
    saveGame();
    setMessage(`${building.name} installé. Flux du système mis à jour.`);
    render();
  }

  function buyTechnology(id) {
    const tech = technologies.find(item => item.id === id);
    if (!tech || gameState.technologies.includes(id)) return;
    if (tech.requires && !tech.requires.every(required => gameState.technologies.includes(required))) return;
    if (!canAfford(tech.cost)) return;
    charge(tech.cost);
    gameState.technologies.push(id);
    saveGame();
    setMessage(`Technologie « ${tech.name} » déployée.`);
    render();
  }

  function chooseSpecialization(id) {
    if (gameState.specialization || totalBuildings() < 8) return;
    if (!specializations.some(item => item.id === id)) return;
    gameState.specialization = id;
    saveGame();
    const selected = specializations.find(item => item.id === id);
    setMessage(`Spécialisation ${selected.name} verrouillée. Cet arbitrage est permanent.`);
    render();
  }

  function createItemCard(className, name, quantity, description, flow, cost, buttonText, buttonAction, disabled, extraClass = "") {
    const card = document.createElement("article");
    card.className = `item-card ${className} ${extraClass}`.trim();
    const content = document.createElement("div");
    const nameRow = document.createElement("div");
    nameRow.className = "item-name-row";
    const title = document.createElement("h3");
    title.className = "item-name";
    title.textContent = name;
    nameRow.append(title);
    if (quantity !== null) {
      const count = document.createElement("span");
      count.className = "item-quantity";
      count.textContent = `× ${quantity}`;
      nameRow.append(count);
    }
    content.append(nameRow);
    const descriptionNode = document.createElement("p");
    descriptionNode.className = "item-description";
    descriptionNode.textContent = description;
    content.append(descriptionNode);
    if (flow) {
      const flowNode = document.createElement("p");
      flowNode.className = "item-flow";
      flowNode.textContent = flow;
      content.append(flowNode);
    }
    if (cost) {
      const costNode = document.createElement("p");
      costNode.className = "item-cost";
      costNode.textContent = `COÛT : ${resourceCostText(cost)}`;
      content.append(costNode);
    }
    card.append(content);
    if (buttonText) {
      const button = document.createElement("button");
      button.className = "button item-button";
      button.type = "button";
      button.textContent = buttonText;
      button.disabled = disabled;
      button.dataset.action = buttonAction;
      card.append(button);
    }
    return card;
  }

  function formatBuildingFlow(building, state = gameState) {
    const modifiers = getModifiers(state);
    const count = state.buildings[building.id] || 0;
    const unitState = { ...state, buildings: { ...state.buildings, [building.id]: 1 } };
    const rates = getBuildingRates(building, unitState, modifiers);
    const parts = [];
    Object.entries(rates.input).forEach(([key, rate]) => {
      parts.push(`−${formatNumber(rate)} ${RESOURCE_NAMES[key]}/s`);
    });
    Object.entries(rates.output).forEach(([key, rate]) => {
      parts.push(`+${formatNumber(rate)} ${RESOURCE_NAMES[key]}/s`);
    });
    return `${parts.join("   ")} par unité · installé × ${count}`;
  }

  function renderBuildings() {
    const snapshot = productionSnapshot();
    el["building-list"].replaceChildren();
    buildings.forEach(building => {
      const cost = getBuildingCost(building);
      const owned = gameState.buildings[building.id];
      const blocked = owned > 0 && snapshot.activity[building.id] < 0.999;
      const card = createItemCard(
        "building-card",
        building.name,
        owned,
        building.description,
        formatBuildingFlow(building),
        cost,
        "INSTALLER",
        `building:${building.id}`,
        !canAfford(cost),
        blocked ? "is-blocked" : owned ? "is-owned" : ""
      );
      el["building-list"].append(card);
    });
    el["building-count"].textContent = `${String(totalBuildings()).padStart(2, "0")} UNITÉ${totalBuildings() === 1 ? "" : "S"}`;
  }

  function renderTechnologies() {
    el["technology-list"].replaceChildren();
    technologies.forEach(tech => {
      const owned = gameState.technologies.includes(tech.id);
      const missing = (tech.requires || []).filter(id => !gameState.technologies.includes(id));
      const affordable = canAfford(tech.cost);
      const card = createItemCard(
        "technology-card",
        tech.name,
        null,
        tech.description,
        missing.length ? `PRÉREQUIS : ${missing.map(id => technologies.find(item => item.id === id).name).join(", ")}` : "",
        owned ? null : tech.cost,
        owned ? "DÉPLOYÉE" : missing.length ? "VERROUILLÉE" : "RECHERCHER",
        `technology:${tech.id}`,
        owned || missing.length > 0 || !affordable,
        owned ? "is-owned" : ""
      );
      el["technology-list"].append(card);
    });
  }

  function renderSpecializations() {
    const unlocked = totalBuildings() >= 8;
    el["specialization-lock"].textContent = gameState.specialization
      ? "CHOIX PERMANENT"
      : unlocked ? "CHOIX DISPONIBLE" : `DÉBLOQUÉ À 8 UNITÉS · ${totalBuildings()}/8`;
    el["specialization-intro"].textContent = gameState.specialization
      ? "Votre spécialisation ne peut pas être modifiée dans cette version."
      : "Choisissez une orientation permanente lorsque votre infrastructure atteint 8 unités.";
    el["specialization-list"].replaceChildren();
    specializations.forEach(item => {
      const selected = gameState.specialization === item.id;
      const card = createItemCard(
        "specialization-card",
        item.name,
        null,
        `${item.description} ${item.effectText}`,
        null,
        null,
        selected ? "SÉLECTIONNÉE" : "CHOISIR",
        `specialization:${item.id}`,
        Boolean(gameState.specialization) || !unlocked,
        selected ? "is-selected" : !unlocked ? "is-locked" : ""
      );
      el["specialization-list"].append(card);
    });
  }

  function renderFlows(snapshot) {
    const labels = [
      ["processor", "Processeurs → BITS"],
      ["decoder", "Décodeurs → BITS consommés / DATA produite"],
      ["generator", "Générateurs → ENERGY"],
      ["server", "Serveurs → ENERGY consommée / DATA produite"]
    ];
    el["production-lines"].replaceChildren();
    labels.forEach(([id, label]) => {
      const count = gameState.buildings[id];
      const line = document.createElement("div");
      line.className = "flow-line";
      const name = document.createElement("span");
      name.textContent = `${label} · ${count} actif${count === 1 ? "" : "s"}`;
      const status = document.createElement("span");
      status.className = `flow-value${count > 0 && snapshot.activity[id] < 0.999 ? " blocked" : ""}`;
      status.textContent = count > 0 && snapshot.activity[id] < 0.999 ? "BLOQUÉ / PARTIEL" : count > 0 ? "EN LIGNE" : "ABSENT";
      line.append(name, status);
      el["production-lines"].append(line);
    });
  }

  function updateFlowStatuses(snapshot) {
    Array.from(el["production-lines"].children).forEach((line, index) => {
      const id = ["processor", "decoder", "generator", "server"][index];
      const count = gameState.buildings[id];
      const status = line.children[1];
      const blocked = count > 0 && snapshot.activity[id] < 0.999;
      status.className = `flow-value${blocked ? " blocked" : ""}`;
      status.textContent = blocked ? "BLOQUÉ / PARTIEL" : count > 0 ? "EN LIGNE" : "ABSENT";
    });
  }

  function updateAvailability(snapshot) {
    Array.from(el["building-list"].children).forEach((card, index) => {
      const building = buildings[index];
      const count = gameState.buildings[building.id];
      const blocked = count > 0 && snapshot.activity[building.id] < 0.999;
      card.classList.toggle("is-blocked", blocked);
      card.classList.toggle("is-owned", count > 0 && !blocked);
      card.querySelector("button").disabled = !canAfford(getBuildingCost(building));
    });
    Array.from(el["technology-list"].children).forEach((card, index) => {
      const tech = technologies[index];
      const owned = gameState.technologies.includes(tech.id);
      const missing = (tech.requires || []).some(id => !gameState.technologies.includes(id));
      card.querySelector("button").disabled = owned || missing || !canAfford(tech.cost);
    });
  }

  function render(updateCatalogs = true) {
    const snapshot = productionSnapshot();
    gameState.lastActivity = snapshot.activity;
    RESOURCE_KEYS.forEach(key => {
      el[`resource-${key}`].textContent = formatNumber(gameState.resources[key]);
      const rate = snapshot.rates[key];
      el[`rate-${key}`].textContent = `${rate >= 0 ? "+" : "−"}${formatNumber(Math.abs(rate))} / s`;
    });
    if (updateCatalogs) {
      renderFlows(snapshot);
      renderBuildings();
      renderTechnologies();
      renderSpecializations();
    } else {
      updateFlowStatuses(snapshot);
    }
    updateAvailability(snapshot);
    renderOfflinePanel();
    const specialization = specializations.find(item => item.id === gameState.specialization);
    el["specialty-badge"].hidden = !specialization;
    if (specialization) el["specialty-badge"].textContent = specialization.name;
    el["system-status"].textContent = snapshot.activity.server < 0.999 && gameState.buildings.server > 0
      ? "ÉNERGIE LIMITÉE"
      : "SYSTÈME EN LIGNE";
  }

  function handleAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const [kind, id] = button.dataset.action.split(":");
    if (kind === "building") buyBuilding(id);
    if (kind === "technology") buyTechnology(id);
    if (kind === "specialization") chooseSpecialization(id);
  }

  function gameTick() {
    const now = performance.now();
    const elapsed = Math.max(0, Math.min(MAX_OFFLINE_SECONDS, (now - lastTickAt) / 1000));
    lastTickAt = now;
    if (document.hidden || elapsed <= 0) return;
    const result = simulateElapsed(gameState, elapsed);
    gameState.resources = result.resources;
    gameState.lastActivity = result.activity;
    if (now - lastRenderedAt >= 400) {
      render(false);
      lastRenderedAt = now;
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      saveGame();
      lastTickAt = performance.now();
      return;
    }
    createOfflineRecovery(Date.now());
    lastTickAt = performance.now();
    render();
  }

  function initialize() {
    cacheElements();
    loadGame();
    createOfflineRecovery();
    el["building-list"].addEventListener("click", handleAction);
    el["technology-list"].addEventListener("click", handleAction);
    el["specialization-list"].addEventListener("click", handleAction);
    el["claim-offline"].addEventListener("click", claimOfflineProgress);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    render();
    if (gameState.storageAvailable) saveGame();
    tickTimer = window.setInterval(gameTick, TICK_MS);
    autosaveTimer = window.setInterval(saveGame, 10000);
    window.addEventListener("beforeunload", () => {
      if (tickTimer !== null) window.clearInterval(tickTimer);
      if (autosaveTimer !== null) window.clearInterval(autosaveTimer);
      saveGame();
    }, { once: true });
  }

  initialize();
})();
