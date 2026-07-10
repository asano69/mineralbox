// frontend/src/components/Content.jsx
// Left pane of the Specimen view: the snippet's code.
// Placeholder only — MonacoEditor wiring comes once the snippets query
// for a given specimen is in place (see old Snippets.jsx for reference).
export default function Content(props) {
  return (
    <div class="h-full rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-4">
      <p class="opacity-70">Code content for specimen {props.specimenId} goes here.</p>
    </div>
  );
}
