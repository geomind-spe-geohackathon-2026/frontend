import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { ensureSyntaxTree, foldable, foldEffect } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import { useSyncExternalStore } from "react";

const extensions = [json()];

function subscribe(listener: () => void): () => void {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", listener);
  };
}

function isDark(): boolean {
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme !== null) return theme === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Folds every object and list below the top one, so the JSON opens closed and each opened field shows its own fields closed. */
export function foldNested(view: EditorView): void {
  const { state } = view;
  ensureSyntaxTree(state, state.doc.length, 500);
  const effects = [];
  for (let number = 2; number <= state.doc.lines; number += 1) {
    const line = state.doc.line(number);
    const range = foldable(state, line.from, line.to);
    if (range !== null) effects.push(foldEffect.of(range));
  }
  if (effects.length > 0) view.dispatch({ effects });
}

type Props = { value: string; label: string; onChange: (text: string) => void };

/** A JSON code editor (CodeMirror) with syntax colours that follows the app's theme; it opens with every field folded. */
export function JsonEditor({ value, label, onChange }: Props) {
  const dark = useSyncExternalStore(subscribe, isDark);
  return (
    <CodeMirror
      value={value}
      theme={dark ? "dark" : "light"}
      extensions={extensions}
      aria-label={label}
      basicSetup={{ foldGutter: true, highlightActiveLine: false }}
      maxHeight="420px"
      className="overflow-hidden rounded-md border border-border text-[12.5px]"
      onChange={onChange}
      onCreateEditor={foldNested}
    />
  );
}
