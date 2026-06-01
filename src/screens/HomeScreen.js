import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Animated, Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../store';
import { C, COMP, W } from '../theme';
import { FRIENDS_ACTIVITY } from '../data';
import { Sound } from '../sound';

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(isoDate) {
  const d   = new Date(isoDate);
  const now = new Date();
  const diff = Math.round((d - now) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7)  return `In ${diff} days`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatPill({ label, value }) {
  return (
    <View style={s.statPill}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ChallengeCard({ challenge }) {
  const prog     = challenge.current / challenge.target;
  const progAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progAnim, { toValue: prog, tension: 40, friction: 8, useNativeDriver: false }).start();
  }, [prog]);
  const barWidth = progAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const done     = challenge.current >= challenge.target;
  return (
    <View style={[s.challengeCard, done && s.challengeCardDone]}>
      <View style={s.challengeHeader}>
        <View>
          <Text style={s.challengeEyebrow}>WEEKLY CHALLENGE</Text>
          <Text style={s.challengeTitle}>{challenge.title}</Text>
          <Text style={s.challengeSub}>{challenge.description}</Text>
        </View>
        <View style={s.challengeBadge}><Text style={s.challengeBadgeEmoji}>{challenge.badge}</Text></View>
      </View>
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width: barWidth, backgroundColor: done ? C.gold : C.accent }]}>
          <View style={s.progressShine} />
        </Animated.View>
      </View>
      <View style={s.challengeFooter}>
        <Text style={[s.challengeCount, done && { color: C.gold }]}>
          {done ? '✓ Complete!' : `${challenge.current} / ${challenge.target} logged`}
        </Text>
        <Text style={s.challengeXP}>+{challenge.xpReward} XP</Text>
      </View>
    </View>
  );
}

function FixtureRow({ match, index }) {
  const nav   = useNavigation();
  const comp  = COMP[match.competition];
  const slideIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slideIn, {
      toValue: 1, duration: 360, delay: index * 55,
      easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: slideIn, transform: [{ translateY: slideIn.interpolate({ inputRange: [0,1], outputRange: [14,0] }) }] }}>
      <TouchableOpacity style={s.fixtureRow} activeOpacity={0.72} onPress={() => nav.navigate('Log')}>
        <View style={[s.compDot, { backgroundColor: comp.color }]} />
        <View style={s.fixtureTeams}>
          <Text style={s.fixtureMatch} numberOfLines={1}>{match.homeTeam} vs {match.awayTeam}</Text>
          <Text style={s.fixtureComp}>{comp.emoji} {comp.short}</Text>
        </View>
        <View style={s.fixtureMeta}>
          <Text style={s.fixtureDate}>{fmtDate(match.date)}</Text>
          <Text style={s.fixtureArrow}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function Stars({ rating, size = 12 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(i => <Text key={i} style={{ fontSize: size, color: i <= rating ? C.star : C.starEmpty }}>★</Text>)}
    </View>
  );
}

function FeedCard({ item, index }) {
  const slideIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slideIn, { toValue: 1, duration: 380, delay: index * 70, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, []);
  const isOwn = item.type === 'own';
  return (
    <Animated.View style={{ opacity: slideIn, transform: [{ translateY: slideIn.interpolate({ inputRange:[0,1], outputRange:[12,0] }) }] }}>
      <View style={[s.feedCard, isOwn && s.feedCardOwn]}>
        <View style={s.feedCardTop}>
          <View style={[s.feedAvatar, isOwn && s.feedAvatarOwn]}>
            <Text style={[s.feedInitial, isOwn && s.feedInitialOwn]}>{isOwn ? '⚽' : item.name[0]}</Text>
          </View>
          <View style={s.feedMeta}>
            <Text style={s.feedName}>{isOwn ? 'You' : item.name}</Text>
            <Text style={s.feedTime}>{item.time || 'just now'}</Text>
          </View>
          <Stars rating={item.rating} size={16} />
        </View>
        <Text style={s.feedMatch} numberOfLines={1}>{item.match}</Text>
        {item.review ? (
          <Text style={s.feedReview} numberOfLines={3}>"{item.review}"</Text>
        ) : null}
        <View style={s.feedFooter}>
          <Text style={s.feedRatingLabel}>{item.rating}.0 / 5.0</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Dev Panel ───────────────────────────────────────────────────────────────

function DevPanel({ onReset, xp, loggedCount }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.devWrap}>
      <TouchableOpacity style={s.devToggle} onPress={() => setOpen(v => !v)} activeOpacity={0.7}>
        <Text style={s.devToggleText}>⚙️  Dev Tools</Text>
        <Text style={s.devToggleChevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={s.devPanel}>
          <View style={s.devStats}>
            <Text style={s.devStat}>XP: <Text style={s.devStatVal}>{xp}</Text></Text>
            <Text style={s.devStat}>Logged: <Text style={s.devStatVal}>{loggedCount}</Text></Text>
            <Text style={s.devStat}>Build: <Text style={s.devStatVal}>0.1.0</Text></Text>
          </View>
          <TouchableOpacity style={s.devResetBtn} onPress={onReset} activeOpacity={0.8}>
            <Text style={s.devResetText}>↺  Reset All Data</Text>
          </TouchableOpacity>
          <Text style={s.devHint}>Clears all matches, XP, and re-shows onboarding on next reload</Text>
        </View>
      )}
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const nav = useNavigation();
  const { upcoming, logged, challenge, streak, xp, reset, favoriteTeam } = useApp();

  const now            = new Date();
  const dayName        = DAYS[now.getDay()];
  const dateStr        = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const avgRating      = logged.length ? (logged.reduce((s, m) => s + m.rating, 0) / logged.length).toFixed(1) : '—';
  const futureFixtures = upcoming.filter(m => new Date(m.date) > now);
  const readyToRate    = upcoming.filter(m => new Date(m.date) <= now);

  // Community feed: own recent + friends, own first
  const ownFeed = logged.slice(0, 3).map(m => ({
    type: 'own', name: 'You',
    match: `${m.homeTeam} vs ${m.awayTeam}`,
    rating: m.rating, review: m.review, time: 'Your diary',
  }));
  const friendFeed = FRIENDS_ACTIVITY.map(f => ({ type: 'friend', ...f }));
  const feed = [...ownFeed, ...friendFeed];

  const handleReset = () => {
    Sound.tap();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    reset();
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.dayLabel}>{dayName.toUpperCase()}</Text>
            <Text style={s.dateText}>{dateStr}</Text>
            <Text style={s.tagline}>{favoriteTeam ? `⚽ ${favoriteTeam} fan` : '⚽ Your match diary'}</Text>
          </View>
          <View style={s.streakBadge}>
            <Text style={s.streakEmoji}>🔥</Text>
            <Text style={s.streakNum}>{streak}</Text>
            <Text style={s.streakLabel}>streak</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatPill label="LOGGED"     value={logged.length} />
          <View style={s.statDivider} />
          <StatPill label="AVG RATING" value={avgRating} />
          <View style={s.statDivider} />
          <StatPill label="THIS WEEK"  value={`${challenge.current}/${challenge.target}`} />
        </View>

        {/* Ready to rate nudge */}
        {readyToRate.length > 0 && (
          <TouchableOpacity style={s.rateBanner} onPress={() => nav.navigate('Log')} activeOpacity={0.8}>
            <Text style={s.rateBannerEmoji}>⭐</Text>
            <Text style={s.rateBannerText}>
              {readyToRate.length} match{readyToRate.length !== 1 ? 'es' : ''} ready to rate
            </Text>
            <Text style={s.rateBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Challenge */}
        <ChallengeCard challenge={challenge} />

        {/* Community feed */}
        {feed.length > 0 && (
          <>
            <Text style={s.sectionTitle}>RECENT REVIEWS</Text>
            {feed.map((item, i) => <FeedCard key={i} item={item} index={i} />)}
          </>
        )}

        {/* Upcoming fixtures */}
        <Text style={s.sectionTitle}>UPCOMING FIXTURES</Text>
        {futureFixtures.length === 0 ? (
          <View style={s.emptyState}><Text style={s.emptyText}>No upcoming fixtures scheduled</Text></View>
        ) : (
          futureFixtures.map((m, i) => <FixtureRow key={m.id} match={m} index={i} />)
        )}

        {/* Dev panel */}
        <DevPanel onReset={handleReset} xp={xp} loggedCount={logged.length} />

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { paddingBottom: 24 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },
  dayLabel:  { color: C.accent, fontSize: 10, fontWeight: '700', letterSpacing: 3, marginBottom: 2 },
  dateText:  { color: C.text,   fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 3 },
  tagline:   { color: C.sub,    fontSize: 13 },
  streakBadge: { alignItems: 'center', backgroundColor: C.surfaceHigh, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  streakEmoji: { fontSize: 20, marginBottom: 2 },
  streakNum:   { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -1, lineHeight: 24 },
  streakLabel: { color: C.sub, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  statsRow:    { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  statPill:    { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue:   { color: C.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  statLabel:   { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.8 },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 10 },

  rateBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 14, backgroundColor: C.goldDim, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.goldBorder },
  rateBannerEmoji: { fontSize: 18 },
  rateBannerText:  { flex: 1, color: C.gold, fontSize: 13, fontWeight: '700' },
  rateBannerArrow: { color: C.gold, fontSize: 20, lineHeight: 22 },

  challengeCard: { marginHorizontal: 20, marginBottom: 24, backgroundColor: C.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.accentBorder },
  challengeCardDone: { borderColor: C.goldBorder, backgroundColor: '#141A0A' },
  challengeHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  challengeEyebrow:  { color: C.accent, fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginBottom: 4 },
  challengeTitle:    { color: C.text,  fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 3 },
  challengeSub:      { color: C.sub,   fontSize: 12 },
  challengeBadge:    { width: 44, height: 44, borderRadius: 22, backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.goldBorder, justifyContent: 'center', alignItems: 'center' },
  challengeBadgeEmoji: { fontSize: 22 },
  progressTrack: { height: 6, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: '100%', borderRadius: 4, overflow: 'hidden' },
  progressShine: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 20, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4 },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  challengeCount:  { color: C.sub, fontSize: 12, fontWeight: '600' },
  challengeXP:     { color: C.gold, fontSize: 12, fontWeight: '700' },

  sectionTitle: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginHorizontal: 22, marginBottom: 10 },

  // Community feed
  feedCard:     { marginHorizontal: 20, marginBottom: 12, backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border },
  feedCardOwn:  { borderColor: C.accentBorder, backgroundColor: C.accentDim },
  feedCardTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  feedAvatar:   { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  feedAvatarOwn:{ backgroundColor: C.accentDim, borderColor: C.accentBorder },
  feedInitial:  { color: C.sub, fontSize: 16, fontWeight: '700' },
  feedInitialOwn:{ fontSize: 20 },
  feedMeta:     { flex: 1 },
  feedName:     { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  feedTime:     { color: C.muted, fontSize: 11 },
  feedMatch:    { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 10 },
  feedReview:   { color: C.sub, fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: 12 },
  feedFooter:   { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, marginTop: 2 },
  feedRatingLabel: { color: C.gold, fontSize: 12, fontWeight: '700' },

  // Fixtures
  fixtureRow:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  compDot:       { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  fixtureTeams:  { flex: 1 },
  fixtureMatch:  { color: C.text, fontSize: 14, fontWeight: '600', letterSpacing: -0.2, marginBottom: 3 },
  fixtureComp:   { color: C.sub, fontSize: 11 },
  fixtureMeta:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fixtureDate:   { color: C.accent, fontSize: 11, fontWeight: '600' },
  fixtureArrow:  { color: C.muted, fontSize: 18, lineHeight: 22 },

  emptyState: { marginHorizontal: 20, padding: 20, alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  emptyText:  { color: C.sub, fontSize: 13, textAlign: 'center' },

  // Dev panel
  devWrap:   { marginHorizontal: 20, marginTop: 28, marginBottom: 4 },
  devToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  devToggleText:    { flex: 1, color: C.muted, fontSize: 11, fontWeight: '600' },
  devToggleChevron: { color: C.muted, fontSize: 11 },
  devPanel:   { marginTop: 8, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 10 },
  devStats:   { flexDirection: 'row', gap: 16 },
  devStat:    { color: C.muted, fontSize: 11 },
  devStatVal: { color: C.text, fontWeight: '700' },
  devResetBtn:{ backgroundColor: C.redDim, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: C.red + '50' },
  devResetText:{ color: C.red, fontSize: 13, fontWeight: '700' },
  devHint:    { color: C.muted, fontSize: 10, lineHeight: 14 },
});
