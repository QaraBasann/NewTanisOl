import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  MessageSquare, 
  RotateCcw, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Flame
} from 'lucide-react';
import { RevealAnswerCard, ChatMessage } from '../types';
import { ChatWindow } from './ChatWindow';

interface RevealPhaseProps {
  cards: RevealAnswerCard[];
  messages: ChatMessage[];
  onSendMessage: (text: string, questionRef?: string) => void;
  onTyping: (isTyping: boolean) => void;
  onRequestReplay: () => void;
  yourParticipantId?: string;
  isReplayPending?: boolean;
}

export const RevealPhase: React.FC<RevealPhaseProps> = ({
  cards,
  messages,
  onSendMessage,
  onTyping,
  onRequestReplay,
  yourParticipantId,
  isReplayPending
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'chat'>('cards');
  const [activeQuestionRef, setActiveQuestionRef] = useState<string | null>(null);

  const handleDiscussInChat = (questionOrder: number) => {
    setActiveQuestionRef(`Sual ${questionOrder + 1}`);
    setActiveTab('chat');
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Reveal Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E2B97A]/15 border border-[#E2B97A]/40 text-xs text-[#E2B97A] font-semibold mb-3 shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-[#E2B97A]" />
          <span>Bütün Cavablar Açıldı</span>
        </motion.div>
        <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#F5E8D6] mb-2">
          Görüşləriniz və Düşüncələriniz
        </h2>
        <p className="text-xs sm:text-sm text-[#CDB9A3] max-w-lg mx-auto">
          Hər iki tərəfin cavablarını müqayisə edin və söhbəti çatda davam etdirin.
        </p>
      </div>

      {/* Mobile Tab Switcher (Desktop shows both side-by-side) */}
      <div className="lg:hidden grid grid-cols-2 p-1 bg-[#2B0A11] rounded-full border border-[rgba(226,185,122,0.2)] mb-6 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('cards')}
          className={`py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            activeTab === 'cards'
              ? 'bg-[#8C1D2A] text-[#F5E8D6] shadow-md'
              : 'text-[#CDB9A3]'
          }`}
        >
          Cavablar ({cards.length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`py-2 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? 'bg-[#8C1D2A] text-[#F5E8D6] shadow-md'
              : 'text-[#CDB9A3]'
          }`}
        >
          <span>Canlı Çat</span>
          <span className="w-2 h-2 rounded-full bg-[#E2B97A]" />
        </button>
      </div>

      {/* Main Grid: Left = Cards, Right = Chat (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Answer Cards */}
        <div className={`lg:col-span-7 space-y-5 ${activeTab === 'chat' ? 'hidden lg:block' : 'block'}`}>
          {cards.map((card, idx) => (
            <motion.div
              key={card.questionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="wine-card p-6 relative overflow-hidden"
            >
              {/* Card Question Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#E2B97A] font-bold block mb-1">
                    Sual {card.order + 1}
                  </span>
                  <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#F5E8D6] leading-snug">
                    {card.questionText}
                  </h3>
                </div>

                <button
                  onClick={() => handleDiscussInChat(card.order)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A0509]/80 border border-[rgba(226,185,122,0.3)] text-xs text-[#E2B97A] hover:bg-[#E2B97A]/20 transition-all cursor-pointer"
                  title="Bu sualı çatda müzakirə et"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Müzakirə et</span>
                </button>
              </div>

              {/* Two Answers Side-by-Side (Stacked on Mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Participant 1 Answer */}
                <div className="p-4 rounded-xl bg-[#2B0A11]/80 border border-[rgba(226,185,122,0.3)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#E2B97A] truncate">
                      {card.participant1.nickname}
                    </span>
                    {card.participant1.status === 'no_answer' && (
                      <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full">
                        Cavab verilməyib
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#F5E8D6] leading-relaxed break-words whitespace-pre-wrap">
                    {card.participant1.answer}
                  </p>
                </div>

                {/* Participant 2 Answer */}
                <div className="p-4 rounded-xl bg-[#2B0A11]/80 border border-[rgba(217,138,143,0.3)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#D98A8F] truncate">
                      {card.participant2.nickname}
                    </span>
                    {card.participant2.status === 'no_answer' && (
                      <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full">
                        Cavab verilməyib
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#F5E8D6] leading-relaxed break-words whitespace-pre-wrap">
                    {card.participant2.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Replay Game CTA Card */}
          <div className="wine-card p-6 text-center mt-8">
            <h3 className="font-serif-title text-xl font-bold text-[#F5E8D6] mb-2">
              Söhbəti Davam Etdirək?
            </h3>
            <p className="text-xs text-[#CDB9A3] mb-4">
              Yeni kateqoriya və tamamilə yeni suallarla növbəti oyuna başlayın.
            </p>

            <button
              onClick={onRequestReplay}
              disabled={isReplayPending}
              className="py-3.5 px-8 btn-gold inline-flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer shadow-lg disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isReplayPending ? 'Dostunuzun razılığı gözlənilir...' : 'Yenidən Oyna'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className={`lg:col-span-5 sticky top-6 ${activeTab === 'cards' ? 'hidden lg:block' : 'block'}`}>
          <ChatWindow
            messages={messages}
            onSendMessage={onSendMessage}
            onTyping={onTyping}
            yourParticipantId={yourParticipantId}
            activeQuestionRef={activeQuestionRef}
            onClearQuestionRef={() => setActiveQuestionRef(null)}
          />
        </div>
      </div>
    </div>
  );
};
