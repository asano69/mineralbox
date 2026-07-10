// frontend/src/components/Directory.jsx
// Left-most pane of the Specimen view: a table-of-contents-like tree built
// from every snippet's pathname (split on "/"). Selecting a leaf reports
// its snippet id via props.onSelect, which Specimen.jsx uses to drive both
// Snippet.jsx and Note.jsx.
import { createResource, createMemo, createEffect, For, Show } from "solid-js";
import pb from "../lib/pb";

// Builds a nested { children: {...} } tree from each snippet's pathname.
// Intermediate path segments become plain folder nodes; the last segment
// of each path becomes a leaf node carrying the snippet record itself.
function buildTree(snippets) {
  const root = { children: {} };
  for (const snippet of snippets) {
    const parts = (snippet.pathname || snippet.id).split("/").filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const isSnippet = i === parts.length - 1;
      if (!node.children[part]) {
        node.children[part] = isSnippet
          ? { name: part, snippet }
          : { name: part, children: {} };
      }
      node = node.children[part];
    });
  }
  return root;
}

function TreeNode(props) {
  return (
    <Show
      when={props.node.snippet}
      fallback={
        <li>
          <p class="px-2 py-1 text-sm font-semibold opacity-60">{props.node.name}</p>
          <ul class="ml-2 flex flex-col gap-1 border-l border-[var(--color-border-soft)] pl-2">
            <For each={Object.values(props.node.children)}>
              {(child) => (
                <TreeNode node={child} selectedId={props.selectedId} onSelect={props.onSelect} />
              )}
            </For>
          </ul>
        </li>
      }
    >
      <li>
        <button
          type="button"
          class={`w-full truncate rounded-md px-2 py-1 text-left text-sm transition-colors ${
            props.selectedId === props.node.snippet.id
              ? "bg-[var(--color-hover-bg)] font-semibold"
              : "hover:bg-[var(--color-hover-bg)]"
          }`}
          onClick={() => props.onSelect(props.node.snippet.id)}
        >
          {props.node.name}
        </button>
      </li>
    </Show>
  );
}

export default function Directory(props) {
  const [snippets] = createResource(
    () => props.specimenId,
    (specimenId) =>
      pb.collection("snippets").getFullList({
        filter: `specimen = "${specimenId}"`,
        sort: "pathname",
      }),
  );

  const tree = createMemo(() => buildTree(snippets() ?? []));

  // Default to the first file once the list loads, so Snippet/Note
  // aren't left empty before the user picks anything.
  createEffect(() => {
    const list = snippets();
    if (list && list.length > 0 && props.selectedId === null) {
      props.onSelect(list[0].id);
    }
  });

  return (
    <ul class="flex flex-col gap-1">
      <For each={Object.values(tree().children)}>
        {(node) => (
          <TreeNode node={node} selectedId={props.selectedId} onSelect={props.onSelect} />
        )}
      </For>
    </ul>
  );
}
