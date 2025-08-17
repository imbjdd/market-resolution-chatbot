import { cn } from '@extension/ui';
import ReactMarkdown from 'react-markdown';

export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function Message({ role, content }: MessageProps) {
  return (
    <div
      className={cn(
        'flex w-full items-start gap-2 px-3 py-2',
        role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex max-w-[85%] flex-col gap-1',
          role === 'user' ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm break-words',
            role === 'user'
              ? 'bg-black text-white'
              : 'bg-black text-white dark:bg-gray-800 dark:text-gray-100'
          )}
        >
          {role === 'assistant' ? (
            <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
              {content}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}