// frontend/src/routes/Specimen.jsx
import { createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import NavBar from "../components/NavBar";
import Directory from "../components/Directory";
import Snippet from "../components/Snippet";
import Note from "../components/Note";

// Specimen detail view: directory tree, then the selected file's code,
// then its note, side by side. Selection state lives here and is shared
// between Directory (writes it) and Snippet/Note (read it).

export default function Specimen() {
  const params = useParams();
  const [selectedSnippetId, setSelectedSnippetId] = createSignal(null);

  return (
    <div class="flex h-screen w-full flex-col gap-6 bg-[var(--color-bg)] px-6 py-6 text-[var(--color-text)]">
      <NavBar />
      <div class="flex flex-1 min-h-0 flex-col gap-6 md:flex-row">
        <aside class="w-full shrink-0 overflow-y-auto md:w-56">
          <Directory
            specimenId={params.specimenId}
            selectedId={selectedSnippetId()}
            onSelect={setSelectedSnippetId}
          />
        </aside>
        <div class="flex-1 min-h-0">
          <Snippet snippetId={selectedSnippetId()} />
        </div>
        <div class="flex-1 min-h-0">
          <Note specimenId={params.specimenId} snippetId={selectedSnippetId()} />
        </div>
      </div>
    </div>
  );
}
