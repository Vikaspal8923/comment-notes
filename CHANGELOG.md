# Change Log

All notable changes to the "Comment Notes" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.0] - 2024-12-19

### Added
- Initial release of Comment Notes extension
- Unique 8-character ID generation for comments
- Auto-conversion of `//[cmt]` to `//[cmt:ID]` pattern
- Hover provider showing comment content and quick actions
- Rich text editor (Quill.js) with bullet points and markdown support
- External JSON storage in `comment.json` files
- Read-only comment IDs with auto-revert protection
- Smart cleanup of orphaned comments
- Modern Discord/Slack-style UI
- Markdown ↔ HTML conversion for comment storage
- Cursor positioning inside comment patterns
- Automatic space insertion after patterns
- Configuration options for auto-insert space and file location

### Technical Features
- TypeScript implementation with VS Code Extension API
- Document change listeners for real-time pattern detection
- Webview panels for rich text editing
- File system operations for JSON storage
- Regex pattern matching and validation
- Error handling and user feedback

## [Unreleased]

### Planned
- Comment search and filtering
- Comment templates
- Export/import functionality
- Team collaboration features
- Comment analytics and insights