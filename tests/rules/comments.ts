import ts from "typescript";

export type CommentProblem = { line: number; text: string };

const directive = /^\/\/ eslint-disable-next-line [\w@/-]+$/;

function isOneLineJsdoc(text: string): boolean {
  return text.startsWith("/**") && !text.includes("\n");
}

function collectTokens(node: ts.Node, into: ts.Node[]): void {
  if (node.getChildCount() === 0) into.push(node);
  node.getChildren().forEach((child) => {
    if (!ts.isJSDoc(child)) collectTokens(child, into);
  });
}

/** Finds comments that the rules forbid: anything but a one-line JSDoc above an export or an eslint directive. */
export function findCommentProblems(file: string, source: string): CommentProblem[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const tokens: ts.Node[] = [];
  collectTokens(sourceFile, tokens);
  const problems = new Map<number, CommentProblem>();
  const jsxText = tokens.filter((token) => token.kind === ts.SyntaxKind.JsxText);
  const isInJsxText = (position: number): boolean =>
    jsxText.some((token) => position >= token.getFullStart() && position < token.getEnd());
  for (const token of tokens) {
    const leading = ts.getLeadingCommentRanges(source, token.getFullStart()) ?? [];
    const trailing = ts.getTrailingCommentRanges(source, token.getEnd()) ?? [];
    for (const range of [...leading, ...trailing]) {
      const text = source.slice(range.pos, range.end);
      const allowedJsdoc = isOneLineJsdoc(text) && token.kind === ts.SyntaxKind.ExportKeyword;
      if (allowedJsdoc || directive.test(text) || isInJsxText(range.pos)) continue;
      const line = sourceFile.getLineAndCharacterOfPosition(range.pos).line + 1;
      problems.set(range.pos, { line, text });
    }
  }
  return [...problems.values()];
}

/** Finds exported functions and components without a JSDoc comment directly above them. */
export function findMissingDocs(file: string, source: string): number[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const missing: number[] = [];
  for (const statement of sourceFile.statements) {
    if (!isExportedFunction(statement)) continue;
    const documented = (ts.getLeadingCommentRanges(source, statement.getFullStart()) ?? []).some(
      (range) => isOneLineJsdoc(source.slice(range.pos, range.end)),
    );
    if (!documented) {
      missing.push(sourceFile.getLineAndCharacterOfPosition(statement.getStart()).line + 1);
    }
  }
  return missing;
}

function isExportedFunction(statement: ts.Statement): boolean {
  const exported = ts.canHaveModifiers(statement)
    ? (ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false)
    : false;
  if (!exported) return false;
  if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) return true;
  if (!ts.isVariableStatement(statement)) return false;
  return statement.declarationList.declarations.some(
    (declaration) =>
      declaration.initializer !== undefined &&
      (ts.isArrowFunction(declaration.initializer) ||
        ts.isFunctionExpression(declaration.initializer)),
  );
}
