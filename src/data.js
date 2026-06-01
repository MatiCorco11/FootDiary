const d = (offset) => {
  const dt = new Date('2026-05-14T18:45:00');
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString();
};

export const INITIAL_UPCOMING = [
  // ── Finished – ready to rate (past dates, scores confirmed) ──────────────
  { id: 'f1', homeTeam: 'Chelsea',    awayTeam: 'Everton',      competition: 'pl',         date: d(-2), homeScore: 2, awayScore: 0 },
  { id: 'f2', homeTeam: 'Liverpool',  awayTeam: 'Newcastle',    competition: 'pl',         date: d(-3), homeScore: 3, awayScore: 1 },
  { id: 'f3', homeTeam: 'Leverkusen', awayTeam: 'Dortmund',     competition: 'bundesliga', date: d(-4), homeScore: 2, awayScore: 1 },
  { id: 'f4', homeTeam: 'Atlético',   awayTeam: 'Sevilla',      competition: 'laliga',     date: d(-5), homeScore: 1, awayScore: 1 },
  { id: 'f5', homeTeam: 'AC Milan',   awayTeam: 'Roma',         competition: 'seriea',     date: d(-6), homeScore: 0, awayScore: 0 },
  // ── Upcoming – not yet played ─────────────────────────────────────────────
  { id: 'u1', homeTeam: 'Man City',   awayTeam: 'Arsenal',      competition: 'pl',         date: d(1),  homeScore: null, awayScore: null },
  { id: 'u2', homeTeam: 'Barcelona',  awayTeam: 'Real Madrid',  competition: 'laliga',     date: d(3),  homeScore: null, awayScore: null },
  { id: 'u3', homeTeam: 'Liverpool',  awayTeam: 'Chelsea',      competition: 'pl',         date: d(4),  homeScore: null, awayScore: null },
  { id: 'u4', homeTeam: 'PSG',        awayTeam: 'Bayern',       competition: 'ucl',        date: d(6),  homeScore: null, awayScore: null },
  { id: 'u5', homeTeam: 'Juventus',   awayTeam: 'Inter Milan',  competition: 'seriea',     date: d(8),  homeScore: null, awayScore: null },
  { id: 'u6', homeTeam: 'Dortmund',   awayTeam: 'Bayern',       competition: 'bundesliga', date: d(10), homeScore: null, awayScore: null },
  { id: 'u7', homeTeam: 'Marseille',  awayTeam: 'PSG',          competition: 'ligue1',     date: d(12), homeScore: null, awayScore: null },
];

export const INITIAL_LOGGED = [
  { id: 'l1', homeTeam: 'Arsenal',    awayTeam: 'PSG',          competition: 'ucl',    date: d(-3),  homeScore: 2, awayScore: 1, status: 'logged', rating: 5,   review: 'Unbelievable atmosphere. Saka was immense — one of the best UCL nights I\'ve witnessed in years.', isWatched: true },
  { id: 'l2', homeTeam: 'Real Madrid',awayTeam: 'Atlético',     competition: 'laliga', date: d(-7),  homeScore: 1, awayScore: 1, status: 'logged', rating: 4,   review: 'Bellingham equaliser in the 89th was pure cinema. Never boring.', isWatched: true },
  { id: 'l3', homeTeam: 'Man Utd',    awayTeam: 'Tottenham',    competition: 'pl',     date: d(-10), homeScore: 2, awayScore: 3, status: 'logged', rating: 3,   review: 'Son was brilliant. United lacked intensity for 70 minutes then woke up too late.', isWatched: true },
  { id: 'l4', homeTeam: 'Liverpool',  awayTeam: 'Man City',     competition: 'pl',     date: d(-14), homeScore: 3, awayScore: 2, status: 'logged', rating: 5,   review: null, isWatched: true },
  { id: 'l5', homeTeam: 'Bayern',     awayTeam: 'Dortmund',     competition: 'bundesliga', date: d(-18), homeScore: 4, awayScore: 0, status: 'logged', rating: 2, review: 'One-sided. Dortmund showed up to collect a paycheck.', isWatched: true },
];

export const INITIAL_CHALLENGE = {
  id: 'wc1',
  title: 'Match Week',
  description: 'Rate 5 matches this week',
  target: 5,
  current: 2,
  xpReward: 500,
  badge: '🏆',
};

export const INITIAL_ACHIEVEMENTS = [
  { id: 'a1', emoji: '⚽', title: 'First Whistle',   description: 'Log your first match',              unlocked: true,  xp: 100 },
  { id: 'a2', emoji: '🎩', title: 'Hat-Trick',        description: 'Log 3 matches in one week',         unlocked: true,  xp: 250 },
  { id: 'a3', emoji: '⭐', title: 'Five Star Fan',    description: 'Give a 5-star rating',              unlocked: true,  xp: 150 },
  { id: 'a4', emoji: '🔥', title: '7-Day Streak',     description: 'Log matches 7 days in a row',       unlocked: false, xp: 500 },
  { id: 'a5', emoji: '📝', title: 'The Reviewer',     description: 'Write 10 reviews',                  unlocked: false, xp: 300 },
  { id: 'a6', emoji: '💯', title: 'Century Club',     description: 'Log 100 matches',                   unlocked: false, xp: 1000 },
  { id: 'a7', emoji: '🌍', title: 'Globe Trotter',    description: 'Rate matches from 5 leagues',       unlocked: false, xp: 400 },
  { id: 'a8', emoji: '🏆', title: 'Match Week',       description: 'Complete a weekly challenge',       unlocked: false, xp: 500 },
];

export const TEAMS = [
  'Arsenal',    'Chelsea',   'Liverpool',   'Man City',
  'Man Utd',    'Tottenham', 'Newcastle',   'West Ham',
  'Real Madrid','Barcelona', 'Atlético',    'Sevilla',
  'Bayern',     'Dortmund',  'Leverkusen',  'RB Leipzig',
  'Juventus',   'Inter Milan','AC Milan',   'Napoli',
  'PSG',        'Marseille', 'Ajax',        'Porto',
];

export const FRIENDS_ACTIVITY = [
  { name: 'Alex R.',  action: 'rated', match: 'Barça vs Real Madrid', rating: 5, time: '2h ago' },
  { name: 'Jamie T.', action: 'rated', match: 'Liverpool vs Chelsea',  rating: 4, time: '5h ago' },
  { name: 'Sam K.',   action: 'rated', match: 'PSG vs Bayern',         rating: 3, time: '1d ago' },
];
