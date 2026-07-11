// frontend/src/components/Snippet.jsx
// Center pane of the Specimen view: lets the user view and edit exactly
// one snippet (the one picked in Directory.jsx) using the same
// MonacoEditor instance in two modes. `current` holds the last-saved
// content locally so the reading view reflects a successful save
// immediately, without waiting on the parent to re-fetch snippets.
import { createSignal, createEffect, Show } from "solid-js";
import MonacoEditor from "./MonacoEditor";
import pb from "../lib/pb";

// Maps a snippet's pathname extension to a MonacoEditor lang value.
// Falls back to "go" since MonacoEditor only registers go/javascript/sql.
const EXT_LANG = { go: "go", js: "javascript", jsx: "javascript", sql: "sql" };

function langFor(pathname) {
  const ext = (pathname || "").split(".").pop();
  return EXT_LANG[ext] || "go";
}

export default function Snippet(props) {
  const [editing, setEditing] = createSignal(false);
  // `current` is the source of truth for reading mode; `draft` is only
  // used while editing and is discarded on Save/Reset.
  const [current, setCurrent] = createSignal(props.snippet?.content ?? "");
  const [draft, setDraft] = createSignal(current());
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  // Reset local state and drop back to reading mode whenever a different
  // snippet is selected, so an unsaved edit never bleeds into another.
  createEffect((prevId) => {
    const id = props.snippet?.id ?? null;
    if (id !== prevId) {
      const content = props.snippet?.content ?? "";
      setCurrent(content);
      setDraft(content);
      setEditing(false);
      setError("");
    }
    return id;
  });

  const dirty = () => draft() !== current();

  const startEditing = () => {
    setDraft(current());
    setError("");
    setEditing(true);
  };

  // Discards the draft and returns to reading mode without saving.
  const handleCancel = () => {
    setDraft(current());
    setError("");
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await pb
        .collection("snippets")
        .update(props.snippet.id, { content: draft() });
      setCurrent(updated.content);
      props.onSaved?.(updated);
      setEditing(false);
    } catch {
      setError("Failed to save the snippet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Show
      when={props.snippet}
      fallback={<p class="opacity-70">Select a file from the directory.</p>}
    >
      <div class="flex h-full flex-col rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-3">
        <div class="mb-2 flex items-center justify-between">
          <p class="font-mono text-sm opacity-70">{props.snippet.pathname}</p>
          <Show when={!editing()}>
            <button type="button" class="btn" onClick={startEditing}>
              Edit
            </button>
          </Show>
        </div>
        <MonacoEditor
          value={editing() ? draft() : current()}
          lang={langFor(props.snippet.pathname)}
          readOnly={!editing()}
          onChange={setDraft}
        />
        <Show when={editing()}>
          <div class="mt-2 flex items-center gap-3">
            <button
              type="button"
              class="btn"
              disabled={!dirty() || saving()}
              onClick={handleSave}
            >
              {saving() ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              class="btn"
              disabled={saving()}
              onClick={handleCancel}
            >
              Reset
            </button>
            {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
          </div>
        </Show>
      </div>
    </Show>
  );
}
