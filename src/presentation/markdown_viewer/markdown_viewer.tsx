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
        h1: ({...props}) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
        h2: ({...props}) => <h2 className="text-2xl font-bold my-4" {...props} />,
        h3: ({...props}) => <h3 className="text-xl font-bold my-4" {...props} />,
        h4: ({...props}) => <h4 className="text-lg font-bold my-4" {...props} />,
        h5: ({...props}) => <h5 className="text-md font-bold my-4" {...props} />,
        h6: ({...props}) => <h6 className="text-base font-bold my-4" {...props} />,
        p: ({...props}) => <p className="my-2 leading-7" {...props} />,
        ul: ({...props}) => <ul className="list-disc list-inside my-2" {...props} />,
        ol: ({...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
        li: ({...props}) => <li className="my-1 ml-4" {...props} />,
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