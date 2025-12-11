import { useState, useEffect } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Folder,
    FileText,
    MoreHorizontal,
    Trash2,
    Edit,
    FolderPlus,
} from 'lucide-react';
import { FileMetadata } from '../../../shared/types';
import { cn } from '../lib/utils';
import { InputModal } from './InputModal';

interface SidebarProps {
    rootPath: string | null;
    onSelect: (file: FileMetadata) => void;
    currentPath: string | null;
    onOpenWorkspace?: () => void;
}

// Context Menu Component (Reused)
const ContextMenu = ({
    onDelete,
    onEdit,
    showEdit = false,
}: {
    onDelete?: () => void;
    onEdit?: () => void;
    showEdit?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <MoreHorizontal size={14} className="text-gray-400" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[140px] z-50">
                        {showEdit && onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    onEdit();
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Edit size={14} />
                                <span>Editar Item</span>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    onDelete();
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 size={14} />
                                <span>Excluir</span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Folder Item Component
const FolderItem = ({
    file,
    onSelect,
    isActive,
    onDelete,
}: {
    file: FileMetadata;
    onSelect: (f: FileMetadata) => void;
    isActive: boolean;
    onDelete: (path: string, isDir: boolean) => void;
}) => {
    const Icon = file.isDirectory ? Folder : FileText;

    return (
        <div
            className={cn(
                'group flex items-center py-2.5 px-3 cursor-pointer text-sm font-medium rounded-md transition-all select-none mx-2',
                isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
            onClick={(e) => {
                e.stopPropagation(); // Prevent toggling workspace
                onSelect(file);
            }}
        >
            <Icon
                size={18}
                className={cn(
                    'mr-3 flex-shrink-0',
                    isActive ? 'text-teal-600' : 'text-gray-400'
                )}
            />
            <span className="truncate flex-1">{file.name.replace('.md', '')}</span>
            <ContextMenu
                onDelete={() => onDelete(file.path, file.isDirectory)}
            />
        </div>
    );
};

// Workspace Accordion Component
const WorkspaceAccordion = ({
    workspace,
    isActive, // Is this workspace open/expanded
    onToggle,
    onSelect,
    currentPath,
    onDeleteWorkspace,
    onRenameWorkspace,
    onDeleteFile
}: {
    workspace: FileMetadata;
    isActive: boolean;
    onToggle: () => void;
    onSelect: (f: FileMetadata) => void;
    currentPath: string | null;
    onDeleteWorkspace: (path: string) => void;
    onRenameWorkspace: (path: string) => void;
    onDeleteFile: (path: string, isDir: boolean) => void;
}) => {
    const [children, setChildren] = useState<FileMetadata[]>([]);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

    // Load children when active or workspace changes
    useEffect(() => {
        if (isActive) {
            loadChildren();
        }
    }, [isActive, workspace.path]);

    const loadChildren = async () => {
        const files = await window.api.getFiles(workspace.path);
        // Only show folders in the sidebar tree
        const foldersOnly = files.filter(f => f.isDirectory);
        setChildren(foldersOnly);
    };

    const handleCreateFolder = async (name: string) => {
        const result = await window.api.createFolder(workspace.path, name);
        if (result.success) {
            if (!isActive) {
                onToggle();
            } else {
                await loadChildren();
            }
            // Return nothing/true to signal success to Modal
            return true;
        } else {
            // Return error object to Modal
            return { error: result.error || 'Falha ao criar pasta' };
        }
    };

    return (
        <div className="border-b border-gray-50 last:border-0">
            <InputModal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                onSubmit={handleCreateFolder}
                title={`Nova Pasta em ${workspace.name}`}
                placeholder="Nome da pasta"
            />

            {/* Workspace Header */}
            <div
                className={cn(
                    "flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors group",
                    isActive && "bg-gray-50/50"
                )}
                onClick={() => {
                    onToggle();
                    // Also select the workspace to show Dashboard
                    onSelect(workspace);
                }}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                        isActive ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
                    )}>
                        <span className="font-bold text-xs">
                            {workspace.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <span className={cn(
                        "font-semibold truncate flex-1",
                        isActive ? "text-gray-900" : "text-gray-600"
                    )}>
                        {workspace.name}
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ContextMenu
                        showEdit
                        onEdit={() => onRenameWorkspace(workspace.path)}
                        onDelete={() => onDeleteWorkspace(workspace.path)}
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFolderModalOpen(true); // Open modal to create folder IN THIS workspace
                        }}
                        className="p-1 rounded hover:bg-gray-200 text-gray-400"
                        title="Nova Pasta"
                    >
                        <Plus size={16} />
                    </button>
                    <div className="w-4 flex justify-center">
                        {isActive ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                    </div>
                </div>
            </div>

            {/* Workspace Content */}
            {isActive && (
                <div className="pb-2">
                    {children.length === 0 ? (
                        <div className="px-4 py-2 text-xs text-gray-400 ml-9">
                            Vazio
                        </div>
                    ) : (
                        children.map(file => (
                            <FolderItem
                                key={file.path}
                                file={file}
                                onSelect={onSelect}
                                isActive={currentPath === file.path}
                                onDelete={(path, isDir) => {
                                    onDeleteFile(path, isDir);
                                    // Refresh children after delete
                                    loadChildren();
                                }}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export const Sidebar = ({ rootPath, onSelect, currentPath }: SidebarProps) => {
    const [workspaces, setWorkspaces] = useState<FileMetadata[]>([]);
    const [activeWorkspacePath, setActiveWorkspacePath] = useState<string | null>(null);
    const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
    const [renameTarget, setRenameTarget] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        loadWorkspaces();
    }, [rootPath]); // Reload when rootPath (Hub) changes or mounts

    const loadWorkspaces = async () => {
        if (!rootPath) return;
        // rootPath is now the "StudioVault" hub
        const files = await window.api.getFiles(rootPath);
        // Filter only directories as workspaces
        const workspaceDirs = files.filter(f => f.isDirectory);
        setWorkspaces(workspaceDirs);

        // Default to first workspace if none active
        if (!activeWorkspacePath && workspaceDirs.length > 0) {
            setActiveWorkspacePath(workspaceDirs[0].path);
        }
    };

    const handleCreateWorkspace = async (name: string) => {
        const newPath = await window.api.createWorkspace(name);
        if (newPath) {
            await loadWorkspaces();
            setActiveWorkspacePath(newPath);
            // Auto-select the new workspace to show its Dashboard
            const workspaceName = newPath.split(/[\\/]/).pop() || name;
            onSelect({
                path: newPath,
                name: workspaceName,
                isDirectory: true
            } as FileMetadata);
            return true;
        } else {
            return { error: 'Falha ao criar workspace' };
        }
    };

    const handleDeleteWorkspace = async (path: string) => {
        if (confirm(`Excluir workspace "${path.split(/[\\/]/).pop()}" e todo seu conteúdo?`)) {
            const success = await window.api.deleteFolder(path);
            if (success) {
                await loadWorkspaces();
                if (activeWorkspacePath === path) {
                    setActiveWorkspacePath(null);
                }
            }
        }
    };

    const handleRenameWorkspace = async (newName: string) => {
        if (!renameTarget) return;
        const result = await window.api.renameItem(renameTarget, newName);
        if (result) {
            await loadWorkspaces();
        }
        setRenameTarget(null);
    };

    const handleDeleteFile = async (filePath: string, isDir: boolean) => {
        if (confirm(`Excluir ${isDir ? 'pasta' : 'arquivo'}?`)) {
            await (isDir ? window.api.deleteFolder(filePath) : window.api.deleteFile(filePath));
        }
    };

    if (!rootPath) return null;

    return (
        <div className="w-64 bg-white border-r border-gray-100 h-screen flex flex-col font-sans">
            <InputModal
                isOpen={isNewWorkspaceModalOpen}
                onClose={() => setIsNewWorkspaceModalOpen(false)}
                onSubmit={handleCreateWorkspace}
                title="Novo Workspace"
                placeholder="Nome do Workspace"
            />
            <InputModal
                isOpen={!!renameTarget}
                onClose={() => setRenameTarget(null)}
                onSubmit={handleRenameWorkspace}
                title="Renomear Workspace"
                placeholder="Novo nome"
            />

            {/* Sidebar Header / App Brand */}
            <div className="h-14 flex items-center px-4 border-b border-gray-100 flex-shrink-0">
                <span className="font-bold text-gray-900 tracking-tight flex-1">StudioVault</span>
                <button
                    onClick={() => setIsNewWorkspaceModalOpen(true)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Novo Workspace"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Workspaces List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {workspaces.map(ws => (
                    <WorkspaceAccordion
                        key={ws.path}
                        workspace={ws}
                        isActive={activeWorkspacePath === ws.path}
                        onToggle={() => setActiveWorkspacePath(activeWorkspacePath === ws.path ? null : ws.path)}
                        onSelect={onSelect}
                        currentPath={currentPath}
                        onDeleteWorkspace={handleDeleteWorkspace}
                        onRenameWorkspace={(path) => setRenameTarget(path)}
                        onDeleteFile={handleDeleteFile}
                    />
                ))}
            </div>
        </div>
    );
};
