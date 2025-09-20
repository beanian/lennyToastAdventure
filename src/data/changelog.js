export const CHANGE_LOG_ENTRIES = [
  {
    date: '2025-09-20',
    title: 'Leaderboard Reworked',
    highlights: [
      'Leaderboard now displays each unique players fastest run only',
      'Renamed from Lennys Toast Adventure to Lennys Toast Quest',
      'Added new domain lenny.toast.quest',
      'Added this changelog screen :)'

    ]
  },
    {
    date: '2025-09-18',
    title: 'Lennys Toast Quest Launched!!!!',
    highlights: [
      'Beta version with only speedrun mode enabled',
      'More levels and features coming soon!'
    ]
  }
];

export function getRecentChangeLogEntries(limit = 3) {
  return CHANGE_LOG_ENTRIES.slice(0, limit);
}

export function formatChangeLogEntries(entries) {
  return entries
    .map((entry) => {
      const lines = [
        `${entry.date} — ${entry.title}`,
        ...entry.highlights.map((item) => `• ${item}`)
      ];
      return lines.join('\n');
    })
    .join('\n\n');
}
