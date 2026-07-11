// frontend/src/routes/Specimen.jsx
import { createSignal, createResource, createMemo } from "solid-js";
import { useParams } from "@solidjs/router";
import Logo from "../components/Logo";
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

  const [snippets, { mutate: mutateSnippets }] = createResource(
    () => params.specimenId,
    (specimenId) =>
      pb.collection("snippets").getFullList({
        filter: `specimen = "${specimenId}"`,
        sort: "pathname",
      }),
  );

  // Adds a newly-created snippet to the local list without re-fetching,
  // same idea as handleSnippetSaved above.
  const handleSnippetCreated = (created) => {
    mutateSnippets((prev) => [...(prev ?? []), created]);
  };

  // Removes a deleted snippet from the local list and clears the
  // selection; Directory's existing "select the first snippet" effect
  // then picks a replacement automatically if one remains.
  const handleSnippetDeleted = (deletedId) => {
    mutateSnippets((prev) => (prev ?? []).filter((s) => s.id !== deletedId));
    setSelectedSnippetId(null);
  };

  // Keeps the Directory tree in sync when Snippet/Note save a change,
  // without re-fetching the whole list from the server.
  const handleSnippetSaved = (updated) => {
    mutateSnippets((prev) =>
      (prev ?? []).map((s) => (s.id === updated.id ? updated : s)),
    );
  };

  const [specimen] = createResource(
    () => params.specimenId,
    (specimenId) => pb.collection("specimens").getOne(specimenId),
  );

  const selectedSnippet = createMemo(
    () => (snippets() ?? []).find((s) => s.id === selectedSnippetId()) ?? null,
  );

  return (
    <div class="flex h-screen w-full flex-col gap-3 bg-[var(--color-bg)] px-6 py-6 text-[var(--color-text)]">
      <div class="flex flex-1 min-h-0 flex-col gap-3 md:flex-row">
        <aside class="w-full shrink-0 overflow-y-auto md:w-56">
          <Logo />
          <SpecimenInfo specimen={specimen()} />
          <Directory
            snippets={snippets() ?? []}
            selectedId={selectedSnippetId()}
            onSelect={setSelectedSnippetId}
            specimenId={params.specimenId}
            onCreated={handleSnippetCreated}
            onDeleted={handleSnippetDeleted}
          />
        </aside>
        <div class="flex-1 min-h-0">
          <Snippet snippet={selectedSnippet()} onSaved={handleSnippetSaved} />
        </div>
        <div class="flex-1 min-h-0">
          <Note snippet={selectedSnippet()} onSaved={handleSnippetSaved} />
        </div>
      </div>
    </div>
  );
}
