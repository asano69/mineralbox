// frontend/src/components/Snippet.jsx
// Center pane of the Specimen view: lets the user view and edit exactly
// one snippet (the one picked in Directory.jsx) using the same
// MonacoEditor instance in two modes. `current`/`currentPathname` hold
// the last-saved content and pathname locally so the reading view
// reflects a successful save immediately, without waiting on the
// parent to re-fetch snippets.
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
  // `current`/`draft` are the source of truth for reading mode / the
  // in-progress edit for content; `currentPathname`/`draftPathname` are
  // the same pair for the pathname. Both drafts are only used while
  // editing and are discarded on Save/Reset.
  const [current, setCurrent] = createSignal(props.snippet?.content ?? "");
  const [draft, setDraft] = createSignal(current());
  const [currentPathname, setCurrentPathname] = createSignal(props.snippet?.pathname ?? "");
  const [draftPathname, setDraftPathname] = createSignal(currentPathname());
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  // Reset local state and drop back to reading mode whenever a different
  // snippet is selected, so an unsaved edit never bleeds into another.
  createEffect((prevId) => {
    const id = props.snippet?.id ?? null;
    if (id !== prevId) {
      const content = props.snippet?.content ?? "";
      const pathname = props.snippet?.pathname ?? "";
      setCurrent(content);
      setDraft(content);
      setCurrentPathname(pathname);
      setDraftPathname(pathname);
      setEditing(false);
      setError("");
    }
    return id;
  });

  const dirty = () => draft() !== current() || draftPathname() !== currentPathname();

  const startEditing = () => {
    setDraft(current());
    setDraftPathname(currentPathname());
    setError("");
    setEditing(true);
  };

  // Discards the draft and returns to reading mode without saving.
  const handleCancel = () => {
    setDraft(current());
    setDraftPathname(currentPathname());
    setError("");
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await pb
        .collection("snippets")
        .update(props.snippet.id, { content: draft(), pathname: draftPathname() });
      setCurrent(updated.content);
      setCurrentPathname(updated.pathname);
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
        <div class="mb-2 flex items-center justify-between gap-2">
          <Show
            when={editing()}
            fallback={<p class="font-mono text-sm opacity-70">{currentPathname()}</p>}
          >
            <input
              type="text"
              value={draftPathname()}
              onInput={(e) => setDraftPathname(e.target.value)}
              class="flex-1 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 font-mono text-sm text-[var(--color-text)]"
            />
          </Show>
          <Show when={!editing()}>
            <button type="button" class="btn" onClick={startEditing}>
              Edit
            </button>
          </Show>
        </div>
        <MonacoEditor
          value={editing() ? draft() : current()}
          lang={langFor(editing() ? draftPathname() : currentPathname())}
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
