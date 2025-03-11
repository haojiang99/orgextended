# VS Code Org Mode Extension

This extension adds basic Org mode support to Visual Studio Code, similar to Emacs Org mode.

## Features

### 1. Syntax Highlighting
- Headings with different levels
- TODO states with color coding:
  - TODO (orange)
  - IN-PROGRESS (yellow)
  - WAITING (blue)
  - DONE (green)
- Full-line styling:
  - Highlighted background for TODO lines
  - Optional colored text for the entire line matching the TODO state color
  - Optional bold text for the entire line
- Code and example blocks with purple background highlighting
  - Supports blocks with separated checkboxes: `- [ ] #+BEGIN_EXAMPLE`
  - Supports blocks with attached checkboxes: `[x]#+BEGIN_EXAMPLE`
  - Checked blocks (with [x]) display with green text
  - Both checked and unchecked checkboxes are supported
- Checkboxes ([ ], [x], [X])
- Basic formatting (bold, italic, underline, code)
- Lists
- Links
- Code blocks
- Comments

### 2. TODO States
- Toggle between TODO states (TODO → IN-PROGRESS → WAITING → DONE → none)
- Default keybinding: `Alt+T`
- Quick pick menu to select TODO state directly with `Alt+C` when cursor is on a TODO line

### 3. Checkboxes
- Toggle checkboxes ([ ] ↔ [x])
- Default keybinding: `Alt+C` (when cursor is not on a TODO line)
- Create a new checkbox item with `Alt+D` anywhere in the document

### 4. Example Blocks
- Create a new example block with `Alt+E`
- Automatically formats with BEGIN/END tags and positions cursor on the middle line
- Example blocks get purple highlighting

### 5. Folding

- Fold all headings with Alt+F
- Unfold all headings with Alt+Shift+F
- Use Tab on any heading line to toggle folding for that heading block
- VS Code's standard folding shortcuts also work (Ctrl+Shift+[ to fold, Ctrl+Shift+] to unfold)

### 6. Keyboard Shortcuts

- Tab - Toggle fold/unfold for the current heading block
- Ctrl+Enter - Create a new item:

- On TODO heading lines: Creates a new heading with the same TODO state after the current TODO block
- On checkbox lines: Creates a new line with an empty checkbox
- On regular lines: Creates a new line with the same indentation


- Alt+T - Toggle TODO state (cycles through states)
- Alt+C - Choose TODO state (when on TODO line) or toggle checkbox (elsewhere)
- Alt+D - Create a new checkbox item
- Alt+E - Create a new example block
- Alt+F - Fold all headings
- Alt+Shift+F - Unfold all headings

## Installation

### From Source
1. Clone the repository:
   ```
   git clone https://github.com/your-username/vscode-org-mode.git
   ```

2. Navigate to the extension directory:
   ```
   cd vscode-org-mode
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Compile the extension:
   ```
   npm run compile
   ```

5. Package the extension:
   ```
   npx vsce package
   ```

6. Install the extension:
   - In VS Code, go to Extensions view (Ctrl+Shift+X)
   - Click "..." at the top of the Extensions view
   - Select "Install from VSIX..." and choose the generated .vsix file

## Usage

### Creating a new Org file
- Create a new file with the `.org` extension
- The extension will automatically activate for `.org` files

### Working with TODO items
- Create a heading with asterisks: `* Heading`
- Toggle through TODO states with `Alt+T`
- Quick select a specific TODO state with `Alt+C` when cursor is on a TODO line
- Create a new TODO item with `Ctrl+Enter`

### Working with checkboxes
- Create a list item: `- Item`
- Toggle checkbox with `Alt+C` (when not on a TODO line)
- Create a new checkbox item with `Alt+D`
- Create a new checkbox with `Ctrl+Enter` when cursor is on a checkbox line

### Working with blocks
- Create an example block quickly with `Alt+E` (with option for checkbox style)
- Create a source code block:
  ```
  #+BEGIN_SRC typescript
  function example() {
    console.log("Hello, World!");
  }
  #+END_SRC
  ```
- Create an example block manually:
  ```
  #+BEGIN_EXAMPLE
  This is an example block.
  It can contain multiple lines.
  #+END_EXAMPLE
  ```
- Create blocks with checkboxes (two styles supported):
  ```
  # Style 1: Checkbox with space (- [ ] prefix)
  - [ ] #+BEGIN_EXAMPLE
    This is an example block with a separated checkbox.
  - [ ] #+END_EXAMPLE
  
  # Style 2: Checkbox directly attached (no space)
  [x]#+BEGIN_EXAMPLE
    This is an example block with an attached checkbox.
    Text will appear in green since the checkbox is checked.
  [x]#+END_EXAMPLE
  ```
- All block types will be highlighted with a purple background
- Blocks with checked checkboxes ([x]) will have green text

### 8. Archiving
- Archive DONE items with `Alt+A` when cursor is on a DONE heading
- Archive any heading (regardless of status) with `Alt+Shift+A`
- Archived items are moved to a `.archive.org` file with the same base name
- Archive files include timestamps and original content structure
- Option to open the archive file after archiving

### Working with archives
- Complete a task by changing its state to DONE
- Position cursor on the DONE heading line
- Press `Alt+A` to archive the completed item
- The entire heading block will be moved to the archive file
- Archive files maintain the same structure as the original
- Archive entries include a timestamp showing when they were archived

## Extension Settings

### Configurable Options
This extension provides the following settings:

- `orgMode.highlightEntireLine`: Whether to color the entire line text with the TODO state color (default: true)
- `orgMode.boldEntireLine`: Whether to make the entire TODO line bold (default: false)
- `orgMode.highlightCodeBlocks`: Whether to highlight code and example blocks with a purple background (default: true)
- `orgMode.codeBlockOpacity`: The opacity of the code block background highlighting, from 0.0 to 1.0 (default: 0.1)

You can customize these settings in your settings.json file:

```json
"orgMode.highlightEntireLine": true,
"orgMode.boldEntireLine": true,
"orgMode.highlightCodeBlocks": true,
"orgMode.codeBlockOpacity": 0.2
```

### Theme Colors
This extension contributes the following colors that can be customized in your VS Code settings:

- `org.todoKeyword`: Color for TODO keywords (default: orange)
- `org.inProgressKeyword`: Color for IN-PROGRESS keywords (default: gold)
- `org.waitingKeyword`: Color for WAITING keywords (default: steel blue)
- `org.doneKeyword`: Color for DONE keywords (default: lime green)
- `org.srcBlock`: Background color for source code blocks (default: indigo/purple)
- `org.exampleBlock`: Background color for example blocks (default: indigo/purple)

You can customize these colors in your settings.json file:

```json
"workbench.colorCustomizations": {
  "org.todoKeyword": "#FF0000",
  "org.inProgressKeyword": "#FFA500",
  "org.waitingKeyword": "#0000FF",
  "org.doneKeyword": "#008000",
  "org.srcBlock": "#800080",
  "org.exampleBlock": "#800080"
}
```

The extension adds subtle background highlighting to the entire line containing a TODO keyword to make it easier to identify the status of tasks at a glance. With the `highlightEntireLine` setting enabled, the text color of the entire line will match the TODO state color.

## Known Issues

- Limited subset of Org mode functionality compared to Emacs
- No table support yet
- Limited export capabilities

## Future Improvements

- Table support
- More formatting options
- Agenda view
- Export to HTML/PDF
- Custom TODO sequences via settings
- Links and navigation
- Folding
- Timestamps and dates

## License

MIT
