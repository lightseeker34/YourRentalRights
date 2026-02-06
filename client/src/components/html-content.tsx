import DOMPurify from 'dompurify';

interface HtmlContentProps {
  content: string;
  className?: string;
}

export function HtmlContent({ content, className = "" }: HtmlContentProps) {
  const sanitizedHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });

  return (
    <div 
      className="prose prose-sm max-w-none prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 text-slate-700 ml-[10px] mr-[10px] pt-[10px] pb-[10px]"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, '').trim();
}
