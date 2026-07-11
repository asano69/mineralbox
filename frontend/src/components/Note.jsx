// frontend/src/components/Note.jsx
import { createMemo, Show } from "solid-js";
import { Marked } from "marked";
import DOMPurify from "dompurify";
import MonacoEditor from "./MonacoEditor";
import pb from "../lib/pb";
import { createEditableRecord } from "../lib/createEditableRecord";
import { parseLineAnchor, colorForRange, textColorForRange } from "../lib/lineAnchors";

// Renders a line-anchor as a button, colored the same way MonacoEditor
// colors the referenced lines (see lib/lineAnchors.js), so the preview
// and the editor always agree on which range means which color. Both
// colors read the shared light/dark signal, so the button stays legible
// in either mode.
function lineAnchorButton(start, end, label) {
  const range = { start, end };
  const background = colorForRange(range);
  const color = textColorForRange(range);
  return `<button type="button" class="line-anchor" style="background-color:${background};color:${color}" data-line-start="${start}" data-line-end="${end}">${label}</button>`;
}

// A dedicated Marked instance keeps this override local to Note.jsx
// instead of mutating the shared/global marked renderer.
const markedWithLineAnchors = new Marked();
markedWithLineAnchors.use({
  // Handles the explicit "[label](#L32-L35)" markdown link form, keeping
  // the caller's own label instead of the raw "#L32-L35" text.
  renderer: {
    link(token) {
      const anchor = parseLineAnchor(token.href);
      if (!anchor || anchor.raw !== token.href) return false; // fall back to the default <a> rendering
      const text = this.parser.parseInline(token.tokens);
      return lineAnchorButton(anchor.start, anchor.end, text);
    },
  },
  // Handles a bare "#L32-L35" mention anywhere in running text, with no
  // link syntax required.
  extensions: [
    {
      name: "lineAnchor",
      level: "inline",
      start(src) {
        const index = src.search(/#L\d+/);
        return index === -1 ? undefined : index;
      },
      tokenizer(src) {
        const anchor = parseLineAnchor(src);
        if (!anchor) return;
        return { type: "lineAnchor", raw: anchor.raw, start: anchor.start, end: anchor.end };
      },
      renderer(token) {
        const label =
          token.end !== token.start ? `#L${token.start}-L${token.end}` : `#L${token.start}`;
        return lineAnchorButton(token.start, token.end, label);
      },
    },
  ],
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
