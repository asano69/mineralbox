import { A } from "@solidjs/router";

export default function Logo() {
  return (
    <A
      href="/"
      class="font-serif text-4xl flex items-center gap-2 transition-opacity hover:opacity-80"
    >
      <img src="/favicon.svg" alt="" class="h-12 w-12" />
      <h1>MineralBox</h1>
    </A>
  );
}
