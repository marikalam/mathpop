let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(ctx, freq, startTime, duration, peak) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

export function playCorrectChime() {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.01;
  tone(ctx, 523.25, now, 0.16, 0.18);
  tone(ctx, 659.25, now + 0.09, 0.22, 0.18);
  tone(ctx, 783.99, now + 0.18, 0.3, 0.18);
}

export function playIncorrectBuzz() {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.01;
  tone(ctx, 220, now, 0.22, 0.16);
  tone(ctx, 174.61, now + 0.1, 0.28, 0.16);
}

const OPERATION_WORDS = { '×': 'times', '+': 'plus', '−': 'minus' };

let cachedVoices = [];

function refreshVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

const PREFERRED_VOICE_NAMES = [
  'Google US English',
  'Samantha',
  'Ava',
  'Nicky',
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
];

function pickVoice() {
  const voices = cachedVoices.length ? cachedVoices : refreshVoices();
  for (const name of PREFERRED_VOICE_NAMES) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }
  const enhanced = voices.find((v) => /natural|premium|enhanced/i.test(v.name) && v.lang.startsWith('en'));
  if (enhanced) return enhanced;
  return voices.find((v) => v.lang === 'en-US') || voices.find((v) => v.lang.startsWith('en')) || null;
}

export function speakProblem(problem) {
  if (!('speechSynthesis' in window)) return;
  const text = `${problem.a} ${OPERATION_WORDS[problem.symbol]} ${problem.b}`;
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.98;
  utterance.pitch = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
