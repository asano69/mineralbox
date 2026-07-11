// frontend/src/components/Snippet.jsx
import { Show } from "solid-js";
import MonacoEditor from "./MonacoEditor";
import pb from "../lib/pb";
import { createEditableRecord } from "../lib/createEditableRecord";

const EXT_LANG = { go: "go", js: "javascript", jsx: "javascript", sql: "sql" };
function langFor(pathname) {
  const ext = (pathname || "").split(".").pop();
  return EXT_LANG[ext] || "go";
}

export default function Snippet(props) {
  const editable = createEditableRecord(
    () => props.snippet,
    ["content", "pathname"],
    (patch) => pb.collection("snippets").update(props.snippet.id, patch),
  );

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
      fallback={<p class="opacity-70">Select a file from the directory.</p>}
    >
      <div class="flex h-full flex-col rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-3">
        <div class="mb-2 flex items-center justify-between gap-2">
          <Show
            when={editable.editing()}
            fallback={
              <p class="font-mono text-sm opacity-70">
                {editable.current().pathname}
              </p>
            }
          >
            <input
              type="text"
              value={editable.draft().pathname}
              onInput={(e) => editable.setField("pathname", e.target.value)}
              class="flex-1 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 font-mono text-sm text-[var(--color-text)]"
            />
          </Show>
          <Show when={!editable.editing()}>
            <button type="button" class="btn" onClick={editable.startEditing}>
              Edit
            </button>
          </Show>
        </div>
<MonacoEditor
          value={
            editable.editing()
              ? editable.draft().content
              : editable.current().content
          }
          lang={langFor(
            editable.editing()
              ? editable.draft().pathname
              : editable.current().pathname,
          )}
          readOnly={!editable.editing()}
          highlightRange={props.highlightRange}
          lineAnchors={props.lineAnchors}
          onChange={(v) => editable.setField("content", v)}
        />
        <Show when={editable.editing()}>
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
