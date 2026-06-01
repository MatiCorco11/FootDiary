import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Modal, Platform, TextInput, Pressable, Image,
  Animated, Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../store';
import { C, COMP, W } from '../theme';
import { Sound } from '../sound';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEB_INPUT = Platform.OS === 'web' ? { outline: 'none', outlineStyle: 'none' } : {};

function daysAgo(isoDate) {
  const diff = Math.round((new Date() - new Date(isoDate)) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

const RATING_LABELS = ['', 'Disappointing 😐', 'Below average 😕', 'Decent watch 👍', 'Really good ⚡', 'Absolute classic ⭐'];

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ value, onChange }) {
  const scales  = useRef([1,2,3,4,5].map(() => new Animated.Value(1))).current;
  const labelOp = useRef(new Animated.Value(0)).current;

  const tap = useCallback((star) => {
    Sound.starTap(star);
    if (star === 5) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else Haptics.selectionAsync();

    onChange(star);

    Animated.sequence([
      Animated.timing(scales[star - 1], { toValue: 1.5, duration: 80, useNativeDriver: true }),
      Animated.spring(scales[star - 1],  { toValue: 1, tension: 260, friction: 9, useNativeDriver: true }),
    ]).start();

    labelOp.setValue(0);
    Animated.timing(labelOp, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [onChange]);

  return (
    <View style={sr.wrap}>
      <View style={sr.row}>
        {[1,2,3,4,5].map(i => (
          <TouchableOpacity key={i} onPress={() => tap(i)} activeOpacity={0.7} style={sr.starBtn}>
            <Animated.Text style={[sr.star, {
              transform: [{ scale: scales[i - 1] }],
              color: i <= value ? C.star : C.starEmpty,
            }]}>★</Animated.Text>
          </TouchableOpacity>
        ))}
      </View>
      {value > 0 && (
        <Animated.Text style={[sr.label, { opacity: labelOp }]}>{RATING_LABELS[value]}</Animated.Text>
      )}
    </View>
  );
}

const sr = StyleSheet.create({
  wrap:    { alignItems: 'center', gap: 10 },
  row:     { flexDirection: 'row', gap: 6 },
  starBtn: { padding: 4 },
  star:    { fontSize: 44 },
  label:   { color: C.sub, fontSize: 14, textAlign: 'center' },
});

// ─── Particle Burst ──────────────────────────────────────────────────────────

const PCOLORS = [C.gold, C.accent, '#FF6B6B', '#A78BFA', '#fff', C.gold, C.accent, C.gold, '#fff', C.accent];

function ParticleBurst({ visible }) {
  const ps = useRef(Array.from({ length: 10 }, (_, i) => ({
    tx: new Animated.Value(0), ty: new Animated.Value(0),
    op: new Animated.Value(0), sc: new Animated.Value(0),
    angle: (i / 10) * 2 * Math.PI,
  }))).current;

  useEffect(() => {
    if (!visible) return;
    ps.forEach((p, i) => {
      const dist = 70 + (i % 3) * 20;
      p.tx.setValue(0); p.ty.setValue(0); p.op.setValue(1); p.sc.setValue(0);
      Animated.parallel([
        Animated.spring(p.sc, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
        Animated.timing(p.tx, { toValue: Math.cos(p.angle) * dist, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.ty, { toValue: Math.sin(p.angle) * dist, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([Animated.delay(320), Animated.timing(p.op, { toValue: 0, duration: 380, useNativeDriver: true })]),
      ]).start();
    });
  }, [visible]);

  if (!visible) return null;
  return (
    <View style={pb.container} pointerEvents="none">
      {ps.map((p, i) => (
        <Animated.View key={i} style={[pb.dot, {
          backgroundColor: PCOLORS[i],
          transform: [{ translateX: p.tx }, { translateY: p.ty }, { scale: p.sc }],
          opacity: p.op,
        }]} />
      ))}
    </View>
  );
}

const pb = StyleSheet.create({
  container: { position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, alignItems: 'center', justifyContent: 'center' },
  dot:       { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
});

// ─── Log Screen ───────────────────────────────────────────────────────────────

export default function LogScreen({ route }) {
  const nav              = useNavigation();
  const { upcoming, logMatch } = useApp();

  const now         = new Date();
  const readyToLog  = upcoming.filter(m => new Date(m.date) <= now);

  const [selected, setSelected]       = useState(null);
  const [rating, setRating]           = useState(0);
  const [review, setReview]           = useState('');
  const [photo, setPhoto]             = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [xpEarned, setXpEarned]       = useState(50);

  const sheetAnim    = useRef(new Animated.Value(0)).current;
  const xpAnim       = useRef(new Animated.Value(0)).current;
  const xpOpacity    = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  const openModal = (match) => {
    setSelected(match); setRating(0); setReview(''); setPhoto(null); setCelebrating(false);
    sheetAnim.setValue(0);
    Animated.spring(sheetAnim, { toValue: 1, tension: 55, friction: 11, useNativeDriver: true }).start();
    Sound.tap();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeModal = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setSelected(null));
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [16, 9], quality: 0.75,
      });
      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        Sound.photo();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}
  };

  const submitLog = useCallback(() => {
    if (!selected || rating === 0) return;
    Sound.submit();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const earned = logMatch(selected.id, rating, review, photo);
    setXpEarned(earned);
    setCelebrating(true);

    xpAnim.setValue(0); xpOpacity.setValue(1); successScale.setValue(0);
    Animated.parallel([
      Animated.timing(xpAnim, { toValue: -70, duration: 1000, useNativeDriver: true }),
      Animated.sequence([Animated.delay(600), Animated.timing(xpOpacity, { toValue: 0, duration: 400, useNativeDriver: true })]),
      Animated.spring(successScale, { toValue: 1, tension: 180, friction: 8, useNativeDriver: true }),
    ]).start();

    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 380);

    setTimeout(() => {
      Animated.timing(sheetAnim, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => {
        setSelected(null); setCelebrating(false);
        nav.navigate('Diary');
      });
    }, 1700);
  }, [selected, rating, review, photo, logMatch, nav]);

  const sheetY  = sheetAnim.interpolate({ inputRange: [0,1], outputRange: [700, 0] });
  const comp    = selected ? COMP[selected.competition] : null;
  const canSubmit = rating > 0;

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.pageTitle}>Log a Match</Text>
        <Text style={s.pageSub}>Rate games that have finished</Text>
      </View>

      {/* Match list */}
      <ScrollView style={s.scroll} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>FINISHED – READY TO RATE</Text>
        {readyToLog.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>⏳</Text>
            <Text style={s.emptyTitle}>Nothing finished yet</Text>
            <Text style={s.emptyText}>Check back after upcoming fixtures are played</Text>
          </View>
        ) : (
          readyToLog.map(m => {
            const c = COMP[m.competition];
            return (
              <TouchableOpacity key={m.id} style={s.matchCard} activeOpacity={0.76} onPress={() => openModal(m)}>
                {/* Left league stripe */}
                <View style={[s.leagueStripe, { backgroundColor: c.color }]} />
                <View style={s.matchCardBody}>
                  {/* Competition + date */}
                  <View style={s.matchCardTop}>
                    <Text style={s.matchComp}>{c.emoji} {c.name}</Text>
                    <Text style={s.matchWhen}>{daysAgo(m.date)}</Text>
                  </View>
                  {/* Teams + score */}
                  <View style={s.matchTeamsRow}>
                    <Text style={s.matchTeamHome} numberOfLines={1}>{m.homeTeam}</Text>
                    <View style={[s.matchScorePill, { borderColor: c.color + '60', backgroundColor: c.color + '18' }]}>
                      <Text style={s.matchScoreText}>{m.homeScore} – {m.awayScore}</Text>
                    </View>
                    <Text style={s.matchTeamAway} numberOfLines={1}>{m.awayTeam}</Text>
                  </View>
                </View>
                {/* Tap to rate CTA */}
                <View style={s.matchCardRight}>
                  <Text style={s.matchCardCta}>Rate</Text>
                  <Text style={s.matchCardArrow}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={!!selected} transparent animationType="none" onRequestClose={closeModal}>
        <View style={s.modalContainer}>
          <Pressable style={s.backdrop} onPress={!celebrating ? closeModal : undefined} />
          <Animated.View style={[s.sheet, { transform: [{ translateY: sheetY }] }]}>
            <View style={s.handle} />

            {/* ─ Rating form ─ */}
            {selected && !celebrating && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={s.sheetScroll}
              >
                {/* Match header */}
                <View style={[s.matchHeader, { borderColor: comp?.color + '55' }]}>
                  <View style={[s.compPill, { backgroundColor: comp?.color + '22', borderColor: comp?.color + '55' }]}>
                    <Text style={s.compPillText}>{comp?.emoji} {comp?.name}</Text>
                  </View>
                  <View style={s.vsBlock}>
                    <Text style={s.vsTeam} numberOfLines={1}>{selected.homeTeam}</Text>
                    <View style={[s.finalScoreBadge, { backgroundColor: comp?.color + '20', borderColor: comp?.color + '55' }]}>
                      <Text style={[s.finalScoreNum, { color: comp?.color || C.accent }]}>
                        {selected.homeScore} – {selected.awayScore}
                      </Text>
                    </View>
                    <Text style={[s.vsTeam, s.vsTeamRight]} numberOfLines={1}>{selected.awayTeam}</Text>
                  </View>
                  <Text style={s.matchWhenSub}>{daysAgo(selected.date)}</Text>
                </View>

                {/* Stars — main interaction */}
                <Text style={s.rateLabel}>RATE THIS MATCH</Text>
                <StarRating value={rating} onChange={setRating} />

                {/* Review */}
                <Text style={[s.fieldLabel, { marginTop: 24 }]}>SHORT REVIEW (OPTIONAL)</Text>
                <TextInput
                  style={[s.reviewInput, WEB_INPUT]}
                  value={review}
                  onChangeText={setReview}
                  placeholder="What stood out? A goal, a player, a moment..."
                  placeholderTextColor={C.muted}
                  multiline
                  maxLength={280}
                  textAlignVertical="top"
                />
                <Text style={s.charCount}>{review.length}/280</Text>

                {/* Photo upload */}
                <Text style={s.fieldLabel}>ADD A PHOTO (OPTIONAL)</Text>
                <TouchableOpacity style={s.photoBtn} onPress={pickPhoto} activeOpacity={0.78}>
                  {photo ? (
                    <View>
                      <Image source={{ uri: photo }} style={s.photoPreview} resizeMode="cover" />
                      <View style={s.photoOverlay}>
                        <Text style={s.photoChangeText}>📸 Change photo</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={s.photoPlaceholder}>
                      <Text style={s.photoPlaceholderEmoji}>📸</Text>
                      <Text style={s.photoPlaceholderTitle}>Add a photo</Text>
                      <Text style={s.photoPlaceholderSub}>Show where you watched it</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Actions */}
                <View style={s.actions}>
                  <TouchableOpacity style={s.btnCancel} onPress={closeModal} activeOpacity={0.75}>
                    <Text style={s.btnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.btnSubmit, !canSubmit && s.btnDisabled]}
                    onPress={submitLog}
                    disabled={!canSubmit}
                    activeOpacity={0.82}
                  >
                    <Text style={s.btnSubmitText}>Log Match →</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            {/* ─ Celebration ─ */}
            {selected && celebrating && (
              <View style={s.celebView}>
                <Animated.Text style={[s.celebBall, { transform: [{ scale: successScale }] }]}>⚽</Animated.Text>
                <Text style={s.celebTitle}>Logged!</Text>
                <Text style={s.celebSub} numberOfLines={1}>
                  {selected.homeTeam} {selected.homeScore} – {selected.awayScore} {selected.awayTeam}
                </Text>
                <View style={s.celebStars}>
                  {[1,2,3,4,5].map(i => <Text key={i} style={{ fontSize: 24, color: i <= rating ? C.star : C.starEmpty }}>★</Text>)}
                </View>
                <Animated.Text style={[s.xpBadge, { transform: [{ translateY: xpAnim }], opacity: xpOpacity }]}>
                  +{xpEarned} XP
                </Animated.Text>
                <ParticleBurst visible={celebrating} />
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },

  header: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pageTitle: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
  pageSub:   { color: C.sub, fontSize: 13 },

  sectionTitle: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginBottom: 12 },
  listContent:  { paddingHorizontal: 20, paddingTop: 18 },

  // Match cards in list
  matchCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 18, marginBottom: 12,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    minHeight: 80,
  },
  leagueStripe:  { width: 5, alignSelf: 'stretch' },
  matchCardBody: { flex: 1, padding: 14 },
  matchCardTop:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  matchComp:     { color: C.sub, fontSize: 11 },
  matchWhen:     { color: C.accent, fontSize: 11, fontWeight: '600' },
  matchTeamsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchTeamHome: { flex: 1, color: C.text, fontSize: 14, fontWeight: '800', textAlign: 'right', letterSpacing: -0.2 },
  matchScorePill:{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, flexShrink: 0 },
  matchScoreText:{ color: C.text, fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  matchTeamAway: { flex: 1, color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  matchCardRight:{ paddingRight: 14, alignItems: 'center' },
  matchCardCta:  { color: C.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  matchCardArrow:{ color: C.muted, fontSize: 22, lineHeight: 24 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { color: C.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyText:  { color: C.sub, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 10, maxHeight: '92%',
  },
  handle:     { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetScroll:{ paddingHorizontal: 22, paddingBottom: 8 },

  // Match header in modal
  matchHeader: { borderRadius: 18, padding: 16, marginBottom: 22, borderWidth: 1, backgroundColor: C.surfaceHigh, alignItems: 'center', gap: 12 },
  compPill:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  compPillText:{ color: C.text, fontSize: 11, fontWeight: '600' },
  vsBlock:     { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  vsTeam:      { flex: 1, color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3, textAlign: 'right' },
  vsTeamRight: { textAlign: 'left' },
  finalScoreBadge: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, borderWidth: 1, flexShrink: 0 },
  finalScoreNum:   { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  matchWhenSub:    { color: C.sub, fontSize: 11 },

  rateLabel:  { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textAlign: 'center', marginBottom: 14 },
  fieldLabel: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginBottom: 10 },

  reviewInput: {
    backgroundColor: C.surfaceHigh, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    color: C.text, fontSize: 14, lineHeight: 20,
    borderWidth: 1, borderColor: C.border,
    minHeight: 80, marginBottom: 4,
  },
  charCount: { color: C.muted, fontSize: 10, textAlign: 'right', marginBottom: 18 },

  photoBtn: { marginBottom: 20, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  photoPlaceholder: { backgroundColor: C.surfaceHigh, padding: 20, alignItems: 'center', gap: 6 },
  photoPlaceholderEmoji: { fontSize: 28 },
  photoPlaceholderTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
  photoPlaceholderSub:   { color: C.sub, fontSize: 11 },
  photoPreview:  { width: '100%', height: 140 },
  photoOverlay:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, alignItems: 'center' },
  photoChangeText: { color: C.white, fontSize: 12, fontWeight: '600' },

  actions:       { flexDirection: 'row', gap: 10 },
  btnCancel:     { flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: C.surfaceHigh, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  btnCancelText: { color: C.sub, fontSize: 15, fontWeight: '600' },
  btnSubmit:     { flex: 2, paddingVertical: 15, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center' },
  btnDisabled:   { opacity: 0.4 },
  btnSubmitText: { color: '#030E05', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

  celebView:  { alignItems: 'center', paddingVertical: 44, overflow: 'hidden', paddingHorizontal: 22 },
  celebBall:  { fontSize: 64, marginBottom: 10 },
  celebTitle: { color: C.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginBottom: 4 },
  celebSub:   { color: C.sub, fontSize: 13, marginBottom: 16 },
  celebStars: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  xpBadge:    { color: C.gold, fontSize: 22, fontWeight: '800', backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.goldBorder, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },
});
