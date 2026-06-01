import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Animated, Easing, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C } from '../theme';
import { TEAMS } from '../data';
import { Sound } from '../sound';

const { width: W } = Dimensions.get('window');

const FEATURES = [
  { emoji: '⚽', title: 'Log matches',      sub: 'Every game you watch goes in your diary' },
  { emoji: '⭐', title: 'Rate & review',    sub: 'Star ratings and short reviews, just like Letterboxd' },
  { emoji: '🏆', title: 'Earn rewards',     sub: 'XP, achievements, and weekly challenges keep it fun' },
  { emoji: '📸', title: 'Add a photo',      sub: 'Capture where you watched — pub, stadium, sofa' },
];

function FeaturePill({ item, delay }) {
  const slideIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slideIn, {
      toValue: 1, duration: 400, delay,
      easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[s.featurePill, { opacity: slideIn, transform: [{ translateX: slideIn.interpolate({ inputRange: [0,1], outputRange: [-20,0] }) }] }]}>
      <View style={s.featureIcon}><Text style={s.featureEmoji}>{item.emoji}</Text></View>
      <View style={s.featureBody}>
        <Text style={s.featureTitle}>{item.title}</Text>
        <Text style={s.featureSub}>{item.sub}</Text>
      </View>
    </Animated.View>
  );
}

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep]               = useState(0);
  const [selectedTeam, setSelectedTeam] = useState('');
  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const ballScale  = useRef(new Animated.Value(0.8)).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(ballScale,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(ballOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const goToStep = (next) => {
    Sound.tap();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    });
  };

  const finish = () => {
    Sound.submit();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      onComplete(selectedTeam);
    });
  };

  return (
    <SafeAreaView style={s.safe}>

      {/* Progress dots */}
      <View style={s.dots}>
        {[0,1,2].map(i => (
          <View key={i} style={[s.dot, step === i && s.dotActive]} />
        ))}
      </View>

      <Animated.View style={[s.content, { opacity: fadeAnim }]}>

        {/* ── Step 0: Welcome ────────────────────────────────────────────── */}
        {step === 0 && (
          <View style={s.step}>
            <Animated.Text style={[s.ball, { transform: [{ scale: ballScale }], opacity: ballOpacity }]}>
              ⚽
            </Animated.Text>
            <Text style={s.welcomeTitle}>Kickoff</Text>
            <Text style={s.welcomeSub}>Your personal football diary</Text>
            <Text style={s.welcomeBody}>
              Rate every match you watch. Build your diary. Track your streak. Discover what you love about the game.
            </Text>
            <TouchableOpacity style={s.btnPrimary} onPress={() => goToStep(1)} activeOpacity={0.82}>
              <Text style={s.btnPrimaryText}>Get Started →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 1: Pick your team ─────────────────────────────────────── */}
        {step === 1 && (
          <View style={s.step}>
            <Text style={s.stepTitle}>Who do you support?</Text>
            <Text style={s.stepSub}>Pick your club — it'll personalise your experience</Text>
            <ScrollView style={s.teamScroll} contentContainerStyle={s.teamGrid} showsVerticalScrollIndicator={false}>
              {TEAMS.map(team => (
                <TouchableOpacity
                  key={team}
                  style={[s.teamChip, selectedTeam === team && s.teamChipActive]}
                  onPress={() => {
                    setSelectedTeam(team);
                    Sound.tap();
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[s.teamChipText, selectedTeam === team && s.teamChipTextActive]}>
                    {team}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={s.stepFooter}>
              <TouchableOpacity style={s.btnSecondary} onPress={() => goToStep(2)} activeOpacity={0.75}>
                <Text style={s.btnSecondaryText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnPrimary, { flex: 2 }, !selectedTeam && s.btnDisabled]}
                onPress={() => goToStep(2)}
                activeOpacity={0.82}
              >
                <Text style={s.btnPrimaryText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step 2: How it works ───────────────────────────────────────── */}
        {step === 2 && (
          <View style={s.step}>
            <Text style={s.stepTitle}>How it works</Text>
            <Text style={s.stepSub}>Everything you need, nothing you don't</Text>
            <View style={s.featureList}>
              {FEATURES.map((f, i) => <FeaturePill key={f.title} item={f} delay={i * 100} />)}
            </View>
            <TouchableOpacity style={s.btnPrimary} onPress={finish} activeOpacity={0.82}>
              <Text style={s.btnPrimaryText}>
                {selectedTeam ? `Let's go, ${selectedTeam} fan →` : "Let's go →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  content: { flex: 1 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16, paddingBottom: 4 },
  dot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.muted },
  dotActive: { backgroundColor: C.accent, width: 20 },

  step: { flex: 1, paddingHorizontal: 28, paddingBottom: 32, paddingTop: 16 },

  // Step 0
  ball:         { fontSize: 90, textAlign: 'center', marginBottom: 24, marginTop: 20 },
  welcomeTitle: { color: C.text, fontSize: 42, fontWeight: '900', letterSpacing: -1.5, textAlign: 'center', marginBottom: 8 },
  welcomeSub:   { color: C.accent, fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 24, letterSpacing: 0.3 },
  welcomeBody:  { color: C.sub, fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 40 },

  // Step 1 & 2 header
  stepTitle: { color: C.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginBottom: 6, marginTop: 8 },
  stepSub:   { color: C.sub, fontSize: 14, marginBottom: 20, lineHeight: 20 },

  // Team grid
  teamScroll: { flex: 1, marginBottom: 20 },
  teamGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  teamChip:   { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  teamChipActive: { backgroundColor: C.accentDim, borderColor: C.accent },
  teamChipText:   { color: C.sub, fontSize: 13, fontWeight: '600' },
  teamChipTextActive: { color: C.accent },

  // Feature list
  featureList:  { flex: 1, gap: 14, marginBottom: 28 },
  featurePill:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, gap: 14 },
  featureIcon:  { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accentBorder, justifyContent: 'center', alignItems: 'center' },
  featureEmoji: { fontSize: 22 },
  featureBody:  { flex: 1 },
  featureTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  featureSub:   { color: C.sub, fontSize: 12, lineHeight: 18 },

  // Footer
  stepFooter: { flexDirection: 'row', gap: 10 },

  // Buttons
  btnPrimary:     { paddingVertical: 16, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center' },
  btnPrimaryText: { color: '#030E05', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  btnSecondary:   { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  btnSecondaryText:{ color: C.sub, fontSize: 15, fontWeight: '600' },
  btnDisabled:    { opacity: 0.45 },
});
