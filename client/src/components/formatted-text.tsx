import React from "react";

interface FormattedTextProps {
  content: string;
  className?: string;
}

export function FormattedText({ content, className = "" }: FormattedTextProps) {
  const formatLine = (line: string, lineKey: number): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let text = line;
    let partKey = 0;

    const processMatch = (
      regex: RegExp,
      createNode: (match: RegExpExecArray, key: string) => React.ReactNode
    ): boolean => {
      const match = regex.exec(text);
      if (match) {
        if (match.index > 0) {
          parts.push(text.substring(0, match.index));
        }
        parts.push(createNode(match, `${lineKey}-${partKey++}`));
        text = text.substring(match.index + match[0].length);
        return true;
      }
      return false;
    };

    while (text.length > 0) {
      let foundMatch = false;
      let bestMatch: { index: number; node: React.ReactNode; length: number } | null = null;

      const patterns = [
        {
          regex: /\[([^\]]+)\]\(([^)]+)\)/,
          create: (m: RegExpExecArray, k: string) => (
            <a key={k} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{m[1]}</a>
          ),
        },
        {
          regex: /\*\*([^*]+)\*\*/,
          create: (m: RegExpExecArray, k: string) => <strong key={k}>{m[1]}</strong>,
        },
        {
          regex: /__([^_]+)__/,
          create: (m: RegExpExecArray, k: string) => <u key={k}>{m[1]}</u>,
        },
        {
          regex: /\*([^*]+)\*/,
          create: (m: RegExpExecArray, k: string) => <em key={k}>{m[1]}</em>,
        },
        {
          regex: /(https?:\/\/[^\s\])"<]+)/,
          create: (m: RegExpExecArray, k: string) => (
            <a key={k} href={m[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{m[0]}</a>
          ),
        },
      ];

      for (const { regex, create } of patterns) {
        const match = regex.exec(text);
        if (match && (!bestMatch || match.index < bestMatch.index)) {
          bestMatch = {
            index: match.index,
            length: match[0].length,
            node: create(match, `${lineKey}-${partKey++}`),
          };
        }
      }

      if (bestMatch) {
        if (bestMatch.index > 0) {
          parts.push(text.substring(0, bestMatch.index));
        }
        parts.push(bestMatch.node);
        text = text.substring(bestMatch.index + bestMatch.length);
        foundMatch = true;
      }

      if (!foundMatch) {
        parts.push(text);
        break;
      }
    }

    return <>{parts}</>;
  };

  const lines = content.split('\n');
  
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {formatLine(line, idx)}
          {idx < lines.length - 1 && '\n'}
        </React.Fragment>
      ))}
    </div>
  );
}
