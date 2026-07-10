import { A } from "@solidjs/router";

// Renders a single specimen as a card (label + description). Pure
// presentational component: Home.jsx owns the data fetch and just passes
// one specimen record in via props. Wrapping the whole card in <A> makes
// it navigate to the specimen's detail page (/:boxName/:specimenId).
export default function SpecimenCard(props) {
  const s = props.specimen;

  return (
    <A
      href={`/${props.boxName}/${s.id}`}
      class="flex flex-col gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-4 py-3 shadow-[0_1px_3px_0_var(--color-shadow)] transition-colors hover:bg-[var(--color-hover-bg)]"
    >
      <p class="font-semibold">{s.label || "(untitled)"}</p>
      {s.description && <p class="text-sm opacity-70">{s.description}</p>}
    </A>
  );
}
