const DEFAULT_ENDPOINT = 'https://jsonblob.com/api/jsonBlob/1417914812679249920';
const API_ENDPOINT =
  (typeof window !== 'undefined' && window.LEADERBOARD_API_ENDPOINT) || DEFAULT_ENDPOINT;
const MAX_ENTRIES_PER_LEVEL = 500;
const MAX_NAME_LENGTH = 20;
const SCHEMA_VERSION = 1;

let cache = null;
let cachePromise = null;
let writeQueue = Promise.resolve();

function sanitizeName(name) {
  if (typeof name !== 'string') return 'Player';
  const trimmed = name.trim();
  if (!trimmed) return 'Player';
  return trimmed.slice(0, MAX_NAME_LENGTH);
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const name = sanitizeName(entry.name || 'Player');
  const time = Number(entry.time);
  if (!Number.isFinite(time)) return null;
  const timestampRaw = Number(entry.timestamp);
  const timestamp = Number.isFinite(timestampRaw) ? timestampRaw : Date.now();
  return { name, time, timestamp };
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.time === b.time) return (a.timestamp || 0) - (b.timestamp || 0);
    return a.time - b.time;
  });
}

function dedupeEntries(entries, { limit = MAX_ENTRIES_PER_LEVEL } = {}) {
  const byName = new Map();
  for (const entry of entries || []) {
    const normalized = normalizeEntry(entry);
    if (!normalized) continue;
    const existing = byName.get(normalized.name);
    if (
      !existing ||
      normalized.time < existing.time ||
      (normalized.time === existing.time && normalized.timestamp < existing.timestamp)
    ) {
      byName.set(normalized.name, normalized);
    }
  }
  const sorted = sortEntries([...byName.values()]);
  if (typeof limit === 'number' && limit >= 0) {
    return sorted.slice(0, limit);
  }
  return sorted;
}

function normalizeStore(raw) {
  if (!raw || typeof raw !== 'object') {
    return { schemaVersion: SCHEMA_VERSION, levels: {} };
  }

  const levels = (() => {
    if (typeof raw.levels === 'object' && raw.levels !== null) {
      return raw.levels;
    }
    // Legacy shape where levels were stored at root keyed by levelId
    const entries = {};
    for (const [key, value] of Object.entries(raw)) {
      if (Array.isArray(value)) entries[key] = value;
    }
    return entries;
  })();

  const normalized = { schemaVersion: SCHEMA_VERSION, levels: {} };
  for (const [levelId, records] of Object.entries(levels)) {
    if (!Array.isArray(records)) continue;
    normalized.levels[levelId] = dedupeEntries(records);
  }

  return normalized;
}

async function fetchStore(forceRefresh = false) {
  if (forceRefresh) {
    cache = null;
    cachePromise = null;
  }
  if (cache) return cache;
  if (!cachePromise) {
    cachePromise = (async () => {
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error(`Leaderboard fetch failed with status ${response.status}`);
        }
        const json = await response.json().catch(() => ({}));
        cache = normalizeStore(json);
      } catch (err) {
        console.error('Unable to fetch leaderboard store, falling back to empty cache.', err);
        cache = { schemaVersion: SCHEMA_VERSION, levels: {} };
      } finally {
        cachePromise = null;
      }
      return cache;
    })();
  }
  return cachePromise;
}

async function persistStore(store) {
  try {
    const body = JSON.stringify(store);
    const response = await fetch(API_ENDPOINT, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body
    });
    if (!response.ok) {
      throw new Error(`Leaderboard persist failed with status ${response.status}`);
    }
  } catch (err) {
    console.error('Failed to persist leaderboard store.', err);
    throw err;
  }
}

function withWriteQueue(operation) {
  const run = writeQueue
    .catch(() => {})
    .then(operation);
  writeQueue = run.then(() => undefined, () => undefined);
  return run;
}

export async function getLeaderboard(levelId) {
  if (!levelId) return [];
  const store = await fetchStore();
  const entries = Array.isArray(store.levels?.[levelId]) ? store.levels[levelId] : [];
  return dedupeEntries(entries);
}

export async function addRun(levelId, name, timeSeconds) {
  if (!levelId || typeof timeSeconds !== 'number' || Number.isNaN(timeSeconds)) {
    return { entries: await getLeaderboard(levelId), entry: null, rank: -1 };
  }

  const sanitized = sanitizeName(name);
  const entry = {
    name: sanitized,
    time: Number(timeSeconds),
    timestamp: Date.now()
  };

  return withWriteQueue(async () => {
    const store = await fetchStore(true);
    const levels = store.levels || (store.levels = {});
    const current = Array.isArray(levels[levelId]) ? [...levels[levelId]] : [];
    current.push(entry);
    const dedupedAll = dedupeEntries(current, { limit: -1 });
    const bestEntry = dedupedAll.find(e => e.name === entry.name) || null;
    const rank = bestEntry ? dedupedAll.indexOf(bestEntry) + 1 : -1;
    const limited =
      typeof MAX_ENTRIES_PER_LEVEL === 'number' && MAX_ENTRIES_PER_LEVEL >= 0
        ? dedupedAll.slice(0, MAX_ENTRIES_PER_LEVEL)
        : dedupedAll;
    levels[levelId] = limited;
    store.updatedAt = Date.now();
    await persistStore(store);
    cache = store;
    return { entries: [...limited], entry: bestEntry, rank };
  }).catch(err => {
    console.error('Failed to save leaderboard run.', err);
    throw err;
  });
}

export async function clearLeaderboard(levelId) {
  if (!levelId) return;
  await withWriteQueue(async () => {
    const store = await fetchStore(true);
    const levels = store.levels || (store.levels = {});
    if (levels[levelId]) {
      delete levels[levelId];
      store.updatedAt = Date.now();
      await persistStore(store);
      cache = store;
    }
  });
}
