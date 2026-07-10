// frontend/src/components/Note.jsx
// Right pane of the Specimen view. Shows the specimen's own label,
// description, and free-form note, plus the annotation of whichever
// snippet is currently selected in Directory.jsx (updates as selection changes).
import { createResource, Show } from "solid-js";
import pb from "../lib/pb";

export default function Note(props) {
  const [specimen] = createResource(
    () => props.specimenId,
    (specimenId) => pb.collection("specimens").getOne(specimenId),
  );

  const [snippet] = createResource(
  () => props.snippetId,
  (snippetId) =>
    pb.collection("snippets").getOne(snippetId, { requestKey: "note-snippet" }),
);

  return (
   <div class="h-full overflow-y-auto rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-4">
    <Show when={specimen()} fallback={<p class="opacity-70">Loading…</p>}>
        <h2 class="mb-2 font-serif text-2xl">{specimen().label || "(untitled)"}</h2>
        <Show when={specimen().description}>
          <p class="mb-4 opacity-80">{specimen().description}</p>
        </Show>
      
      </Show>

      <Show when={snippet()?.annotation}>
        <hr class="my-4 border-[var(--color-border-soft)]" />
        <h3 class="mb-2 font-semibold">{snippet().pathname}</h3>
        <p class="whitespace-pre-wrap">{snippet().annotation}</p>
      </Show>
    </div>
  );
}
