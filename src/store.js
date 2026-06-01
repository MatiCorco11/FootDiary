import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  INITIAL_UPCOMING, INITIAL_CHALLENGE, INITIAL_ACHIEVEMENTS,
} from './data';
import { supabase } from './lib/supabase';
import { saveToCache, loadFromCache, clearCache } from './lib/cache';
import {
  fetchProfile, upsertProfile,
  fetchLoggedMatches, insertLoggedMatch,
  fetchAchievements, upsertAchievement,
  fetchChallenge, upsertChallenge,
} from './lib/db';

const AppContext = createContext(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekStart() {
  const d      = new Date();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
  return monday.toISOString().split('T')[0];
}

function mapDbMatchToLocal(row) {
  return {
    id:          row.id,
    homeTeam:    row.home_team,
    awayTeam:    row.away_team,
    competition: row.competition,
    date:        row.date,
    homeScore:   row.home_score,
    awayScore:   row.away_score,
    rating:      row.rating,
    review:      row.review,
    photo:       row.photo_url,
    status:      'logged',
    isWatched:   true,
    loggedAt:    row.logged_at,
  };
}

function mapLocalMatchToDb(userId, match) {
  return {
    id:          match.id,
    user_id:     userId,
    home_team:   match.homeTeam,
    away_team:   match.awayTeam,
    competition: match.competition,
    date:        match.date,
    home_score:  match.homeScore,
    away_score:  match.awayScore,
    rating:      match.rating,
    review:      match.review  || null,
    photo_url:   match.photo   || null,
    logged_at:   match.loggedAt,
  };
}

function mergeAchievements(dbRows) {
  return INITIAL_ACHIEVEMENTS.map(a => {
    const row = dbRows?.find(r => r.achievement_id === a.id);
    return row ? { ...a, unlocked: row.unlocked } : a;
  });
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  // Auth
  const [session, setSession]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App data
  const [upcoming, setUpcoming]         = useState(INITIAL_UPCOMING);
  const [logged, setLogged]             = useState([]);
  const [challenge, setChallenge]       = useState(INITIAL_CHALLENGE);
  const [achievements, setAchievements] = useState(INITIAL_ACHIEVEMENTS);
  const [xp, setXp]                     = useState(0);
  const [streak, setStreak]             = useState(0);
  const [pendingAchievement, setPending]= useState(null);
  const [favoriteTeam, setFavoriteTeamState] = useState('');

  const userIdRef = useRef(null);

  // ─── Auth bootstrap ────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        userIdRef.current = session.user.id;
        loadUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        userIdRef.current = session.user.id;
        loadUserData(session.user.id);
      } else {
        userIdRef.current = null;
        resetLocalState();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Data loading ──────────────────────────────────────────────────────────

  const resetLocalState = () => {
    setUpcoming(INITIAL_UPCOMING);
    setLogged([]);
    setChallenge(INITIAL_CHALLENGE);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setXp(0);
    setStreak(0);
    setPending(null);
    setFavoriteTeamState('');
  };

  const applyData = (data) => {
    if (data.logged       != null) setLogged(data.logged);
    if (data.achievements != null) setAchievements(data.achievements);
    if (data.xp           != null) setXp(data.xp);
    if (data.streak       != null) setStreak(data.streak);
    if (data.favoriteTeam != null) setFavoriteTeamState(data.favoriteTeam);
    if (data.challenge    != null) {
      const weekStart = getWeekStart();
      setChallenge(prev => ({
        ...prev,
        current: data.challenge.week_start === weekStart ? data.challenge.current : 0,
      }));
    }
  };

  const loadUserData = async (userId) => {
    // Step 1 — cache-first: render immediately with stored data
    const cached = await loadFromCache(`userdata_${userId}`);
    if (cached) applyData(cached);

    // Step 2 — background Supabase sync
    try {
      const [profile, dbMatches, dbAchievements, dbChallenge] = await Promise.all([
        fetchProfile(userId),
        fetchLoggedMatches(userId),
        fetchAchievements(userId),
        fetchChallenge(userId),
      ]);

      const fresh = {
        logged:       dbMatches      ? dbMatches.map(mapDbMatchToLocal)  : (cached?.logged       ?? []),
        achievements: dbAchievements ? mergeAchievements(dbAchievements) : (cached?.achievements ?? INITIAL_ACHIEVEMENTS),
        xp:           profile?.xp            ?? (cached?.xp           ?? 0),
        streak:       profile?.streak         ?? (cached?.streak        ?? 0),
        favoriteTeam: profile?.favorite_team  ?? (cached?.favoriteTeam ?? ''),
        challenge:    dbChallenge             ?? cached?.challenge,
      };

      applyData(fresh);
      await saveToCache(`userdata_${userId}`, fresh);
    } catch (_) {
      // Network unavailable — cached data stays on screen
    }
  };

  // ─── Auth actions ──────────────────────────────────────────────────────────

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ?? null;
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ?? null;
  }, []);

  const signOut = useCallback(async () => {
    const userId = userIdRef.current;
    await supabase.auth.signOut();
    if (userId) await clearCache(`userdata_${userId}`);
    try { localStorage.removeItem('kickoff_onboarded'); } catch (_) {}
  }, []);

  // ─── App actions ───────────────────────────────────────────────────────────

  const setFavoriteTeam = useCallback((team) => {
    setFavoriteTeamState(team);
    const userId = userIdRef.current;
    if (!userId) return;
    upsertProfile(userId, { favorite_team: team }).catch(() => {});
    loadFromCache(`userdata_${userId}`).then(cached => {
      if (cached) saveToCache(`userdata_${userId}`, { ...cached, favoriteTeam: team });
    });
  }, []);

  const logMatch = useCallback((matchId, rating, review, photo) => {
    const src = upcoming.find(m => m.id === matchId);
    if (!src) return 0;

    const entry = {
      ...src,
      rating,
      review:    review?.trim() || null,
      photo:     photo || null,
      status:    'logged',
      isWatched: true,
      loggedAt:  new Date().toISOString(),
    };

    const xpEarned  = 50 + (rating >= 5 ? 25 : 0) + (review?.trim() ? 25 : 0) + (photo ? 10 : 0);
    const newXp     = xp + xpEarned;
    const newCurrent = Math.min(challenge.current + 1, challenge.target);
    const achv      = newCurrent >= challenge.target
      ? achievements.find(a => a.id === 'a8' && !a.unlocked)
      : null;
    const finalXp   = achv ? newXp + challenge.xpReward : newXp;

    // Optimistic update — synchronous, no perceived latency
    setUpcoming(prev => prev.filter(m => m.id !== matchId));
    setLogged(prev => [entry, ...prev]);
    setXp(finalXp);
    setChallenge(prev => ({ ...prev, current: newCurrent }));
    if (achv) {
      const unlocked = { ...achv, unlocked: true };
      setAchievements(prev => prev.map(a => a.id === 'a8' ? unlocked : a));
      setPending(unlocked);
    }

    // Background: write to DB + update cache
    const userId = userIdRef.current;
    if (userId) {
      const weekStart = getWeekStart();

      Promise.all([
        insertLoggedMatch(userId, mapLocalMatchToDb(userId, entry)),
        upsertProfile(userId, { xp: finalXp }),
        upsertChallenge(userId, {
          current:    newCurrent,
          completed:  newCurrent >= challenge.target,
          week_start: weekStart,
        }),
        achv ? upsertAchievement(userId, 'a8', true) : Promise.resolve(),
      ]).catch(() => {});

      loadFromCache(`userdata_${userId}`).then(cached => {
        if (!cached) return;
        saveToCache(`userdata_${userId}`, {
          ...cached,
          logged:       [entry, ...(cached.logged ?? [])],
          xp:           finalXp,
          challenge:    { ...(cached.challenge ?? {}), current: newCurrent, week_start: weekStart },
          achievements: (cached.achievements ?? INITIAL_ACHIEVEMENTS).map(a =>
            achv && a.id === 'a8' ? { ...a, unlocked: true } : a
          ),
        });
      });
    }

    return xpEarned;
  }, [upcoming, challenge, achievements, xp]);

  const dismissAchievement = useCallback(() => setPending(null), []);

  const reset = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <AppContext.Provider value={{
      session, authLoading, signIn, signUp, signOut,
      upcoming, logged, challenge, achievements, xp, streak,
      pendingAchievement, favoriteTeam,
      logMatch, dismissAchievement, reset, setFavoriteTeam,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
