// frontend/src/components/MonacoEditor.jsx
// Thin SolidJS wrapper around monaco-editor. Mounts a single editor
// instance on the container div and keeps it in sync with props.value,
// props.lang, and props.readOnly. Edits are reported back via
// props.onChange(newValue).
import { onMount, onCleanup, createEffect } from "solid-js";
import * as monaco from "monaco-editor";
import "../lib/monacoWorkers";

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
  let highlightDecorations;

  onMount(() => {
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

    editor = monaco.editor.create(container, {
      value: props.value ?? "",
      language: LANG_MAP[props.lang] ?? "plaintext",
      theme: darkQuery.matches ? "vs-dark" : "vs",
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      readOnly: props.readOnly ?? false,
      domReadOnly: props.readOnly ?? false,
    });

    highlightDecorations = editor.createDecorationsCollection();

    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      if (value !== props.value) props.onChange?.(value);
    });

    // Switch the editor's theme whenever the OS/browser color scheme
    // changes, instead of only reading it once at creation time.
    const handleThemeChange = (e) => {
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

  // Reveals and highlights props.highlightRange ({ start, end }), e.g.
  // after clicking a "#L32-L35" line-anchor link in Note's preview.
  // Setting highlightRange to null clears the highlight.
  createEffect(() => {
    if (!editor) return;
    const range = props.highlightRange;
    if (!range) {
      highlightDecorations.set([]);
      return;
    }
    editor.revealLineInCenter(range.start);
    highlightDecorations.set([
      {
        range: new monaco.Range(range.start, 1, range.end, 1),
        options: { isWholeLine: true, className: "line-highlight" },
      },
    ]);
  });

  onCleanup(() => editor?.dispose());

  return (
    <div
      ref={container}
      class="min-h-0 flex-1 rounded-md border border-[var(--color-border-soft)]"
    />
  );
}
