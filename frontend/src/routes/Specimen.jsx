// frontend/src/routes/Specimen.jsx
import { useParams } from "@solidjs/router";
import NavBar from "../components/NavBar";
import Content from "../components/Content";
import Note from "../components/Note";

// Specimen detail view: code on the left, note on the right, side by side.
// Replaces the old Snippets.jsx form-based UI.
export default function Specimen() {
  const params = useParams();

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <div class="flex flex-1 flex-col gap-6 md:flex-row">
        <div class="flex-1">
          <Content specimenId={params.specimenId} />
        </div>
        <div class="flex-1">
          <Note specimenId={params.specimenId} />
        </div>
      </div>
    </div>
  );
}
