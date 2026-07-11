// frontend/src/components/Note.jsx
// Right pane of the Specimen view. Lets the user edit the specimen's own
// description and the annotation of whichever snippet is currently
// selected in Directory.jsx. The two fields belong to different
// PocketBase records (specimens vs snippets), so each has its own Save
// button and is persisted independently.
//
// Both fields are edited as raw Markdown directly in Monaco. There is no
// rendered preview here on purpose, to keep this component simple.
import { createSignal, createEffect, Show } from "solid-js";
import MonacoEditor from "./MonacoEditor";
import pb from "../lib/pb";

// One Markdown field with its own draft/dirty/save state. resetKey
// identifies the record the field belongs to, so switching specimens or
// snippets swaps in the new value instead of keeping a stale draft.
function EditableMarkdown(props) {
  const [draft, setDraft] = createSignal(props.value ?? "");
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  createEffect((prevKey) => {
    if (props.resetKey !== prevKey) {
      setDraft(props.value ?? "");
      setError("");
    }
    return props.resetKey;
  });

  const dirty = () => draft() !== (props.value ?? "");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await props.onSave(draft());
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="flex h-48 flex-col gap-2">
      <MonacoEditor value={draft()} lang="markdown" onChange={setDraft} />
      <div class="flex items-center gap-3">
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
  );
}

export default function Note(props) {
  return (
    <div class="h-full overflow-y-auto rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-4">
      <Show when={props.specimen} fallback={<p class="opacity-70">Loading…</p>}>
        <h2 class="mb-2 font-serif text-2xl">{props.specimen.label || "(untitled)"}</h2>
        <EditableMarkdown
          resetKey={props.specimen.id}
          value={props.specimen.description}
          onSave={(value) =>
            pb
              .collection("specimens")
              .update(props.specimen.id, { description: value })
              .then((updated) => props.onSpecimenSaved?.(updated))
          }
        />
      </Show>

      <Show when={props.snippet}>
        <hr class="my-4 border-[var(--color-border-soft)]" />
        <h3 class="mb-2 font-semibold">{props.snippet.pathname}</h3>
        <EditableMarkdown
          resetKey={props.snippet.id}
          value={props.snippet.annotation}
          onSave={(value) =>
            pb
              .collection("snippets")
              .update(props.snippet.id, { annotation: value })
              .then((updated) => props.onSnippetSaved?.(updated))
          }
        />
      </Show>
    </div>
  );
}
