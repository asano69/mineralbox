// Renders a single specimen as a card (label + description). Pure
// presentational component: Home.jsx owns the data fetch and just passes
// one specimen record in via props.
export default function SpecimenCard(props) {
  const s = props.specimen;

  return (
    <div class="flex flex-col gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-4 py-3 shadow-[0_1px_3px_0_var(--color-shadow)]">
      <p class="font-semibold">{s.label || "(untitled)"}</p>
      {s.description && <p class="text-sm opacity-70">{s.description}</p>}
    </div>
  );
}
