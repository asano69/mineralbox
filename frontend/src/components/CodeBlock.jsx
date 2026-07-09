// frontend/src/components/CodeBlock.jsx
import { createResource, Show } from "solid-js";
import { getHighlighter } from "../lib/highlighter";

// Renders a code string as highlighted HTML for the given language.
// lang must be one of the languages registered in getHighlighter().
export default function CodeBlock(props) {
  const [html] = createResource(
    () => [props.code, props.lang],
    async ([code, lang]) => {
      const highlighter = await getHighlighter();
      return highlighter.codeToHtml(code, {
        lang: lang.toLowerCase(),
        theme: "github-dark",
      });
    },
  );

  return (
    <Show when={html()}>
      <div class="rounded-md text-sm" innerHTML={html()} />
    </Show>
  );
}
