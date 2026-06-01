import { supabase } from './supabase';

export async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertProfile(userId, updates) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });
  return !error;
}

export async function fetchLoggedMatches(userId) {
  const { data } = await supabase
    .from('logged_matches')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });
  return data ?? null;
}

export async function insertLoggedMatch(userId, match) {
  const { error } = await supabase
    .from('logged_matches')
    .insert({ ...match, user_id: userId });
  return !error;
}

export async function fetchAchievements(userId) {
  const { data } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId);
  return data ?? null;
}

export async function upsertAchievement(userId, achievementId, unlocked) {
  const { error } = await supabase
    .from('user_achievements')
    .upsert({
      user_id: userId,
      achievement_id: achievementId,
      unlocked,
      unlocked_at: unlocked ? new Date().toISOString() : null,
    });
  return !error;
}

export async function fetchChallenge(userId) {
  const { data } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertChallenge(userId, challenge) {
  const { error } = await supabase
    .from('weekly_challenges')
    .upsert({ user_id: userId, ...challenge });
  return !error;
}
