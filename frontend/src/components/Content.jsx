// frontend/src/components/Content.jsx
// Left pane of the Specimen view: every snippet (code file) attached to
// this specimen, each rendered read-only in Monaco.
import { createResource, For, Show } from "solid-js";
import MonacoEditor from "./MonacoEditor";
import pb from "../lib/pb";

// Maps a snippet's pathname extension to a MonacoEditor lang value.
// Falls back to "go" since MonacoEditor only registers go/javascript/sql.
const EXT_LANG = { go: "go", js: "javascript", jsx: "javascript", sql: "sql" };

function langFor(pathname) {
  const ext = (pathname || "").split(".").pop();
  return EXT_LANG[ext] || "go";
}

export default function Content(props) {
  const [snippets] = createResource(
    () => props.specimenId,
    (specimenId) =>
      pb.collection("snippets").getFullList({
        filter: `specimen = "${specimenId}"`,
        sort: "pathname",
      }),
  );

  return (
    <div class="flex flex-col gap-4">
      <Show
        when={(snippets() ?? []).length > 0}
        fallback={<p class="opacity-70">No snippets for this specimen.</p>}
      >
        <For each={snippets()}>
          {(snippet) => (
            <div class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-3">
              <p class="mb-2 font-mono text-sm opacity-70">{snippet.pathname}</p>
              <MonacoEditor
                value={snippet.content}
                lang={langFor(snippet.pathname)}
                readOnly
              />
              <Show when={snippet.annotation}>
                <p class="mt-2 text-sm opacity-80">{snippet.annotation}</p>
              </Show>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}
