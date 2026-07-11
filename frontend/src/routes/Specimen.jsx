// frontend/src/routes/Specimen.jsx
import { createSignal, createResource, createMemo } from "solid-js";
import { useParams } from "@solidjs/router";
import NavBar from "../components/NavBar";
import Directory from "../components/Directory";
import Snippet from "../components/Snippet";
import Note from "../components/Note";
import SpecimenInfo from "../components/SpecimenInfo";
import pb from "../lib/pb";

// Specimen detail view: specimen info bar, then directory tree, then the
// selected file's code, then its note, side by side. The snippet list is
// fetched once here and shared by every pane, so no pane re-fetches a
// snippet it can already see in the list.
export default function Specimen() {
  const params = useParams();
  const [selectedSnippetId, setSelectedSnippetId] = createSignal(null);

  const [snippets] = createResource(
    () => params.specimenId,
    (specimenId) =>
      pb.collection("snippets").getFullList({
        filter: `specimen = "${specimenId}"`,
        sort: "pathname",
      }),
  );

  const [specimen] = createResource(
    () => params.specimenId,
    (specimenId) => pb.collection("specimens").getOne(specimenId),
  );

  const selectedSnippet = createMemo(() =>
    (snippets() ?? []).find((s) => s.id === selectedSnippetId()) ?? null,
  );

  return (
    <div class="flex h-screen w-full flex-col gap-3 bg-[var(--color-bg)] px-6 py-6 text-[var(--color-text)]">
      <NavBar />
     
      <div class="flex flex-1 min-h-0 flex-col gap-3 md:flex-row">
        <aside class="w-full shrink-0 overflow-y-auto md:w-56">
          <SpecimenInfo specimen={specimen()} />
          <Directory
            snippets={snippets() ?? []}
            selectedId={selectedSnippetId()}
            onSelect={setSelectedSnippetId}
          />
        </aside>
        <div class="flex-1 min-h-0">
          <Snippet snippet={selectedSnippet()} />
        </div>
        <div class="flex-1 min-h-0">
          <Note snippet={selectedSnippet()} />
        </div>
      </div>
    </div>
  );
}
