import { cn } from '@extension/ui';
import ReactMarkdown from 'react-markdown';

export interface QuickAction {
  type: 'show_market';
  label: string;
  marketId: string;
  marketUrl?: string;
}

export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  quickActions?: QuickAction[];
}

const handleQuickAction = (action: QuickAction) => {
  if (action.type === 'show_market' && action.marketUrl) {
    // Ouvrir le lien dans un nouvel onglet
    chrome.tabs.create({ url: action.marketUrl });
  }
};

export function Message({ role, content, quickActions }: MessageProps) {
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
        
        {/* Quick Actions */}
        {role === 'assistant' && quickActions && quickActions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors duration-200"
              >
                🔗 {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}