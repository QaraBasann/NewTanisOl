import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Copy, 
  Check, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Circle, 
  Clock, 
  HelpCircle,
  Eye,
  Sliders
} from 'lucide-react';
import { RoomSnapshot, RoomSettings } from '../types';

interface WaitingScreenProps {
  snapshot: RoomSnapshot;
  onUpdateSettings: (settings: RoomSettings) => void;
  onToggleReady: (isReady: boolean) => void;
  onStartGame: () => void;
  yourParticipantId?: string;
  isHost: boolean;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  snapshot,
  onUpdateSettings,
  onToggleReady,
  onStartGame,
  yourParticipantId,
  isHost
}) => {
  const [copied, setCopied] = React.useState(false);

  const me = snapshot.participants.find(p => p.id === yourParticipantId);
  const partner = snapshot.participants.find(p => p.id !== yourParticipantId);

  const isMeReady = me?.isReady || false;
  const isPartnerReady = partner?.isReady || false;
  const canStart = snapshot.participants.length === 2 && isMeReady && isPartnerReady && isHost;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(snapshot.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSettingChange = (field: keyof RoomSettings, value: any) => {
    if (!isHost) return;
    onUpdateSettings({
      ...snapshot.settings,
      [field]: value
    });
  };

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
      {/* Lobby Title */}
      <div className="text-center mb-8">
        <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#F5E8D6] mb-2">
          {snapshot.participants.length === 1 ? 'Dostunu Gözləyirik' : 'Oyun Otağı'}
        </h2>
        <p className="text-sm text-[#CDB9A3]">
          {snapshot.participants.length === 1 
            ? 'Aşağıdakı otaq kodunu dostunla paylaş, otağa daxil olan kimi oyun başlayacaq.'
            : 'Hər iki tərəf parametrləri təsdiqlədikdə oyun başlayacaq.'}
        </p>
      </div>

      {/* Participants Status Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Participant 1 (Host) */}
        <div className={`p-4 rounded-2xl border transition-all ${
          snapshot.participants[0] 
            ? 'bg-[#4A1219]/60 border-[rgba(226,185,122,0.3)]' 
            : 'bg-[#2B0A11]/40 border-dashed border-[rgba(226,185,122,0.15)]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-medium text-[#E2B97A] tracking-wider">
              Otaq Sahibi (Host)
            </span>
            {snapshot.participants[0]?.isReady ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Hazırdır
              </span>
            ) : (
              <span className="text-[11px] text-[#CDB9A3]/60">Gözlənilir</span>
            )}
          </div>
          <p className="font-semibold text-[#F5E8D6] truncate">
            {snapshot.participants[0]?.nickname || 'Boş'}
          </p>
        </div>

        {/* Participant 2 (Guest) */}
        <div className={`p-4 rounded-2xl border transition-all ${
          snapshot.participants[1] 
            ? 'bg-[#4A1219]/60 border-[rgba(226,185,122,0.3)]' 
            : 'bg-[#2B0A11]/40 border-dashed border-[rgba(226,185,122,0.15)] flex flex-col items-center justify-center text-center'
        }`}>
          {snapshot.participants[1] ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-medium text-[#D98A8F] tracking-wider">
                  Qonaq (Guest)
                </span>
                {snapshot.participants[1].isReady ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hazırdır
                  </span>
                ) : (
                  <span className="text-[11px] text-[#CDB9A3]/60">Gözlənilir</span>
                )}
              </div>
              <p className="font-semibold text-[#F5E8D6] truncate">
                {snapshot.participants[1].nickname}
              </p>
            </>
          ) : (
            <div className="py-2">
              <span className="text-xs text-[#CDB9A3] block mb-1">Dostunu dəvət et</span>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2B97A]/10 border border-[#E2B97A]/40 text-xs text-[#E2B97A] hover:bg-[#E2B97A]/20 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Kodu Kopyala</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Game Settings Card */}
      <div className="wine-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4 border-b border-[rgba(226,185,122,0.15)] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#E2B97A]" />
            <h3 className="font-serif-title text-lg font-semibold text-[#F5E8D6]">
              Oyun Parametrləri
            </h3>
          </div>
          {!isHost && (
            <span className="text-[11px] text-[#CDB9A3] italic bg-[#2B0A11] px-2.5 py-0.5 rounded-full border border-[rgba(226,185,122,0.15)]">
              Parametrləri Host təyin edir
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Category selection */}
          <div>
            <label className="block text-xs font-medium text-[#CDB9A3] mb-1.5 uppercase tracking-wider">
              Kateqoriya
            </label>
            <select
              disabled={!isHost}
              value={snapshot.settings.category}
              onChange={(e) => handleSettingChange('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#2B0A11] border border-[rgba(226,185,122,0.25)] text-[#F5E8D6] focus:outline-none focus:border-[#E2B97A] disabled:opacity-80 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {snapshot.categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1A0509] text-[#F5E8D6]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Count & Time Per Question Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#CDB9A3] mb-1.5 uppercase tracking-wider">
                Sual Sayı
              </label>
              <select
                disabled={!isHost}
                value={snapshot.settings.questionCount}
                onChange={(e) => handleSettingChange('questionCount', parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#2B0A11] border border-[rgba(226,185,122,0.25)] text-[#F5E8D6] focus:outline-none focus:border-[#E2B97A] disabled:opacity-80 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {[5, 10, 15, 20].map((num) => (
                  <option key={num} value={num} className="bg-[#1A0509] text-[#F5E8D6]">
                    {num} Sual
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CDB9A3] mb-1.5 uppercase tracking-wider">
                Hər Sual üçün Vaxt
              </label>
              <select
                disabled={!isHost}
                value={snapshot.settings.timePerQuestion}
                onChange={(e) => handleSettingChange('timePerQuestion', parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#2B0A11] border border-[rgba(226,185,122,0.25)] text-[#F5E8D6] focus:outline-none focus:border-[#E2B97A] disabled:opacity-80 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {[30, 45, 60, 90, 120].map((sec) => (
                  <option key={sec} value={sec} className="bg-[#1A0509] text-[#F5E8D6]">
                    {sec} Saniyə
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reveal Mode */}
          <div>
            <label className="block text-xs font-medium text-[#CDB9A3] mb-1.5 uppercase tracking-wider">
              Cavabların Açılma Rejimi
            </label>
            <select
              disabled={!isHost}
              value={snapshot.settings.revealMode}
              onChange={(e) => handleSettingChange('revealMode', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#2B0A11] border border-[rgba(226,185,122,0.25)] text-[#F5E8D6] focus:outline-none focus:border-[#E2B97A] disabled:opacity-80 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="standard" className="bg-[#1A0509] text-[#F5E8D6]">
                Oyun sonunda hamısı birlikdə (Standart)
              </option>
              <option value="immediate" className="bg-[#1A0509] text-[#F5E8D6]">
                Hər sualdan sonra dərhal
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Ready toggle button */}
        <button
          type="button"
          onClick={() => onToggleReady(!isMeReady)}
          className={`w-full sm:w-1/2 py-3.5 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
            isMeReady
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'btn-wine-outline'
          }`}
        >
          {isMeReady ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          <span>{isMeReady ? 'Hazıram (Təsdiqləndi)' : 'Hazıram'}</span>
        </button>

        {/* Start Game Button (Host Only) */}
        {isHost ? (
          <button
            type="button"
            disabled={!canStart}
            onClick={onStartGame}
            className={`w-full sm:w-1/2 py-3.5 btn-gold flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer ${
              !canStart ? 'opacity-40 cursor-not-allowed' : 'animate-pulse'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Oyunu Başlat</span>
          </button>
        ) : (
          <div className="w-full sm:w-1/2 py-3.5 text-center text-xs text-[#CDB9A3] italic bg-[#2B0A11]/60 rounded-full border border-[rgba(226,185,122,0.15)]">
            {canStart ? 'Host oyunu başlada bilər' : 'Hər iki tərəfin hazır olması gözlənilir'}
          </div>
        )}
      </div>
    </div>
  );
};
