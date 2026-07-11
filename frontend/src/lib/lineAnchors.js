// frontend/src/lib/lineAnchors.js
// Shared logic for "#L23" / "#L32-L34" line-anchor references, used by
// both the annotation preview (Note.jsx, which renders them as colored
// buttons) and the code editor (MonacoEditor.jsx, which highlights the
// referenced lines). Keeping the color logic in one place is what
// guarantees the button hue and the editor highlight always agree.
import { createSignal } from "solid-js";

// Matches a line-anchor reference: "#L32", "#L32-L35", or "#L32-35"
// (the second "L" is optional). Not anchored at the end, since bare
// mentions are surrounded by other running text.
const LINE_ANCHOR = /^#L(\d+)(?:-L?(\d+))?/;

// Parses a line-anchor string into { raw, start, end }, or null if it
// doesn't match. `raw` is only the matched prefix, so callers that need
// an exact full-string match (e.g. a link's href) must compare lengths
// themselves.
export function parseLineAnchor(str) {
  const match = LINE_ANCHOR.exec(str);
  if (!match) return null;
  const [raw, start, end] = match;
  return { raw, start: Number(start), end: end ? Number(end) : Number(start) };
}

// Finds every line-anchor mention in a block of annotation markdown,
// covering both forms Note.jsx's Marked extension understands:
// "[label](#L32-L35)" links and bare "#L32-L35" mentions.
export function findLineAnchors(markdown) {
  if (!markdown) return [];
  const matches = markdown.match(/#L\d+(?:-L?\d+)?/g) ?? [];
  return matches.map(parseLineAnchor).filter(Boolean);
}

// --- Light/dark mode -----------------------------------------------------
//
// Single shared signal for the OS/browser color scheme, so Note.jsx's
// button colors and MonacoEditor's theme/highlight colors always react
// to the same source instead of each component polling matchMedia on
// its own.
const prefersDark =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

const [isDarkMode, setIsDarkMode] = createSignal(prefersDark?.matches ?? false);

prefersDark?.addEventListener("change", (e) => setIsDarkMode(e.matches));

export { isDarkMode };

// --- Color ---------------------------------------------------------------
//
// Every range gets a hue by hashing "start-end", so the same range
// always gets the same hue and different ranges are spread around the
// wheel (collisions are fine). Only the hue is shared between the
// button and the editor highlight below - saturation, lightness, and
// alpha are each tuned separately for what they're rendered on top of.

// Deterministic 32-bit hash (FNV-1a). Not security-sensitive, just used
// to spread ranges around the hue wheel.
function hashString(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function hueForRange({ start, end }) {
  return hashString(`${start}-${end}`) % 360;
}

// Circular mean of several hues (0-360), used when multiple ranges
// cover the same line in the editor. Averaging hue this way keeps the
// result a real, saturated color; averaging RGB channels washes toward
// gray/white as more colors overlap, which is exactly the illegibility
// problem this replaces.
function meanHue(hues) {
  let sin = 0;
  let cos = 0;
  for (const h of hues) {
    const rad = (h * Math.PI) / 180;
    sin += Math.sin(rad);
    cos += Math.cos(rad);
  }
  const deg = (Math.atan2(sin, cos) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}

// Background color for a line-anchor button in Note.jsx's preview.
// Lightness follows isDarkMode() so the badge stays visible against
// both a white and a black page background; textColorForRange below
// picks a matching text color so contrast holds in both cases.
export function colorForRange(range) {
  const lightness = isDarkMode() ? 60 : 38;
  return `hsl(${hueForRange(range)}, 65%, ${lightness}%)`;
}

// Text color to pair with colorForRange's background: dark mode's
// lighter badge needs dark text, light mode's darker badge needs light
// text.
export function textColorForRange() {
  return isDarkMode() ? "#1a1a1a" : "#ffffff";
}

// Background color for a Monaco line highlight covering `line`, or null
// if no range covers it. Only the hue is shared with the button color;
// lightness leans toward the editor's own background (near-white in
// light mode, near-black in dark mode) instead of a fixed mid-tone, and
// a low alpha lets the syntax-highlighted code show through, so the
// line reads as a soft tint rather than a block that fights the text.
function lineHighlightColor(ranges, line) {
  const covering = ranges.filter((r) => line >= r.start && line <= r.end);
  if (covering.length === 0) return null;
  const hue = meanHue(covering.map(hueForRange));
  const lightness = isDarkMode() ? 25 : 85;
  return `hsla(${hue}, 70%, ${lightness}%, 0.35)`;
}

// --- Monaco decorations ---------------------------------------------------
//
// Monaco decorations take a CSS className, not an inline color, so each
// color string needs its own tiny stylesheet rule. This injects one
// lazily the first time a color is used and reuses it after that.
let styleEl;
const classNameByColor = new Map();

function classNameForColor(color) {
  if (classNameByColor.has(color)) return classNameByColor.get(color);
  if (!styleEl) {
    styleEl = document.createElement("style");
    document.head.appendChild(styleEl);
  }
  const className = `line-anchor-bg-${classNameByColor.size}`;
  styleEl.sheet.insertRule(
    `.${className} { background-color: ${color} !important; }`,
  );
  classNameByColor.set(color, className);
  return className;
}

// Builds whole-line decorations covering every line 1..lineCount, one
// decoration per contiguous band of lines that resolve to the same
// (possibly hue-blended) color. Lines covered by no range get no
// decoration. Reads isDarkMode() itself (via lineHighlightColor), so
// callers don't need to pass light/dark through.
export function decorationsForRanges(monaco, lineCount, ranges) {
  const decorations = [];
  let bandStart = null;
  let bandColor = null;

  const flush = (bandEnd) => {
    if (bandColor) {
      decorations.push({
        range: new monaco.Range(bandStart, 1, bandEnd, 1),
        options: {
          isWholeLine: true,
          className: classNameForColor(bandColor),
        },
      });
    }
  };

  for (let line = 1; line <= lineCount; line++) {
    const color = lineHighlightColor(ranges, line);
    if (color !== bandColor) {
      flush(line - 1);
      bandStart = line;
      bandColor = color;
    }
  }
  flush(lineCount);

  return decorations;
}
