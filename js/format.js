// Number & text formatting helpers.

const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

// Compact number formatting, e.g. 1532 -> "1.53K".
export function fmt(n) {
  if (n === Infinity) return "∞";
  const sign = n < 0 ? "-" : "";
  n = Math.abs(n);
  if (n < 1000) {
    return sign + (Number.isInteger(n) ? n.toString() : n.toFixed(n < 10 ? 1 : 0));
  }
  let tier = Math.floor(Math.log10(n) / 3);
  tier = Math.min(tier, SUFFIXES.length - 1);
  const scaled = n / Math.pow(1000, tier);
  return sign + scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0) + SUFFIXES[tier];
}

// Format a per-second rate.
export function fmtRate(n) {
  const s = fmt(Math.abs(n));
  return (n >= 0 ? "+" : "-") + s + "/s";
}

// Clamp helper.
export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Format seconds -> "1m 20s" / "45s".
export function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  if (sec < 60) return sec + "s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
