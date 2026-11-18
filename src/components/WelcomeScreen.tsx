import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, ArrowRight, ShieldCheck, HeartHandshake, HelpCircle } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateRoom: (nickname: string) => void;
  onJoinRoom: (roomCode: string, nickname: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading,
  errorMessage
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setLocalError('Adınız 2 ilə 20 simvol arasında olmalıdır.');
      return;
    }
    onCreateRoom(trimmed);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmedName = nickname.trim();
    const trimmedCode = roomCode.trim().toUpperCase();

    if (trimmedName.length < 2 || trimmedName.length > 20) {
      setLocalError('Adınız 2 ilə 20 simvol arasında olmalıdır.');
      return;
    }
    if (trimmedCode.length !== 6) {
      setLocalError('Otaq kodu 6 simvoldan ibarət olmalıdır.');
      return;
    }
    onJoinRoom(trimmedCode, trimmedName);
  };

  return (
    <div className="relative z-10 max-w-xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      {/* Hero Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4A1219]/60 border border-[rgba(226,185,122,0.3)] text-xs text-[#E2B97A] font-medium mb-6 shadow-lg shadow-[#8C1D2A]/10"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#E2B97A]" />
        <span>İki nəfərlik real-time AI tanışlıq təcrübəsi</span>
      </motion.div>

      {/* Main Title */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center mb-8"
      >
        <h1 className="font-serif-title text-4xl sm:text-5xl font-bold text-[#F5E8D6] tracking-tight mb-2">
          Bir-birinizi <span className="text-[#E2B97A] italic">Yenidən</span> Kəşf Edin
        </h1>
        <p className="text-sm sm:text-base text-[#CDB9A3] max-w-md mx-auto leading-relaxed">
          Gemini AI əsaslı unikal suallar, gizli cavablar və eyni anda açılan səmimi müzakirə anı.
        </p>
      </motion.div>

      {/* Interactive Luxury Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full wine-card p-6 sm:p-8"
      >
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#2B0A11] rounded-full border border-[rgba(226,185,122,0.2)] mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('create'); setLocalError(null); }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#8C1D2A] text-[#F5E8D6] shadow-md shadow-[#8C1D2A]/40'
                : 'text-[#CDB9A3] hover:text-[#F5E8D6]'
            }`}
          >
            Otaq Yarat
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('join'); setLocalError(null); }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === 'join'
                ? 'bg-[#8C1D2A] text-[#F5E8D6] shadow-md shadow-[#8C1D2A]/40'
                : 'text-[#CDB9A3] hover:text-[#F5E8D6]'
            }`}
          >
            Koda Qoşul
          </button>
        </div>

        {/* Error Notification */}
        {(localError || errorMessage) && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
            {localError || errorMessage}
          </div>
        )}

        {/* Create Form */}
        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#CDB9A3] mb-1.5 uppercase tracking-wider">
                Adınız və ya Ləqəbiniz
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="məsələn, Aysel"
                maxLength={20}
                required
                className="w-full px-4 py-3 rounded-xl bg-[#2B0A11]/80 border border-[rgba(226,185,122,0.25)] text-[#F5E8D6] placeholder-[#CDB9A3]/40 focus:outline-none focus:border-[#E2B97A] focus:ring-1 focus:ring-[#E2B97A] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 btn-gold flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Otaq hazırlanır...' : 'Otaq Yarat və Kodu Al'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#CDB9A3] mb-1.5 uppercase tracking-wider">
                Adınız
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="məsələn, Rəsul"
                maxLength={20}
                required
                className="w-full px-4 py-3 rounded-xl bg-[#2B0A11]/80 border border-[rgba(226,185,122,0.25)] text-[#F5E8D6] placeholder-[#CDB9A3]/40 focus:outline-none focus:border-[#E2B97A] focus:ring-1 focus:ring-[#E2B97A] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CDB9A3] mb-1.5 uppercase tracking-wider">
                6 Simvollu Otaq Kodu
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="məsələn, 4G8784"
                maxLength={6}
                required
                className="w-full px-4 py-3 rounded-xl bg-[#2B0A11]/80 border border-[rgba(226,185,122,0.25)] text-[#F5E8D6] placeholder-[#CDB9A3]/40 font-mono tracking-widest text-center uppercase focus:outline-none focus:border-[#E2B97A] focus:ring-1 focus:ring-[#E2B97A] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 btn-gold flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Qoşulur...' : 'Otağa Daxil Ol'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </motion.div>

      {/* Feature Highlights Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8"
      >
        <div className="p-4 rounded-xl bg-[#2B0A11]/50 border border-[rgba(226,185,122,0.15)] flex flex-col items-center text-center">
          <ShieldCheck className="w-5 h-5 text-[#E2B97A] mb-2" />
          <span className="text-xs font-semibold text-[#F5E8D6] mb-1">Gizli Cavablar</span>
          <span className="text-[11px] text-[#CDB9A3]">Cavablar oyun bitənədək gizli saxlanılır</span>
        </div>

        <div className="p-4 rounded-xl bg-[#2B0A11]/50 border border-[rgba(226,185,122,0.15)] flex flex-col items-center text-center">
          <Sparkles className="w-5 h-5 text-[#E2B97A] mb-2" />
          <span className="text-xs font-semibold text-[#F5E8D6] mb-1">Təkrarlanmayan AI</span>
          <span className="text-[11px] text-[#CDB9A3]">3 səviyyəli filtr ilə hər oyun yeni suallar</span>
        </div>

        <div className="p-4 rounded-xl bg-[#2B0A11]/50 border border-[rgba(226,185,122,0.15)] flex flex-col items-center text-center">
          <HeartHandshake className="w-5 h-5 text-[#E2B97A] mb-2" />
          <span className="text-xs font-semibold text-[#F5E8D6] mb-1">Eyni Anda Açılış</span>
          <span className="text-[11px] text-[#CDB9A3]">Yan-yana müqayisə və canlı çat</span>
        </div>
      </motion.div>
    </div>
  );
};
