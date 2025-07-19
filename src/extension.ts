// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { registerCommentTriggerListener } from "./listers/onCommentTrigger";
import { registerCommentHoverProvider } from "./listers/onHoverProvider";
import { CommentUI } from "./listers/commentUI";
import {
  findNearestProjectRoot,
  readComments,
  writeComments,
} from "./listers/commentFileUtils";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

    // 
export function activate(context: vscode.ExtensionContext) {
  console.log("comment-notes extension activated");
  vscode.window.showInformationMessage("🟢 Extension Activated");
  context.subscriptions.push(
    registerCommentTriggerListener(context),
    registerCommentHoverProvider(),
    vscode.commands.registerCommand("extension.openCommentBox", (args) => {
      const id = args?.id;
      const filePath =
        args?.filePath ||
        (vscode.window.activeTextEditor?.document.uri.fsPath ?? "");
      let content = "";
      if (id && filePath) {
        const projectRoot = findNearestProjectRoot(filePath);
        if (projectRoot) {
          const comments = readComments(projectRoot);
          content = comments[id] || "";
        }
        // Pass context as the 4th argument!
        CommentUI.show(id, content, filePath, context);
      }
    }),
    vscode.commands.registerCommand(
              "extension.deleteCommentById",
        async (args) => {
          const id = args?.id;
          const filePath = args?.filePath;
          if (id && filePath) {
            const projectRoot = findNearestProjectRoot(filePath);
            if (projectRoot) {
              // Delete from comment.json
              const comments = readComments(projectRoot);
              delete comments[id];
              writeComments(projectRoot, comments);
            }
            // Remove the pattern from the code file
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === document) {
              // Small delay to prevent listener interference
              await new Promise(resolve => setTimeout(resolve, 50));
              const text = document.getText();
              // Find the specific pattern to remove
              const pattern = new RegExp(`\\[cmt:${id}\\]( )?`, "g");
              let match;
              const matches: Array<{start: number, end: number}> = [];
              
              // Find all matches
              while ((match = pattern.exec(text)) !== null) {
                matches.push({
                  start: match.index,
                  end: match.index + match[0].length
                });
              }
              
              // Remove matches in reverse order to maintain positions
              if (matches.length > 0) {
                await editor.edit((editBuilder) => {
                  for (let i = matches.length - 1; i >= 0; i--) {
                    const { start, end } = matches[i];
                    const range = new vscode.Range(
                      document.positionAt(start),
                      document.positionAt(end)
                    );
                    editBuilder.delete(range);
                  }
                });
              }
            }
            vscode.window.showWarningMessage(` Comment  deleted.`);
          }
        }
    )
  );
}
 // 