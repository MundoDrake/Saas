import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

import { motion, Variants } from 'framer-motion';
import {
    FileText,
    Folder,
    Bookmark,
    Plus,
    MoreHorizontal,
    HardDrive,
    Cloud,
    Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SelectionModal, SelectionOption } from './SelectionModal';
import { InputModal } from './InputModal';


// --- Types ---
interface WorkspaceItem {
    id: string;
    title: string;
    breadcrumb: string;
    type: 'file' | 'folder';
    date?: string;
    original?: any;
}

interface FolderItem {
    id: string;
    name: string;
    original?: any;
}

// --- Mock Data ---
const MOCK_RECENT: WorkspaceItem[] = [
    { id: '1', title: 'Segunda', breadcrumb: 'em Orbital', type: 'folder' },
    { id: '2', title: 'Atividade do dia', breadcrumb: 'em Segunda', type: 'file' },
    { id: '3', title: 'Atividade do dia', breadcrumb: 'em Domingo', type: 'file' },
    { id: '4', title: 'Domingo', breadcrumb: 'em Orbital', type: 'folder' },
    { id: '5', title: 'Sabado', breadcrumb: 'em Orbital', type: 'folder' },
    { id: '6', title: 'Sexta-feira', breadcrumb: 'em Orbital', type: 'folder' },
    { id: '7', title: 'Quinta-feira', breadcrumb: 'em Orbital', type: 'folder' },
    { id: '8', title: 'Quarta-feira', breadcrumb: 'em Orbital', type: 'folder' },
];

const MOCK_DOCS: WorkspaceItem[] = [
    { id: '1', title: 'Sem título', breadcrumb: 'em Documento', type: 'file' },
];

const MOCK_FOLDERS: FolderItem[] = [
    { id: '1', name: 'Segunda' },
    { id: '2', name: 'Terça-feira' },
    { id: '3', name: 'Quarta-feira' },
    { id: '4', name: 'Quinta-feira' },
    { id: '5', name: 'Sexta-feira' },
    { id: '6', name: 'Sabado' },
    { id: '7', name: 'Domingo' },
];

// --- Animations ---
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// --- Sub-components ---

const DashboardCard = ({ title, children, className, action }: { title: string, children: React.ReactNode, className?: string, action?: React.ReactNode }) => {
    return (
        <motion.div
            variants={itemVariants}
            className={cn(
                "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-80 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-300",
                className
            )}
        >
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center">
                <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{title}</h3>
                {action}
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {children}
            </div>
        </motion.div>
    );
};

const ListItem = ({ item }: { item: WorkspaceItem }) => {
    return (
        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group">
            {item.type === 'folder' ? (
                <Folder size={16} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            ) : (
                <FileText size={16} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            )}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate font-medium">{item.title}</span>
            </div>
            {item.date && (
                <span className="text-xs text-zinc-400 whitespace-nowrap">{item.date}</span>
            )}
        </div>
    );
};

const FolderChip = ({ folder }: { folder: FolderItem }) => {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer shadow-sm hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300"
        >
            <Folder size={18} strokeWidth={1.5} className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                {folder.name}
            </span>
        </motion.div>
    );
};

// --- Main Component ---
export const WorkspaceView = ({ workspace, onNavigate }: { workspace: any, onNavigate: (file: any) => void }) => {
    const [recentFiles, setRecentFiles] = useState<WorkspaceItem[]>([]);
    const [documents, setDocuments] = useState<WorkspaceItem[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);

    // Modal States
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);

    const loadWorkspaceData = async () => {
        if (!workspace?.path) return;

        // Fetch files from the workspace root
        const files = await window.api.getFiles(workspace.path);

        // Process Folders
        const folderItems = files
            .filter(f => f.isDirectory)
            .map(f => ({
                id: f.path,
                name: f.name,
                path: f.path,
                original: f
            }));
        setFolders(folderItems);

        // Process Documents (Root files only)
        const docItems = files
            .filter(f => !f.isDirectory)
            .map(f => ({
                id: f.path,
                title: f.name.replace(/\.md$/, ''),
                breadcrumb: `em ${workspace.name}`,
                type: 'file' as const,
                date: f.createdAt ? format(new Date(f.createdAt), 'dd/MM') : '',
                original: f
            }));
        setDocuments(docItems);

        // Process Recent Files (Recursively fetched from backend)
        // Exclude root-level files (those are shown in Documentos block)
        const recentRaw = await window.api.getRecentFiles(workspace.path, 10);
        const workspacePathNormalized = workspace.path.replace(/\\/g, '/');

        const recentItems = recentRaw
            .filter(f => {
                // Exclude files directly in the workspace root
                const parentDir = f.path.replace(/\\/g, '/').replace(/\/[^/]+$/, '');
                return parentDir !== workspacePathNormalized;
            })
            .map(f => ({
                id: f.path,
                title: f.name.replace(/\.md$/, ''),
                breadcrumb: `em ${f.path.includes(workspace.path) ? f.path.slice(workspace.path.length).split(/[\\/]/)[1] || 'Raiz' : 'Workspace'}`,
                type: 'file' as const,
                date: f.createdAt ? format(new Date(f.createdAt), 'dd/MM') : '',
                original: f
            }));

        setRecentFiles(recentItems);
    };

    const handleCreateFile = async (name: string) => {
        const fileName = name.endsWith('.md') ? name : `${name}.md`;
        const result = await window.api.createProjectFile(workspace.path, fileName, ''); // content empty

        if (result.success) {
            await loadWorkspaceData();
            return true;
        } else {
            return { error: result.error || 'Falha ao criar arquivo' };
        }
    };

    const handleImportFile = async () => {
        setIsSelectionOpen(false);
        const result = await window.api.importFile(workspace.path);

        if (result.success) {
            await loadWorkspaceData();
        } else if (result.error && result.error !== 'Seleção cancelada') {
            alert(result.error); // Simple alert for now, could use a Toast
        }
    };

    const selectionOptions: SelectionOption[] = [
        {
            id: 'local',
            label: 'Arquivos Locais',
            description: 'Importar arquivo (.md, .txt) do seu computador',
            icon: HardDrive,
            onClick: handleImportFile
        },
        {
            id: 'drive',
            label: 'Google Drive',
            description: 'Importar do Google Drive (Em breve)',
            icon: Cloud,
            onClick: () => alert('Integração com Drive em breve!'),
            disabled: true
        },
        {
            id: 'dropbox',
            label: 'Dropbox',
            description: 'Importar do Dropbox (Em breve)',
            icon: Database,
            onClick: () => alert('Integração com Dropbox em breve!'),
            disabled: true
        }
    ];

    useEffect(() => {
        loadWorkspaceData();
    }, [workspace]);

    return (
        <div className="h-full overflow-y-auto bg-zinc-50/50 dark:bg-black px-[15px] py-4 font-sans">
            <motion.div
                key={workspace.path} // Force re-render animation when switching workspaces
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
            >
                {/* Section A: Dashboard Top Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Recente (Now showing actual files in root) */}
                    <DashboardCard title="Recente">
                        <div className="space-y-0.5">
                            {recentFiles.length === 0 ? (
                                <div className="p-4 text-xs text-zinc-400 text-center">Nenhum arquivo recente</div>
                            ) : (
                                recentFiles.slice(0, 10).map(item => (
                                    <div key={item.id} onClick={() => onNavigate(item.original)}>
                                        <ListItem item={item} />
                                    </div>
                                ))
                            )}
                        </div>
                    </DashboardCard>

                    {/* Card 2: Documentos */}
                    {/* Card 2: Documentos */}
                    <DashboardCard
                        title="Documentos"
                        action={documents.length > 0 ? (
                            <button
                                onClick={() => setIsSelectionOpen(true)}
                                className="p-1 rounded-md text-zinc-400 hover:text-indigo-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                                title="Adicionar documento"
                            >
                                <Plus size={16} />
                            </button>
                        ) : null}
                    >
                        {documents.length > 0 ? (
                            <div className="space-y-0.5">
                                {documents.map(item => (
                                    <div key={item.id} onClick={() => onNavigate(item.original)}>
                                        <ListItem item={item} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center px-4 pb-4 space-y-4">
                                <div className="relative">
                                    <FileText size={48} strokeWidth={1} className="text-zinc-300/50 dark:text-zinc-700" />
                                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5">
                                        <Plus size={14} className="text-zinc-400" />
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 max-w-[180px] leading-relaxed">
                                    Os documentos facilitam a organização do seu conhecimento e projetos.
                                </p>
                                <button
                                    onClick={() => setIsSelectionOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors"
                                >
                                    Adicionar documento
                                </button>
                            </div>
                        )}
                    </DashboardCard>

                    {/* Card 3: Favoritos (Empty State) */}
                    <DashboardCard title="Favoritos">
                        <div className="h-full flex flex-col items-center justify-center text-center px-4 pb-4 space-y-4">
                            <div className="relative">
                                <Bookmark size={48} strokeWidth={1} className="text-zinc-300/50 dark:text-zinc-700" />
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5">
                                    <Plus size={14} className="text-zinc-400" />
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 max-w-[180px] leading-relaxed">
                                Os favoritos facilitam salvar itens da ClickUp ou qualquer URL da web.
                            </p>
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors">
                                Adicionar favorito
                            </button>
                        </div>
                    </DashboardCard>
                </div>

                {/* Section B: Folders Grid */}
                <div>
                    <h2 className="font-medium text-sm text-zinc-500 mb-4 px-1">Pastas</h2>
                    <motion.div
                        variants={containerVariants}
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
                    >
                        {folders.length === 0 ? (
                            <div className="col-span-full text-sm text-zinc-400 italic px-1">Nenhuma pasta neste workspace.</div>
                        ) : (
                            folders.map(folder => (
                                <div key={folder.id} onClick={() => onNavigate(folder.original)}>
                                    <FolderChip folder={folder} />
                                </div>
                            ))
                        )}
                    </motion.div>
                </div>
            </motion.div>

            <SelectionModal
                isOpen={isSelectionOpen}
                onClose={() => setIsSelectionOpen(false)}
                title="Adicionar Documento"
                description="Escolha onde deseja criar ou importar seu documento"
                options={selectionOptions}
            />

            <InputModal
                isOpen={isCreateFileOpen}
                onClose={() => setIsCreateFileOpen(false)}
                onSubmit={handleCreateFile}
                title="Novo Documento"
                placeholder="Nome do arquivo..."
                buttonLabel="Criar"
            />
        </div>
    );
};

