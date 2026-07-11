// frontend/src/components/SpecimenCard.jsx
import { Show } from "solid-js";
import { A } from "@solidjs/router";
import pb from "../lib/pb";
import { createEditableRecord } from "../lib/createEditableRecord";

export default function SpecimenCard(props) {
  const editable = createEditableRecord(
    () => props.specimen,
    ["label", "description"],
    (patch) => pb.collection("specimens").update(props.specimen.id, patch),
  );

  // These wrap the primitive's actions with preventDefault/stopPropagation
  // so clicks inside the card never bubble up to the surrounding <A> and
  // trigger navigation.
  const startEditing = (e) => {
    e.preventDefault();
    e.stopPropagation();
    editable.startEditing();
  };
  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    editable.cancel();
  };
  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      props.onSaved?.(await editable.commit());
    } catch {
      // surfaced via editable.error()
    }
  };
  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this specimen? This cannot be undone.")) return;
    try {
      await pb.collection("specimens").delete(props.specimen.id);
      props.onDeleted?.(props.specimen.id);
    } catch {
      editable.setError("Failed to delete the specimen. Please try again.");
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData("application/x-specimen-id", props.specimen.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Show
      when={editable.editing()}
      fallback={
        <A
          href={`/${props.boxName}/${props.specimen.id}`}
          draggable="true"
          onDragStart={handleDragStart}
          class="flex flex-col gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-4 py-3 shadow-[0_1px_3px_0_var(--color-shadow)] transition-colors hover:bg-[var(--color-hover-bg)]"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">
              {editable.current().label || "(untitled)"}
            </p>
            <button type="button" class="btn" onClick={startEditing}>
              Edit
            </button>
          </div>
          {editable.current().description && (
            <p class="text-sm opacity-70 line-clamp-3">
              {editable.current().description}
            </p>
          )}
        </A>
      }
    >
      <div class="flex flex-col gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-4 py-3 shadow-[0_1px_3px_0_var(--color-shadow)]">
        <input
          type="text"
          value={editable.draft().label}
          onInput={(e) => editable.setField("label", e.target.value)}
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 font-semibold text-[var(--color-text)]"
        />
        <textarea
          value={editable.draft().description}
          onInput={(e) => editable.setField("description", e.target.value)}
          rows="3"
          class="resize-none rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-sm text-[var(--color-text)]"
        />
        <div class="flex items-center gap-3">
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
            onClick={handleCancel}
          >
            Reset
          </button>
          <button
            type="button"
            class="btn border !border-[#c82333] bg-[#dc3545] text-white enabled:hover:bg-[#c82333] enabled:hover:border-[#c82333] enabled:active:bg-[#bd2130] enabled:active:border-[#bd2130]"
            disabled={editable.saving()}
            onClick={handleDelete}
          >
            Delete
          </button>
          {editable.error() && (
            <p class="text-sm text-[#dc3545]">{editable.error()}</p>
          )}
        </div>
      </div>
    </Show>
  );
}
