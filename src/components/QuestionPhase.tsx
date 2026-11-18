import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Send, CheckCircle2, Sparkles, User, HelpCircle } from 'lucide-react';
import { ActiveQuestionView } from '../types';

interface QuestionPhaseProps {
  activeQuestion: ActiveQuestionView;
  onSubmitAnswer: (questionId: string, answer: string) => void;
  onTyping: (isTyping: boolean) => void;
  partnerNickname?: string;
  isTransitioning?: boolean;
}

export const QuestionPhase: React.FC<QuestionPhaseProps> = ({
  activeQuestion,
  onSubmitAnswer,
  onTyping,
  partnerNickname = 'Dostun',
  isTransitioning
}) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset local state when active question changes
  useEffect(() => {
    setAnswer('');
    setIsSubmitting(false);
  }, [activeQuestion.questionId]);

  // Handle typing status notification
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 500) {
      setAnswer(val);
      onTyping(val.trim().length > 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || activeQuestion.hasYouAnswered) return;
    setIsSubmitting(true);
    onTyping(false);
    onSubmitAnswer(activeQuestion.questionId, answer.trim());
  };

  const progressPercent = ((activeQuestion.order + 1) / activeQuestion.totalQuestions) * 100;
  const isUrgent = activeQuestion.secondsRemaining <= 10;

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Progress & Question Index Header */}
      <div className="flex items-center justify-between mb-3 text-xs font-semibold text-[#CDB9A3] tracking-wider uppercase">
        <span>Sual {activeQuestion.order + 1} / {activeQuestion.totalQuestions}</span>
        <span className="text-[#E2B97A]">{Math.round(progressPercent)}%</span>
      </div>

      {/* Luxury Progress Bar */}
      <div className="w-full h-1.5 bg-[#2B0A11] rounded-full overflow-hidden mb-6 border border-[rgba(226,185,122,0.15)]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#8C1D2A] to-[#E2B97A]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question Card Container with 3D feel */}
      <motion.div 
        key={activeQuestion.questionId}
        initial={{ opacity: 0, rotateX: 12, y: 30 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="wine-card p-6 sm:p-8 mb-6 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle decorative gold badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs text-[#E2B97A] uppercase tracking-wider font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tanış Ol Müzakirə</span>
          </div>

          {/* Circular Countdown Timer */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
              isUrgent 
                ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse' 
                : 'bg-[#2B0A11] border-[rgba(226,185,122,0.3)] text-[#E2B97A]'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono font-bold text-sm">
                {activeQuestion.secondsRemaining}s
              </span>
            </div>
          </div>
        </div>

        {/* Question Text */}
        <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#F5E8D6] leading-relaxed mb-6">
          {activeQuestion.text}
        </h2>

        {/* Partner Live Status Indicator */}
        <div className="p-3 rounded-xl bg-[#2B0A11]/60 border border-[rgba(226,185,122,0.15)] flex items-center justify-between text-xs text-[#CDB9A3]">
          <span className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#E2B97A]" />
            <span>{partnerNickname}:</span>
          </span>

          {activeQuestion.hasPartnerAnswered ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cavabladı
            </span>
          ) : activeQuestion.isPartnerTyping ? (
            <span className="text-[#E2B97A] italic animate-pulse">
              yazır...
            </span>
          ) : (
            <span className="text-[#CDB9A3]/60 italic">
              düşünür...
            </span>
          )}
        </div>
      </motion.div>

      {/* Answer Input or Waiting State */}
      <div className="wine-card p-6 sm:p-8">
        {activeQuestion.hasYouAnswered ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif-title text-lg font-bold text-[#F5E8D6] mb-1">
              Cavabınız Qəbul Edildi!
            </h3>
            <p className="text-xs sm:text-sm text-[#CDB9A3]">
              {activeQuestion.hasPartnerAnswered 
                ? 'Hər iki cavab hazırdır, növbəti suala keçilir...' 
                : `${partnerNickname} tərəfindən cavab gözlənilir...`}
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-[#CDB9A3] mb-1.5">
                <label className="uppercase tracking-wider font-medium">Sizin Cavabınız</label>
                <span className={answer.length >= 480 ? 'text-rose-400 font-bold' : ''}>
                  {answer.length}/500
                </span>
              </div>
              <textarea
                value={answer}
                onChange={handleTextChange}
                rows={4}
                maxLength={500}
                required
                placeholder="Səmimi düşüncələrinizi yazın (cavabınız yalnız oyun bitdikdə açılacaq)..."
                className="w-full px-4 py-3 rounded-xl bg-[#2B0A11]/90 border border-[rgba(226,185,122,0.25)] text-[#F5E8D6] placeholder-[#CDB9A3]/40 focus:outline-none focus:border-[#E2B97A] focus:ring-1 focus:ring-[#E2B97A] resize-none transition-all leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!answer.trim() || isSubmitting}
              className="w-full py-3.5 btn-gold flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Göndərilir...' : 'Cavabı Göndər'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1A0509]/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-4"
          >
            <div className="w-14 h-14 rounded-full border-2 border-[#E2B97A] border-t-transparent animate-spin mb-4" />
            <h3 className="font-serif-title text-2xl font-bold text-[#F5E8D6] mb-1">
              Hər İki Cavab Alındı
            </h3>
            <p className="text-sm text-[#CDB9A3]">
              Növbəti suala keçilir...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
