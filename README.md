# Kickoff ⚽

A personal football match diary — Letterboxd for soccer. Rate every game you watch, write short reviews, track your streak, and earn XP as you build your diary.

Built with React Native + Expo (SDK 54), targeting iOS, Android, and web.

---

## Features

- **Log matches** — rate finished games with 1–5 stars and an optional review
- **Photo memories** — attach a photo to capture where you watched
- **XP & levelling** — earn XP for every log (+50 base, +25 for 5-star, +25 for review, +10 for photo)
- **Weekly challenge** — log 5 matches in a week to unlock the Match Week achievement
- **Achievements** — 8 unlockable badges (First Whistle, Hat-Trick, Five Star Fan, and more)
- **Diary** — filterable list of all your logged matches by competition
- **Discover** — browse competitions, clubs sorted by your avg rating, and friends activity
- **Profile** — XP progress bar, stats grid, weekly activity dots, favourite league banner
- **Haptics & sounds** — every interaction has tactile and audio feedback (web: Web Audio API tones)
- **Onboarding** — 3-step flow: welcome → pick your club → feature overview

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native 0.81.5 / Expo SDK 54 |
| Navigation | React Navigation — Bottom Tabs |
| State | React Context (`AppProvider` / `useApp`) |
| Animations | `Animated` API (spring + timing) |
| Haptics | `expo-haptics` |
| Image picker | `expo-image-picker` |
| Audio (web) | Web Audio API |
| Architecture | New Architecture enabled (`newArchEnabled: true`) |

---

## Getting Started

```bash
npm install

# Web (recommended for development)
npx expo start --web --port 8082

# iOS
npm run ios

# Android
npm run android
```

The web app runs at `http://localhost:8082` by default. If the port is taken, Expo will prompt for the next available one.

---

## Project Structure

```
App.js                     # Navigation root, AchievementBanner overlay, onboarding gate
src/
  theme.js                 # Design tokens (C palette) + competition metadata (COMP)
  data.js                  # Mock data: upcoming fixtures, logged matches, achievements, teams
  store.js                 # AppProvider / useApp context — all app state + logMatch()
  sound.js                 # Web Audio API tones (platform-guarded)
  screens/
    OnboardingScreen.js    # 3-step onboarding flow
    HomeScreen.js          # Feed, challenge card, upcoming fixtures, dev panel
    DiaryScreen.js         # Filterable logged match list
    LogScreen.js           # Rate finished matches — bottom-sheet modal + celebration
    DiscoverScreen.js      # Competitions, clubs, friends activity + ClubModal
    ProfileScreen.js       # XP bar, stats, weekly dots, achievements grid
```

---

## Design System

Dark pitch-green palette:

| Token | Value |
|---|---|
| `bg` | `#060E08` |
| `accent` | `#2EDB6A` |
| `gold` | `#F5C518` |
| `text` | `#E6F2E8` |
| `surface` | `#0D1A10` |

Supported competitions: Premier League, Champions League, La Liga, Bundesliga, Serie A, Ligue 1.

---

## Gamification

- **+50 XP** per match logged
- **+25 XP** bonus for a 5-star rating
- **+25 XP** bonus for writing a review
- **+10 XP** bonus for attaching a photo
- **+500 XP** for completing the weekly challenge (log 5 matches)
- 5 levels: Casual Fan → Regular → Enthusiast → Ultra → Legend (500 XP each)
