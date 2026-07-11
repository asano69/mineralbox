// frontend/src/components/Note.jsx
import { createMemo, Show } from "solid-js";
import { marked } from "marked";
import DOMPurify from "dompurify";
import MonacoEditor from "./MonacoEditor";
import pb from "../lib/pb";
import { createEditableRecord } from "../lib/createEditableRecord";

function toHtml(markdown) {
  return markdown ? DOMPurify.sanitize(marked.parse(markdown)) : "";
}

export default function Note(props) {
  const editable = createEditableRecord(
    () => props.snippet,
    ["annotation"],
    (patch) => pb.collection("snippets").update(props.snippet.id, patch),
  );

  const snippetHtml = createMemo(() => toHtml(editable.current().annotation));

  const handleSave = async () => {
    try {
      props.onSaved?.(await editable.commit());
    } catch {
      // surfaced via editable.error()
    }
  };

  return (
    <Show
      when={props.snippet}
      fallback={<p class="opacity-70">Select a file to see its notes.</p>}
    >
      <div class="flex h-full flex-col rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-4">
        <div class="mb-2 flex items-center justify-between">
          <Show when={!editable.editing()}>
            <button type="button" class="btn" onClick={editable.startEditing}>
              Edit
            </button>
          </Show>
        </div>
        <Show
          when={editable.editing()}
          fallback={
            <div class="flex-1 overflow-y-auto">
              <Show
                when={editable.current().annotation}
                fallback={<p class="opacity-70">No notes yet.</p>}
              >
                <div class="markdown" innerHTML={snippetHtml()} />
              </Show>
            </div>
          }
        >
          <MonacoEditor
            value={editable.draft().annotation}
            lang="markdown"
            onChange={(v) => editable.setField("annotation", v)}
          />
          <div class="mt-2 flex items-center gap-3">
            <button
              type="button"
              class="btn"
              disabled={!editable.dirty() || editable.saving()}
              onClick={handleSave}
            >
              {editable.saving() ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              class="btn"
              disabled={editable.saving()}
              onClick={editable.cancel}
            >
              Reset
            </button>
            {editable.error() && (
              <p class="text-sm text-[#dc3545]">{editable.error()}</p>
            )}
          </div>
        </Show>
      </div>
    </Show>
  );
}
