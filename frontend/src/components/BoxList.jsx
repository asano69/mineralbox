import { createResource, createSignal, createEffect, For, Show } from "solid-js";
import pb from "../lib/pb";

// One row of the box list while in edit mode: an inline-editable name
// field (saved on blur, reverted if empty/unchanged/failed) plus a
// Delete button. Local draft state lives here, not in BoxList, so
// editing one box's name never touches the others.
function BoxRow(props) {
  const [name, setName] = createSignal(props.box.name);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  // Reset the draft whenever the underlying box identity changes (e.g.
  // the list was refetched elsewhere) so a stale draft never lingers.
  createEffect((prevId) => {
    if (props.box.id !== prevId) {
      setName(props.box.name);
      setError("");
    }
    return props.box.id;
  });

  const handleBlur = async () => {
    const trimmed = name().trim();
    if (!trimmed || trimmed === props.box.name) {
      setName(props.box.name);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await pb.collection("boxes").update(props.box.id, { name: trimmed });
      props.onRenamed(updated);
    } catch {
      setName(props.box.name);
      setError("Failed to rename. Name may already be in use.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete box "${props.box.name}"? Its specimens will remain unboxed.`)) return;
    setSaving(true);
    setError("");
    try {
      await pb.collection("boxes").delete(props.box.id);
      props.onDeleted(props.box.id);
    } catch {
      setError("Failed to delete the box.");
      setSaving(false);
    }
  };

  return (
    <li class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <input
          type="text"
          value={name()}
          onInput={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          disabled={saving()}
          class="flex-1 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)]"
        />
        <button type="button" class="btn" disabled={saving()} onClick={handleDelete}>
          Delete
        </button>
      </div>
      {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
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

  const sortByName = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name));

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
        class={itemClass(props.selectedId === box.id, dragOverId() === box.id)}
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
              <BoxRow box={box} onRenamed={handleRenamed} onDeleted={handleDeleted} />
            )}
          </For>
        </Show>
      </ul>

      <div class="flex items-center gap-3">
        <Show
          when={!creating()}
        >
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
            <button type="button" class="btn" disabled={saving()} onClick={handleCancel}>
              Cancel
            </button>
          </div>
          {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
        </form>
      </Show>
    </div>
  );
}
