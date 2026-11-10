// Japanese Math: numbers and math the way kids learn them in Japan, for
// every family (Japanese written in kana with romaji, so anyone can read
// it, and the Japanese said out loud by a Japanese voice: `voiceLang`).
//   - kuku: the 九九 times-table chant ("ni san ga roku": 2 × 3 = 6)
//   - kanjiNumbers: 一 二 三... and how 二十三 is 23
//   - counters: Japanese counts fish, pencils and paper differently
//     (さんびき, さんぼん, さんまい)
//   - yenShop: shopping with yen at the Japanese corner shop
// `tier` ('easy' | 'medium' | 'hard') comes from the player's level in the
// topic (autoLevel.js).

const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const step = (tier) => (tier === 'hard' ? 2 : tier === 'medium' ? 1 : 0);

// Hiragana (and the katakana used here) to romaji.
const KANA = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o', か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko', が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo', た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  だ: 'da', で: 'de', ど: 'do', な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no', は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho', ば: 'ba', び: 'bi',
  ぶ: 'bu', べ: 'be', ぼ: 'bo', ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po', ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo', や: 'ya', ゆ: 'yu',
  よ: 'yo', ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro', わ: 'wa', を: 'o', ん: 'n', ー: '-',
};
const SMALL = { ゃ: 'ya', ゅ: 'yu', ょ: 'yo' };
export function romaji(kana) {
  let out = '';
  const chars = [...kana.replace(/[ァ-ン]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === 'っ') {
      const next = KANA[chars[i + 1]] || '';
      out += next.startsWith('ch') ? 't' : next[0] || '';
    } else if (SMALL[c]) {
      // き + ゃ = kya; し + ゃ = sha; ち + ゃ = cha; じ + ゃ = ja.
      out = /(sh|ch|j)i$/.test(out) ? out.slice(0, -1) + SMALL[c].slice(1) : out.slice(0, -1) + SMALL[c];
    } else if (KANA[c] !== undefined) out += KANA[c];
    else out += c;
  }
  return out;
}

const ONES = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
// How a number is read (the everyday way: よん, なな, きゅう).
export function yomi(n) {
  if (n === 0) return 'ゼロ';
  if (n >= 100) {
    const h = Math.floor(n / 100);
    const HUN = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'];
    return HUN[h] + (n % 100 ? yomi(n % 100) : '');
  }
  const t = Math.floor(n / 10);
  const o = n % 10;
  return (t ? (t > 1 ? ONES[t] : '') + 'じゅう' : '') + ONES[o];
}

// ---- 九九 (kuku): the times-table chant ----
const KUKU = {
  1: ['いんいちがいち', 'いんにがに', 'いんさんがさん', 'いんしがし', 'いんごがご', 'いんろくがろく', 'いんしちがしち', 'いんはちがはち', 'いんくがく'],
  2: ['にいちがに', 'ににんがし', 'にさんがろく', 'にしがはち', 'にごじゅう', 'にろくじゅうに', 'にしちじゅうし', 'にはちじゅうろく', 'にくじゅうはち'],
  3: ['さんいちがさん', 'さんにがろく', 'さざんがく', 'さんしじゅうに', 'さんごじゅうご', 'さぶろくじゅうはち', 'さんしちにじゅういち', 'さんぱにじゅうし', 'さんくにじゅうしち'],
  4: ['しいちがし', 'しにがはち', 'しさんじゅうに', 'ししじゅうろく', 'しごにじゅう', 'しろくにじゅうし', 'ししちにじゅうはち', 'しはさんじゅうに', 'しくさんじゅうろく'],
  5: ['ごいちがご', 'ごにじゅう', 'ごさんじゅうご', 'ごしにじゅう', 'ごごにじゅうご', 'ごろくさんじゅう', 'ごしちさんじゅうご', 'ごはしじゅう', 'ごっくしじゅうご'],
  6: ['ろくいちがろく', 'ろくにじゅうに', 'ろくさんじゅうはち', 'ろくしにじゅうし', 'ろくごさんじゅう', 'ろくろくさんじゅうろく', 'ろくしちしじゅうに', 'ろくはしじゅうはち', 'ろっくごじゅうし'],
  7: ['しちいちがしち', 'しちにじゅうし', 'しちさんにじゅういち', 'しちしにじゅうはち', 'しちごさんじゅうご', 'しちろくしじゅうに', 'しちしちしじゅうく', 'しちはごじゅうろく', 'しちくろくじゅうさん'],
  8: ['はちいちがはち', 'はちにじゅうろく', 'はちさんにじゅうし', 'はちしさんじゅうに', 'はちごしじゅう', 'はちろくしじゅうはち', 'はちしちごじゅうろく', 'はっぱろくじゅうし', 'はっくしちじゅうに'],
  9: ['くいちがく', 'くにじゅうはち', 'くさんにじゅうしち', 'くしさんじゅうろく', 'くごしじゅうご', 'くろくごじゅうし', 'くしちろくじゅうさん', 'くはしちじゅうに', 'くくはちじゅういち'],
};
// The product as the chant says it (し for 4, しち for 7, く for 9).
const KUKU_ONES = ['', 'いち', 'に', 'さん', 'し', 'ご', 'ろく', 'しち', 'はち', 'く'];
export function kukuAnswer(n) {
  const t = Math.floor(n / 10);
  const o = n % 10;
  return (t ? (t > 1 ? KUKU_ONES[t] : '') + 'じゅう' : '') + KUKU_ONES[o];
}
// [the part before the answer (with が), the answer] for a × b.
export function kukuParts(a, b) {
  const line = KUKU[a][b - 1];
  const ans = kukuAnswer(a * b);
  const head = line.slice(0, line.length - ans.length);
  return [head, ans];
}

function kukuProblem(tier) {
  const s = step(tier);
  const a = s === 0 ? randInt(2, 5) : randInt(2, 9);
  const b = randInt(1, 9);
  const [head, ans] = kukuParts(a, b);
  const line = head + ans;
  const base = {
    voiceLang: 'ja',
    questionTitle: '九九 · Kuku',
    explain: [
      'In Japan, kids learn times tables as a chant called kuku.',
      `${a} × ${b} is said "${romaji(head)} ${romaji(ans)}".`,
      `The chant ends with the answer: ${romaji(ans)} means ${a * b}.`,
      `So what is ${a} × ${b}?`,
    ],
  };
  if (s < 2) {
    return {
      ...base,
      prompt: `${a} × ${b} = ?\n${head}…？ (${romaji(head)}...?)`,
      speechJa: `${head}？`,
      correct: a * b,
      answerType: 'numeric',
      answerLabel: `${line} (${romaji(line)}): ${a} × ${b} = ${a * b}`,
      speechAnswer: line,
    };
  }
  // Hard: hear the chant, pick the times fact.
  const wrong = new Set();
  while (wrong.size < 3) {
    const x = randInt(2, 9);
    const y = randInt(1, 9);
    if (x * y !== a * b) wrong.add(`${x} × ${y}`);
  }
  return {
    ...base,
    prompt: `Which one is ${line}?\n(${romaji(line)})`,
    speechJa: line,
    correct: `${a} × ${b}`,
    answerType: 'choice',
    choices: shuffle([`${a} × ${b}`, ...wrong]),
    answerLabel: `${line} = ${a} × ${b} = ${a * b}`,
    speechAnswer: line,
  };
}

// ---- 漢字の数字: kanji numbers ----
const KANJI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export function kanjiNumber(n) {
  if (n === 100) return '百';
  const t = Math.floor(n / 10);
  const o = n % 10;
  return (t ? (t > 1 ? KANJI[t] : '') + '十' : '') + KANJI[o];
}

function kanjiNumbersProblem(tier) {
  const s = step(tier);
  const n = s === 0 ? randInt(1, 10) : s === 1 ? randInt(11, 20) : randInt(21, 99);
  const k = kanjiNumber(n);
  const t = Math.floor(n / 10);
  const reverse = s > 0 && Math.random() < 0.4;
  const explain =
    n <= 10
      ? ['一 is 1, 二 is 2, 三 is 3. Count the lines!', '四 is 4, 五 is 5, 六 is 6, 七 is 7, 八 is 8, 九 is 9, and 十 is 10.', `Which number is ${k}?`]
      : [
          '十 means ten.',
          t > 1 ? `A number in front of 十 says how many tens: ${KANJI[t]}十 is ${t} tens, ${t * 10}.` : 'Just 十 by itself is one ten.',
          n % 10 ? `A number after 十 is the ones: ${KANJI[n % 10]} is ${n % 10}.` : 'Nothing after 十, so no ones.',
          `So what number is ${k}?`,
        ];
  if (reverse) {
    const wrong = [n + 10, n - 10, n + 1, n - 1, Number(String(n).split('').reverse().join(''))].filter((x) => x > 0 && x < 100 && x !== n);
    const choices = shuffle([k, ...shuffle([...new Set(wrong)]).slice(0, 3).map(kanjiNumber)]);
    return {
      voiceLang: 'ja',
      questionTitle: '漢字の数字 · Kanji numbers',
      prompt: `Which kanji is ${n}?`,
      speechJa: yomi(n),
      correct: k,
      answerType: 'choice',
      choices,
      answerLabel: `${n} = ${k} (${romaji(yomi(n))})`,
      speechAnswer: yomi(n),
      explain,
    };
  }
  return {
    voiceLang: 'ja',
    questionTitle: '漢字の数字 · Kanji numbers',
    prompt: `${k} = ?`,
    speechJa: 'この かんじは なんの すうじ？',
    correct: n,
    answerType: 'numeric',
    answerLabel: `${k} = ${n} (${romaji(yomi(n))})`,
    speechAnswer: yomi(n),
    explain,
  };
}

// ---- かぞえかた: counter words ----
// [counter, what it counts, readings for 1 to 10]
const COUNTERS = {
  hiki: ['ひき', 'animals', ['いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき', 'ななひき', 'はっぴき', 'きゅうひき', 'じゅっぴき']],
  hon: ['ほん', 'long, thin things', ['いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん']],
  mai: ['まい', 'flat things', ['いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', 'ななまい', 'はちまい', 'きゅうまい', 'じゅうまい']],
  ko: ['こ', 'small, round things', ['いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', 'ななこ', 'はっこ', 'きゅうこ', 'じゅっこ']],
};
// Things to count (Drawings.jsx ids), their Japanese names, and counter.
const COUNT_THINGS = [
  ['fish', 'さかな', 'fish', 'hiki'],
  ['dog', 'いぬ', 'dogs', 'hiki'],
  ['cat', 'ねこ', 'cats', 'hiki'],
  ['frog', 'かえる', 'frogs', 'hiki'],
  ['bunny', 'うさぎ', 'bunnies', 'hiki'],
  ['banana', 'バナナ', 'bananas', 'hon'],
  ['carrot', 'にんじん', 'carrots', 'hon'],
  ['cookie', 'クッキー', 'cookies', 'mai'],
  ['apple', 'りんご', 'apples', 'ko'],
  ['ball', 'ボール', 'balls', 'ko'],
  ['strawberry', 'いちご', 'strawberries', 'ko'],
  ['orange', 'みかん', 'oranges', 'ko'],
  ['donut', 'ドーナツ', 'donuts', 'ko'],
];

function countersProblem(tier) {
  const s = step(tier);
  const [id, ja, en, counter] = pick(COUNT_THINGS.filter(([thing]) => thing !== 'carrot'));
  const n = s === 0 ? randInt(1, 3) : s === 1 ? randInt(1, 6) : randInt(1, 10);
  const [word, kind, readings] = COUNTERS[counter];
  const correct = readings[n - 1];
  // Wrong: the same number with the other counters (and, harder, the
  // same counter said without its sound change).
  const others = Object.entries(COUNTERS).filter(([k]) => k !== counter).map(([, c]) => c[2][n - 1]);
  const plain = ONES[n] ? yomi(n) + word : '';
  const wrong = [...others];
  if (s === 2 && plain && plain !== correct) wrong.unshift(plain);
  const choices = shuffle([correct, ...wrong.slice(0, 3)]);
  return {
    voiceLang: 'ja',
    questionTitle: 'かぞえかた · Counting words',
    visual: { kind: 'pile', n, emoji: id },
    prompt: `How do you count ${n} ${n === 1 ? en.replace(/ies$/, 'y').replace(/s$/, '') : en} (${ja}) in Japanese?`,
    speechJa: `${ja}が ${n}。なんて かぞえる？`,
    correct,
    answerType: 'choice',
    choices,
    choiceNames: Object.fromEntries(choices.map((c) => [c, `${c} (${romaji(c)})`])),
    choiceKind: 'kana',
    answerLabel: `${n} ${ja}: ${correct} (${romaji(correct)})`,
    speechAnswer: correct,
    explain: [
      'Japanese uses a different counting word for different kinds of things.',
      `${word} (${romaji(word)}) is for ${kind}.`,
      n === 1 || n === 6 || n === 8 || n === 10
        ? `Some numbers change the sound a little, like ip-pon or rop-piki. Listen for it!`
        : `Put the number and ${romaji(word)} together.`,
      `So how do you count ${n} ${en}?`,
    ],
  };
}

// ---- おかいもの: the yen shop ----
const SHOP = [
  ['おにぎり', 'rice ball', 120],
  ['ジュース', 'juice', 150],
  ['あめ', 'candy', 30],
  ['えんぴつ', 'pencil', 80],
  ['ノート', 'notebook', 200],
  ['パン', 'bread', 180],
  ['アイス', 'ice cream', 140],
  ['ガム', 'gum', 60],
];

function yenShopProblem(tier) {
  const s = step(tier);
  if (s === 0) {
    // Add up coins: 1, 5, 10, 50 and 100 yen.
    const coins = shuffle([100, 50, 10, 10, 5, 1, 100, 50]).slice(0, randInt(2, 3));
    const total = coins.reduce((a, b) => a + b, 0);
    return {
      voiceLang: 'ja',
      questionTitle: 'おかいもの · Yen shop',
      prompt: `You have ${coins.map((c) => `${c}えん`).join(' + ')}.\nHow many yen is that?`,
      speechJa: `${coins.map((c) => `${yomi(c)}えん`).join('と ')}。ぜんぶで なんえん？`,
      correct: total,
      answerType: 'numeric',
      answerLabel: `${coins.join(' + ')} = ${total}えん (${total} yen)`,
      speechAnswer: `${yomi(total)}えん`,
      explain: ['えん (en) is yen, the money in Japan.', 'Start with the biggest coin, then add the others one at a time.', 'How many yen in all?'],
    };
  }
  const [a, b] = shuffle(SHOP).slice(0, 2);
  if (s === 1) {
    const total = a[2] + b[2];
    return {
      voiceLang: 'ja',
      questionTitle: 'おかいもの · Yen shop',
      prompt: `${a[0]} (${a[1]}) is ${a[2]}えん.\n${b[0]} (${b[1]}) is ${b[2]}えん.\nHow much for both?`,
      speechJa: `${a[0]}は ${yomi(a[2])}えん。${b[0]}は ${yomi(b[2])}えん。ぜんぶで なんえん？`,
      correct: total,
      answerType: 'numeric',
      answerLabel: `${a[2]} + ${b[2]} = ${total}えん`,
      speechAnswer: `${yomi(total)}えん`,
      explain: ['えん (en) is yen, the money in Japan.', `Add the hundreds first, then the rest: ${a[2]} + ${b[2]}.`, 'How many yen for both?'],
    };
  }
  const pay = a[2] < 100 && Math.random() < 0.5 ? 100 : pick([500, 1000]);
  const change = pay - a[2];
  return {
    voiceLang: 'ja',
    questionTitle: 'おかいもの · Yen shop',
    prompt: `${a[0]} (${a[1]}) is ${a[2]}えん.\nYou pay ${pay}えん. How much change?`,
    speechJa: `${a[0]}は ${yomi(a[2])}えん。${yomi(pay)}えん はらいました。おつりは なんえん？`,
    correct: change,
    answerType: 'numeric',
    answerLabel: `${pay} − ${a[2]} = ${change}えん (おつり, otsuri: change)`,
    speechAnswer: `${yomi(change)}えん`,
    explain: [
      'おつり (otsuri) is the change you get back.',
      `Count up from ${a[2]} to the next hundred, then up to ${pay}.`,
      `How much is ${pay} − ${a[2]}?`,
    ],
  };
}

export const JAPANESE_BUILDERS = {
  kuku: kukuProblem,
  kanjiNumbers: kanjiNumbersProblem,
  counters: countersProblem,
  yenShop: yenShopProblem,
};
