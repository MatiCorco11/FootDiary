import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useApp } from '../store';
import { C, COMP } from '../theme';

const XP_PER_LEVEL = 500;
const LEVEL_NAMES  = ['Casual Fan', 'Regular', 'Enthusiast', 'Ultra', 'Legend'];

function Stars({ rating, size = 12 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: size, color: i <= rating ? C.star : C.starEmpty }}>★</Text>
      ))}
    </View>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function AchievementBubble({ achv }) {
  return (
    <View style={[s.achvBubble, achv.unlocked ? s.achvUnlocked : s.achvLocked]}>
      <Text style={[s.achvEmoji, !achv.unlocked && s.achvEmojiLocked]}>{achv.emoji}</Text>
      <Text style={[s.achvTitle, !achv.unlocked && s.achvTitleLocked]} numberOfLines={1}>{achv.title}</Text>
      <Text style={s.achvXP}>+{achv.xp} XP</Text>
    </View>
  );
}

function WeekDot({ active, logged }) {
  return (
    <View style={[s.weekDot, active && s.weekDotActive, logged && s.weekDotLogged]}>
      {logged && <Text style={s.weekDotCheck}>✓</Text>}
    </View>
  );
}

export default function ProfileScreen() {
  const { logged, challenge, achievements, xp, streak, signOut } = useApp();

  const level      = Math.min(Math.floor(xp / XP_PER_LEVEL), LEVEL_NAMES.length - 1);
  const levelName  = LEVEL_NAMES[level];
  const xpInLevel  = xp % XP_PER_LEVEL;
  const levelProg  = xpInLevel / XP_PER_LEVEL;

  const avgRating  = logged.length
    ? (logged.reduce((s, m) => s + m.rating, 0) / logged.length).toFixed(1)
    : '—';
  const reviewCount = logged.filter(m => m.review).length;

  // League breakdown
  const leagueCounts = {};
  logged.forEach(m => {
    leagueCounts[m.competition] = (leagueCounts[m.competition] || 0) + 1;
  });
  const topLeague = Object.entries(leagueCounts).sort((a, b) => b[1] - a[1])[0];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Week activity mock (last 7 days)
  const week = Array.from({ length: 7 }, (_, i) => {
    const today  = new Date();
    const day    = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const dayStr = ['S','M','T','W','T','F','S'][day.getDay()];
    const isToday = i === 6;
    const hasLog = logged.some(m => {
      const ld = new Date(m.loggedAt || m.date);
      return ld.toDateString() === day.toDateString();
    });
    return { label: dayStr, isToday, hasLog };
  });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={s.profileHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>⚽</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>You</Text>
            <View style={s.levelRow}>
              <View style={s.levelBadge}><Text style={s.levelBadgeText}>Lv. {level + 1}</Text></View>
              <Text style={s.levelName}>{levelName}</Text>
            </View>
            <Text style={s.xpText}>{xp.toLocaleString()} XP total</Text>
          </View>
          <View style={s.streakBox}>
            <Text style={s.streakFire}>🔥</Text>
            <Text style={s.streakNum}>{streak}</Text>
            <Text style={s.streakLabel}>streak</Text>
          </View>
        </View>

        {/* XP bar */}
        <View style={s.xpSection}>
          <View style={s.xpBarTrack}>
            <View style={[s.xpBarFill, { width: `${Math.round(levelProg * 100)}%` }]} />
          </View>
          <Text style={s.xpProgress}>{xpInLevel} / {XP_PER_LEVEL} XP to Level {level + 2}</Text>
        </View>

        {/* Stats */}
        <Text style={s.sectionTitle}>STATS</Text>
        <View style={s.statsGrid}>
          <StatCard label="Matches Logged"    value={logged.length} />
          <StatCard label="Avg Rating"        value={`${avgRating} ★`} />
          <StatCard label="Reviews Written"   value={reviewCount} />
          <StatCard label="Achievements"      value={`${unlockedCount}/${achievements.length}`} />
        </View>

        {/* Weekly activity */}
        <Text style={s.sectionTitle}>THIS WEEK</Text>
        <View style={s.weekCard}>
          <View style={s.weekRow}>
            {week.map((d, i) => (
              <View key={i} style={s.weekCol}>
                <Text style={[s.weekLabel, d.isToday && s.weekLabelActive]}>{d.label}</Text>
                <WeekDot active={d.isToday} logged={d.hasLog} />
              </View>
            ))}
          </View>
          <View style={s.weekChallengeRow}>
            <Text style={s.weekChallengeText}>
              Weekly challenge: {challenge.current}/{challenge.target} matches logged
            </Text>
            <Text style={s.weekChallengeXP}>+{challenge.xpReward} XP</Text>
          </View>
        </View>

        {/* Top league */}
        {topLeague && (
          <View style={s.topLeagueBanner}>
            <Text style={s.topLeagueEmoji}>{COMP[topLeague[0]]?.emoji}</Text>
            <View>
              <Text style={s.topLeagueLabel}>FAVOURITE LEAGUE</Text>
              <Text style={s.topLeagueName}>{COMP[topLeague[0]]?.name}</Text>
            </View>
            <Text style={s.topLeagueCount}>{topLeague[1]} rated</Text>
          </View>
        )}

        {/* Achievements */}
        <Text style={s.sectionTitle}>ACHIEVEMENTS</Text>
        <View style={s.achvGrid}>
          {achievements.map(a => (
            <AchievementBubble key={a.id} achv={a} />
          ))}
        </View>

        <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.75}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { paddingBottom: 24 },

  profileHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 16, paddingBottom: 18,
    borderBottomWidth: 1, borderBottomColor: C.border, gap: 14,
  },
  avatar:     { width: 60, height: 60, borderRadius: 30, backgroundColor: C.pitch, borderWidth: 2, borderColor: C.accentBorder, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28 },
  profileInfo:{ flex: 1 },
  profileName:{ color: C.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 5 },
  levelRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  levelBadge: { backgroundColor: C.accentDim, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: C.accentBorder },
  levelBadgeText: { color: C.accent, fontSize: 10, fontWeight: '700' },
  levelName:  { color: C.sub, fontSize: 12 },
  xpText:     { color: C.muted, fontSize: 11 },
  streakBox:  { alignItems: 'center', backgroundColor: C.surfaceHigh, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  streakFire: { fontSize: 18, marginBottom: 2 },
  streakNum:  { color: C.text, fontSize: 20, fontWeight: '800', lineHeight: 22 },
  streakLabel:{ color: C.sub, fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },

  xpSection: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4 },
  xpBarTrack:{ height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  xpBarFill: { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
  xpProgress:{ color: C.sub, fontSize: 11 },

  sectionTitle: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginHorizontal: 22, marginTop: 22, marginBottom: 10 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, gap: 8 },
  statCard:  { flex: 1, minWidth: '44%', backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  statValue: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  statLabel: { color: C.sub, fontSize: 11, fontWeight: '600', textAlign: 'center' },

  weekCard: { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
  weekRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  weekCol:  { alignItems: 'center', gap: 6 },
  weekLabel:{ color: C.muted, fontSize: 11, fontWeight: '600' },
  weekLabelActive: { color: C.accent },
  weekDot:  { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  weekDotActive: { borderColor: C.accentBorder },
  weekDotLogged: { backgroundColor: C.accentDim, borderColor: C.accent },
  weekDotCheck:  { color: C.accent, fontSize: 13, fontWeight: '800' },
  weekChallengeRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  weekChallengeText: { color: C.sub, fontSize: 12, flex: 1 },
  weekChallengeXP:   { color: C.gold, fontSize: 12, fontWeight: '700' },

  topLeagueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: C.goldDim, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.goldBorder,
  },
  topLeagueEmoji:  { fontSize: 28 },
  topLeagueLabel:  { color: C.gold, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  topLeagueName:   { color: C.text, fontSize: 14, fontWeight: '700' },
  topLeagueCount:  { marginLeft: 'auto', color: C.gold, fontSize: 12, fontWeight: '600' },

  achvGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  achvBubble: { width: '30%', aspectRatio: 0.9, borderRadius: 16, padding: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, gap: 4 },
  achvUnlocked: { backgroundColor: C.goldDim, borderColor: C.goldBorder },
  achvLocked:   { backgroundColor: C.surface, borderColor: C.border },
  achvEmoji:    { fontSize: 24 },
  achvEmojiLocked: { opacity: 0.3 },
  achvTitle:    { color: C.text, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  achvTitleLocked: { color: C.muted },
  achvXP:       { color: C.gold, fontSize: 9, fontWeight: '700' },

  signOutBtn: { marginHorizontal: 20, marginTop: 28, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  signOutText:{ color: C.sub, fontSize: 14, fontWeight: '600' },
});
