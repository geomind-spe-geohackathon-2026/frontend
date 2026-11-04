import { json } from "@codemirror/lang-json";
import { ensureSyntaxTree, foldedRanges, foldState, unfoldEffect } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { foldNested } from "./json-editor";

const text = JSON.stringify(
  { air: { pressure: { unit: "Pa", value: 1 } }, fluid: { density: 2 } },
  null,
  2,
);

function toView(): EditorView {
  const state = EditorState.create({ doc: text, extensions: [json(), foldState] });
  ensureSyntaxTree(state, state.doc.length, 5000);
  return new EditorView({ state, parent: document.body });
}

function toFolds(view: EditorView): { from: number; to: number }[] {
  const folds: { from: number; to: number }[] = [];
  foldedRanges(view.state).between(0, view.state.doc.length, (from, to) => {
    folds.push({ from, to });
  });
  return folds;
}

describe("foldNested", () => {
  it("folds every field below the top object, and opening one keeps its own fields folded", () => {
    const view = toView();
    foldNested(view);
    const folds = toFolds(view);
    expect(folds.length).toBe(3);
    const air = folds[0];
    if (air === undefined) throw new Error("no fold");
    view.dispatch({ effects: unfoldEffect.of(air) });
    expect(toFolds(view).length).toBe(2);
    view.destroy();
  });
});
