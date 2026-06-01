import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { AppProvider, useApp } from './src/store';
import { C } from './src/theme';
import { Sound } from './src/sound';
import AuthScreen       from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen       from './src/screens/HomeScreen';
import DiaryScreen      from './src/screens/DiaryScreen';
import LogScreen        from './src/screens/LogScreen';
import DiscoverScreen   from './src/screens/DiscoverScreen';
import ProfileScreen    from './src/screens/ProfileScreen';

// ─── Tab Bar Icon ────────────────────────────────────────────────────────────

function TabIcon({ emoji, focused, isCenter }) {
  if (isCenter) {
    return (
      <View style={ti.centerWrap}>
        <Text style={ti.centerPlus}>+</Text>
      </View>
    );
  }
  return <Text style={[ti.icon, { opacity: focused ? 1 : 0.45 }]}>{emoji}</Text>;
}

const ti = StyleSheet.create({
  icon:       { fontSize: 22 },
  centerWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 14, shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  centerPlus: { fontSize: 28, color: '#030E05', fontWeight: '300', lineHeight: 32 },
});

// ─── Achievement Banner ──────────────────────────────────────────────────────

function AchievementBanner() {
  const { pendingAchievement, dismissAchievement } = useApp();
  const slideY = useRef(new Animated.Value(-130)).current;
  const prev   = useRef(null);

  useEffect(() => {
    if (pendingAchievement && pendingAchievement !== prev.current) {
      prev.current = pendingAchievement;
      slideY.setValue(-130);
      Sound.achievement();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 220);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 440);
      Animated.sequence([
        Animated.spring(slideY, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
        Animated.delay(2800),
        Animated.timing(slideY, { toValue: -130, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start(() => dismissAchievement());
    }
  }, [pendingAchievement]);

  if (!pendingAchievement) return null;

  return (
    <Animated.View style={[ab.banner, { transform: [{ translateY: slideY }] }]}>
      <TouchableOpacity style={ab.inner} activeOpacity={0.85} onPress={() => { slideY.setValue(-130); dismissAchievement(); }}>
        <View style={ab.iconWrap}><Text style={ab.icon}>{pendingAchievement.emoji}</Text></View>
        <View style={ab.body}>
          <Text style={ab.eyebrow}>ACHIEVEMENT UNLOCKED</Text>
          <Text style={ab.title}>{pendingAchievement.title}</Text>
          <Text style={ab.sub}>{pendingAchievement.description} · +{pendingAchievement.xp} XP</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ab = StyleSheet.create({
  banner: {
    position: 'absolute', top: 60, left: 16, right: 16, zIndex: 999,
    borderRadius: 18, backgroundColor: C.goldDim,
    borderWidth: 1.5, borderColor: C.goldBorder,
    shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  inner:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconWrap:{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.gold + '25', borderWidth: 1, borderColor: C.goldBorder, justifyContent: 'center', alignItems: 'center' },
  icon:    { fontSize: 24 },
  body:    { flex: 1 },
  eyebrow: { color: C.gold, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  title:   { color: C.text, fontSize: 15, fontWeight: '800', marginVertical: 2 },
  sub:     { color: C.sub, fontSize: 11 },
});

// ─── Navigator ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: C.tabBg, borderTopColor: C.border, borderTopWidth: 1, height: 82, paddingBottom: 18, paddingTop: 8 },
          tabBarActiveTintColor:   C.accent,
          tabBarInactiveTintColor: C.muted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
        }}
      >
        <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />, tabBarLabel: 'Home' }} />
        <Tab.Screen name="Diary"    component={DiaryScreen}    options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />, tabBarLabel: 'Diary' }} />
        <Tab.Screen name="Log"      component={LogScreen}      options={{ tabBarIcon: () => <TabIcon isCenter />, tabBarLabel: '' }} />
        <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />, tabBarLabel: 'Discover' }} />
        <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />, tabBarLabel: 'Profile' }} />
      </Tab.Navigator>
      <AchievementBanner />
    </>
  );
}

// ─── Root — auth → onboarding → app ──────────────────────────────────────────

function Root() {
  const { session, authLoading, setFavoriteTeam } = useApp();
  const [onboarded, setOnboarded] = useState(() => {
    try { return typeof localStorage !== 'undefined' && !!localStorage.getItem('kickoff_onboarded'); }
    catch { return false; }
  });

  const handleOnboardingComplete = (team) => {
    if (team) setFavoriteTeam(team);
    try { localStorage.setItem('kickoff_onboarded', '1'); } catch (_) {}
    setOnboarded(true);
  };

  if (authLoading) {
    return (
      <View style={sp.splash}>
        <Text style={sp.ball}>⚽</Text>
        <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!session) return <AuthScreen />;

  if (!onboarded) return <OnboardingScreen onComplete={handleOnboardingComplete} />;

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

const sp = StyleSheet.create({
  splash: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  ball:   { fontSize: 64 },
});

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
