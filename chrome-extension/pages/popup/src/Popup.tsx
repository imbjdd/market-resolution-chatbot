import '@src/Popup.css';
import { useState } from 'react';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { MessageProps } from './components/Message';

const Popup = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const userMessage: MessageProps = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8787/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: MessageProps = {
        role: 'assistant',
        content: data.response,
        quickActions: data.quickActions
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: MessageProps = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex w-full flex-col ${isLight ? 'bg-amber-400' : 'bg-gray-900 text-white'}`} style={{margin: 0, padding: 0, minHeight: '500px', maxHeight: '600px', height: '500px'}}>
      {/* Header */}
      <div className={`flex items-center justify-center bg-white border-b-2 p-3 ${isLight ? 'border-black bg-amber-400' : 'border-gray-700 bg-gray-800'}`}>
        <div className="flex items-center gap-2">
          <h1 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Market Resolution Bot
          </h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{maxHeight: '400px'}}>
        <MessageList messages={messages} />
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className={`flex items-center justify-center p-3 border-t-2 ${isLight ? 'border-black' : 'border-gray-700'}`}>
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
