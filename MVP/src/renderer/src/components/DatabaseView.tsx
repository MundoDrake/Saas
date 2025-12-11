import { useState, useEffect } from 'react';
import { FolderOpen, File, FilePlus, Folder, ArrowLeft } from 'lucide-react';
import { FileMetadata } from '../../../shared/types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { InputModal } from './InputModal';

interface DatabaseViewProps {
    folder: FileMetadata;
    onNavigate: (file: FileMetadata) => void;
    onBack?: () => void;
    canGoBack?: boolean;
}

export const DatabaseView = ({ folder, onNavigate, onBack, canGoBack }: DatabaseViewProps) => {
    const [files, setFiles] = useState<FileMetadata[]>([]);
    const [subFolders, setSubFolders] = useState<FileMetadata[]>([]);
    const [documents, setDocuments] = useState<FileMetadata[]>([]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        async function load() {
            const data = await window.api.getFiles(folder.path);
            setFiles(data);
            setSubFolders(data.filter(f => f.isDirectory));
            setDocuments(data.filter(f => !f.isDirectory));
        }
        load();
    }, [folder.path]);

    const handleCreateProject = async (name: string) => {
        try {
            const newFilePath = await window.api.createProjectFile(folder.path, name);
            if (newFilePath) {
                // Refresh list
                const data = await window.api.getFiles(folder.path);
                setFiles(data);
                setSubFolders(data.filter(f => f.isDirectory));
                setDocuments(data.filter(f => !f.isDirectory));
            } else {
                alert("Failed to create project (file might exist)");
            }
        } catch (error) {
            console.error("IPC Error:", error);
            alert("System Error: Check console");
        }
    };

    return (
        <div className="flex-1 h-screen overflow-hidden flex flex-col bg-background">
            <InputModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateProject}
                title="Create New Project"
                description="Enter the name for your new project file."
                placeholder="Project Name"
            />

            <div className="h-20 px-8 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    {canGoBack && (
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
                            <FolderOpen size={12} />
                            <span className="uppercase tracking-wider">{folder.name}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-gray-200 active:scale-95"
                >
                    <FilePlus size={16} /> <span>New Project</span>
                </button>
            </div>

            <div className="flex-1 overflow-auto p-8 space-y-10">

                {/* 1. Folder Grid */}
                {subFolders.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">Folders</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {subFolders.map(dir => (
                                <div
                                    key={dir.path}
                                    onClick={() => onNavigate(dir)}
                                    className="group relative bg-card border hover:border-primary/50 p-6 rounded-xl cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 flex flex-col items-center justify-center gap-4 text-center aspect-[5/4]"
                                >
                                    <div className="p-4 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                                        <Folder size={32} className="text-blue-500 fill-blue-500/20" />
                                    </div>
                                    <span className="font-medium text-lg text-foreground/80 group-hover:text-primary transition-colors truncate w-full px-2">
                                        {dir.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. File List */}
                {documents.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">Files</h2>
                        <div className="rounded-lg border bg-card/50 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="px-6 py-3 w-[40%]">Name</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Last Modified</th>
                                        <th className="px-6 py-3 text-right">Size</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {documents.map(file => (
                                        <tr
                                            key={file.path}
                                            className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                            onClick={() => onNavigate(file)}
                                        >
                                            <td className="px-6 py-4 font-medium flex items-center gap-3">
                                                <div className="p-2 rounded-md bg-muted group-hover:bg-background transition-colors border">
                                                    <File size={16} className="text-gray-500 group-hover:text-primary transition-colors shrink-0" />
                                                </div>
                                                <span className="truncate">{file.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {file.status ? (
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center shadow-sm",
                                                        file.status === 'Done' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                                            file.status === 'In Progress' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                                "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                                    )}>
                                                        {file.status}
                                                    </span>
                                                ) : <span className="text-muted-foreground/30">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                                                {file.lastModified ? format(new Date(file.lastModified), 'MMM d, yyyy') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-muted-foreground font-mono text-xs">
                                                {file.size ? (file.size / 1024).toFixed(1) + ' KB' : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {files.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl bg-card/30">
                        <FolderOpen size={48} className="mb-4 opacity-20" />
                        <p>This folder is empty</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 text-primary hover:underline text-sm"
                        >
                            Create your first project
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
