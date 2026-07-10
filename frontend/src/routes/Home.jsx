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
  const [specimens] = createResource(
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

  return (
    <div class="flex min-h-screen w-full flex-col gap-6 bg-[var(--color-bg)] px-6 py-6 text-[var(--color-text)]">
      <NavBar />
      <div class="flex flex-col gap-8 md:flex-row">
        <aside class="w-full shrink-0 md:w-56">
          <BoxList selectedId={selectedBoxId()} onSelect={setSelectedBoxId} />
        </aside>
        <div class="grid flex-1 grid-cols-1 gap-4 content-start sm:grid-cols-2">
          <Show
            when={(specimens() ?? []).length > 0}
            fallback={<p class="opacity-70">No specimens found.</p>}
          >
            <For each={specimens()}>
              {(specimen) => (
                <SpecimenCard
                  specimen={specimen}
                  boxName={specimen.expand?.box?.name}
                />
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
}
