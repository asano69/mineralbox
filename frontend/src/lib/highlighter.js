// frontend/src/lib/highlighter.js
// Lazily creates a single shared Shiki highlighter limited to the
// three languages this app actually supports, so the bundle stays small
// and there is only one highlighter instance for the whole app.
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

let highlighterPromise;

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import("shiki/themes/github-dark.mjs")],
      langs: [
        import("shiki/langs/go.mjs"),
        import("shiki/langs/jsx.mjs"),
        import("shiki/langs/sql.mjs"),
      ],
      // No WASM engine needed, which keeps the setup simpler.
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}
