import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Modal, Pressable, Animated, Easing,
} from 'react-native';
import { useApp } from '../store';
import { C, COMP, W } from '../theme';
import { FRIENDS_ACTIVITY } from '../data';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function Stars({ rating, size = 12 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: size, color: i <= rating ? C.star : C.starEmpty }}>★</Text>
      ))}
    </View>
  );
}

// ─── Club Modal ──────────────────────────────────────────────────────────────

function ClubModal({ club, visible, onClose }) {
  const { logged } = useApp();
  const slideX     = useRef(new Animated.Value(W)).current;
  const [following, setFollowing] = useState(false);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (visible && club) {
      slideX.setValue(W);
      Animated.spring(slideX, { toValue: 0, tension: 65, friction: 13, useNativeDriver: true }).start();
    }
  }, [visible, club]);

  const clubMatches = club ? logged.filter(m => m.homeTeam === club || m.awayTeam === club) : [];
  const avgRating   = clubMatches.length
    ? clubMatches.reduce((s, m) => s + m.rating, 0) / clubMatches.length
    : 0;
  const roundedAvg  = Math.round(avgRating * 10) / 10;

  const compMap = {};
  clubMatches.forEach(m => { compMap[m.competition] = (compMap[m.competition] || 0) + 1; });

  if (!club) return null;

  const dismiss = () => {
    Animated.timing(slideX, { toValue: W, duration: 230, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(onClose);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <View style={cm.overlay}>
        <Animated.View style={[cm.page, { transform: [{ translateX: slideX }] }]}>
          <SafeAreaView style={{ flex: 1 }}>

            {/* Header */}
            <View style={cm.header}>
              <TouchableOpacity style={cm.backBtn} onPress={dismiss} activeOpacity={0.7}>
                <Text style={cm.backArrow}>‹</Text>
                <Text style={cm.backText}>Discover</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={cm.content} showsVerticalScrollIndicator={false}>

              {/* Club hero */}
              <View style={cm.hero}>
                <View style={cm.clubAvatar}>
                  <Text style={cm.clubInitials}>{club.slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={cm.clubName}>{club}</Text>

                {clubMatches.length > 0 ? (
                  <>
                    <View style={cm.bigRatingRow}>
                      <Text style={cm.bigRatingNum}>{roundedAvg.toFixed(1)}</Text>
                      <Text style={cm.bigRatingStar}>★</Text>
                    </View>
                    <Stars rating={Math.round(avgRating)} size={20} />
                    <Text style={cm.matchCount}>{clubMatches.length} match{clubMatches.length !== 1 ? 'es' : ''} in your diary</Text>
                  </>
                ) : (
                  <Text style={cm.noMatches}>No matches logged yet</Text>
                )}

                <TouchableOpacity
                  style={[cm.followBtn, following && cm.followBtnActive]}
                  onPress={() => setFollowing(v => !v)}
                  activeOpacity={0.75}
                >
                  <Text style={[cm.followBtnText, following && cm.followBtnTextActive]}>
                    {following ? '✓ Following' : '+ Follow'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Competition breakdown */}
              {Object.keys(compMap).length > 0 && (
                <>
                  <Text style={cm.sectionTitle}>COMPETITIONS</Text>
                  <View style={cm.compRow}>
                    {Object.entries(compMap).map(([id, count]) => (
                      <View key={id} style={[cm.compChip, { borderColor: COMP[id]?.color + '60', backgroundColor: COMP[id]?.color + '18' }]}>
                        <Text style={cm.compChipText}>{COMP[id]?.emoji} {COMP[id]?.short} · {count}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Recent matches */}
              {clubMatches.length > 0 && (
                <>
                  <Text style={cm.sectionTitle}>MATCH HISTORY</Text>
                  {clubMatches.map(m => {
                    const comp   = COMP[m.competition];
                    const isHome = m.homeTeam === club;
                    return (
                      <View key={m.id} style={cm.matchCard}>
                        <View style={cm.matchCardTop}>
                          <View style={[cm.compDot, { backgroundColor: comp?.color }]} />
                          <Text style={cm.matchCardComp}>{comp?.emoji} {comp?.name}</Text>
                          <Text style={cm.matchCardDate}>{fmtDate(m.date)}</Text>
                        </View>
                        <View style={cm.matchCardTeams}>
                          <Text style={[cm.matchCardTeam, isHome && cm.matchCardTeamBold]} numberOfLines={1}>{m.homeTeam}</Text>
                          <View style={cm.matchCardScore}>
                            <Text style={cm.matchCardScoreText}>{m.homeScore} – {m.awayScore}</Text>
                          </View>
                          <Text style={[cm.matchCardTeam, cm.matchCardTeamRight, !isHome && cm.matchCardTeamBold]} numberOfLines={1}>{m.awayTeam}</Text>
                        </View>
                        <View style={cm.matchCardRating}>
                          <Stars rating={m.rating} size={13} />
                          <Text style={cm.matchCardRatingNum}>{m.rating}.0</Text>
                        </View>
                        {m.review ? <Text style={cm.matchCardReview} numberOfLines={2}>"{m.review}"</Text> : null}
                      </View>
                    );
                  })}
                </>
              )}

              {clubMatches.length === 0 && (
                <View style={cm.emptyState}>
                  <Text style={cm.emptyEmoji}>📖</Text>
                  <Text style={cm.emptyTitle}>No diary entries yet</Text>
                  <Text style={cm.emptySub}>Rate a {club} match to see it here</Text>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.bg },
  page:    { flex: 1, backgroundColor: C.bg },

  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingRight: 10 },
  backArrow: { color: C.accent, fontSize: 26, lineHeight: 28, fontWeight: '300' },
  backText:  { color: C.accent, fontSize: 15, fontWeight: '600' },

  content: { paddingBottom: 24 },

  hero:         { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 22 },
  clubAvatar:   { width: 80, height: 80, borderRadius: 40, backgroundColor: C.pitch, borderWidth: 2, borderColor: C.accentBorder, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  clubInitials: { color: C.accent, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  clubName:     { color: C.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 16, textAlign: 'center' },
  bigRatingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 8 },
  bigRatingNum: { color: C.gold, fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 54 },
  bigRatingStar:{ color: C.gold, fontSize: 32, lineHeight: 52 },
  matchCount:   { color: C.sub, fontSize: 13, marginTop: 10 },
  noMatches:    { color: C.muted, fontSize: 14, marginTop: 8 },

  followBtn:      { marginTop: 18, paddingHorizontal: 28, paddingVertical: 10, borderRadius: 22, borderWidth: 1.5, borderColor: C.accentBorder, backgroundColor: C.accentDim },
  followBtnActive:{ backgroundColor: C.accent, borderColor: C.accent },
  followBtnText:  { color: C.accent, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  followBtnTextActive: { color: '#030E05' },

  sectionTitle: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginHorizontal: 22, marginTop: 20, marginBottom: 10 },

  compRow:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 22, gap: 8, marginBottom: 4 },
  compChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  compChipText: { color: C.text, fontSize: 12, fontWeight: '600' },

  matchCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  matchCardTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  compDot:        { width: 7, height: 7, borderRadius: 4 },
  matchCardComp:  { flex: 1, color: C.sub, fontSize: 11 },
  matchCardDate:  { color: C.muted, fontSize: 11 },
  matchCardTeams: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  matchCardTeam:  { flex: 1, color: C.sub, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  matchCardTeamRight: { textAlign: 'left' },
  matchCardTeamBold:  { color: C.text, fontWeight: '800' },
  matchCardScore: { paddingHorizontal: 9, paddingVertical: 4, backgroundColor: C.surfaceHigh, borderRadius: 8, flexShrink: 0 },
  matchCardScoreText: { color: C.text, fontSize: 13, fontWeight: '800' },
  matchCardRating:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  matchCardRatingNum: { color: C.gold, fontSize: 11, fontWeight: '700' },
  matchCardReview:    { color: C.sub, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub:   { color: C.sub, fontSize: 13 },
});

// ─── Discover Screen ─────────────────────────────────────────────────────────

function LeagueCard({ id, comp }) {
  return (
    <TouchableOpacity style={[s.leagueCard, { borderColor: comp.color + '50' }]} activeOpacity={0.75}>
      <View style={[s.leagueDot, { backgroundColor: comp.color }]} />
      <Text style={s.leagueEmoji}>{comp.emoji}</Text>
      <Text style={s.leagueName}>{comp.name}</Text>
      <Text style={s.leagueChevron}>›</Text>
    </TouchableOpacity>
  );
}

function FriendRow({ activity }) {
  return (
    <View style={s.friendRow}>
      <View style={s.friendAvatar}>
        <Text style={s.friendInitial}>{activity.name[0]}</Text>
      </View>
      <View style={s.friendBody}>
        <Text style={s.friendName}>{activity.name}</Text>
        <Text style={s.friendMatch} numberOfLines={1}>rated {activity.match}</Text>
      </View>
      <View style={s.friendRight}>
        <Stars rating={activity.rating} size={11} />
        <Text style={s.friendTime}>{activity.time}</Text>
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const { logged } = useApp();
  const [selectedClub, setSelectedClub] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openClub = (name) => {
    setSelectedClub(name);
    setModalVisible(true);
  };
  const closeClub = () => setModalVisible(false);

  // All unique clubs from logged matches, sorted by avg rating
  const teamMap = {};
  logged.forEach(m => {
    [m.homeTeam, m.awayTeam].forEach(t => {
      if (!teamMap[t]) teamMap[t] = { total: 0, count: 0 };
      teamMap[t].total += m.rating;
      teamMap[t].count += 1;
    });
  });
  const allClubs = Object.entries(teamMap)
    .map(([team, { total, count }]) => ({ team, avg: total / count, count }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.pageTitle}>Discover</Text>
          <Text style={s.pageSub}>Leagues · clubs · friends</Text>
        </View>

        {/* Competitions */}
        <Text style={s.sectionTitle}>COMPETITIONS</Text>
        <View style={s.leaguesList}>
          {Object.entries(COMP).map(([id, comp]) => (
            <LeagueCard key={id} id={id} comp={comp} />
          ))}
        </View>

        {/* Clubs */}
        {allClubs.length > 0 && (
          <>
            <Text style={s.sectionTitle}>CLUBS IN YOUR DIARY</Text>
            <View style={s.card}>
              {allClubs.map(({ team, avg, count }, i) => (
                <React.Fragment key={team}>
                  <TouchableOpacity style={s.clubRow} activeOpacity={0.72} onPress={() => openClub(team)}>
                    <View style={s.clubRankBadge}>
                      <Text style={s.clubRank}>{i + 1}</Text>
                    </View>
                    <View style={s.clubBody}>
                      <Text style={s.clubName}>{team}</Text>
                      <Text style={s.clubCount}>{count} match{count !== 1 ? 'es' : ''} rated</Text>
                    </View>
                    <View style={s.clubRight}>
                      <View style={s.clubRating}>
                        <Text style={s.clubRatingNum}>{avg.toFixed(1)}</Text>
                        <Text style={s.clubRatingStar}>★</Text>
                      </View>
                      <Text style={s.clubChevron}>›</Text>
                    </View>
                  </TouchableOpacity>
                  {i < allClubs.length - 1 && <View style={s.divider} />}
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* Friends */}
        <Text style={s.sectionTitle}>FRIENDS ACTIVITY</Text>
        <View style={s.card}>
          {FRIENDS_ACTIVITY.map((a, i) => (
            <React.Fragment key={i}>
              <FriendRow activity={a} />
              {i < FRIENDS_ACTIVITY.length - 1 && <View style={s.divider} />}
            </React.Fragment>
          ))}
          <TouchableOpacity style={s.findFriendsBtn} activeOpacity={0.75}>
            <Text style={s.findFriendsText}>+ Find Friends</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <ClubModal club={selectedClub} visible={modalVisible} onClose={closeClub} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { paddingBottom: 24 },

  header: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.border },
  pageTitle: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
  pageSub:   { color: C.sub, fontSize: 13 },

  sectionTitle: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginHorizontal: 22, marginTop: 22, marginBottom: 10 },

  leaguesList: { paddingHorizontal: 20, gap: 8 },
  leagueCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    borderWidth: 1,
  },
  leagueDot:    { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  leagueEmoji:  { fontSize: 18, marginRight: 10 },
  leagueName:   { flex: 1, color: C.text, fontSize: 14, fontWeight: '600' },
  leagueChevron:{ color: C.muted, fontSize: 20, lineHeight: 22 },

  card: { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  clubRow:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  clubRankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  clubRank:      { color: C.muted, fontSize: 12, fontWeight: '700' },
  clubBody:      { flex: 1 },
  clubName:      { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  clubCount:     { color: C.sub, fontSize: 11 },
  clubRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clubRating:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clubRatingNum: { color: C.gold, fontSize: 15, fontWeight: '800' },
  clubRatingStar:{ color: C.gold, fontSize: 13 },
  clubChevron:   { color: C.muted, fontSize: 20, lineHeight: 22 },

  friendRow:    { flexDirection: 'row', alignItems: 'center', padding: 14 },
  friendAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accentBorder, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  friendInitial:{ color: C.accent, fontSize: 14, fontWeight: '700' },
  friendBody:   { flex: 1 },
  friendName:   { color: C.text, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  friendMatch:  { color: C.sub, fontSize: 11 },
  friendRight:  { alignItems: 'flex-end', gap: 4 },
  friendTime:   { color: C.muted, fontSize: 10 },

  findFriendsBtn: { margin: 14, paddingVertical: 11, borderRadius: 11, borderWidth: 1, borderColor: C.accentBorder, alignItems: 'center' },
  findFriendsText:{ color: C.accent, fontSize: 13, fontWeight: '700' },
});
