import { createResource, createSignal, For, Show } from "solid-js";
import pb from "../lib/pb";

// Stacked list of boxes, plus an "All specimens" entry to clear the filter,
// and a "New Box" form to create additional boxes. Clicking a box calls
// props.onSelect(box.id); this component owns its own data fetch since
// it's meant to be reusable wherever a box picker is needed.
export default function BoxList(props) {
  const [boxes, { refetch }] = createResource(() =>
    pb.collection("boxes").getFullList({ sort: "name" }),
  );

  const [creating, setCreating] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  const itemClass = (active) =>
    `w-full rounded-md border px-3 py-2 text-left transition-colors ${
      active
        ? "border-[var(--color-border)] bg-[var(--color-hover-bg)]"
        : "border-[var(--color-border-soft)] bg-[var(--color-field)] hover:bg-[var(--color-hover-bg)]"
    }`;

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

  // Creates a new box, refetches the list so it appears in the right
  // sorted position, then selects it immediately.
  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName().trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      const created = await pb.collection("boxes").create({ name });
      await refetch();
      props.onSelect(created.id);
      setNewName("");
      setCreating(false);
    } catch {
      setError("Failed to create the box. It may already exist.");
    } finally {
      setSaving(false);
    }
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
        <For each={boxes() ?? []}>
          {(box) => (
            <li>
              <button
                type="button"
                class={itemClass(props.selectedId === box.id)}
                onClick={() => props.onSelect(box.id)}
              >
                {box.name}
              </button>
            </li>
          )}
        </For>
      </ul>

      <Show
        when={creating()}
        fallback={
          <button type="button" class="btn self-start" onClick={startCreating}>
            New Box
          </button>
        }
      >
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
