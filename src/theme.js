import { Dimensions } from 'react-native';

export const { width: W, height: H } = Dimensions.get('window');

export const C = {
  bg:           '#060E08',
  surface:      '#0D1A10',
  surfaceHigh:  '#152419',
  pitch:        '#192F1F',
  accent:       '#2EDB6A',
  accentDim:    'rgba(46,219,106,0.12)',
  accentBorder: 'rgba(46,219,106,0.28)',
  gold:         '#F5C518',
  goldDim:      'rgba(245,197,24,0.14)',
  goldBorder:   'rgba(245,197,24,0.38)',
  red:          '#E05555',
  redDim:       'rgba(224,85,85,0.12)',
  text:         '#E6F2E8',
  sub:          '#7A9880',
  muted:        '#3C5840',
  border:       '#152419',
  star:         '#F5C518',
  starEmpty:    '#1E3424',
  white:        '#FFFFFF',
  tabBg:        '#090F0B',
};

export const COMP = {
  pl:         { name: 'Premier League',   emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#3D1099', short: 'PL' },
  ucl:        { name: 'Champions League', emoji: '⭐',        color: '#1B3A8F', short: 'UCL' },
  laliga:     { name: 'La Liga',          emoji: '🇪🇸',        color: '#CC0000', short: 'LaLiga' },
  bundesliga: { name: 'Bundesliga',       emoji: '🇩🇪',        color: '#D20515', short: 'BL' },
  seriea:     { name: 'Serie A',          emoji: '🇮🇹',        color: '#024494', short: 'SA' },
  ligue1:     { name: 'Ligue 1',          emoji: '🇫🇷',        color: '#021F70', short: 'L1' },
};
