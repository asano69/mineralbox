// frontend/src/components/Note.jsx
// Right pane of the Specimen view. Shows the annotation of whichever
// snippet is currently selected in Directory.jsx. Purely presentational:
// the snippet record is fetched once in Specimen.jsx and passed in as
// props. annotation is stored as Markdown, so it's rendered through marked
// and sanitized with dompurify before being injected.
import { Show, createMemo } from "solid-js";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Converts a Markdown string to sanitized HTML, or "" if empty.
function toHtml(markdown) {
  return markdown ? DOMPurify.sanitize(marked.parse(markdown)) : "";
}

export default function Note(props) {
  const snippetHtml = createMemo(() => toHtml(props.snippet?.annotation));

  return (
    <div class="h-full overflow-y-auto rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-4">
      <Show
        when={props.snippet?.annotation}
        fallback={<p class="opacity-70">Select a file to see its notes.</p>}
      >
        <h3 class="mb-2 font-semibold">{props.snippet.pathname}</h3>
        <div innerHTML={snippetHtml()} />
      </Show>
    </div>
  );
}
