// frontend/src/components/SpecimenInfo.jsx
// Top bar of the Specimen view: shows the specimen's own label and
// description. These are plain metadata, not Markdown content, so they
// are rendered as plain input boxes instead of being parsed/rendered as
// Markdown or edited in MonacoEditor.
import { Show } from "solid-js";

export default function SpecimenInfo(props) {
  return (
    <Show when={props.specimen}>
      <div class="flex flex-col gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-3">
        <input
          type="text"
          value={props.specimen.label || ""}
          readOnly
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-3 py-2 font-serif text-2xl text-[var(--color-text)]"
        />
        <textarea
          value={props.specimen.description || ""}
          readOnly
          rows="3"
          class="resize-none rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] opacity-80"
        />
      </div>
    </Show>
  );
}
