import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT_FILES = [
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml"
];

export function showCommentFileError(message: string, error?: any) {
  vscode.window.showErrorMessage(`Comment Notes: ${message}` + (error ? ` (${error})` : ""));
}

// Find the nearest folder containing a project root file
export function findNearestProjectRoot(filePath: string): string | undefined {
  let dir = path.dirname(filePath);
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return undefined;
  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  while (dir.startsWith(workspaceRoot)) {
    for (const rootFile of PROJECT_ROOT_FILES) {
      if (fs.existsSync(path.join(dir, rootFile))) {
        return dir;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: workspace root
  return workspaceRoot;
}

// Read comments from comment.json in the given directory
export function readComments(projectRoot: string): Record<string, string> {
  const file = path.join(projectRoot, "comment.json");
  if (!fs.existsSync(file)) return {};
  try {
    const data = fs.readFileSync(file, "utf8");
    return JSON.parse(data);
  } catch (err) {
    showCommentFileError("Failed to read comment.json", err);
    return {};
  }
}

// Write comments to comment.json in the given directory
export function writeComments(projectRoot: string, comments: Record<string, string>) {
  const file = path.join(projectRoot, "comment.json");
  try {
    fs.writeFileSync(file, JSON.stringify(comments, null, 2), "utf8");
  } catch (err) {
    showCommentFileError("Failed to write comment.json", err);
  }
}

// Delete a comment by id
export function deleteComment(projectRoot: string, id: string) {
  const comments = readComments(projectRoot);
  if (comments[id]) {
    delete comments[id];
    writeComments(projectRoot, comments);
  }
} 