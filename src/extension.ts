// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { registerCommentTriggerListener } from "./listers/oncommentTrigger";
import { registerCommentHoverProvider } from "./listers/onHoverProvider";
import { CommentUI } from "./listers/commentUI";
import { findNearestProjectRoot, readComments, writeComments } from "./listers/commentFileUtils";


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("comment-notes extension activated");
  vscode.window.showInformationMessage("🟢 Extension Activated");
  context.subscriptions.push(
    registerCommentTriggerListener(context),
    registerCommentHoverProvider(),
    vscode.commands.registerCommand("extension.openCommentBox", (args) => {
      const id = args?.id;
      const filePath = args?.filePath || (vscode.window.activeTextEditor?.document.uri.fsPath ?? "");
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
    vscode.commands.registerCommand("extension.deleteCommentById", async (args) => {
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
          const text = document.getText();
          // Remove only the [cmt:ID] pattern (with optional leading/trailing spaces)
          const pattern = new RegExp(`\\[cmt:${id}\\]( )?`, 'g');
          const newText = text.replace(pattern, ' ');
          if (newText !== text) {
            await editor.edit(editBuilder => {
              const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
              );
              editBuilder.replace(fullRange, newText);
            });
          }
        }
        vscode.window.showWarningMessage(` Comment  deleted.`);
      }
    })
  );

}
