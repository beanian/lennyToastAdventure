const STORAGE_KEY = 'lenny-toast-leaderboard';
const MAX_ENTRIES_PER_LEVEL = 20;
const MAX_NAME_LENGTH = 20;

let cache = null;
const memoryStore = {};

function getStorage() {
  if (cache) return cache;
  if (typeof window === 'undefined') {
    cache = memoryStore;
    return cache;
  }
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Leaderboard storage unavailable, falling back to memory store.', err);
    cache = memoryStore;
  }
  if (!cache || typeof cache !== 'object') cache = {};
  return cache;
}

function persist(store) {
  cache = store;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to persist leaderboard store.', err);
  }
}

function sanitizeName(name) {
  if (typeof name !== 'string') return 'Player';
  const trimmed = name.trim();
  if (!trimmed) return 'Player';
  return trimmed.slice(0, MAX_NAME_LENGTH);
}

export function getLeaderboard(levelId) {
  if (!levelId) return [];
  const store = getStorage();
  const entries = Array.isArray(store[levelId]) ? store[levelId] : [];
  return [...entries].sort((a, b) => {
    if (a.time === b.time) return (a.timestamp || 0) - (b.timestamp || 0);
    return a.time - b.time;
  });
}

export function addRun(levelId, name, timeSeconds) {
  if (!levelId || typeof timeSeconds !== 'number' || Number.isNaN(timeSeconds)) {
    return { entries: getLeaderboard(levelId), entry: null, rank: -1 };
  }
  const sanitized = sanitizeName(name);
  const entry = {
    name: sanitized,
    time: Number(timeSeconds),
    timestamp: Date.now()
  };
  const store = getStorage();
  const current = Array.isArray(store[levelId]) ? store[levelId] : [];
  current.push(entry);
  current.sort((a, b) => {
    if (a.time === b.time) return (a.timestamp || 0) - (b.timestamp || 0);
    return a.time - b.time;
  });
  const rank = current.indexOf(entry) + 1;
  if (current.length > MAX_ENTRIES_PER_LEVEL) {
    current.length = MAX_ENTRIES_PER_LEVEL;
  }
  store[levelId] = current;
  persist(store);
  return { entries: [...current], entry, rank };
}

export function clearLeaderboard(levelId) {
  if (!levelId) return;
  const store = getStorage();
  if (store[levelId]) {
    delete store[levelId];
    persist(store);
  }
}
