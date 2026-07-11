// frontend/src/lib/createEditableRecord.js
// Shared state machine for the "view current value / edit a draft / save
// or reset" pattern repeated across Snippet.jsx, Note.jsx, SpecimenCard.jsx,
// and BoxList.jsx's BoxRow. Centralizes draft/current tracking, dirty
// checking, and the save lifecycle so each component only owns its own
// markup and which PocketBase fields it's editing.
import { createSignal, createEffect, on } from "solid-js";

// source: reactive accessor returning the current record (or null/undefined)
// fields: array of field names to track as an editable draft
// save: async (patch) => updatedRecord, called by commit()
export function createEditableRecord(source, fields, save) {
  const pluck = (record) =>
    Object.fromEntries(fields.map((f) => [f, record?.[f] ?? ""]));

  const [current, setCurrent] = createSignal(pluck(source()));
  const [draft, setDraft] = createSignal(current());
  const [editing, setEditing] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  // Whenever the underlying record's identity changes (a different
  // snippet/specimen/box selected, or a refetch elsewhere), drop any
  // in-progress draft so it never bleeds onto the next record.
  createEffect(
    on(
      () => source()?.id ?? null,
      () => {
        const values = pluck(source());
        setCurrent(values);
        setDraft(values);
        setEditing(false);
        setError("");
      },
    ),
  );

  const dirty = () => fields.some((f) => draft()[f] !== current()[f]);

  const setField = (field, value) =>
    setDraft((d) => ({ ...d, [field]: value }));

  const startEditing = () => {
    setDraft(current());
    setError("");
    setEditing(true);
  };

  // Discards the draft without saving.
  const cancel = () => {
    setDraft(current());
    setError("");
    setEditing(false);
  };

  // Persists `patch` (defaults to the current draft), and on success
  // folds the result back into both current and draft so the view
  // reflects it immediately without a re-fetch.
  const commit = async (patch = draft()) => {
    setSaving(true);
    setError("");
    try {
      const updated = await save(patch);
      const values = pluck(updated);
      setCurrent(values);
      setDraft(values);
      setEditing(false);
      return updated;
    } catch (e) {
      setError("Failed to save. Please try again.");
      throw e;
    } finally {
      setSaving(false);
    }
  };

  return {
    current,
    draft,
    setField,
    editing,
    startEditing,
    cancel,
    commit,
    saving,
    error,
    setError, // callers with a more specific error message (e.g. BoxRow) can override it
    dirty,
  };
}
