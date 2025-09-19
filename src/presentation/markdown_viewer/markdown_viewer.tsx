import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownViewer({
  content,
}: Readonly<{
  content: string,
}>) {
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({node, ...props}) => <h1 className="text-4xl font-bold my-4" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-3xl font-bold my-4" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-2xl font-bold my-4" {...props} />,
        h4: ({node, ...props}) => <h4 className="text-xl font-bold my-4" {...props} />,
        h5: ({node, ...props}) => <h5 className="text-lg font-bold my-4" {...props} />,
        h6: ({node, ...props}) => <h6 className="text-base font-bold my-4" {...props} />,
        p: ({node, ...props}) => <p className="my-2 leading-7" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc list-inside my-2" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
        li: ({node, ...props}) => <li className="my-1" {...props} />,
        a: ({href, children}) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}