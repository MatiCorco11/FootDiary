import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { C } from '../theme';
import { useApp } from '../store';

const WEB_INPUT = Platform.OS === 'web' ? { outline: 'none', outlineStyle: 'none' } : {};

export default function AuthScreen() {
  const { signIn, signUp } = useApp();
  const [mode, setMode]       = useState('signin');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async () => {
    if (!email.trim() || password.length < 6) return;
    setLoading(true);
    setError('');
    const err = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
    setLoading(false);
    if (err) setError(err.message);
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !loading;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.logoArea}>
          <Text style={s.ball}>⚽</Text>
          <Text style={s.appName}>Kickoff</Text>
          <Text style={s.tagline}>Your personal football diary</Text>
        </View>

        <View style={s.card}>
          {/* Mode toggle */}
          <View style={s.toggle}>
            <TouchableOpacity
              style={[s.toggleBtn, mode === 'signin' && s.toggleBtnActive]}
              onPress={() => switchMode('signin')}
              activeOpacity={0.75}
            >
              <Text style={[s.toggleText, mode === 'signin' && s.toggleTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, mode === 'signup' && s.toggleBtnActive]}
              onPress={() => switchMode('signup')}
              activeOpacity={0.75}
            >
              <Text style={[s.toggleText, mode === 'signup' && s.toggleTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>EMAIL</Text>
          <TextInput
            style={[s.input, WEB_INPUT]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={[s.label, { marginTop: 16 }]}>PASSWORD</Text>
          <TextInput
            style={[s.input, WEB_INPUT]}
            value={password}
            onChangeText={setPassword}
            placeholder="min. 6 characters"
            placeholderTextColor={C.muted}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

          {!!error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity
            style={[s.submitBtn, !canSubmit && s.submitDisabled]}
            onPress={submit}
            disabled={!canSubmit}
            activeOpacity={0.82}
          >
            {loading
              ? <ActivityIndicator color="#030E05" />
              : <Text style={s.submitText}>
                  {mode === 'signin' ? 'Sign In →' : 'Create Account →'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  logoArea: { alignItems: 'center', marginBottom: 36 },
  ball:     { fontSize: 56, marginBottom: 10 },
  appName:  { color: C.text, fontSize: 38, fontWeight: '900', letterSpacing: -1.5, marginBottom: 6 },
  tagline:  { color: C.sub, fontSize: 14 },

  card: {
    backgroundColor: C.surface, borderRadius: 24,
    padding: 22, borderWidth: 1, borderColor: C.border,
  },

  toggle:          { flexDirection: 'row', backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 4, marginBottom: 22 },
  toggleBtn:       { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: C.accent },
  toggleText:      { color: C.muted, fontSize: 14, fontWeight: '700' },
  toggleTextActive:{ color: '#030E05' },

  label: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  input: {
    backgroundColor: C.surfaceHigh, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    color: C.text, fontSize: 15,
    borderWidth: 1, borderColor: C.border,
  },

  error: { color: C.red, fontSize: 12, marginTop: 12, textAlign: 'center', lineHeight: 18 },

  submitBtn:      { marginTop: 20, paddingVertical: 15, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center' },
  submitDisabled: { opacity: 0.45 },
  submitText:     { color: '#030E05', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
});
