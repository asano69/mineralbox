// frontend/src/components/SpecimenCard.jsx
// Renders a single specimen as a card (label + description), with an
// inline edit mode for both fields. View mode wraps the whole card in <A>
// so clicking it navigates to the specimen's detail page
// (/:boxName/:specimenId); edit mode swaps the link for a plain div so
// clicks and typing stay local to the card instead of triggering
// navigation. Follows the same current/draft pattern as
// Snippet.jsx/Note.jsx: `current` is the source of truth for the view,
// `draft` only exists while editing and is discarded on Reset.
import { createSignal, createEffect, Show } from "solid-js";
import { A } from "@solidjs/router";
import pb from "../lib/pb";

export default function SpecimenCard(props) {
  const [editing, setEditing] = createSignal(false);
  const [current, setCurrent] = createSignal(props.specimen.label ?? "");
  const [currentDescription, setCurrentDescription] = createSignal(
    props.specimen.description ?? "",
  );
  const [draft, setDraft] = createSignal(current());
  const [draftDescription, setDraftDescription] = createSignal(currentDescription());
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  // Keep the view in sync with the parent's data whenever it's not being
  // edited (e.g. the list was refreshed elsewhere).
  createEffect(() => {
    if (!editing()) {
      setCurrent(props.specimen.label ?? "");
      setCurrentDescription(props.specimen.description ?? "");
    }
  });

  const dirty = () =>
    draft() !== current() || draftDescription() !== currentDescription();

  // e.preventDefault()/stopPropagation() keep clicks on these buttons from
  // bubbling up to the surrounding <A> and navigating away.
  const startEditing = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraft(current());
    setDraftDescription(currentDescription());
    setError("");
    setEditing(true);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraft(current());
    setDraftDescription(currentDescription());
    setError("");
    setEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    setError("");
    try {
      const updated = await pb.collection("specimens").update(props.specimen.id, {
        label: draft(),
        description: draftDescription(),
      });
      setCurrent(updated.label);
      setCurrentDescription(updated.description);
      props.onSaved?.(updated);
      setEditing(false);
    } catch {
      setError("Failed to save the specimen. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Show
      when={editing()}
      fallback={
        <A
          href={`/${props.boxName}/${props.specimen.id}`}
          class="flex flex-col gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-4 py-3 shadow-[0_1px_3px_0_var(--color-shadow)] transition-colors hover:bg-[var(--color-hover-bg)]"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">{current() || "(untitled)"}</p>
            <button type="button" class="btn" onClick={startEditing}>
              Edit
            </button>
          </div>
          {currentDescription() && (
            <p class="text-sm opacity-70 line-clamp-3">{currentDescription()}</p>
          )}
        </A>
      }
    >
      <div class="flex flex-col gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-4 py-3 shadow-[0_1px_3px_0_var(--color-shadow)]">
        <input
          type="text"
          value={draft()}
          onInput={(e) => setDraft(e.target.value)}
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 font-semibold text-[var(--color-text)]"
        />
        <textarea
          value={draftDescription()}
          onInput={(e) => setDraftDescription(e.target.value)}
          rows="3"
          class="resize-none rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-sm text-[var(--color-text)]"
        />
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="btn"
            disabled={!dirty() || saving()}
            onClick={handleSave}
          >
            {saving() ? "Saving…" : "Save"}
          </button>
          <button type="button" class="btn" disabled={saving()} onClick={handleCancel}>
            Reset
          </button>
          {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
        </div>
      </div>
    </Show>
  );
}
