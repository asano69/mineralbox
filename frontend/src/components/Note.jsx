// frontend/src/components/Note.jsx
// Right pane of the Specimen view. Shows the annotation of whichever
// snippet is currently selected in Directory.jsx. Two modes: view mode
// renders the stored Markdown through marked (sanitized with dompurify);
// edit mode lets the user change it in MonacoEditor. `current` holds the
// last-saved annotation locally so the preview reflects a successful
// save immediately, without waiting on the parent to re-fetch snippets.
import { createSignal, createEffect, createMemo, Show } from "solid-js";
import { marked } from "marked";
import DOMPurify from "dompurify";
import MonacoEditor from "./MonacoEditor";
import pb from "../lib/pb";

// Converts a Markdown string to sanitized HTML, or "" if empty.
function toHtml(markdown) {
  return markdown ? DOMPurify.sanitize(marked.parse(markdown)) : "";
}

export default function Note(props) {
  const [editing, setEditing] = createSignal(false);
  // `current` is the source of truth for the preview; `draft` is only
  // used while editing and is discarded on Save/Reset.
  const [current, setCurrent] = createSignal(props.snippet?.annotation ?? "");
  const [draft, setDraft] = createSignal(current());
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  // Reset local state and drop back to view mode whenever a different
  // snippet is selected, so an unsaved edit never bleeds into another.
  createEffect((prevId) => {
    const id = props.snippet?.id ?? null;
    if (id !== prevId) {
      const annotation = props.snippet?.annotation ?? "";
      setCurrent(annotation);
      setDraft(annotation);
      setEditing(false);
      setError("");
    }
    return id;
  });

  const dirty = () => draft() !== current();
  const snippetHtml = createMemo(() => toHtml(current()));

  const startEditing = () => {
    setDraft(current());
    setError("");
    setEditing(true);
  };

  // Discards the draft and returns to the preview without saving.
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
        .update(props.snippet.id, { annotation: draft() });
      setCurrent(updated.annotation);
      props.onSaved?.(updated);
      setEditing(false);
    } catch {
      setError("Failed to save the note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Show
      when={props.snippet}
      fallback={<p class="opacity-70">Select a file to see its notes.</p>}
    >
      <div class="flex h-full flex-col rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-4">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-semibold">{props.snippet.pathname}</h3>
          <Show when={!editing()}>
            <button type="button" class="btn" onClick={startEditing}>
              Edit
            </button>
          </Show>
        </div>
        <Show
          when={editing()}
          fallback={
            <div class="flex-1 overflow-y-auto">
              <Show
                when={current()}
                fallback={<p class="opacity-70">No notes yet.</p>}
              >
                <div innerHTML={snippetHtml()} />
              </Show>
            </div>
          }
        >
          <MonacoEditor value={draft()} lang="markdown" onChange={setDraft} />
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
