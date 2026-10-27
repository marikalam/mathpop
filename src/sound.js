import { playerName } from './storyNames.js';

let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Mobile browsers only let audio start playing when it's tied to a real
// user gesture, and speech goes through an async pipeline (model load +
// inference) before it has anything to play — by the time it's ready, the
// original tap no longer counts. Resuming the shared AudioContext
// synchronously on the very first tap anywhere "spends" that gesture; once
// resumed, the same context keeps working from async code and timers for
// the rest of the page session. This also matters on iOS specifically:
// speech and chimes both play through this one AudioContext rather than
// an <audio> element, which is the playback path iOS is willing to mix
// with other apps' audio (e.g. Spotify over CarPlay) instead of muting it —
// speechSynthesis, by contrast, always takes exclusive control there.
export function unlockAudio() {
  ensureAudio();
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

// Tapping the MathPop logo: four bubbly pops, one for each tile (+ − × ÷)
// as they spin, then a slide-whistle "whee" and a sparkle. Played through
// the same audio as the voice, so it's also a quick "is my sound on?" check.
export function playLogoSound() {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.02;
  [420, 520, 640, 780].forEach((start, i) => {
    const at = now + i * 0.1;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(start, at);
    osc.frequency.exponentialRampToValueAtTime(start * 2.6, at + 0.07);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(0.32, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.13);
  });
  const whee = now + 0.42;
  const slide = ctx.createOscillator();
  slide.type = 'triangle';
  slide.frequency.setValueAtTime(500, whee);
  slide.frequency.exponentialRampToValueAtTime(1500, whee + 0.28);
  const wheeGain = ctx.createGain();
  wheeGain.gain.setValueAtTime(0.0001, whee);
  wheeGain.gain.linearRampToValueAtTime(0.16, whee + 0.03);
  wheeGain.gain.exponentialRampToValueAtTime(0.0001, whee + 0.32);
  slide.connect(wheeGain).connect(ctx.destination);
  slide.start(whee);
  slide.stop(whee + 0.34);
  [1568, 2093, 2637].forEach((freq, i) => tone(ctx, freq, whee + 0.3 + i * 0.06, 0.35, 0.09));
}

// Stickers (the same sounds as PitchPop): a bubbly "bloop" when one is
// tapped or picked...
export function playStickerPick() {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.01;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(1250, now + 0.11);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
  tone(ctx, 1567.98, now + 0.1, 0.18, 0.07);
}

// ...and a soft "pat" and a little twinkle when it's stuck in the book.
export function playStickerStick() {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.01;
  const pat = ctx.createOscillator();
  pat.type = 'sine';
  pat.frequency.setValueAtTime(260, now);
  pat.frequency.exponentialRampToValueAtTime(120, now + 0.09);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.28, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  pat.connect(gain).connect(ctx.destination);
  pat.start(now);
  pat.stop(now + 0.14);
  [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => tone(ctx, f, now + 0.1 + i * 0.07, 0.22, 0.08));
}

const OPERATION_WORDS = { '×': 'times', '+': 'plus', '−': 'minus', '÷': 'divided by' };

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
  const uri = (voice.voiceURI || '').toLowerCase();
  const text = `${name} ${uri}`;
  const isEnglish = voice.lang.toLowerCase().startsWith('en');
  let score = 0;
  if (!isEnglish) score -= 10;
  if (text.includes('online')) score += 3;
  if (text.includes('natural')) score += 4;
  if (text.includes('neural')) score += 6;
  if (/premium|enhanced/.test(text)) score += 4;
  if (text.includes('siri')) score += 3;
  if (PREFERRED_NAME_HINTS.some((hint) => text.includes(hint))) score += 2;
  if (voice.localService === false) score += 2;
  if (/compact|espeak|robot/.test(text)) score -= 4;
  return score;
}

async function pickVoice() {
  const voices = await loadVoices();
  if (voices.length === 0) return null;
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

async function speakWithWebSpeechAPI(text) {
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

// Piper only ships an English voice here, so other languages go through
// the OS voice for that language (iOS/macOS/Android/Windows all include
// Japanese, Cantonese and Mandarin). Cantonese voices are tagged zh-HK on
// most platforms, but some use yue.
async function pickVoiceForLang(lang) {
  const voices = await loadVoices();
  const norm = (l) => l.toLowerCase().replace('_', '-');
  const target = norm(lang);
  let pool = voices.filter((v) => {
    const vl = norm(v.lang);
    if (target === 'zh-hk') return vl === 'zh-hk' || vl.startsWith('yue');
    return vl === target;
  });
  // No mainland Mandarin voice installed — a Taiwan Mandarin voice still
  // reads the digits correctly.
  if (pool.length === 0 && target === 'zh-cn') pool = voices.filter((v) => norm(v.lang) === 'zh-tw');
  // Any voice for the same language, e.g. Mexican Spanish for es-ES
  // (Chinese is kept apart above: Cantonese and Mandarin differ).
  const base = target.split('-')[0];
  if (pool.length === 0 && base !== 'zh') pool = voices.filter((v) => norm(v.lang).split('-')[0] === base);
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => scoreVoiceQuality(b) - scoreVoiceQuality(a))[0];
}

// Which of these languages (BCP 47 tags) this device can actually say.
// English always works (MathPop's own voice). If the device lists no
// voices at all, we can't tell, so all of them are kept.
export async function languagesWithVoices(langs) {
  const voices = await loadVoices();
  if (voices.length === 0) return langs;
  const found = await Promise.all(langs.map((l) => (l.startsWith('en') ? true : pickVoiceForLang(l).then(Boolean))));
  return langs.filter((_, i) => found[i]);
}

function scoreVoiceQuality(voice) {
  const text = `${voice.name} ${voice.voiceURI || ''}`.toLowerCase();
  let score = 0;
  if (/premium|enhanced|natural|neural|siri/.test(text)) score += 4;
  if (voice.localService === false) score += 1;
  if (/compact|espeak/.test(text)) score -= 4;
  return score;
}

export async function speakInLanguage(text, lang) {
  if (!lang || lang.startsWith('en')) return speak(text);
  if (!('speechSynthesis' in window)) return;
  speechRun++;
  stopCurrent();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  const voice = await pickVoiceForLang(lang);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// piper-tts-web pulls in onnxruntime-web (a sizeable WASM runtime), so it's
// dynamically imported rather than bundled into the main chunk — nobody
// pays for it until speech is actually requested. The voice model itself
// (~60MB) downloads once and is cached by the browser after that.
let piperModulePromise = null;
function getPiperModule() {
  if (!piperModulePromise) piperModulePromise = import('./piper.js');
  return piperModulePromise;
}

export function prewarmVoices() {
  loadVoices();
  getPiperModule()
    .then((m) => m.loadPiper())
    .catch(() => {
      /* Piper couldn't load (unsupported browser, offline on first-ever use, etc.) — speak() falls back to the OS voice */
    });
}

// 'piper' | 'good-system' | 'basic-system' — lets the UI explain the voice
// situation (e.g. only suggest installing a better system voice when we've
// actually fallen back to one, and it isn't a great one).
export async function getVoiceQuality() {
  try {
    const { loadPiper } = await getPiperModule();
    await loadPiper();
    return 'piper';
  } catch {
    const voice = await pickVoice();
    return voice && scoreVoice(voice) > 0 ? 'good-system' : 'basic-system';
  }
}

let currentSource = null;
// Bumped by every new speak() or stopSpeaking(), so a walkthrough that's
// still playing (speakSteps) knows to stop.
let speechRun = 0;

function stopCurrent() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      /* already stopped */
    }
    currentSource = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function stopSpeaking() {
  speechRun++;
  stopCurrent();
}

export async function speak(text) {
  speechRun++;
  try {
    const { synthesizeSpeech } = await getPiperModule();
    const blob = await synthesizeSpeech(text);
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = ensureAudio();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    if (currentSource) {
      try {
        currentSource.stop();
      } catch {
        /* already stopped */
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    currentSource = source;
    source.start();
  } catch (err) {
    console.warn('Piper TTS unavailable, falling back to the built-in voice', err);
    speakWithWebSpeechAPI(text);
  }
}

// Japanese problems (`lang: 'ja'`) are read by the device's Japanese voice
// (MathPop's own voice only speaks English).
const LANG_TAGS = { ja: 'ja-JP' };

// Asked by name ("Marcus, what is 5 plus 3?") when the problem says so
// (`callName`, about half of them).
export function speakProblem(problem) {
  const name = problem.callName ? playerName() : null;
  if (LANG_TAGS[problem.lang]) {
    const text = problem.speech || problem.prompt;
    speakInLanguage(name ? `${name}、${text}` : text, LANG_TAGS[problem.lang]);
  } else if (problem.type === 'sentence') {
    speak(problem.text);
  } else if (problem.type === 'clock') {
    speak(name ? `${name}, what time is it?` : 'What time is it?');
  } else if (problem.type === 'skill') {
    const text = problem.speech || problem.prompt;
    speak(name ? `${name}, ${text}` : text);
  } else {
    const sum = `${problem.a} ${OPERATION_WORDS[problem.symbol]} ${problem.b}`;
    speak(name ? `${name}, what is ${sum}?` : sum);
  }
}

export function playFeedbackAndSpeak(correct, correctAnswer, lang) {
  if (correct) {
    playCorrectChime();
  } else {
    playIncorrectBuzz();
  }
  setTimeout(() => {
    // Often by name: "Great job, Marcus!"
    const name = Math.random() < 0.5 ? playerName() : null;
    if (lang === 'ja') {
      speakInLanguage(
        correct
          ? `${name ? `${name}、` : ''}せいかい！ ${correctAnswer}！`
          : `おしい！ ${name ? `${name}、` : ''}こたえは ${correctAnswer}。`,
        LANG_TAGS.ja,
      );
      return;
    }
    if (name) {
      speak(correct ? `Great job, ${name}! The answer is ${correctAnswer}` : `Not quite, ${name}. The answer is ${correctAnswer}.`);
      return;
    }
    // A wrong answer is told, and the round moves on (Show me how is
    // there to explain it).
    speak(correct ? `The answer is ${correctAnswer}` : `Not quite. The answer is ${correctAnswer}.`);
  }, 300);
}

export function speakResults(correct, total, lang) {
  const wrong = total - correct;
  const name = playerName();
  if (lang === 'ja') {
    const you = name ? `${name}、` : '';
    speakInLanguage(correct === total ? `${you}すごい！ ${total}もん ぜんぶ せいかい！` : `${you}${total}もんちゅう ${correct}もん せいかい！ よく がんばったね！`, LANG_TAGS.ja);
    return;
  }
  speak(
    correct === total
      ? `Perfect${name ? `, ${name}` : ''}! You got all ${total} correct!`
      : `${name ? `Well done, ${name}! ` : ''}You got ${correct} correct and ${wrong} wrong.`
  );
}

async function synthesize(text) {
  const { synthesizeSpeech } = await getPiperModule();
  const blob = await synthesizeSpeech(text);
  return ensureAudio().decodeAudioData(await blob.arrayBuffer());
}

function playBuffer(audioBuffer) {
  return new Promise((resolve) => {
    const ctx = ensureAudio();
    stopCurrent();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => resolve();
    currentSource = source;
    source.start();
  });
}

async function speakWithWebSpeechAPIAndWait(text, lang) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  if (lang) utterance.lang = lang;
  const voice = lang ? await pickVoiceForLang(lang) : await pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = lang ? 0.9 : 0.92;
  await new Promise((resolve) => {
    utterance.onend = resolve;
    utterance.onerror = resolve;
    // Some browsers never fire onend; don't get stuck.
    setTimeout(resolve, 1500 + text.length * 120);
    window.speechSynthesis.speak(utterance);
  });
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// "Show me how": say each step in turn, a little pause between them, and
// tell the screen which step is being said (onStep(i)) so it can light it
// up. The next step is made while this one plays, so there's no gap.
// Stops if anything else starts speaking, or stopSpeaking() is called.
// In Japanese ('ja'), the device's Japanese voice says every step.
export async function speakSteps(steps, onStep, lang) {
  const run = ++speechRun;
  stopCurrent();
  const langTag = LANG_TAGS[lang];
  let piper = !langTag;
  let nextAudio = piper ? synthesize(steps[0]).catch(() => null) : null;
  for (let i = 0; i < steps.length; i++) {
    if (run !== speechRun) return false;
    const audio = piper ? await nextAudio : null;
    if (run !== speechRun) return false;
    if (i + 1 < steps.length && piper && audio) nextAudio = synthesize(steps[i + 1]).catch(() => null);
    onStep(i);
    if (audio) {
      await playBuffer(audio);
    } else {
      piper = false;
      await speakWithWebSpeechAPIAndWait(steps[i], langTag);
    }
    if (run !== speechRun) return false;
    await pause(450);
  }
  return run === speechRun;
}
