const stats = {
  toastCount: 0,
  sockroachKills: 0,
  rawLevelTime: 0,
  livesLost: 0
};

const toNumber = value => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export function resetLevelStats() {
  stats.toastCount = 0;
  stats.sockroachKills = 0;
  stats.rawLevelTime = 0;
  stats.livesLost = 0;
}

export function addToast(count = 1) {
  const inc = Math.max(0, toNumber(count));
  stats.toastCount += inc;
  return stats.toastCount;
}

export function addSockroachKill(count = 1) {
  const inc = Math.max(0, toNumber(count));
  stats.sockroachKills += inc;
  return stats.sockroachKills;
}

export function addLifeLost(count = 1) {
  const inc = Math.max(0, toNumber(count));
  stats.livesLost += inc;
  return stats.livesLost;
}

export function setToastCount(count = 0) {
  stats.toastCount = Math.max(0, toNumber(count));
  return stats.toastCount;
}

export function setSockroachKills(count = 0) {
  stats.sockroachKills = Math.max(0, toNumber(count));
  return stats.sockroachKills;
}

export function setRawLevelTime(seconds = 0) {
  stats.rawLevelTime = Math.max(0, toNumber(seconds));
  return stats.rawLevelTime;
}

export function getLevelStats() {
  return {
    toastCount: stats.toastCount,
    sockroachKills: stats.sockroachKills,
    rawLevelTime: stats.rawLevelTime,
    livesLost: stats.livesLost
  };
}
