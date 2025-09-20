export const CHANGE_LOG_ENTRIES = [
  {
    date: '2024-05-30',
    title: 'Welcome Screen Updates',
    highlights: [
      'Added a dedicated change log viewer to the welcome screen.',
      'Introduced a reusable change log data file for tracking updates.'
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
