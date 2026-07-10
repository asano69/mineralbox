import { useParams, A } from "@solidjs/router";
import NavBar from "../components/NavBar";

// Placeholder for the specimen detail view (title/note plus its child
// snippet files). Only wires up routing/params for now; the real
// PocketBase query comes once the box/specimen schema migration lands.
export default function Specimen() {
  const params = useParams();

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <A href={`/${params.boxName}`} class="text-sm opacity-70 hover:opacity-100">
        ← Back to {params.boxName}
      </A>
      <h1 class="font-serif text-4xl">Specimen: {params.specimenId}</h1>
      <p class="opacity-70">Snippet files for this specimen will be listed here.</p>
    </div>
  );
}
