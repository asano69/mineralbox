// frontend/src/components/Note.jsx
// Right pane of the Specimen view: the specimen's own label, description,
// and free-form note (not to be confused with a snippet's per-file
// annotation, which is rendered next to its code in Content.jsx).
import { createResource, Show } from "solid-js";
import pb from "../lib/pb";

export default function Note(props) {
  const [specimen] = createResource(
    () => props.specimenId,
    (specimenId) => pb.collection("specimens").getOne(specimenId),
  );

  return (
    <div class="h-full rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-4">
      <Show when={specimen()} fallback={<p class="opacity-70">Loading…</p>}>
        <h2 class="mb-2 font-serif text-2xl">{specimen().label || "(untitled)"}</h2>
        <Show when={specimen().description}>
          <p class="mb-4 opacity-80">{specimen().description}</p>
        </Show>
        <Show
          when={specimen().note}
          fallback={<p class="opacity-70">No notes yet.</p>}
        >
          <p class="whitespace-pre-wrap">{specimen().note}</p>
        </Show>
      </Show>
    </div>
  );
}
