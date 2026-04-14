"use client";

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Placeholder } from '@tiptap/extension-placeholder';
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import { Node, mergeAttributes, InputRule } from '@tiptap/core';
import { 
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
    Table as TableIcon, Undo, Redo, Code, Eye,
    Trash, PlusSquare, Columns, Rows, Plus
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from './dropdown-menu';

// --- Custom Variable Extension ---
const Variable = Node.create({
    name: 'variable',
    group: 'inline',
    inline: true,
    selectable: true,
    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => ({
                    'data-id': attributes.id,
                }),
            },
        };
    },

    parseHTML() {
        return [
            { tag: 'span[data-type="variable"]' },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'variable',
                class: 'inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-mono text-[10px] mx-0.5 cursor-default select-none transition-all hover:bg-indigo-500/30',
            }),
            `{{${node.attrs.id}}}`,
        ];
    },
});

// Convert {{var}} text to variable span nodes for the editor
function preprocessHtml(html: string): string {
    return (html || "").replace(/\{\{([^} ]+)\}\}/g, '<span data-type="variable" data-id="$1"></span>');
}

// Convert variable span nodes back to {{var}} text for the database
function postprocessHtml(html: string): string {
    return html.replace(/<span[^>]*data-type="variable"[^>]*data-id="([^"]+)"[^>]*>.*?<\/span>/g, '{{$1}}');
}

interface HTMLEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function HTMLEditor({ value, onChange, placeholder, className }: HTMLEditorProps) {
    const [mode, setMode] = useState<'visual' | 'code' | 'preview'>('visual');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const isInternalUpdate = useRef(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full border border-white/10 my-4',
                },
            }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder: placeholder || 'Start typing...',
            }),
            BubbleMenuExtension,
            Variable,
        ],
        content: preprocessHtml(value),
        onUpdate: ({ editor }) => {
            isInternalUpdate.current = true;
            const cleanHtml = postprocessHtml(editor.getHTML());
            onChange(cleanHtml);
        },
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-invert max-w-none focus:outline-none min-h-[400px] p-6 text-sm",
                    "[&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-white/10 [&_td]:p-2 [&_th]:border [&_th]:border-white/10 [&_th]:p-2 [&_th]:bg-white/5",
                    className
                ),
            },
        },
    });

    // Sync external value changes (template switching) into the editor
    useEffect(() => {
        if (!editor) return;

        // Skip if the change came from the editor itself
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        const currentContent = postprocessHtml(editor.getHTML());
        if (currentContent !== value) {
            editor.commands.setContent(preprocessHtml(value), { emitUpdate: false });
        }
    }, [value, editor]);

    // Update the preview iframe when value changes
    useEffect(() => {
        if (mode === 'preview' && iframeRef.current) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(value || '');
                doc.close();
            }
        }
    }, [value, mode]);

    if (!editor) return null;

    const addVariable = (id: string) => {
        editor.chain().focus().insertContent({
            type: 'variable',
            attrs: { id },
        }).run();
    };

    return (
        <div className="flex flex-col w-full border border-white/10 rounded-xl overflow-hidden glass">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-white/5 border-b border-white/5">
                {/* Mode Switcher */}
                <div className="flex items-center gap-0.5 mr-2 px-1 border-r border-white/10">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 px-2 text-[11px]", mode === 'visual' && "bg-white/10 text-primary")}
                        onClick={() => setMode('visual')}
                        title="Visual Editor"
                    >
                        <Bold className="h-3.5 w-3.5 mr-1" /> Visual
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 px-2 text-[11px]", mode === 'code' && "bg-white/10 text-primary")}
                        onClick={() => setMode('code')}
                        title="HTML Source"
                    >
                        <Code className="h-3.5 w-3.5 mr-1" /> Code
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 px-2 text-[11px]", mode === 'preview' && "bg-white/10 text-primary")}
                        onClick={() => setMode('preview')}
                        title="Letter Preview"
                    >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                </div>

                {/* Visual mode toolbar buttons */}
                {mode === 'visual' && (
                    <>
                        <div className="flex items-center gap-1 mr-2 px-1 border-r border-white/10">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", editor.isActive('bold') && "bg-white/10 text-primary")}
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                title="Bold"
                            >
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", editor.isActive('italic') && "bg-white/10 text-primary")}
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                title="Italic"
                            >
                                <Italic className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", editor.isActive('underline') && "bg-white/10 text-primary")}
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                title="Underline"
                            >
                                <UnderlineIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-1 mr-2 px-1 border-r border-white/10">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", editor.isActive('bulletList') && "bg-white/10 text-primary")}
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                title="Bullet List"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", editor.isActive('orderedList') && "bg-white/10 text-primary")}
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                title="Ordered List"
                            >
                                <ListOrdered className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-1 mr-2 px-1 border-r border-white/10">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Table Layout">
                                        <TableIcon className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48">
                                    <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                                        <PlusSquare className="h-4 w-4 mr-2" /> Insert Table
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                                        <Columns className="h-4 w-4 mr-2" /> Add Column
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                                        <Rows className="h-4 w-4 mr-2" /> Add Row
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-400" onClick={() => editor.chain().focus().deleteTable().run()}>
                                        <Trash className="h-4 w-4 mr-2" /> Delete Table
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-1 mr-2 px-1 border-r border-white/10">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="sm" className="h-8 text-[11px] gap-1 px-2">
                                        <Plus className="h-3 w-3" /> Variable
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                                    {[
                                        'employee_name', 'employee_number', 'position', 
                                        'department', 'surat_number', 'reason', 
                                        'hire_date', 'issued_date', 'hr_name', 'hr_position',
                                        'company_name', 'company_address', 'company_email', 
                                        'company_phone', 'company_tax_id'
                                    ].map(v => (
                                        <DropdownMenuItem 
                                            key={v} 
                                            className="justify-start font-mono text-[10px]" 
                                            onClick={() => addVariable(v)}
                                        >
                                            {`{{${v}}}`}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-1 ml-auto">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => editor.chain().focus().undo().run()}
                                disabled={!editor.can().undo()}
                            >
                                <Undo className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => editor.chain().focus().redo().run()}
                                disabled={!editor.can().redo()}
                            >
                                <Redo className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Editor Area */}
            <div className="bg-black/20 overflow-y-auto max-h-[600px]">
                {mode === 'visual' && (
                    <EditorContent editor={editor} />
                )}

                {mode === 'code' && (
                    <textarea
                        className="w-full min-h-[500px] bg-transparent text-sm font-mono p-6 text-foreground focus:outline-none resize-y leading-relaxed"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        spellCheck={false}
                    />
                )}

                {mode === 'preview' && (
                    <iframe
                        ref={iframeRef}
                        className="w-full min-h-[600px] bg-white rounded-b-lg"
                        sandbox="allow-same-origin"
                        title="Letter Preview"
                    />
                )}
            </div>

            {/* Bubble Menu for quick actions (visual mode only) */}
            {mode === 'visual' && editor && (
                <BubbleMenu editor={editor} className="flex bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("rounded-none h-8 px-2", editor.isActive('bold') && "bg-white/10 text-primary")}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("rounded-none h-8 px-2", editor.isActive('italic') && "bg-white/10 text-primary")}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("rounded-none h-8 px-2", editor.isActive('underline') && "bg-white/10 text-primary")}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    >
                        <UnderlineIcon className="h-3 w-3" />
                    </Button>
                </BubbleMenu>
            )}
        </div>
    );
}
