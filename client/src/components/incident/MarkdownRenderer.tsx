import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarkdownRendererProps {
  content: string;
  isAi?: boolean;
}

export const MarkdownRenderer = memo(({ content, isAi = false }: MarkdownRendererProps) => {
  const { toast } = useToast();

  if (!isAi) {
    // User message - simplified rendering
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  return (
    <div className="markdown-content w-full max-w-full min-w-0 break-words [overflow-wrap:anywhere] px-0" style={{ fontFamily: 'var(--font-chat)' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({children}) => <p className="mb-2 last:mb-0 break-words [overflow-wrap:anywhere]">{children}</p>,
          ul: ({children}) => <ul className="list-disc pl-4 mb-2 break-words [overflow-wrap:anywhere]">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-4 mb-2 break-words [overflow-wrap:anywhere]">{children}</ol>,
          li: ({children}) => <li className="mb-1 break-words [overflow-wrap:anywhere]">{children}</li>,
          h1: ({children}) => <h1 className="text-lg font-bold mb-2 break-words [overflow-wrap:anywhere]">{children}</h1>,
          h2: ({children}) => <h2 className="text-base font-bold mb-2 break-words [overflow-wrap:anywhere]">{children}</h2>,
          h3: ({children}) => <h3 className="text-sm font-semibold mb-1 break-words [overflow-wrap:anywhere]">{children}</h3>,
          code: ({children, className}) => {
            const isInline = !className;
            return isInline 
              ? <code className="bg-slate-100 px-1 py-0.5 rounded text-xs break-all">{children}</code>
              : <code className="block bg-slate-100 p-2 rounded text-xs overflow-x-auto my-2">{children}</code>;
          },
          pre: ({children, ...props}) => {
            const textContent = String((props as any).node?.children?.[0]?.children?.[0]?.value || children);
            return (
              <div className="relative group/code my-2">
                <pre className="bg-slate-100 p-3 pr-12 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words">{children}</pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(textContent);
                    toast({ title: "Copied!", description: "Template copied to clipboard" });
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-600 hover:text-slate-800 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            );
          },
          blockquote: ({children}) => <blockquote className="border-l-2 border-slate-300 pl-3 italic my-2 break-words [overflow-wrap:anywhere]">{children}</blockquote>,
          strong: ({children}) => <strong className="font-bold">{children}</strong>,
          a: ({children, href}) => <a href={href} className="text-blue-700 underline break-all" target="_blank" rel="noreferrer">{children}</a>,
          // Fixed table rendering:
          // 1. Wrapper div has `w-full overflow-x-auto` to allow scrolling
          // 2. Table has `min-w-full` to ensure it fills the wrapper but can grow
          // 3. Cells have `min-w-[100px]` to force horizontal scroll on small screens instead of squishing
          table: ({children}) => (
            <div className="w-[calc(100vw-40px)] md:w-full overflow-x-auto my-1 md:my-4 border rounded-lg shadow-sm bg-white block">
              <table className="min-w-full border-collapse text-sm text-left table-auto w-full">{children}</table>
            </div>
          ),
          thead: ({children}) => <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>,
          tbody: ({children}) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
          tr: ({children}) => <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-200 last:border-0">{children}</tr>,
          th: ({children}) => <th className="px-1 py-3 font-semibold text-slate-700 whitespace-nowrap min-w-[100px] border-r border-slate-200 last:border-r-0 text-center">{children}</th>,
          td: ({children}) => <td className="px-1 py-3 text-slate-600 whitespace-normal min-w-[140px] max-w-[400px] border-r border-slate-200 last:border-r-0">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
