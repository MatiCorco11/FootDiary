# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server for web (use an available port)
npx expo start --web --port 8082

# Run on specific platform
npm run ios
npm run android
npm run web
```

No lint or test scripts are configured. Web runs at `http://localhost:808X` — if port is taken, Expo will prompt for the next one.

## Architecture

This is a React Native / Expo app (SDK 54, React 19, RN 0.81.5) — a football/soccer match diary (Letterboxd for soccer). New Architecture enabled (`newArchEnabled: true` in `app.json`).

**Navigation:** React Navigation bottom tabs (`@react-navigation/bottom-tabs`) with 5 tabs: Home, Diary, Log, Discover, Profile.

**File structure:**
- `App.js` — navigation root (`Tab.Navigator`), `AchievementBanner` overlay, wraps everything in `AppProvider`. Handles onboarding gate via `localStorage` (`kickoff_onboarded` key).
- `src/theme.js` — design token palette (`C`) and competition metadata (`COMP`). Dark pitch-green palette: `bg: '#060E08'`, `accent: '#2EDB6A'`, `gold: '#F5C518'`. Exports `W`, `H` from `Dimensions`.
- `src/data.js` — mock data: `INITIAL_UPCOMING` (past-dated with scores + future without), `INITIAL_LOGGED` (5 pre-rated), `INITIAL_CHALLENGE`, `INITIAL_ACHIEVEMENTS` (8, 3 pre-unlocked), `FRIENDS_ACTIVITY` (3 entries), `TEAMS` (24 clubs for onboarding).
- `src/store.js` — `AppProvider` / `useApp` React Context. State: `upcoming`, `logged`, `challenge`, `achievements`, `xp` (starts 850), `streak` (4), `pendingAchievement`, `favoriteTeam`. `reset()` restores all initial state and removes `kickoff_onboarded` from localStorage.
- `src/sound.js` — Web Audio API tones (web-only, `Platform.OS === 'web'` guard). `Sound.starTap(n)`, `Sound.submit()`, `Sound.achievement()`, `Sound.tap()`, `Sound.photo()`.
- `src/screens/OnboardingScreen.js` — 3-step onboarding: welcome with animated ⚽, team picker grid (24 clubs), feature list. Cross-fade between steps. Calls `onComplete(selectedTeam)`.
- `src/screens/HomeScreen.js` — community feed (own recent logged + FRIENDS_ACTIVITY merged), weekly challenge card with animated progress bar, upcoming fixtures (future only), "ready to rate" gold banner, DevPanel (collapsible reset tool at bottom).
- `src/screens/DiaryScreen.js` — filterable list of logged/rated matches. `DiaryCard` shows optional photo banner (140px), competition badge, teams+score, stars, review. Filter strip: All/PL/UCL/LaLiga/BL/SA/L1.
- `src/screens/LogScreen.js` — only shows matches where `new Date(m.date) <= now` (finished games only). Match cards with league color stripe. Modal slides up from bottom with star rating, optional review, optional photo upload via `expo-image-picker`. Celebration animation on submit (XP float + particle burst).
- `src/screens/DiscoverScreen.js` — competitions grid, clubs derived from `logged` sorted by avg rating (tappable → `ClubModal`), friends activity. `ClubModal` is a full-screen slide-in (from right) with club hero, avg rating, follow toggle, competition breakdown chips, match history.
- `src/screens/ProfileScreen.js` — XP/level bar (500 XP/level, 5 levels: Casual Fan → Legend), stats grid (Matches Logged / Avg Rating / Reviews Written / Achievements), weekly activity dots, top league banner, achievements grid.

**State pattern:** `logMatch(matchId, rating, review, photo)` removes match from `upcoming`, adds to `logged`, computes XP (+50 base, +25 for 5-star, +25 for review, +10 for photo), updates challenge, fires `pendingAchievement` if challenge completes.

**Animation pattern:** every animated value created with `useRef(new Animated.Value)`, driven by `Animated.spring` / `Animated.timing`. `useNativeDriver: true` for transform/opacity; `useNativeDriver: false` for color/backgroundColor/width.

**Haptics:** `expo-haptics` — `selectionAsync()` on star taps, `impactAsync(Heavy)` on 5th star, `notificationAsync(Success)` on match submit, triple-heavy burst on achievement unlock.

**Gamification:**
- XP: +50 per match logged, +25 bonus for 5-star, +25 bonus for review, +10 bonus for photo
- Weekly challenge: log 5 matches → unlock "Match Week" achievement (+500 XP)
- `pendingAchievement` drives the `AchievementBanner` slide-in in `App.js`

**Styling:** each file has its own local `StyleSheet.create` block (named `s`; `cm` for ClubModal). No styled-components or Tailwind. Design tokens imported from `src/theme.js`.

**Web-specific:** `Platform.OS === 'web'` guard for audio. TextInputs use `outline: 'none', outlineStyle: 'none'` to suppress browser default focus rings. Web deps: `react-dom`, `react-native-web`, `@expo/metro-config`.

## Key invariants

- **React Rules of Hooks:** All hooks must be called unconditionally before any `if (...) return null` guards. In `ClubModal`, `useEffect` and `useState` are called first; null-safe computed values use `club ? ... : []`; the null guard comes last before the JSX.
- **Log tab only shows finished matches:** `upcoming.filter(m => new Date(m.date) <= now)` — future matches are never loggable.
- **Scores are read-only facts:** scores come from `data.js` and are displayed, never edited by the user.
- **Modal backdrop:** uses `StyleSheet.absoluteFillObject` with `backgroundColor: 'rgba(0,0,0,0.72)'` for the rating modal.
