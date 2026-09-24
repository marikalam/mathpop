/**
 * Tiny handwritten-digit classifier (784 -> 256 -> 128 -> 10 MLP) trained
 * offline on MNIST with shift/thickness augmentation to better match messy
 * kid handwriting. Runs fully client-side — no server, no network at
 * runtime beyond the one-time model download.
 */

const SHAPES = [
  ['W1', 784, 256],
  ['b1', 1, 256],
  ['W2', 256, 128],
  ['b2', 1, 128],
  ['W3', 128, 10],
  ['b3', 1, 10],
];

let weights = null;
let loadingPromise = null;

export function loadDigitModel() {
  if (weights) return Promise.resolve(weights);
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch(`${import.meta.env.BASE_URL}digit-model.bin`)
    .then((res) => res.arrayBuffer())
    .then((buf) => {
      const parsed = {};
      let offset = 0;
      for (const [name, rows, cols] of SHAPES) {
        const count = rows * cols;
        parsed[name] = new Float32Array(buf, offset, count);
        offset += count * 4;
      }
      weights = parsed;
      return weights;
    });
  return loadingPromise;
}

function relu(v) {
  for (let i = 0; i < v.length; i++) if (v[i] < 0) v[i] = 0;
  return v;
}

// x: Float32Array(inDim). W: Float32Array(inDim*outDim), row-major [in][out]. b: Float32Array(outDim).
function dense(x, W, b, inDim, outDim) {
  const out = new Float32Array(outDim);
  out.set(b);
  for (let i = 0; i < inDim; i++) {
    const xi = x[i];
    if (xi === 0) continue;
    const rowOffset = i * outDim;
    for (let j = 0; j < outDim; j++) {
      out[j] += xi * W[rowOffset + j];
    }
  }
  return out;
}

function softmax(v) {
  let max = -Infinity;
  for (let i = 0; i < v.length; i++) if (v[i] > max) max = v[i];
  let sum = 0;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) {
    out[i] = Math.exp(v[i] - max);
    sum += out[i];
  }
  for (let i = 0; i < v.length; i++) out[i] /= sum;
  return out;
}

/**
 * pixels: Float32Array(784), row-major 28x28, values 0 (background) to 1 (ink) — same convention as MNIST.
 * Returns { digit, confidence }.
 */
export function predictDigit(pixels) {
  if (!weights) throw new Error('digit model not loaded yet');
  const h1 = relu(dense(pixels, weights.W1, weights.b1, 784, 256));
  const h2 = relu(dense(h1, weights.W2, weights.b2, 256, 128));
  const out = softmax(dense(h2, weights.W3, weights.b3, 128, 10));

  let best = 0;
  for (let i = 1; i < 10; i++) if (out[i] > out[best]) best = i;
  return { digit: best, confidence: out[best] };
}
