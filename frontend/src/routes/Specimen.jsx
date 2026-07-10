// frontend/src/routes/Specimen.jsx
import { createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import NavBar from "../components/NavBar";
import Directory from "../components/Directory";
import File from "../components/File";
import Note from "../components/Note";

// Specimen detail view: directory tree, then the selected file's code,
// then its note, side by side. Selection state lives here and is shared
// between Directory (writes it) and File/Note (read it).
export default function Specimen() {
  const params = useParams();
  const [selectedSnippetId, setSelectedSnippetId] = createSignal(null);

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <div class="flex flex-1 flex-col gap-6 md:flex-row">
        <aside class="w-full shrink-0 md:w-56">
          <Directory
            specimenId={params.specimenId}
            selectedId={selectedSnippetId()}
            onSelect={setSelectedSnippetId}
          />
        </aside>
        <div class="flex-1">
          <File snippetId={selectedSnippetId()} />
        </div>
        <div class="flex-1">
          <Note specimenId={params.specimenId} snippetId={selectedSnippetId()} />
        </div>
      </div>
    </div>
  );
}
