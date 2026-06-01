import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Animated, Easing, Image,
} from 'react-native';
import { useApp } from '../store';
import { C, COMP, W } from '../theme';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function Stars({ rating, size = 13 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: size, color: i <= rating ? C.star : C.starEmpty }}>★</Text>
      ))}
    </View>
  );
}

function DiaryCard({ match, index }) {
  const comp    = COMP[match.competition];
  const slideIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideIn, {
      toValue: 1, duration: 380, delay: index * 60,
      easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  }, []);

  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <Animated.View style={{
      opacity: slideIn,
      transform: [{ translateY: slideIn.interpolate({ inputRange: [0,1], outputRange: [16,0] }) }],
    }}>
      <View style={s.card}>

        {/* Photo banner */}
        {match.photo && (
          <Image source={{ uri: match.photo }} style={s.cardPhoto} resizeMode="cover" />
        )}

        {/* Competition + date */}
        <View style={s.cardMeta}>
          <View style={[s.compBadge, { backgroundColor: comp.color + '25', borderColor: comp.color + '60' }]}>
            <Text style={s.compText}>{comp.emoji} {comp.short}</Text>
          </View>
          <Text style={s.cardDate}>{formatDate(match.date)}</Text>
        </View>

        {/* Teams + score */}
        <View style={s.teamsRow}>
          <Text style={s.teamName} numberOfLines={1}>{match.homeTeam}</Text>
          {hasScore ? (
            <View style={s.scoreBox}>
              <Text style={s.scoreText}>{match.homeScore} – {match.awayScore}</Text>
            </View>
          ) : (
            <Text style={s.vs}>vs</Text>
          )}
          <Text style={[s.teamName, s.teamNameRight]} numberOfLines={1}>{match.awayTeam}</Text>
        </View>

        {/* Rating */}
        <View style={s.ratingRow}>
          <Stars rating={match.rating} size={15} />
          <Text style={s.ratingNum}>{match.rating}.0</Text>
          {match.photo && <Text style={s.photoTag}>📸</Text>}
        </View>

        {/* Review */}
        {match.review ? (
          <Text style={s.review} numberOfLines={2}>"{match.review}"</Text>
        ) : null}

      </View>
    </Animated.View>
  );
}

const FILTERS = ['All', 'pl', 'ucl', 'laliga', 'bundesliga', 'seriea', 'ligue1'];
const FILTER_LABELS = { All: 'All', pl: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 PL', ucl: '⭐ UCL', laliga: '🇪🇸 LaLiga', bundesliga: '🇩🇪 BL', seriea: '🇮🇹 SA', ligue1: '🇫🇷 L1' };

export default function DiaryScreen() {
  const { logged } = useApp();
  const [filter, setFilter] = useState('All');

  const filtered  = filter === 'All' ? logged : logged.filter(m => m.competition === filter);
  const avgRating = logged.length
    ? (logged.reduce((s, m) => s + m.rating, 0) / logged.length).toFixed(1)
    : '—';

  return (
    <SafeAreaView style={s.safe}>

      <View style={s.header}>
        <View>
          <Text style={s.pageTitle}>My Diary</Text>
          <Text style={s.pageSub}>{logged.length} matches · avg {avgRating} ★</Text>
        </View>
        <View style={s.watchedBadge}>
          <Text style={s.watchedEmoji}>📖</Text>
          <Text style={s.watchedNum}>{logged.length}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterPill, filter === f && s.filterPillActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{FILTER_LABELS[f]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.scroll} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>🎬</Text>
            <Text style={s.emptyTitle}>Nothing logged yet</Text>
            <Text style={s.emptyText}>Head to the Log tab to rate your first match</Text>
          </View>
        ) : (
          filtered.map((m, i) => <DiaryCard key={m.id} match={m} index={i} />)
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pageTitle:  { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
  pageSub:    { color: C.sub, fontSize: 13 },
  watchedBadge: { alignItems: 'center', backgroundColor: C.surfaceHigh, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  watchedEmoji: { fontSize: 20, marginBottom: 2 },
  watchedNum:   { color: C.text, fontSize: 18, fontWeight: '800' },

  filterScroll:  { maxHeight: 48, flexGrow: 0 },
  filterContent: { paddingHorizontal: 18, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  filterPill:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterPillActive: { backgroundColor: C.accentDim, borderColor: C.accentBorder },
  filterText:    { color: C.sub, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: C.accent },

  listContent: { paddingHorizontal: 18, paddingTop: 14 },

  card: { backgroundColor: C.surface, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardPhoto:  { width: '100%', height: 140 },
  cardMeta:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 14, marginBottom: 12 },
  compBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  compText:   { color: C.text, fontSize: 11, fontWeight: '600' },
  cardDate:   { color: C.sub, fontSize: 11 },

  teamsRow:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12 },
  teamName:     { flex: 1, color: C.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  teamNameRight:{ textAlign: 'right' },
  scoreBox:     { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.surfaceHigh, borderRadius: 8, marginHorizontal: 8 },
  scoreText:    { color: C.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.5 },
  vs:           { color: C.muted, fontSize: 13, fontWeight: '600', marginHorizontal: 8 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8 },
  ratingNum: { color: C.gold, fontSize: 12, fontWeight: '700' },
  photoTag:  { fontSize: 12, marginLeft: 4 },

  review: { color: C.sub, fontSize: 12, lineHeight: 18, fontStyle: 'italic', marginHorizontal: 16, marginBottom: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: C.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyText:  { color: C.sub, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
