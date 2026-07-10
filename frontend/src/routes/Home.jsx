import { A } from "@solidjs/router";
import NavBar from "../components/NavBar";

// Placeholder for the all-specimens list ("/"). Only wires up routing
// for now; the real PocketBase query comes once the box/specimen schema
// migration lands.
export default function Home() {
  return (
    <div class="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center gap-4 bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <div class="flex w-full flex-col gap-4">
        <h1 class="font-serif text-4xl">All specimens (dummy)</h1>
        <A href="/rust-basics" class="btn w-fit">
          Go to a dummy box →
        </A>
      </div>
    </div>
  );
}
