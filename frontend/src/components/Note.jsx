// frontend/src/components/Note.jsx
// Right pane of the Specimen view: the note/annotation attached to the
// snippet (PocketBase "snippets" collection's annotation field).
// Placeholder only, layout-check purposes.
export default function Note(props) {
  return (
    <div class="h-full rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-4">
      <p class="opacity-70">Note for specimen {props.specimenId} goes here.</p>
    </div>
  );
}
