import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { WaitingScreen } from './components/WaitingScreen';
import { QuestionPhase } from './components/QuestionPhase';
import { RevealPhase } from './components/RevealPhase';
import { ThreeCanvas } from './components/ThreeCanvas';
import { 
  RoomSnapshot, 
  ActiveQuestionView, 
  RevealAnswerCard, 
  ChatMessage, 
  RoomSettings 
} from './types';

export function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Game State
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestionView | null>(null);
  const [revealCards, setRevealCards] = useState<RevealAnswerCard[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [yourParticipantId, setYourParticipantId] = useState<string | undefined>(undefined);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Connect / Reconnect WebSocket on Mount
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Check stored session for automatic reconnection (PRD Section 3.1)
      const storedToken = localStorage.getItem('tanisol_session_token');
      const storedCode = localStorage.getItem('tanisol_room_code');

      if (storedToken && storedCode) {
        ws.send(JSON.stringify({
          type: 'RECONNECT',
          payload: { roomCode: storedCode, sessionToken: storedToken }
        }));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerEvent(data);
      } catch (err) {
        console.error('Failed to parse WS event:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleServerEvent = (data: { type: string; payload: any }) => {
    switch (data.type) {
      case 'ROOM_CREATED':
      case 'ROOM_JOINED': {
        const { roomCode, sessionToken, participantId } = data.payload;
        localStorage.setItem('tanisol_session_token', sessionToken);
        localStorage.setItem('tanisol_room_code', roomCode);
        setYourParticipantId(participantId);
        setIsLoading(false);
        break;
      }

      case 'ROOM_STATE': {
        const { snapshot, activeQuestion, revealCards, chatMessages, yourParticipantId: pId } = data.payload;
        setSnapshot(snapshot);
        setActiveQuestion(activeQuestion);
        setRevealCards(revealCards || []);
        setChatMessages(chatMessages || []);
        if (pId) setYourParticipantId(pId);
        setIsLoading(false);
        break;
      }

      case 'NEW_CHAT_MESSAGE': {
        setChatMessages((prev) => [...prev, data.payload]);
        break;
      }

      case 'PARTNER_TYPING': {
        setPartnerTyping(Boolean(data.payload.isTyping));
        break;
      }

      case 'ERROR': {
        setErrorMessage(data.payload.message);
        setIsLoading(false);
        break;
      }

      case 'NOTIFICATION': {
        // Optional quick notification
        break;
      }
    }
  };

  const sendEvent = (type: string, payload: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  // User Actions
  const handleCreateRoom = (nickname: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    sendEvent('CREATE_ROOM', { nickname });
  };

  const handleJoinRoom = (roomCode: string, nickname: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    sendEvent('JOIN_ROOM', { roomCode, nickname });
  };

  const handleUpdateSettings = (settings: RoomSettings) => {
    sendEvent('UPDATE_SETTINGS', settings);
  };

  const handleToggleReady = (isReady: boolean) => {
    sendEvent('TOGGLE_READY', { isReady });
  };

  const handleStartGame = () => {
    setIsLoading(true);
    sendEvent('START_GAME');
  };

  const handleSubmitAnswer = (questionId: string, answer: string) => {
    sendEvent('SUBMIT_ANSWER', { questionId, answer });
  };

  const handleSendMessage = (text: string, questionRef?: string) => {
    sendEvent('SEND_MESSAGE', { text, questionRef });
  };

  const handleTyping = (isTyping: boolean) => {
    sendEvent('TYPING_STATUS', { isTyping });
  };

  const handleRequestReplay = () => {
    sendEvent('REPLAY_REQUEST');
  };

  // Determine which screen to render
  const renderContent = () => {
    if (!snapshot) {
      return (
        <WelcomeScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      );
    }

    const isHost = snapshot.yourRole === 'host';
    const isResults = snapshot.roomStatus === 'results' || snapshot.gameStatus === 'completed';
    const isInGame = (snapshot.roomStatus === 'in_game' || snapshot.gameStatus === 'question_active' || snapshot.gameStatus === 'question_transition') && activeQuestion;

    if (isResults) {
      return (
        <RevealPhase
          cards={revealCards}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onRequestReplay={handleRequestReplay}
          yourParticipantId={yourParticipantId}
          isReplayPending={snapshot.roomStatus === 'replay_pending'}
        />
      );
    }

    if (isInGame) {
      const partner = snapshot.participants.find(p => p.id !== yourParticipantId);
      return (
        <QuestionPhase
          activeQuestion={{
            ...activeQuestion,
            isPartnerTyping: partnerTyping
          }}
          onSubmitAnswer={handleSubmitAnswer}
          onTyping={handleTyping}
          partnerNickname={partner?.nickname || 'Dostun'}
          isTransitioning={snapshot.gameStatus === 'question_transition'}
        />
      );
    }

    return (
      <WaitingScreen
        snapshot={snapshot}
        onUpdateSettings={handleUpdateSettings}
        onToggleReady={handleToggleReady}
        onStartGame={handleStartGame}
        yourParticipantId={yourParticipantId}
        isHost={isHost}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#1A0509] text-[#F5E8D6] relative flex flex-col">
      {/* Three.js 3D Floating Gold Rings & Dust */}
      <ThreeCanvas intensity={snapshot ? 'calm' : 'hero'} />

      {/* Atmospheric Background glow */}
      <div className="atmosphere-bg" />

      {/* Header */}
      <Header
        roomCode={snapshot?.roomCode}
        isConnected={isConnected}
        participantCount={snapshot?.participants.length}
      />

      {/* Main App Content */}
      <main className="flex-1 flex flex-col justify-center relative z-10">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
