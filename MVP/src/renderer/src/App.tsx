import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DatabaseView } from './components/DatabaseView';
import { MarkdownEditor } from './components/MarkdownEditor';
import { WorkspaceView } from './components/WorkspaceView';
import { FileMetadata } from '../../shared/types';
import { Loader2 } from 'lucide-react';

function App() {
    const [vaultRoot, setVaultRoot] = useState<string | null>(null);
    const [currentFile, setCurrentFile] = useState<FileMetadata | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const state = await window.api.getInitialState();
            if (state) {
                setVaultRoot(state.rootPath);
                // Don't auto-select root (Hub) as it might be confusing. 
                // Let user select a workspace from sidebar.
            }
            setIsLoading(false);
        };
        init();
    }, []);

    const handleSelect = (file: FileMetadata) => {
        setCurrentFile(file);
    };

    const handleBack = async () => {
        if (!currentFile || !vaultRoot) return;

        // If currently at root, do nothing
        if (currentFile.path === vaultRoot) return;

        // Use dirname to get parent path (now async via IPC)
        const parentPath = await window.api.dirname(currentFile.path);

        // Security check
        if (!parentPath.startsWith(vaultRoot)) {
            return;
        }

        // Determine name for parent (basic fallback)
        const parentName = parentPath === vaultRoot ? 'Root' : parentPath.split(/[\\/]/).pop() || 'Folder';

        handleSelect({
            path: parentPath,
            name: parentName,
            isDirectory: true
        } as FileMetadata);
    };

    const isWorkspaceRoot = (file: FileMetadata) => {
        if (!vaultRoot) return false;
        // Check if the file's parent is the vault root
        // Using string manipulation for synchronous check
        // Normalized check involves checking if filtering empty segments results in 1 more segment than root
        // Simple heuristic: 
        // root: C:/Users/Docs/StudioVault
        // file: C:/Users/Docs/StudioVault/Orbital
        // file is workspace root.

        // We can assume valid paths.
        // If file.path starts with vaultRoot AND has no separators after the workspace name.
        if (!file.path.startsWith(vaultRoot)) return false;

        const relative = file.path.slice(vaultRoot.length).replace(/^[\\/]/, '');
        // If relative has no slashes, it's a direct child (Worksapce)
        return !relative.includes('/') && !relative.includes('\\') && relative.length > 0;
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background text-primary">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {/* Main App Layout */}
            <Sidebar
                rootPath={vaultRoot}
                onSelect={handleSelect}
                currentPath={currentFile?.path || null}
            />
            <main className="flex-1 flex flex-col min-w-0 bg-background/50">
                {currentFile ? (
                    currentFile.isDirectory ? (
                        isWorkspaceRoot(currentFile) ? (
                            <WorkspaceView workspace={currentFile} onNavigate={handleSelect} />
                        ) : (
                            <DatabaseView
                                folder={currentFile}
                                onNavigate={handleSelect}
                                onBack={handleBack}
                                canGoBack={currentFile.path !== vaultRoot}
                            />
                        )
                    ) : (
                        <MarkdownEditor
                            file={currentFile}
                            onBack={handleBack}
                        />
                    )
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Selecione um Workspace para começar
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
