import { Platform } from 'react-native';

const tone = (freq, endFreq, dur, vol = 0.16, type = 'sine') => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx  = new Ctx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + dur * 0.75);
    }
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur + 0.05);
  } catch (_) {}
};

export const Sound = {
  // Rising tone per star (pitch scales with star number)
  starTap: (n) => tone(330 + n * 110, 440 + n * 110, 0.1, 0.13, 'triangle'),

  // Triumphant ascending chord on submit
  submit: () => {
    tone(523, 523, 0.2,  0.14);
    setTimeout(() => tone(659, 659, 0.2,  0.14), 85);
    setTimeout(() => tone(784, 784, 0.22, 0.16), 170);
    setTimeout(() => tone(1047,1047, 0.32, 0.18), 255);
  },

  // Achievement jingle — 5-note rising arpeggio
  achievement: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => tone(f, f * 1.05, 0.16, 0.2), i * 90)
    );
  },

  // Light UI tap
  tap: () => tone(880, 660, 0.07, 0.09, 'triangle'),

  // Photo picked — quick ascending blip
  photo: () => { tone(660, 880, 0.08, 0.12); setTimeout(() => tone(880, 1100, 0.1, 0.1), 70); },
};
