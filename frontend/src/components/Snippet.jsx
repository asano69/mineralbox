// frontend/src/components/Snippet.jsx
// Center pane of the Specimen view: renders exactly one snippet (the one
// picked in Directory.jsx), read-only in Monaco.
import { createResource, Show } from "solid-js";
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
const [snippet] = createResource(
  () => props.snippetId,
  (snippetId) =>
    pb.collection("snippets").getOne(snippetId, { requestKey: "content-snippet" }),
);

  return (
    <Show
      when={snippet()}
      fallback={<p class="opacity-70">Select a file from the directory.</p>}
    >
    <div class="flex h-full flex-col rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-3">
    <p class="mb-2 font-mono text-sm opacity-70">{snippet().pathname}</p>
    <MonacoEditor
      value={snippet().content}
      lang={langFor(snippet().pathname)}
      readOnly
    />
  </div>
</Show>   
  );
}
