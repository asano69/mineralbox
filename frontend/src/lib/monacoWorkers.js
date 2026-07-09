// frontend/src/lib/monacoWorkers.js
// Minimal Monaco worker setup: only the base editor worker is needed
// because this app only uses syntax highlighting, not language services
// like autocomplete or diagnostics for go/sql/javascript.
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

self.MonacoEnvironment = {
  getWorker() {
    return new EditorWorker();
  },
};
