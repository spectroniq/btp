import ReactMarkdown from 'react-markdown';

interface Props {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = '' }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white/90">{children}</strong>,
          em: ({ children }) => <em className="italic text-white/70">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          code: ({ children }) => (
            <code className="bg-white/10 text-white/80 rounded px-1 py-0.5 text-xs font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-white/5 rounded-lg p-3 mb-2 overflow-x-auto text-xs font-mono text-white/70">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
