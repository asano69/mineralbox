import { createSignal, createResource, For, Show } from "solid-js";
import NavBar from "../components/NavBar";
import BoxList from "../components/BoxList";
import SpecimenCard from "../components/SpecimenCard";
import pb from "../lib/pb";

// "/" shows every box in a stacked list (BoxList) and a grid of specimen
// cards (SpecimenCard). Selecting a box filters the grid to that box;
// selecting "All specimens" (selectedBoxId === null) shows every specimen.
export default function Home() {
  const [selectedBoxId, setSelectedBoxId] = createSignal(null);

  // Wrapped in an object so the source is always truthy: createResource
  // skips the fetcher entirely when its source signal returns null, which
  // would otherwise stop specimens from loading when no box is selected.
  const [specimens, { mutate }] = createResource(
    () => ({ boxId: selectedBoxId() }),
    ({ boxId }) =>
      pb.collection("specimens").getFullList({
        filter: boxId ? `box = "${boxId}"` : "",
        sort: "-created",
        // Needed so each card can link to /:boxName/:specimenId without an
        // extra request per specimen.
        expand: "box",
      }),
  );

  // Creates a new, mostly-empty specimen in the currently selected box and
  // prepends it locally (matches the "-created" sort) instead of
  // re-fetching the whole list. label/description are filled in later via
  // SpecimenCard's own edit mode.
  const handleCreate = async () => {
    if (!selectedBoxId()) return;
    const created = await pb
      .collection("specimens")
      .create({ box: selectedBoxId() }, { expand: "box" });
    mutate((prev) => [created, ...(prev ?? [])]);
  };

  // Keeps the grid in sync when a card saves an edit, without re-fetching
  // the whole list. `updated` has no `expand`, so merging onto the
  // existing record preserves its `expand.box`.
  const handleSpecimenSaved = (updated) => {
    mutate((prev) =>
      (prev ?? []).map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
    );
  };

  // Removes a deleted specimen from the local list, mirroring
  // handleSpecimenSaved's local-mutation approach.
  const handleSpecimenDeleted = (deletedId) => {
    mutate((prev) => (prev ?? []).filter((s) => s.id !== deletedId));
  };



  // SpecimenCard から BoxList へドラッグ&ドロップされたときに呼ばれる。
// specimen の box を張り替え、現在絞り込み中の box から外れた場合は
// ローカルのリストからも取り除く（再フェッチはしない）。
const handleDropSpecimen = async (specimenId, boxId) => {
  const specimen = (specimens() ?? []).find((s) => s.id === specimenId);
  if (!specimen || specimen.box === boxId) return; // 同じboxへのドロップは何もしない

  try {
    const updated = await pb
      .collection("specimens")
      .update(specimenId, { box: boxId }, { expand: "box" });

    mutate((prev) => {
      const list = (prev ?? []).map((s) =>
        s.id === updated.id ? { ...s, ...updated } : s,
      );
      const stillVisible = !selectedBoxId() || updated.box === selectedBoxId();
      return stillVisible ? list : list.filter((s) => s.id !== updated.id);
    });
  } catch {
    // 必要ならここでエラー表示用のsignalを立てる
  }
};


  return (
    <div class="flex min-h-screen w-full flex-col gap-6 bg-[var(--color-bg)] px-6 py-6 text-[var(--color-text)]">
      <NavBar />
      <div class="flex flex-col gap-8 md:flex-row">
        <aside class="w-full shrink-0 md:w-56">
          <BoxList selectedId={selectedBoxId()} onSelect={setSelectedBoxId} onDropSpecimen={handleDropSpecimen} />
        </aside>
        <div class="flex flex-1 flex-col gap-4">
          <button
            type="button"
            class="btn self-start"
            disabled={!selectedBoxId()}
            title={!selectedBoxId() ? "Select a box first" : undefined}
            onClick={handleCreate}
          >
            New Specimen
          </button>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 content-start">
            <Show
              when={(specimens() ?? []).length > 0}
              fallback={<p class="opacity-70">No specimens found.</p>}
            >
              <For each={specimens()}>
                {(specimen) => (
                  <SpecimenCard
                    specimen={specimen}
                    boxName={specimen.expand?.box?.name}
                    onSaved={handleSpecimenSaved}
                    onDeleted={handleSpecimenDeleted}
                  />
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
