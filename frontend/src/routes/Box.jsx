import { useParams, A } from "@solidjs/router";
import NavBar from "../components/NavBar";

// Placeholder for the box view (list of specimens inside one box).
// Only wires up routing/params for now; the real PocketBase query
// comes once the box/specimen schema migration lands.
export default function Box() {
  const params = useParams();

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <h1 class="font-serif text-4xl">Box: {params.boxName}</h1>
      <p class="opacity-70">Specimens in this box will be listed here.</p>
      <A href={`/${params.boxName}/dummy-specimen-id`} class="btn w-fit">
        Go to a dummy specimen →
      </A>
    </div>
  );
}
