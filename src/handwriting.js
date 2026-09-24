import { predictDigit } from './digitModel.js';

const MIN_COMPONENT_AREA = 8;
const MERGE_GAP_PX = 16;
const ALPHA_THRESHOLD = 24;

function labelComponents(mask, width, height) {
  const labels = new Int32Array(width * height).fill(-1);
  const components = [];
  const stack = [];

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start] !== -1) continue;

    const id = components.length;
    let minX = width, maxX = 0, minY = height, maxY = 0, area = 0;
    stack.push(start);
    labels[start] = id;

    while (stack.length) {
      const p = stack.pop();
      const x = p % width;
      const y = (p / width) | 0;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const neighbors = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && mask[n] && labels[n] === -1) {
          labels[n] = id;
          stack.push(n);
        }
      }
    }

    components.push({ minX, maxX, minY, maxY, area });
  }

  return components;
}

function unionFind(n) {
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(a) {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];
      a = parent[a];
    }
    return a;
  }
  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }
  return { find, union };
}

function mergeComponents(components) {
  const { find, union } = unionFind(components.length);

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i], b = components[j];
      const gapX = Math.max(0, b.minX - a.maxX, a.minX - b.maxX);
      const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
      if (gapX < MERGE_GAP_PX && overlapY > -6) union(i, j);
    }
  }

  const groups = new Map();
  components.forEach((c, i) => {
    const root = find(i);
    if (!groups.has(root)) {
      groups.set(root, { minX: c.minX, maxX: c.maxX, minY: c.minY, maxY: c.maxY, area: 0 });
    }
    const g = groups.get(root);
    g.minX = Math.min(g.minX, c.minX);
    g.maxX = Math.max(g.maxX, c.maxX);
    g.minY = Math.min(g.minY, c.minY);
    g.maxY = Math.max(g.maxY, c.maxY);
    g.area += c.area;
  });

  return [...groups.values()].filter((g) => g.area >= MIN_COMPONENT_AREA).sort((a, b) => (a.minX + a.maxX) - (b.minX + b.maxX));
}

function cropToDigitTensor(sourceCanvas, box) {
  const boxW = box.maxX - box.minX + 1;
  const boxH = box.maxY - box.minY + 1;
  const inner = 20;
  const scale = inner / Math.max(boxW, boxH);
  const drawW = Math.max(1, Math.round(boxW * scale));
  const drawH = Math.max(1, Math.round(boxH * scale));

  const out = document.createElement('canvas');
  out.width = 28;
  out.height = 28;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    sourceCanvas,
    box.minX, box.minY, boxW, boxH,
    Math.round((28 - drawW) / 2), Math.round((28 - drawH) / 2), drawW, drawH
  );

  const { data } = ctx.getImageData(0, 0, 28, 28);
  const pixels = new Float32Array(784);
  for (let i = 0; i < 784; i++) pixels[i] = data[i * 4 + 3] / 255;
  return pixels;
}

/**
 * Reads ink drawn on `canvas` (alpha channel = ink), segments it into
 * left-to-right digit blobs, and classifies each one.
 * Returns { text, digits: [{ digit, confidence, box }] }.
 */
export function recognizeNumber(canvas) {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, width, height);

  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0;

  const components = labelComponents(mask, width, height);
  const groups = mergeComponents(components);

  const digits = groups.map((box) => {
    const pixels = cropToDigitTensor(canvas, box);
    const { digit, confidence } = predictDigit(pixels);
    return { digit, confidence, box };
  });

  return { text: digits.map((d) => d.digit).join(''), digits };
}
