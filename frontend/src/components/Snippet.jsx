// frontend/src/components/Snippet.jsx
// Center pane of the Specimen view: lets the user edit and save exactly
// one snippet (the one picked in Directory.jsx). Editing happens in
// Monaco; the content is only persisted to PocketBase once Save is
// pressed, so navigating away without saving discards the draft.
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
  const [draft, setDraft] = createSignal(props.snippet?.content ?? "");
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  // Reset the draft whenever a different snippet is selected, so an
  // unsaved edit to one file never bleeds into another.
  createEffect((prevId) => {
    const id = props.snippet?.id ?? null;
    if (id !== prevId) {
      setDraft(props.snippet?.content ?? "");
      setError("");
    }
    return id;
  });

  const dirty = () => draft() !== (props.snippet?.content ?? "");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await pb
        .collection("snippets")
        .update(props.snippet.id, { content: draft() });
      props.onSaved?.(updated);
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
        <p class="mb-2 font-mono text-sm opacity-70">{props.snippet.pathname}</p>
        <MonacoEditor
          value={draft()}
          lang={langFor(props.snippet.pathname)}
          onChange={setDraft}
        />
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
      </div>
    </Show>
  );
}
