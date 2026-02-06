import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, Link } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}

export function FormattingToolbar({ textareaRef, value, onChange }: FormattingToolbarProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newValue = 
      value.substring(0, start) + 
      before + selectedText + after + 
      value.substring(end);
    
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleBold = () => wrapSelection("**", "**");
  const handleItalic = () => wrapSelection("*", "*");
  const handleUnderline = () => wrapSelection("__", "__");

  const handleLinkClick = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      setLinkText(selectedText);
    }
    setLinkUrl("");
    setShowLinkDialog(true);
  };

  const handleInsertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const linkMarkdown = linkText 
      ? `[${linkText}](${linkUrl})`
      : `[${linkUrl}](${linkUrl})`;
    
    const newValue = 
      value.substring(0, start) + 
      linkMarkdown + 
      value.substring(end);
    
    onChange(newValue);
    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  return (
    <>
      <div className="flex items-center gap-1 mb-2 p-1 bg-slate-50 rounded border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          title="Bold"
          className="h-8 w-8 p-0"
          data-testid="format-bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          title="Italic"
          className="h-8 w-8 p-0"
          data-testid="format-italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUnderline}
          title="Underline"
          className="h-8 w-8 p-0"
          data-testid="format-underline"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLinkClick}
          title="Insert Link"
          className="h-8 w-8 p-0"
          data-testid="format-link"
        >
          <Link className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-text">Link Text (optional)</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Display text"
                data-testid="link-text-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                data-testid="link-url-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertLink} disabled={!linkUrl.trim()} data-testid="insert-link-btn">
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
