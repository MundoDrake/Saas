import { useState } from 'react';
import { MoreHorizontal, X, Folder, Check, FileText, Star, Heart, Bookmark, Flag, Zap, AlertCircle, Clock, Calendar, Tag, Archive, Trash, Edit, Eye, Lock, Unlock, Send, Download, Upload, Share, Link, ExternalLink, Search, Settings, Home, User, Users, Mail, Bell, MessageSquare, Phone, MapPin, Globe, Sun, Moon, Cloud, Cpu, Database, HardDrive, Wifi, Battery, Camera, Image, Video, Music, Headphones, Mic, Volume2, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, List, Grid, Layers, Box, Circle, Square, Triangle, Hexagon, Octagon, Pentagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FrontmatterData } from '../lib/frontmatter';

// Available icons for selection
const AVAILABLE_ICONS = [
    { name: 'FileText', icon: FileText },
    { name: 'Star', icon: Star },
    { name: 'Heart', icon: Heart },
    { name: 'Bookmark', icon: Bookmark },
    { name: 'Flag', icon: Flag },
    { name: 'Zap', icon: Zap },
    { name: 'AlertCircle', icon: AlertCircle },
    { name: 'Clock', icon: Clock },
    { name: 'Calendar', icon: Calendar },
    { name: 'Tag', icon: Tag },
    { name: 'Archive', icon: Archive },
    { name: 'Trash', icon: Trash },
    { name: 'Edit', icon: Edit },
    { name: 'Eye', icon: Eye },
    { name: 'Lock', icon: Lock },
    { name: 'Unlock', icon: Unlock },
    { name: 'Send', icon: Send },
    { name: 'Download', icon: Download },
    { name: 'Upload', icon: Upload },
    { name: 'Share', icon: Share },
    { name: 'Link', icon: Link },
    { name: 'ExternalLink', icon: ExternalLink },
    { name: 'Search', icon: Search },
    { name: 'Settings', icon: Settings },
    { name: 'Home', icon: Home },
    { name: 'User', icon: User },
    { name: 'Users', icon: Users },
    { name: 'Mail', icon: Mail },
    { name: 'Bell', icon: Bell },
    { name: 'MessageSquare', icon: MessageSquare },
    { name: 'Phone', icon: Phone },
    { name: 'MapPin', icon: MapPin },
    { name: 'Globe', icon: Globe },
    { name: 'Sun', icon: Sun },
    { name: 'Moon', icon: Moon },
    { name: 'Cloud', icon: Cloud },
    { name: 'Cpu', icon: Cpu },
    { name: 'Database', icon: Database },
    { name: 'HardDrive', icon: HardDrive },
    { name: 'Wifi', icon: Wifi },
    { name: 'Battery', icon: Battery },
    { name: 'Camera', icon: Camera },
    { name: 'Image', icon: Image },
    { name: 'Video', icon: Video },
    { name: 'Music', icon: Music },
    { name: 'Headphones', icon: Headphones },
    { name: 'Mic', icon: Mic },
    { name: 'Volume2', icon: Volume2 },
    { name: 'Play', icon: Play },
    { name: 'Pause', icon: Pause },
    { name: 'Circle', icon: Circle },
    { name: 'Square', icon: Square },
    { name: 'Triangle', icon: Triangle },
    { name: 'Hexagon', icon: Hexagon },
];

const STATUS_OPTIONS = ['backlog', 'active', 'in-progress', 'review', 'done', 'archived'];

interface TopBarProps {
    title: string;
    path: string;
    attributes?: FrontmatterData;
    onAttributesChange?: (attrs: FrontmatterData) => void;
    onRename?: (newPath: string) => void;
}

export const TopBar = ({ title, path, attributes, onAttributesChange, onRename }: TopBarProps) => {
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(attributes?.title || title);
    const [editStatus, setEditStatus] = useState(attributes?.status || 'backlog');
    const [editIcon, setEditIcon] = useState(attributes?.icon || 'FileText');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);

    // Simple breadcrumb visual
    const pathParts = path.split(/[\\/]/).filter(Boolean).slice(-2);

    // Get current filename without extension
    const currentFileName = path.split(/[\\/]/).pop()?.replace(/\.md$/, '') || '';

    const handleSave = async () => {
        // Check if filename needs to change
        const needsRename = editTitle !== currentFileName;

        if (needsRename) {
            setIsRenaming(true);
            const newFileName = `${editTitle}.md`;
            const newPath = await window.api.renameItem(path, newFileName);
            setIsRenaming(false);

            if (newPath && onRename) {
                // When renaming, we navigate away, so skip onAttributesChange
                // to avoid saving to old path
                onRename(newPath);
                setIsInfoOpen(false);
                return; // Exit early, don't trigger save to old path
            }
        }

        // Only update attributes (triggers save) if we're NOT renaming
        if (onAttributesChange) {
            onAttributesChange({
                ...attributes,
                title: editTitle,
                status: editStatus,
                icon: editIcon,
            });
        }
        setIsInfoOpen(false);
    };

    const SelectedIcon = AVAILABLE_ICONS.find(i => i.name === editIcon)?.icon || FileText;

    return (
        <>
            <header className="h-20 px-8 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0 z-20">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1">
                        <Folder size={12} />
                        <span className="uppercase tracking-wider">{pathParts[0] || 'ROOT'}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        {title}
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-[10px] text-green-600 font-bold uppercase tracking-wide">
                            Auto-save
                        </span>
                    </h1>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={() => {
                            setEditTitle(attributes?.title || title);
                            setEditStatus(attributes?.status || 'backlog');
                            setEditIcon(attributes?.icon || 'FileText');
                            setIsInfoOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all"
                        title="Informações do arquivo"
                    >
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </header>

            {/* File Info Modal */}
            <AnimatePresence>
                {isInfoOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center"
                        onClick={() => setIsInfoOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-900">Editar Arquivo</h2>
                                <button
                                    onClick={() => setIsInfoOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
                                {/* Icon Selector */}
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 block">Ícone</label>
                                    <button
                                        onClick={() => setShowIconPicker(!showIconPicker)}
                                        className="flex items-center gap-3 w-full p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <SelectedIcon size={20} className="text-indigo-600" />
                                        </div>
                                        <span className="text-sm text-gray-700">{editIcon}</span>
                                    </button>

                                    {showIconPicker && (
                                        <div className="mt-2 p-3 border border-gray-200 rounded-lg bg-gray-50 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                                            {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                                                <button
                                                    key={name}
                                                    onClick={() => {
                                                        setEditIcon(name);
                                                        setShowIconPicker(false);
                                                    }}
                                                    className={`p-2 rounded-lg hover:bg-white transition-colors ${editIcon === name ? 'bg-indigo-100 ring-2 ring-indigo-500' : ''}`}
                                                    title={name}
                                                >
                                                    <Icon size={18} className={editIcon === name ? 'text-indigo-600' : 'text-gray-600'} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 block">Nome</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Nome do arquivo"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 block">Status</label>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Path (Read-only) */}
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 block">Caminho</label>
                                    <p className="text-xs text-gray-600 font-mono break-all bg-gray-50 p-2 rounded border border-gray-100">{path}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
                                <button
                                    onClick={() => setIsInfoOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    <Check size={16} />
                                    Salvar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
