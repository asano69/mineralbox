// frontend/src/components/Note.jsx
// Right pane of the Specimen view. Shows the specimen's own label,
// description, plus the annotation of whichever snippet is currently
// selected in Directory.jsx. Purely presentational: both records are
// fetched once in Specimen.jsx and passed in as props.
// description/annotation are stored as Markdown, so they're rendered
// through marked and sanitized with dompurify before being injected.
import { Show, createMemo } from "solid-js";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Converts a Markdown string to sanitized HTML, or "" if empty.
function toHtml(markdown) {
  return markdown ? DOMPurify.sanitize(marked.parse(markdown)) : "";
}

export default function Note(props) {
  const specimenHtml = createMemo(() => toHtml(props.specimen?.description));
  const snippetHtml = createMemo(() => toHtml(props.snippet?.annotation));

  return (
    <div class="h-full overflow-y-auto rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-4">
      <Show when={props.specimen} fallback={<p class="opacity-70">Loading…</p>}>
        <h2 class="mb-2 font-serif text-2xl">{props.specimen.label || "(untitled)"}</h2>
        <Show when={props.specimen.description}>
          <div class="mb-4 opacity-80" innerHTML={specimenHtml()} />
        </Show>
      </Show>

      <Show when={props.snippet?.annotation}>
        <hr class="my-4 border-[var(--color-border-soft)]" />
        <h3 class="mb-2 font-semibold">{props.snippet.pathname}</h3>
        <div innerHTML={snippetHtml()} />
      </Show>
    </div>
  );
}
