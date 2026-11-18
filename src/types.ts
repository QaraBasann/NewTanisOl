export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Participant {
  id: string;
  nickname: string;
  role: 'host' | 'guest';
  isReady: boolean;
  connectionStatus: 'connected' | 'disconnected';
}

export interface RoomSettings {
  category: string;
  questionCount: number;
  timePerQuestion: number;
  revealMode: string;
}

export interface RoomSnapshot {
  roomCode: string;
  roomId: string;
  roomStatus: 'waiting_for_guest' | 'lobby' | 'in_game' | 'results' | 'replay_pending';
  gameId: string | null;
  gameStatus: 'configuring' | 'generating' | 'ready' | 'question_active' | 'question_transition' | 'completed' | 'aborted' | null;
  settings: RoomSettings;
  participants: Participant[];
  yourRole?: 'host' | 'guest';
  yourParticipantId?: string;
  categories: Category[];
}

export interface ActiveQuestionView {
  questionId: string;
  order: number;
  totalQuestions: number;
  text: string;
  category: string;
  secondsRemaining: number;
  deadlineAt: number;
  hasYouAnswered: boolean;
  hasPartnerAnswered: boolean;
  isPartnerTyping?: boolean;
}

export interface RevealAnswerCard {
  questionId: string;
  order: number;
  questionText: string;
  category: string;
  participant1: {
    id: string;
    nickname: string;
    answer: string;
    status: 'answered' | 'no_answer';
  };
  participant2: {
    id: string;
    nickname: string;
    answer: string;
    status: 'answered' | 'no_answer';
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  questionRef?: string | null;
  createdAt: number;
}
