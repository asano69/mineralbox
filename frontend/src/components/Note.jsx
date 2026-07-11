// frontend/src/components/Note.jsx
// Right pane of the Specimen view. Shows the annotation of whichever
// snippet is currently selected in Directory.jsx. Two modes: view mode
// renders the stored Markdown through marked (sanitized with dompurify);
// edit mode lets the user change it in MonacoEditor. Like Snippet.jsx,
// edits are only persisted to PocketBase once Save is pressed.
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
  const [draft, setDraft] = createSignal(props.snippet?.annotation ?? "");
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  // Reset the draft and drop back to view mode whenever a different
  // snippet is selected, so an unsaved edit never bleeds into another.
  createEffect((prevId) => {
    const id = props.snippet?.id ?? null;
    if (id !== prevId) {
      setDraft(props.snippet?.annotation ?? "");
      setEditing(false);
      setError("");
    }
    return id;
  });

  const dirty = () => draft() !== (props.snippet?.annotation ?? "");
  const snippetHtml = createMemo(() => toHtml(props.snippet?.annotation));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await pb
        .collection("snippets")
        .update(props.snippet.id, { annotation: draft() });
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
          <button
            type="button"
            class="btn"
            onClick={() => setEditing(!editing())}
          >
            {editing() ? "Preview" : "Edit"}
          </button>
        </div>
        <Show
          when={editing()}
          fallback={
            <div class="flex-1 overflow-y-auto">
              <Show
                when={props.snippet.annotation}
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
            {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
          </div>
        </Show>
      </div>
    </Show>
  );
}
