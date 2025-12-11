import { Editor } from '@tiptap/react';
import {
    ArrowLeft,
    Bold,
    Italic,
    Underline as UnderlineIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface EditorToolbarProps {
    editor: Editor | null;
    onBack?: () => void;
}

const ToolbarButton = ({
    onClick,
    active,
    children,
    className,
    title
}: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    className?: string;
    title?: string;
}) => (
    <button
        onClick={onClick}
        title={title}
        className={cn(
            "p-2 rounded transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center min-w-[32px] min-h-[32px]",
            active && "bg-gray-200 text-gray-900",
            className
        )}
    >
        {children}
    </button>
);

const HeadingButton = ({
    level,
    active,
    onClick
}: {
    level: 1 | 2 | 3;
    active: boolean;
    onClick: () => void
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                active
                    ? "bg-black text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 bg-transparent"
            )}
        >
            H{level}
        </button>
    );
};

export const EditorToolbar = ({ editor, onBack }: EditorToolbarProps) => {
    if (!editor) return null;

    return (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 shadow-sm select-none">
            {/* Group 0: Navigation */}
            {onBack && (
                <>
                    <div className="flex items-center">
                        <ToolbarButton onClick={onBack} title="Back">
                            <ArrowLeft size={18} />
                        </ToolbarButton>
                    </div>
                    <div className="h-6 w-[1px] bg-gray-200" />
                </>
            )}

            {/* Group 1: Character Style (B, I, U) */}
            <div className="flex items-center gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon size={18} />
                </ToolbarButton>
            </div>

            <div className="h-6 w-[1px] bg-gray-200" />

            {/* Group 2: Headings (H1, H2, H3) */}
            <div className="flex items-center gap-1">
                <HeadingButton
                    level={1}
                    active={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                />
                <HeadingButton
                    level={2}
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                />
                <HeadingButton
                    level={3}
                    active={editor.isActive('heading', { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                />
            </div>

            <div className="h-6 w-[1px] bg-gray-200" />

            {/* Group 3: Alignment */}
            <div className="flex items-center gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight size={18} />
                </ToolbarButton>
            </div>

            <div className="h-6 w-[1px] bg-gray-200" />

            {/* Group 4: Lists */}
            <div className="flex items-center gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered size={18} />
                </ToolbarButton>
            </div>
        </div>
    );
};
