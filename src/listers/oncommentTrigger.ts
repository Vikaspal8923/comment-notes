import * as vscode from "vscode";
import { CommentUI } from "./commentUI";

const { nanoid } = require("nanoid");

const originalIds: Record<string, Record<number, string>> = {};

let isConverting = false;

// ───────────────────────────────────────────────────────────
// 🏷️ UTILS
// ───────────────────────────────────────────────────────────

function normalizeId(id: string): string {
  return id.slice(0, 8);
}

function generateCommentTag(id: string, needsTrailingSpace: boolean = false): string {
  return ` //[cmt:${id}]${needsTrailingSpace ? ' ' : ''}`;
}

function extractCommentTag(lineText: string): {
  id: string;
  start: number;
  end: number;
} | null {
  const regex = / ?\/\/\[cmt:([a-zA-Z0-9_-]{1,})\]/;
  const match = regex.exec(lineText);
  if (!match || match.index === undefined) return null;

  const id = normalizeId(match[1]);
  const start = match.index;
  const end = match.index + match[0].length;

  return { id, start, end };
}

function replaceRange(
  editor: vscode.TextEditor,
  range: vscode.Range,
  newText: string,
  restoreCursorTo?: vscode.Position
): Thenable<void> {
  return editor
    .edit((editBuilder) => {
      editBuilder.replace(range, newText);
    })
    .then(() => {
      if (restoreCursorTo) {
        editor.selection = new vscode.Selection(
          restoreCursorTo,
          restoreCursorTo
        );
      }
    });
}

// ───────────────────────────────────────────────────────────
// 🧩 INSERTION HANDLER
// ───────────────────────────────────────────────────────────

export async function insertCommentWithId(
  editor: vscode.TextEditor,
  replaceRange: vscode.Range
): Promise<void> {
  const id = normalizeId(nanoid(8));
  const lineText = editor.document.lineAt(replaceRange.start.line).text;
  const afterPattern = lineText.slice(replaceRange.end.character).trim();
  const needsTrailingSpace = afterPattern.length > 0;
  const newText = generateCommentTag(id, needsTrailingSpace);

  isConverting = true;

  await editor.edit((editBuilder) => {
    editBuilder.replace(replaceRange, newText);
  });

  // Place cursor inside the pattern (before the closing bracket)
  const insidePosition = replaceRange.start.translate(0, newText.length - (needsTrailingSpace ? 2 : 1));
  editor.selection = new vscode.Selection(insidePosition, insidePosition);
  editor.revealRange(new vscode.Range(insidePosition, insidePosition));

  // Store the original ID for this line and file
  if (!originalIds[editor.document.uri.fsPath]) originalIds[editor.document.uri.fsPath] = {};
  originalIds[editor.document.uri.fsPath][replaceRange.start.line] = id;

  isConverting = false;
}

// ───────────────────────────────────────────────────────────
// 📌 MAIN LISTENER REGISTRATION
// ───────────────────────────────────────────────────────────

export function registerCommentTriggerListener(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const docChangeListener = vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (isConverting) return;

      const editor = vscode.window.activeTextEditor;
      if (!editor || event.document !== editor.document) return;

      for (const change of event.contentChanges) {
        const lineText = event.document.lineAt(change.range.start.line).text;
        const cursorPos = editor.selection.active;
        const line = change.range.start.line;

        // Auto-convert `//[cmt]` to `[cmt:id()]` format
        if (lineText.includes("//[cmt]")) {
          const index = lineText.indexOf("//[cmt]");
          const replaceRange = new vscode.Range(
            change.range.start.line,
            index,
            change.range.start.line,
            index + 7
          );
          insertCommentWithId(editor, replaceRange);
          return;
        }

        // Validate existing tag
        const tag = extractCommentTag(lineText);
        if (tag) {
          const { id, start, end } = tag;
          const tagRange = new vscode.Range(
            new vscode.Position(change.range.start.line, start),
            new vscode.Position(change.range.start.line, end)
          );

          // Aggressively restore the original ID if user tries to edit it
          const fileIds = originalIds[editor.document.uri.fsPath] || {};
          const originalId = fileIds[change.range.start.line];
          if (originalId && id !== originalId) {
            const expectedText = generateCommentTag(originalId);
            isConverting = true;
            replaceRange(editor, tagRange, expectedText).then(() => {
              isConverting = false;
            });
            return;
          }

          // Normalize the ID if manually typed longer than 8 chars
          const expectedText = generateCommentTag(id);
          const actualText = lineText.slice(start, end);
          if (actualText !== expectedText) {
            isConverting = true;
            replaceRange(editor, tagRange, expectedText).then(() => {
              isConverting = false;
            });
          }

          // Ensure a space after the pattern if there is text immediately after
          if (end < lineText.length && lineText[end] !== ' ') {
            isConverting = true;
            editor.edit(editBuilder => {
              editBuilder.insert(new vscode.Position(change.range.start.line, end), ' ');
            }).then(() => {
              isConverting = false;
            });
          }
        }
      }
    }
  );

  return {
    dispose() {
      docChangeListener.dispose();
    },
  };
}
