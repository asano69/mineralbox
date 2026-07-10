import { createResource, For } from "solid-js";
import pb from "../lib/pb";

// Stacked list of boxes, plus an "All specimens" entry to clear the filter.
// Clicking a box calls props.onSelect(box.id); this component owns its own
// data fetch since it's meant to be reusable wherever a box picker is needed.
export default function BoxList(props) {
  const [boxes] = createResource(() =>
    pb.collection("boxes").getFullList({ sort: "name" }),
  );

  const itemClass = (active) =>
    `w-full rounded-md border px-3 py-2 text-left transition-colors ${
      active
        ? "border-[var(--color-border)] bg-[var(--color-hover-bg)]"
        : "border-[var(--color-border-soft)] bg-[var(--color-field)] hover:bg-[var(--color-hover-bg)]"
    }`;

  return (
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
  );
}
