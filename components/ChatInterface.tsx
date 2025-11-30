import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-xl overflow-hidden border border-stone-200">
      <div className="bg-white border-b border-stone-100 p-4 shadow-sm">
        <h3 className="font-semibold text-stone-700 flex items-center gap-2">
          <span className="text-xl">✦</span> Journal Assistant
        </h3>
        <p className="text-xs text-stone-400 mt-1">
          Tell me about your day, or ask me to find past memories.
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
            <div className="text-center text-stone-400 mt-10">
                <p>No messages yet.</p>
                <p className="text-sm">Try saying "Write a diary entry about my trip to the park."</p>
            </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-stone-700 border border-stone-100 rounded-bl-none'}
              `}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-stone-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your thoughts..."
            className="flex-1 bg-stone-100 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-full px-4 py-2 text-sm outline-none transition-all"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className="bg-indigo-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
