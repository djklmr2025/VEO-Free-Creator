
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { SendIcon } from './Icons';

const FastChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
        { id: 'initial', role: 'model', text: 'Hello! I am a fast, free assistant powered by Puter.js and Gemini. How can I help you today?' }
    ]);
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

    try {
        if (!window.puter?.ai?.chat) {
            throw new Error("Puter.js is not available. Please check your internet connection and refresh the page.");
        }
        
        const stream = await window.puter.ai.chat(input, {
            model: 'google/gemini-2.5-flash-lite',
            stream: true,
        });
        
        for await (const part of stream) {
            const chunkText = part.text;
            if (chunkText) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === modelMessageId ? { ...msg, text: msg.text + chunkText } : msg
                    )
                );
            }
        }
    } catch (error) {
        console.error("Puter chat error:", error);
        setMessages(prev => 
            prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, text: 'Sorry, I encountered an error.'} : msg
            )
        );
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <h2 className="text-3xl font-bold mb-1 text-white">Fast Chat</h2>
      <p className="text-gray-400 mb-6">Experience low-latency responses powered by Puter.js and Gemini.</p>
      
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-4 space-y-4 bg-gray-900/50 p-4 rounded-t-lg">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2 rounded-2xl ${message.role === 'user' ? 'bg-gemini-blue text-white' : 'bg-gray-700 text-gray-200'}`}>
              <p className="whitespace-pre-wrap">{message.text || '...'}</p>
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSend} className="mt-auto p-4 bg-gray-800 rounded-b-lg border-t border-gray-700">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-l-lg focus:ring-2 focus:ring-gemini-blue focus:outline-none transition disabled:bg-gray-600"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-gemini-blue text-white rounded-r-lg hover:bg-gemini-blue/90 disabled:bg-gray-500 transition-colors"
          >
            <SendIcon className="h-6 w-6" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default FastChat;