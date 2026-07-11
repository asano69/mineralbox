// frontend/src/components/Note.jsx
import { createMemo, Show } from "solid-js";
import { Marked } from "marked";
import DOMPurify from "dompurify";
import MonacoEditor from "./MonacoEditor";
import pb from "../lib/pb";
import { createEditableRecord } from "../lib/createEditableRecord";

// Matches the "#L32" / "#L32-L35" line-anchor links used to reference
// specific lines of the current snippet's code from within a note, e.g.
// "see [the loop](#L32-L35)".
const LINE_ANCHOR = /^#L(\d+)(?:-L(\d+))?$/;

// A dedicated Marked instance keeps this override local to Note.jsx
// instead of mutating the shared/global marked renderer.
const markedWithLineAnchors = new Marked();
markedWithLineAnchors.use({
  renderer: {
    link(token) {
      const match = LINE_ANCHOR.exec(token.href);
      if (!match) return false; // fall back to the default <a> rendering
      const [, start, end] = match;
      const text = this.parser.parseInline(token.tokens);
      return `<button type="button" class="line-anchor" data-line-start="${start}" data-line-end="${end || start}">${text}</button>`;
    },
  },
});

function toHtml(markdown) {
  return markdown
    ? DOMPurify.sanitize(markedWithLineAnchors.parse(markdown))
    : "";
}

export default function Note(props) {
  const editable = createEditableRecord(
    () => props.snippet,
    ["annotation"],
    (patch) => pb.collection("snippets").update(props.snippet.id, patch),
  );

  const snippetHtml = createMemo(() => toHtml(editable.current().annotation));

  // Delegated click handler for the "#L32-L35" line-anchor buttons inside
  // the rendered markdown (event delegation, since content set via
  // innerHTML can't carry Solid event handlers directly).
  const handlePreviewClick = (e) => {
    const button = e.target.closest(".line-anchor");
    if (!button) return;
    props.onLineClick?.(
      Number(button.dataset.lineStart),
      Number(button.dataset.lineEnd),
    );
  };

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
                <div
                  class="markdown"
                  innerHTML={snippetHtml()}
                  onClick={handlePreviewClick}
                />
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
