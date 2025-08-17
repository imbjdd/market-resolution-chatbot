import { useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@extension/ui';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, isLoading = false, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t-2 border-black bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="flex items-center justify-center gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about market predictions..."
          className={cn(
            'flex-1 resize-none rounded-md flex items-center border-2 border-black bg-amber-400 placeholder-black px-3 h-10 text-sm',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
          )}
          rows={1}
          disabled={disabled}
          style={{
            minHeight: '32px',
            maxHeight: '80px',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          className={cn(
            'flex h-10 w-10  rounded-md bg-amber-100 border-2 border-black items-center justify-center rounded-lg text-white shrink-0',
            'hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:hover:bg-blue-500',
            'dark:focus:ring-offset-gray-900'
          )}
        >
          <Send className="h-6 w-6 text-black fill-amber-400 " />
        </button>
      </form>
    </div>
  );
}