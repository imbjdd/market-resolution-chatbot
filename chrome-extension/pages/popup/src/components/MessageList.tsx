import { useEffect, useRef } from 'react';
import { Message, MessageProps } from './Message';

export interface MessageListProps {
  messages: MessageProps[];
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-black">
        <div className="text-center">
          <p className="text-lg font-medium">Welcome to Market Resolution Bot</p>
          <p className="text-sm">Start a conversation to get market insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message, index) => (
        <Message key={index} {...message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}