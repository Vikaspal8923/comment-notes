# Comment Notes

A powerful VS Code extension for managing long-form comments with unique IDs, stored externally in JSON files. Perfect for developers who need to write detailed documentation without cluttering their code.

![Comment Notes Demo](https://via.placeholder.com/800x400/2d3748/ffffff?text=Comment+Notes+Demo)

## ✨ Features

- **🆔 Unique Comment IDs**: Automatically generate unique 8-character IDs for each comment
- **📝 Rich Text Editor**: Beautiful Quill.js editor with bullet points and markdown support
- **🔗 Hover Integration**: Hover over comment patterns to see content and quick actions
- **💾 External Storage**: Comments stored in `comment.json` files near project roots
- **🔄 Auto-Conversion**: Type `//[cmt]` and it automatically converts to `//[cmt:ID]`
- **🔒 Read-Only IDs**: Comment IDs are protected from accidental editing
- **🧹 Smart Cleanup**: Orphaned comments are automatically cleaned up
- **🎨 Modern UI**: Clean, Discord/Slack-style interface that fits VS Code's theme

## 🚀 Quick Start

1. **Install the extension** from the VS Code marketplace
2. **Type `//[cmt]`** in any code file and press Enter
3. **Hover over the generated pattern** to see your comment or "No comment yet"
4. **Click "Open Comment Box"** to edit your comment
5. **Save** and your comment is stored in a `comment.json` file

## 📖 Usage

### Creating Comments

```javascript
//[cmt:abc12345] This is a simple comment
function myFunction() {
    // Your code here
}
```

### Comment Patterns

- **Auto-conversion**: Type `//[cmt]` → converts to `//[cmt:uniqueID]`
- **Manual**: Type `//[cmt:yourID]` (ID will be normalized to 8 characters)
- **Read-only**: IDs cannot be edited, only deleted

### Managing Comments

- **Hover**: See comment content and quick actions
- **Open**: Click "Open Comment Box" to edit in a rich text editor
- **Delete**: Click "Delete Comment" to remove both pattern and content
- **Storage**: Comments saved as markdown in `comment.json` files

## ⚙️ Configuration

The extension adds these settings to VS Code:

| Setting | Default | Description |
|---------|---------|-------------|
| `commentNotes.autoInsertSpace` | `true` | Automatically insert space after comment patterns |
| `commentNotes.commentFileLocation` | `project-root` | Where to store comment.json files |

## 🗂️ File Structure

```
your-project/
├── src/
│   └── your-code.js
├── comment.json          ← Comments stored here
└── package.json
```

The `comment.json` file contains:
```json
{
  "abc12345": "# My Comment\n\nThis is a detailed comment with **markdown** support.",
  "def67890": "- Bullet point 1\n- Bullet point 2"
}
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- VS Code Extension Development Host

### Setup

```bash
git clone https://github.com/yourusername/comment-notes.git
cd comment-notes
npm install
npm run compile
```

### Testing

```bash
npm run test
```

### Building

```bash
npm run package
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Comments are stored per project root (not workspace root)
- Large comment files may impact performance
- Quill editor requires internet connection for initial load

## 🔄 Release Notes

### 1.0.0
- Initial release
- Basic comment management with unique IDs
- Hover provider with quick actions
- Rich text editor with markdown support
- External JSON storage
- Auto-conversion and ID protection

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/comment-notes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/comment-notes/discussions)
- **Email**: your-email@example.com

---

**Made with ❤️ for the VS Code community**
