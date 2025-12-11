# StudioVault

This document provides an overview of the project structure and key components of StudioVault, a brand management desktop application built with Electron, React, and TypeScript.

## Project Structure

### Root Directories
- `src/main`: Contains the Electron main process code (Node.js environment).
- `src/preload`: Scripts that run before the renderer starts, exposing safe APIs.
- `src/renderer`: The React application (UI) logic.
- `src/shared`: Types and utilities shared between Main and Renderer processes.

---

## Detailed Component & File Description

### 1. Main Process (`src/main`)
The backend of the desktop app, handling system operations.

- **`index.ts`**: The entry point of the Electron app. Handles window creation and lifecycle events.
- **`ipc.ts`**: Defines Inter-Process Communication (IPC) handlers. It listens for requests from the UI (like 'open-folder', 'save-file') and executes them.
- **`indexer.ts`**: Contains the `FileIndexer` class responsible for:
  - Scanning directories for files/folders.
  - Parsing Markdown files (extracting Frontmatter).
  - Creating new project files and folders.
  - Managing file system operations.
- **`store.ts`**: Simple persistence layer (using `electron-store` or similar) to save user preferences like the `lastVaultPath`.

### 2. Preload Scripts (`src/preload`)
- **`index.ts`**: Acts as a bridge. It exposes specific functions from the `main` process to the `renderer` via the `window.api` object, ensuring security by not exposing the entire Node.js API to the UI.

### 3. Shared (`src/shared`)
- **`types.ts`**: TypeScript interfaces shared across the app.
  - `FileMetadata`: Defines the shape of a file object (path, name, size, frontmatter).
  - `IElectronAPI`: Defines the contract for the API exposed to the renderer.
  - `IPC`: Constants for IPC channel names.

### 4. Renderer Process (`src/renderer`)
The frontend React application.

#### Core Files
- **`main.tsx`**: The React entry point. Mounts the `App` component to the DOM.
- **`App.tsx`**: The main layout component. Manages global state like `vaultRoot`, `currentFile`, and routing between the `Sidebar`, `DatabaseView`, and `MarkdownEditor`.
- **`index.css`**: Global styles and Tailwind CSS directives.

#### Components (`src/renderer/src/components`)
- **`Sidebar.tsx`**: The left navigation panel. Displays the file tree and allows users to select files or folders.
- **`DatabaseView.tsx`**: A grid/list view for folders. Shows files within a selected directory as cards or list items, similar to a file explorer.
- **`MarkdownEditor.tsx`**: The rich text editor component.
  - Uses **Tiptap** for WYSIWYG editing.
  - Handles parsing and stringifying Frontmatter (metadata).
  - Manages the saving state (`isDirty`) and auto-saving logic.
- **`EditorToolbar.tsx`**: The floating or fixed toolbar above the editor. Contains buttons for formatting (Bold, Italic, H1-H3, Lists, Alignment).
- **`TopBar.tsx`**: The header of the editor view. Shows the current file title/breadcrumb and provides document-level actions (like Save? or potentially others in future).
- **`InputModal.tsx`**: A reusable modal component for accepting user input (e.g., when creating a new folder or project).

#### Libraries (`src/renderer/src/lib`)
- **`frontmatter.ts`**: Utilities for parsing and generating YAML frontmatter from Markdown content.
- **`utils.ts`**: General helper functions (e.g., class name merging with `cn`).

---

## Configuration Files

- **`tailwind.config.js`**: Configuration for Tailwind CSS. Defines the color palette, typography styles, and plugins used in the app.
- **`tsconfig.json`**: TypeScript configuration settings.
- **`vite.config.ts`**: Build configuration for Vite, handling the compilation of both Main and Renderer processes into the final Electron app.
- **`package.json`**: Lists project dependencies and scripts (dev, build).
