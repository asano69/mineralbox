import { createSignal, createResource, For, Show } from "solid-js";
import NavBar from "../components/NavBar";
import Button from "../components/Button";

import MonacoEditor from "../components/MonacoEditor";
import pb from "../lib/pb";

const LANGS = ["go", "javascript", "sql"];

// Empty form state, also used to reset after create/cancel/delete.
const emptyForm = () => ({
  id: null,
  title: "",
  filename: "",
  lang: "go",
  snippet: "",
  note: "",
  tags: "",
  source: "",
});

export default function Snippets() {
  const [snippets, { refetch }] = createResource(() =>
    pb.collection("snippets").getFullList({ sort: "-created" }),
  );
  const [form, setForm] = createSignal(emptyForm());
  const [error, setError] = createSignal("");

  const isEditing = () => form().id !== null;

  const selectSnippet = (s) => {
    setForm({
      id: s.id,
      title: s.title || "",
      filename: s.filename || "",
      lang: s.lang || "Go",
      snippet: s.snippet || "",
      note: s.note || "",
      tags: (s.tags || []).join(", "),
      source: s.source || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const data = {
      title: form().title,
      filename: form().filenme,
      lang: form().lang,
      snippet: form().snippet,
      note: form().note,
      source: form().source,
      tags: form()
        .tags.split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (isEditing()) {
        await pb.collection("snippets").update(form().id, data);
      } else {
        await pb.collection("snippets").create(data);
      }
      setForm(emptyForm());
      refetch();
    } catch {
      setError("Failed to save snippet.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this snippet?")) return;
    setError("");
    try {
      await pb.collection("snippets").delete(id);
      if (form().id === id) setForm(emptyForm());
      refetch();
    } catch {
      setError("Failed to delete snippet.");
    }
  };

  return (
    <div class="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <h1 class="font-serif text-4xl">Snippets</h1>

      <form onSubmit={handleSubmit} class="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Title"
          value={form().title}
          onInput={(e) => setForm({ ...form(), title: e.target.value })}
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-3 py-2"
        />

        <input
          type="text"
          placeholder="File Name"
          value={form().filename}
          onInput={(e) => setForm({ ...form(), filename: e.target.value })}
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-3 py-2"
        />
        <select
          value={form().lang}
          onChange={(e) => setForm({ ...form(), lang: e.target.value })}
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-3 py-2"
        >
          <For each={LANGS}>{(l) => <option value={l}>{l}</option>}</For>
        </select>
  <MonacoEditor
  value={form().snippet}
  lang={form().lang}
  onChange={(v) => setForm({ ...form(), snippet: v })}
/>
        <textarea
          placeholder="Note"
          value={form().note}
          onInput={(e) => setForm({ ...form(), note: e.target.value })}
          rows="3"
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-3 py-2"
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={form().tags}
          onInput={(e) => setForm({ ...form(), tags: e.target.value })}
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-3 py-2"
        />
        <input
          type="text"
          placeholder="Source"
          value={form().source}
          onInput={(e) => setForm({ ...form(), source: e.target.value })}
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-3 py-2"
        />
        {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}
        <div class="flex gap-3">
          <button type="submit" class="btn">
            {isEditing() ? "Update" : "Create"}
          </button>
          <Show when={isEditing()}>
            <button type="button" class="btn" onClick={() => setForm(emptyForm())}>
              Cancel
            </button>
          </Show>
        </div>
      </form>

      <ul class="flex flex-col gap-3">
        <For each={snippets() ?? []}>
          {(s) => (
                        <li class="flex flex-col gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] px-4 py-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold">{s.title || "(untitled)"}</p>
                  <p class="text-sm opacity-70">{s.lang}</p>
                </div>
                <div class="flex items-center">
                  <Button value="Edit" onClick={() => selectSnippet(s)} />
                  <Button value="Delete" variant="danger" onClick={() => handleDelete(s.id)} />
                 </div>
               </div>
              <Show when={s.snippet}>
                <MonacoEditor value={s.snippet} lang={s.lang} readOnly />
              </Show>
             </li>
           
          )}
        </For>
      </ul>
    </div>
  );
}
