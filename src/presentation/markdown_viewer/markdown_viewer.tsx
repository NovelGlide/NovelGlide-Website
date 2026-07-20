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
        h1: ({children}) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
        h2: ({children}) => <h2 className="text-2xl font-bold my-4">{children}</h2>,
        h3: ({children}) => <h3 className="text-xl font-bold my-4">{children}</h3>,
        h4: ({children}) => <h4 className="text-lg font-bold my-4">{children}</h4>,
        h5: ({children}) => <h5 className="text-md font-bold my-4">{children}</h5>,
        h6: ({children}) => <h6 className="text-base font-bold my-4">{children}</h6>,
        p: ({children}) => <p className="my-2 leading-7">{children}</p>,
        ul: ({children}) => <ul className="list-disc list-inside my-2">{children}</ul>,
        ol: ({children}) => <ol className="list-decimal list-inside my-2">{children}</ol>,
        li: ({children}) => <li className="my-1 ml-4">{children}</li>,
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