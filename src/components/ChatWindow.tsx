import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Tag, X, User } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, questionRef?: string) => void;
  onTyping: (isTyping: boolean) => void;
  yourParticipantId?: string;
  activeQuestionRef?: string | null;
  onClearQuestionRef?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  onTyping,
  yourParticipantId,
  activeQuestionRef,
  onClearQuestionRef
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, activeQuestionRef || undefined);
    setText('');
    onTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 500) {
      setText(val);
      onTyping(val.trim().length > 0);
    }
  };

  return (
    <div className="wine-card flex flex-col h-[520px] sm:h-[600px] overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-[rgba(226,185,122,0.15)] bg-[#2B0A11]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#E2B97A]" />
          <h3 className="font-serif-title text-sm sm:text-base font-bold text-[#F5E8D6]">
            Canlı Söhbət
          </h3>
        </div>
        <span className="text-[11px] text-[#CDB9A3]">
          {messages.length} mesaj
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#CDB9A3]/50 text-xs px-4">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-[#E2B97A]" />
            <p>Cavabları müzakirə etmək üçün ilk mesajı yazın.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === yourParticipantId;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Name & Time */}
                <span className="text-[10px] text-[#CDB9A3]/70 mb-1 px-1">
                  {isMe ? 'Sən' : msg.senderName} • {timeStr}
                </span>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-[#8C1D2A] to-[#4A1219] text-[#F5E8D6] rounded-tr-none border border-[rgba(226,185,122,0.25)]'
                      : 'bg-[#2B0A11] text-[#F5E8D6] rounded-tl-none border border-[rgba(226,185,122,0.15)]'
                  }`}
                >
                  {/* Linked Question Reference Tag */}
                  {msg.questionRef && (
                    <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1A0509]/60 border border-[rgba(226,185,122,0.3)] text-[10px] text-[#E2B97A] font-medium">
                      <Tag className="w-2.5 h-2.5" />
                      <span>{msg.questionRef}</span>
                    </div>
                  )}

                  <p className="break-words">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Active Question Reference Bar if set */}
      {activeQuestionRef && (
        <div className="px-4 py-1.5 bg-[#1A0509] border-t border-[rgba(226,185,122,0.15)] flex items-center justify-between text-xs text-[#E2B97A]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Tag className="w-3 h-3" />
            <span>Mövzu: <strong>{activeQuestionRef}</strong> haqqında</span>
          </span>
          <button
            onClick={onClearQuestionRef}
            className="text-[#CDB9A3] hover:text-[#F5E8D6] cursor-pointer"
            title="Teqi sil"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-[rgba(226,185,122,0.15)] bg-[#2B0A11]/60 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          placeholder="Mesajınızı yazın..."
          maxLength={500}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#1A0509] border border-[rgba(226,185,122,0.2)] text-xs sm:text-sm text-[#F5E8D6] placeholder-[#CDB9A3]/40 focus:outline-none focus:border-[#E2B97A] transition-all"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2.5 btn-gold rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Göndər"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
