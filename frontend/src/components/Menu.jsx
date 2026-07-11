import { A } from "@solidjs/router";
import pb from "../lib/pb";

export default function Menu() {
  const handleLogout = () => pb.authStore.clear();

  return (
    <nav class="absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-center gap-3 border-t border-[var(--color-border-soft)] bg-[var(--color-bg)] px-6 py-3">
      <A href="/settings" class="btn">
        Settings
      </A>
      <button type="button" class="btn" onClick={handleLogout}>
        Log out
      </button>
    </nav>
  );
}
