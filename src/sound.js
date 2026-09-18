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

// Voice lists load asynchronously on most browsers - calling getVoices()
// right away often returns [] and silently falls back to the flattest
// default voice. Wait for the real list (via voiceschanged, with a
// timeout fallback) before picking one.
let voicesPromise = null;

function loadVoices() {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    const finish = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', finish);
    setTimeout(finish, 1000);
  });
  return voicesPromise;
}

// The Web Speech API has no true "ChatGPT-style" neural voice - browsers
// only expose whatever voices the OS ships, for free. This picks the
// least robotic one actually available. Edge's "Online (Natural)" voices
// are real cloud neural voices (Azure) and sound best by far; macOS
// Enhanced/Premium voices are next; flat compact/default voices are last.
const PREFERRED_NAME_HINTS = [
  'siri',
  'google us english',
  'samantha',
  'ava',
  'allison',
  'susan',
  'nicky',
  'zoe',
  'noelle',
  'nathan',
  'evan',
  'aaron',
  'isha',
  'tom',
  'aria',
  'jenny',
  'victoria',
  'karen',
];

function scoreVoice(voice) {
  const name = voice.name.toLowerCase();
  const isEnglish = voice.lang.toLowerCase().startsWith('en');
  let score = 0;
  if (!isEnglish) score -= 10;
  if (/online \(natural\)/.test(name)) score += 6;
  if (/neural/.test(name)) score += 6;
  if (/premium|enhanced/.test(name)) score += 4;
  if (name.includes('siri')) score += 3;
  if (PREFERRED_NAME_HINTS.some((hint) => name.includes(hint))) score += 2;
  if (voice.localService === false) score += 1;
  if (/compact/.test(name)) score -= 3;
  return score;
}

async function pickVoice() {
  const voices = await loadVoices();
  if (voices.length === 0) return null;
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

export function prewarmVoices() {
  loadVoices();
}

async function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = await pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.98;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function speakProblem(problem) {
  if (problem.type === 'sentence') {
    speak(problem.text);
  } else {
    speak(`${problem.a} ${OPERATION_WORDS[problem.symbol]} ${problem.b}`);
  }
}

export function playFeedbackAndSpeak(correct, correctAnswer) {
  if (correct) {
    playCorrectChime();
  } else {
    playIncorrectBuzz();
  }
  setTimeout(() => {
    speak(`The answer is ${correctAnswer}`);
  }, 300);
}

export function speakResults(correct, total) {
  const wrong = total - correct;
  speak(
    correct === total
      ? `Perfect! You got all ${total} correct!`
      : `You got ${correct} correct and ${wrong} wrong.`
  );
}
