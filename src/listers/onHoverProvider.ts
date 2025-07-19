import * as vscode from "vscode";
import { findNearestProjectRoot, readComments } from "./commentFileUtils";

export function registerCommentHoverProvider(): vscode.Disposable {
  return vscode.languages.registerHoverProvider(
    { scheme: "file", language: "*" }, // or "typescript"
    {
      provideHover(document, position, token) {
        const lineText = document.lineAt(position.line).text;
        const regex = /\/\/\[cmt:([a-zA-Z0-9_-]{1,8})\]/g;

        let match: RegExpExecArray | null;
        while ((match = regex.exec(lineText))) {
          if (match.index === undefined) {continue;}

          const start = match.index;
          const end = start + match[0].length;

          const range = new vscode.Range(
            new vscode.Position(position.line, start),
            new vscode.Position(position.line, end)
          );

          const activeEditor = vscode.window.activeTextEditor;
          const isCursorInside =
            activeEditor?.selection.active.line === position.line &&
            range.contains(activeEditor.selection.active);

          if (range.contains(position) || isCursorInside) {
            const filePath = document.uri.fsPath;
            const projectRoot = findNearestProjectRoot(filePath);
            let commentText = "";
            if (projectRoot) {
              const comments = readComments(projectRoot);
              commentText = comments[match[1]] || "";
            }
            let markdown = "";
            if (commentText) {
              markdown += commentText + "\n\n";
            } else {
              markdown += "_No comment yet_\n\n";
            }
            markdown += "---\n";
            markdown += `[ Open Comment Box](command:extension.openCommentBox?${encodeURIComponent(
              JSON.stringify({ id: match[1], filePath })
            )})`;
            markdown += `&nbsp;&nbsp;&nbsp;[ Delete Comment](command:extension.deleteCommentById?${encodeURIComponent(
              JSON.stringify({ id: match[1], filePath })
            )})`;
            const md = new vscode.MarkdownString(markdown);
            md.isTrusted = true;
            return new vscode.Hover(md, range);
          }
        }

        return undefined;
      },
    }
  );
}
