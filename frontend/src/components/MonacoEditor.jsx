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

  onMount(() => {
    editor = monaco.editor.create(container, {
      value: props.value ?? "",
      language: LANG_MAP[props.lang] ?? "plaintext",
      theme: window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "vs-dark"
        : "vs",
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      readOnly: props.readOnly ?? false,
      domReadOnly: props.readOnly ?? false,
    });

    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      if (value !== props.value) props.onChange?.(value);
    });
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

  onCleanup(() => editor?.dispose());

  return (
    <div
      ref={container}
      class="min-h-0 flex-1 rounded-md border border-[var(--color-border-soft)]"
    />
  );
}
