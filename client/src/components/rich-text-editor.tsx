import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Write something...",
  minHeight = "80px"
}: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline cursor-pointer',
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none`,
        style: `min-height: ${minHeight}; padding: 8px 12px;`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const handleLinkClick = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    if (previousUrl) {
      setLinkUrl(previousUrl);
    } else {
      setLinkUrl("");
    }
    setShowLinkDialog(true);
  };

  const handleLinkSubmit = () => {
    if (!editor) return;
    
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkDialog(false);
    setLinkUrl("");
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkDialog(false);
    setLinkUrl("");
  };

  if (!editor) {
    return null;
  }

  const isLinkActive = editor.isActive('link');

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 p-1 border-b bg-slate-50 pl-[4px] pr-[4px] pt-[0px] pb-[0px]">
        <Button
          type="button"
          variant={editor.isActive('bold') ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-7 w-7 p-0"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-7 w-7 p-0"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-7 w-7 p-0"
          title="Underline"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <Button
          type="button"
          variant={isLinkActive ? "secondary" : "ghost"}
          size="sm"
          onClick={handleLinkClick}
          className="h-7 w-7 p-0"
          title={isLinkActive ? "Edit Link" : "Add Link"}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="relative">
        <EditorContent editor={editor} />
        {editor.isEmpty && (
          <div 
            className="absolute top-2 left-3 text-slate-400 pointer-events-none text-sm"
          >
            {placeholder}
          </div>
        )}
      </div>
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isLinkActive ? "Edit Link" : "Add Link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {isLinkActive && (
              <Button type="button" variant="outline" onClick={handleRemoveLink}>
                Remove Link
              </Button>
            )}
            <Button type="button" onClick={handleLinkSubmit}>
              {isLinkActive ? "Update" : "Add Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
