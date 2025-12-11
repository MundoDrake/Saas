import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Loader2 } from 'lucide-react';
import { FileMetadata } from '../../../shared/types';
import { parseFrontmatter, stringifyFrontmatter, FrontmatterData } from '../lib/frontmatter';
import { TopBar } from './TopBar';
import { EditorToolbar } from './EditorToolbar';

interface EditorInstanceProps {
    file: FileMetadata;
    initialContent: string;
    initialAttributes: FrontmatterData;
    onBack?: () => void;
}



const EditorInstance = ({ file, initialContent, initialAttributes, onBack }: EditorInstanceProps) => {
    const [attributes, setAttributes] = useState<FrontmatterData>(initialAttributes);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedBody, setLastSavedBody] = useState(initialContent);

    const editor = useEditor({
        content: initialContent,
        extensions: [
            StarterKit,
            Markdown,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px]',
            },
        },
    });

    const [lastSavedAttrs, setLastSavedAttrs] = useState(JSON.stringify(initialAttributes));

    // Auto-save effect with debounce
    useEffect(() => {
        if (!editor) return;

        const handleAutoSave = async () => {
            const currentBody = (editor.storage as any).markdown.getMarkdown();
            const currentAttrsStr = JSON.stringify(attributes);

            // Check if body OR attributes changed
            if (currentBody === lastSavedBody && currentAttrsStr === lastSavedAttrs) return;

            setIsSaving(true);
            const fullContent = stringifyFrontmatter(attributes, currentBody);
            await window.api.saveFile(file.path, fullContent);
            setLastSavedBody(currentBody);
            setLastSavedAttrs(currentAttrsStr);
            setIsSaving(false);
        };

        // Debounce: save after 1 second of no typing
        const timer = setTimeout(handleAutoSave, 1000);

        const unsubscribe = editor.on('update', () => {
            clearTimeout(timer);
        });

        return () => {
            clearTimeout(timer);
            // Also save on unmount if there are unsaved changes
            const currentBody = (editor.storage as any).markdown.getMarkdown();
            const currentAttrsStr = JSON.stringify(attributes);
            if (currentBody !== lastSavedBody || currentAttrsStr !== lastSavedAttrs) {
                const fullContent = stringifyFrontmatter(attributes, currentBody);
                window.api.saveFile(file.path, fullContent);
            }
        };
    }, [editor, attributes, file.path, lastSavedBody, lastSavedAttrs]);

    if (!editor) {
        return null;
    }

    return (
        <div className="flex-1 h-screen flex flex-col bg-white overflow-hidden relative">
            {/* Integrated TopBar */}
            <TopBar
                title={attributes.title || file.name}
                path={file.path}
                attributes={attributes}
                onAttributesChange={setAttributes}
                onRename={(newPath) => {
                    // After rename, navigate back to refresh the view
                    if (onBack) {
                        onBack();
                    }
                }}
            />

            {/* Custom Toolbar */}
            <EditorToolbar editor={editor} onBack={onBack} />

            {/* Document Surface */}
            <div className="flex-1 overflow-y-auto bg-gray-50/30 flex justify-center items-start p-8 scrollbar-hide">
                <div
                    className="w-full max-w-none bg-white min-h-[900px] shadow-sm border border-gray-100 rounded-sm p-16 cursor-text transition-all"
                    onClick={() => editor.chain().focus().run()}
                >
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Saving Indicator */}
            {isSaving && (
                <div className="absolute bottom-4 right-8 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Salvando...
                </div>
            )}
        </div>
    );
};

export const MarkdownEditor = ({ file, onBack }: { file: FileMetadata; onBack?: () => void }) => {
    const [data, setData] = useState<{ content: string; attributes: FrontmatterData } | null>(null);

    useEffect(() => {
        setData(null);
        const load = async () => {
            const text = await window.api.readFile(file.path);
            const { attributes: attrs, body } = parseFrontmatter(text);
            setData({ content: body, attributes: attrs });
        };
        load();
    }, [file.path]);

    if (!data) {
        return (
            <div className="flex-1 h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <EditorInstance
            key={file.path}
            file={file}
            initialContent={data.content}
            initialAttributes={data.attributes}
            onBack={onBack}
        />
    );
};
