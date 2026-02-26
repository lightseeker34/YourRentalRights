import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip } from "lucide-react";
import type { ReactNode } from "react";

type ImagePreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewType: "image" | "document";
  previewUrl: string | null;
  previewName: string;
  renderImage: () => ReactNode;
};

export function ImagePreviewModal({
  open,
  onOpenChange,
  previewType,
  previewUrl,
  previewName,
  renderImage,
}: ImagePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={previewType === 'image' ? "w-[98vw] max-w-none h-[96dvh] max-h-[96dvh] rounded-xl mx-auto p-1 pb-[env(safe-area-inset-bottom)] [&>button]:top-8 [&>button]:right-4" : "w-[90vw] max-w-3xl max-h-[90vh] rounded-xl mx-auto [&>button]:top-8 [&>button]:right-4"}
      >
        {previewType !== 'image' && (
          <DialogHeader>
            <DialogTitle className="pt-[10px] pb-[10px]">{previewName}</DialogTitle>
            <DialogDescription className="sr-only">Preview uploaded evidence file.</DialogDescription>
          </DialogHeader>
        )}

        <div className={previewType === 'image' ? "flex items-center justify-center pt-16 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] w-full h-full overflow-auto" : "flex items-center justify-center p-4 w-full max-h-[75vh] overflow-auto"}>
          {previewType === 'image' ? (
            <div className="flex items-center justify-center w-full h-full">
              {renderImage()}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Paperclip className="w-16 h-16 text-slate-400" />
              <a
                href={previewUrl || ''}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Open Document
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
