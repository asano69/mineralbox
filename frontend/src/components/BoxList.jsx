import {
  createResource,
  createSignal,
  createEffect,
  For,
  Show,
} from "solid-js";
import pb from "../lib/pb";
import { createEditableRecord } from "../lib/createEditableRecord";



function BoxRow(props) {
  const editable = createEditableRecord(
    () => props.box,
    ["name"],
    (patch) => pb.collection("boxes").update(props.box.id, patch),
  );

  const handleBlur = async () => {
    const trimmed = editable.draft().name.trim();
    if (!trimmed || trimmed === editable.current().name) {
      editable.setField("name", editable.current().name);
      return;
    }
    try {
      props.onRenamed(await editable.commit());
    } catch {
      editable.setField("name", editable.current().name);
      editable.setError("Failed to rename. Name may already be in use.");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete box "${editable.current().name}"? Its specimens will remain unboxed.`,
      )
    )
      return;
    try {
      await pb.collection("boxes").delete(props.box.id);
      props.onDeleted(props.box.id);
    } catch {
      editable.setError("Failed to delete the box.");
    }
  };

  return (
    <li class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <input
          type="text"
          value={editable.draft().name}
          onInput={(e) => editable.setField("name", e.target.value)}
          onBlur={handleBlur}
          disabled={editable.saving()}
          class="flex-1 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)]"
        />
        <button
          type="button"
          class="btn"
          disabled={editable.saving()}
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
      {editable.error() && <p class="text-sm text-[#dc3545]">{editable.error()}</p>}
    </li>
  );
}
// Stacked list of boxes, plus an "All specimens" entry to clear the
// filter, a "New Box" form, and an "Edit Box" mode that turns every box
// into an inline-renameable row with a Delete button. Clicking a box in
// normal mode calls props.onSelect(box.id); this component owns its own
// data fetch since it's meant to be reusable wherever a box picker is
// needed.
export default function BoxList(props) {
  const [boxes, { mutate }] = createResource(() =>
    pb.collection("boxes").getFullList({ sort: "name" }),
  );

  const [editMode, setEditMode] = createSignal(false);

  const [creating, setCreating] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  const itemClass = (active, dragOver) =>
    `w-full rounded-md border px-3 py-2 text-left transition-colors ${
      dragOver
        ? "border-[var(--color-border)] bg-[var(--color-active-bg)]"
        : active
          ? "border-[var(--color-border)] bg-[var(--color-hover-bg)]"
          : "border-[var(--color-border-soft)] bg-[var(--color-field)] hover:bg-[var(--color-hover-bg)]"
    }`;

  const sortByName = (list) =>
    [...list].sort((a, b) => a.name.localeCompare(b.name));

  const startCreating = () => {
    setNewName("");
    setError("");
    setCreating(true);
  };

  const handleCancel = () => {
    setNewName("");
    setError("");
    setCreating(false);
  };

  // Creates a new box and merges it into the local list, keeping the
  // "name" sort order intact instead of re-fetching from the server.
  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName().trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      const created = await pb.collection("boxes").create({ name });
      mutate((prev) => sortByName([...(prev ?? []), created]));
      props.onSelect(created.id);
      setNewName("");
      setCreating(false);
    } catch {
      setError("Failed to create the box. It may already exist.");
    } finally {
      setSaving(false);
    }
  };

  // Merges a renamed box into the local list and re-sorts, since renaming
  // can change its position in the "name"-sorted list.
  const handleRenamed = (updated) => {
    mutate((prev) =>
      sortByName((prev ?? []).map((b) => (b.id === updated.id ? updated : b))),
    );
  };

  // Removes a deleted box from the local list, clearing the selection if
  // the deleted box was the one currently selected.
  const handleDeleted = (deletedId) => {
    mutate((prev) => (prev ?? []).filter((b) => b.id !== deletedId));
    if (props.selectedId === deletedId) props.onSelect(null);
  };

  // ドラッグ中のハイライト表示用
  const [dragOverId, setDragOverId] = createSignal(null);

  const handleDragOver = (e) => {
    e.preventDefault(); // これがないと onDrop が発火しない
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (boxId) => (e) => {
    e.preventDefault();
    setDragOverId(null);
    const specimenId = e.dataTransfer.getData("application/x-specimen-id");
    if (!specimenId) return;
    props.onDropSpecimen?.(specimenId, boxId);
  };
  return (
    <div class="flex flex-col gap-2">
      <ul class="flex flex-col gap-2">
        <li>
          <button
            type="button"
            class={itemClass(props.selectedId === null)}
            onClick={() => props.onSelect(null)}
          >
            All specimens
          </button>
        </li>
        <Show
          when={editMode()}
          fallback={
            <For each={boxes() ?? []}>
              {(box) => (
                <li>
                  <button
                    type="button"
                    class={itemClass(
                      props.selectedId === box.id,
                      dragOverId() === box.id,
                    )}
                    onClick={() => props.onSelect(box.id)}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setDragOverId(box.id)}
                    onDragLeave={() =>
                      setDragOverId((id) => (id === box.id ? null : id))
                    }
                    onDrop={handleDrop(box.id)}
                  >
                    {box.name}
                  </button>
                </li>
              )}
            </For>
          }
        >
          <For each={boxes() ?? []}>
            {(box) => (
              <BoxRow
                box={box}
                onRenamed={handleRenamed}
                onDeleted={handleDeleted}
              />
            )}
          </For>
        </Show>
      </ul>

      <div class="flex items-center gap-3">
        <Show when={!creating()}>
          <button type="button" class="btn self-start" onClick={startCreating}>
            New
          </button>
        </Show>
        <button
          type="button"
          class="btn self-start"
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode() ? "Done" : "Edit"}
        </button>
      </div>

      <Show when={creating()}>
        <form onSubmit={handleCreate} class="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Box name"
            value={newName()}
            onInput={(e) => setNewName(e.target.value)}
            autofocus
            class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)]"
          />
          <div class="flex items-center gap-3">
            <button
              type="submit"
              class="btn"
              disabled={!newName().trim() || saving()}
            >
              {saving() ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              class="btn"
              disabled={saving()}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
          {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
        </form>
      </Show>
    </div>
  );
}
