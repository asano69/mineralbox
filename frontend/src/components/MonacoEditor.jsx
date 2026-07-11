// frontend/src/components/MonacoEditor.jsx
// Thin SolidJS wrapper around monaco-editor. Mounts a single editor
// instance on the container div and keeps it in sync with props.value,
// props.lang, and props.readOnly. Edits are reported back via
// props.onChange(newValue).
import { createSignal, onMount, onCleanup, createEffect } from "solid-js";
import * as monaco from "monaco-editor";
import "../lib/monacoWorkers";
import { decorationsForRanges } from "../lib/lineAnchors";

// Maps this app's lang select values to Monaco's language ids.
const LANG_MAP = {
  go: "go",
  javascript: "javascript",
  sql: "sql",
  markdown: "markdown",
};

export default function MonacoEditor(props) {
  let container;
  let editor;
  let anchorDecorations;

  // Tracked as a signal (not just a local variable) because the line-anchor
  // highlight's lightness depends on it (see lineAnchors.js), so switching
  // color scheme mid-session needs to trigger a decoration refresh too.
  const [dark, setDark] = createSignal(false);

  // Recomputes the persistent line-anchor highlight from props.lineAnchors,
  // dark(), and the editor's current line count. Called both reactively
  // (below) and imperatively after any content change, since editing the
  // code can shift how many lines exist.
  const refreshAnchorDecorations = () => {
    if (!editor) return;
    const ranges = props.lineAnchors ?? [];
    anchorDecorations.set(
      decorationsForRanges(
        monaco,
        editor.getModel().getLineCount(),
        ranges,
        dark(),
      ),
    );
  };

  onMount(() => {
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(darkQuery.matches);

    editor = monaco.editor.create(container, {
      value: props.value ?? "",
      language: LANG_MAP[props.lang] ?? "plaintext",
      theme: dark() ? "vs-dark" : "vs",
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      readOnly: props.readOnly ?? false,
      domReadOnly: props.readOnly ?? false,
    });

    anchorDecorations = editor.createDecorationsCollection();

    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      if (value !== props.value) props.onChange?.(value);
      refreshAnchorDecorations();
    });

    // Switch the editor's theme whenever the OS/browser color scheme
    // changes, instead of only reading it once at creation time.
    const handleThemeChange = (e) => {
      setDark(e.matches);
      monaco.editor.setTheme(e.matches ? "vs-dark" : "vs");
    };
    darkQuery.addEventListener("change", handleThemeChange);
    onCleanup(() => darkQuery.removeEventListener("change", handleThemeChange));
  });

  // Keep the model's language in sync when the user switches the lang select.
  createEffect(() => {
    const lang = LANG_MAP[props.lang] ?? "plaintext";
    if (editor) monaco.editor.setModelLanguage(editor.getModel(), lang);
  });

  // Keep read-only state in sync, e.g. toggling between a reading mode
  // and an editing mode for the same editor instance.
  createEffect(() => {
    const readOnly = props.readOnly ?? false;
    if (editor) editor.updateOptions({ readOnly, domReadOnly: readOnly });
  });

  // Keep the editor's text in sync when the value changes externally,
  // e.g. selecting a different snippet to edit.
  createEffect(() => {
    if (editor && props.value !== editor.getValue()) {
      editor.setValue(props.value ?? "");
    }
  });

  // Always highlight every "#L23" / "#L32-L34" line-anchor mentioned in
  // the snippet's annotation, not just the one most recently clicked, and
  // recompute whenever the color scheme flips (light <-> dark).
  createEffect(() => {
    props.lineAnchors; // track
    dark(); // track
    refreshAnchorDecorations();
  });

  // Reveals (scrolls to) props.highlightRange, e.g. after clicking a
  // line-anchor button in Note's preview. The range is already colored
  // by the effect above, so this only needs to move the viewport.
  createEffect(() => {
    const range = props.highlightRange;
    if (editor && range) editor.revealLineInCenter(range.start);
  });

  onCleanup(() => editor?.dispose());

  return (
    <div
      ref={container}
      class="min-h-0 flex-1 rounded-md border border-[var(--color-border-soft)]"
    />
  );
}
