import * as vscode from "vscode";
import * as path from "path";
import {
  findNearestProjectRoot,
  readComments,
  writeComments,
  deleteComment,
  showCommentFileError,
} from "./commentFileUtils";

export class CommentUI {
  private static currentPanel: CommentUI | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly id: string;
  private readonly filePath: string;
  private readonly context: vscode.ExtensionContext;

  private constructor(
    panel: vscode.WebviewPanel,
    id: string,
    filePath: string,
    context: vscode.ExtensionContext
  ) {
    this.panel = panel;
    this.id = id;
    this.filePath = filePath;
    this.context = context;

    // Handle dispose
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        if (!this.filePath) {
          showCommentFileError("No file path provided for comment context.");
          return;
        }
        const projectRoot = findNearestProjectRoot(this.filePath);
        if (!projectRoot) {
          showCommentFileError(
            "Could not determine project root for comment storage."
          );
          return;
        }
        switch (message.command) {
          case "save":
            try {
              const comments = readComments(projectRoot);
              comments[this.id] = message.content;
              writeComments(projectRoot, comments);

              // Close the webview after successful save
              this.panel.dispose();
            } catch (err) {
              showCommentFileError("Failed to save comment.", err);
            }
            break;
          case "delete":
            try {
              deleteComment(projectRoot, this.id);

              // Remove the comment pattern from the code file
              const document = vscode.workspace.openTextDocument(this.filePath);
              document.then((doc) => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document === doc) {
                  const text = doc.getText();
                  const pattern = new RegExp(`\\s*//\\[cmt:${this.id}\\]`, "g");
                  const newText = text.replace(pattern, "");

                  if (newText !== text) {
                    editor.edit((editBuilder) => {
                      const fullRange = new vscode.Range(
                        doc.positionAt(0),
                        doc.positionAt(text.length)
                      );
                      editBuilder.replace(fullRange, newText);
                    });
                  }
                }
              });

              // Close the webview after successful deletion
              this.panel.dispose();
            } catch (err) {
              showCommentFileError("Failed to delete comment.", err);
            }
            break;
        }
      },
      undefined,
      this.disposables
    );
  }

  public static show(
    id: string,
    content: string = "",
    filePath: string,
    context: vscode.ExtensionContext
  ) {
    // Dispose if already open
    CommentUI.currentPanel?.dispose();

    const panel = vscode.window.createWebviewPanel(
      "inlineCommentEditor",
      `📝 Comment: ${id}`,
      vscode.ViewColumn.Three,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    CommentUI.currentPanel = new CommentUI(panel, id, filePath, context);
    CommentUI.currentPanel.updateHtml(content);
  }

  private updateHtml(content: string) {
    const quillJsUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, "media", "quill.min.js")
      )
    );
    const quillCssUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, "media", "quill.snow.css")
      )
    );
    const turndownJsUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, "media", "turndown.min.js")
      )
    );
    const markedJsUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, "media", "marked.min.js")
      )
    );

    console.log("Quill JS URI:", quillJsUri.toString());
    console.log("Quill CSS URI:", quillCssUri.toString());
    console.log("Turndown JS URI:", turndownJsUri.toString());
    console.log("Marked JS URI:", markedJsUri.toString());

    this.panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <link href="${quillCssUri}" rel="stylesheet">
      <style>
        body {
          background: var(--vscode-input-background, #181a20);
          color: var(--vscode-editor-foreground, #fff);
          font-family: var(--vscode-editor-font-family, sans-serif);
          margin: 30px 10px 10px 10px;
          padding: 12px;
          height: 100vh;
          display: flex;
        }

        body::-webkit-scrollbar {
          width: 4px;
        }

        body::-webkit-scrollbar-track {
          background: transparent;
        }

        body::-webkit-scrollbar-thumb {
          background-color: #999;
          border-radius: 3px;
        }

        .comment-container {
          background: var(--vscode-input-background, #181a20);
          border: 1px solid var(--vscode-editorWidget-border, #333);
          border-radius: 10px;
          width: 100%;
          max-width: 900px;
          height: 300px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }

        .ql-toolbar.ql-snow {
          border: none;
          padding: 2px;
        }

        .ql-editor.ql-blank::before {
          color: var(--vscode-input-placeholderForeground, #888) !important;
          font-style: normal; /* Optional: if Quill adds italic */
        }
        .ql-container {
          background: var(--vscode-input-background, #181a20);
          border: none !important;
          flex: 1;
          overflow-y: auto;
        }

        .ql-editor {
          color: var(--vscode-editor-foreground, #fff);
          padding: 8px 12px;
          font-size: 1rem;
          min-height: 100%;
          overflow-y: auto;
        }

        .ql-editor::-webkit-scrollbar {
          width: 4px;
        }

        .ql-editor::-webkit-scrollbar-track {
          background: transparent;
        }

        .ql-editor::-webkit-scrollbar-thumb {
          background-color: #999;
          border-radius: 3px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 10px 14px;
          border-top: 1px solid var(--vscode-editorWidget-border, #333);
          background: var(--vscode-input-background, #181a20);
        }

        .action-btn {
          background: var(--vscode-button-background, #3a3d41);
          color: var(--vscode-button-foreground, #fff);
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: var(--vscode-button-hoverBackground, #505357);
        }

        .ql-editor ul, .ql-editor ol {
         padding-left: 2px; /* reduce this to control left space */
         margin: 0;
          }

        .ql-editor li {
         margin-left: 0;
        }
         
      </style>
    </head>
    <body>
      <div class="comment-container">
        <div id="editor"></div>
        <div class="actions">
          <button class="action-btn" onclick="onSave()">Save</button>
        </div>
      </div>

      <script src="${quillJsUri}"></script>
      <script src="${turndownJsUri}"></script>
      <script src="${markedJsUri}"></script>
      <script>
        console.log("Quill script loaded:", typeof Quill);
        console.log("Turndown script loaded:", typeof TurndownService);
        console.log("Marked script loaded:", typeof marked);
        
        if (typeof Quill !== "undefined") {
          var quill = new Quill('#editor', {
            theme: 'snow',
            modules: { toolbar: [[{ 'list': 'bullet' }]] },
            placeholder: 'Write a comment…'
          });
          
          // Load existing content if it exists (convert markdown to HTML)
          const existingContent = ${JSON.stringify(content)};
          if (existingContent && existingContent.trim() !== '') {
            console.log("Loading existing markdown:", existingContent);
            const htmlContent = marked.parse(existingContent);
            console.log("Converted to HTML:", htmlContent);
            
            // Use Quill's clipboard API for proper HTML rendering
            quill.clipboard.dangerouslyPasteHTML(htmlContent);
          }
          
          // Simple paste handler - just get plain text
          // quill.root.addEventListener('paste', function(e) {
          //   e.preventDefault();
          //   const text = e.clipboardData.getData('text/plain');
          //   document.execCommand('insertText', false, text);
          // });
          
          const vscode = acquireVsCodeApi();
          
          function onSave() {
            const htmlContent = quill.root.innerHTML;
            console.log("💾 HTML content:", htmlContent);
            
            // Convert HTML to Markdown before saving
            const turndownService = new TurndownService();
            const markdownContent = turndownService.turndown(htmlContent);
            console.log("📝 Markdown content:", markdownContent);
            
            vscode.postMessage({ command: "save", content: markdownContent });
          }
          
          function onDelete() {
            vscode.postMessage({ command: "delete" });
          }
          
          // Make functions available globally for onclick handlers
          window.onSave = onSave;
          window.onDelete = onDelete;
        } else {
          document.body.innerHTML += "<div style='color:red'>Quill not loaded!</div>";
        }
      </script>
    </body>
    </html>
    `;
  }

  public dispose() {
    CommentUI.currentPanel = undefined;
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
