import { createSignal, createResource, createMemo } from "solid-js";
import { useParams } from "@solidjs/router";
import NavBar from "../components/NavBar";
import Directory from "../components/Directory";
import Snippet from "../components/Snippet";
import Note from "../components/Note";
import pb from "../lib/pb";

// Specimen detail view: directory tree, then the selected file's code,
// then its note, side by side. The snippet list is fetched once here and
// shared by every pane, so no pane re-fetches a snippet it can already
// see in the list. When Snippet.jsx or Note.jsx saves a change, the
// cached resources below are patched in place instead of being refetched.
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

  const [specimen, { mutate: mutateSpecimen }] = createResource(
    () => params.specimenId,
    (specimenId) => pb.collection("specimens").getOne(specimenId),
  );

  const selectedSnippet = createMemo(() =>
    (snippets() ?? []).find((s) => s.id === selectedSnippetId()) ?? null,
  );

  const handleSnippetSaved = (updated) => {
    mutateSnippets((list) =>
      (list ?? []).map((s) => (s.id === updated.id ? updated : s)),
    );
  };

  return (
    <div class="flex h-screen w-full flex-col gap-6 bg-[var(--color-bg)] px-6 py-6 text-[var(--color-text)]">
      <NavBar />
      <div class="flex flex-1 min-h-0 flex-col gap-6 md:flex-row">
        <aside class="w-full shrink-0 overflow-y-auto md:w-56">
          <Directory
            snippets={snippets() ?? []}
            selectedId={selectedSnippetId()}
            onSelect={setSelectedSnippetId}
          />
        </aside>
        <div class="flex-1 min-h-0">
          <Snippet snippet={selectedSnippet()} onSaved={handleSnippetSaved} />
        </div>
        <div class="flex-1 min-h-0">
          <Note
            specimen={specimen()}
            snippet={selectedSnippet()}
            onSpecimenSaved={mutateSpecimen}
            onSnippetSaved={handleSnippetSaved}
          />
        </div>
      </div>
    </div>
  );
}
