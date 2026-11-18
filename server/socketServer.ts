import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { 
  createRoom, 
  joinRoom, 
  updateGameSettings, 
  toggleReady, 
  getRoomSnapshot 
} from './lobbyManager.js';
import { 
  startGame, 
  submitAnswer, 
  getActiveQuestionForClient, 
  getRevealCards, 
  postChatMessage, 
  getRoomChatMessages, 
  requestReplay 
} from './gameEngine.js';
import { updateParticipantStatus } from './session.js';
import { db } from './db.js';

interface ClientSocket {
  ws: WebSocket;
  roomId?: string;
  roomCode?: string;
  participantId?: string;
}

const connections = new Set<ClientSocket>();

export function setupWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    const client: ClientSocket = { ws };
    connections.add(client);

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        await handleSocketMessage(client, data);
      } catch (err: any) {
        console.error('Socket message error:', err);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: err.message || 'Xəta baş verdi' }
        }));
      }
    });

    ws.on('close', () => {
      connections.delete(client);
      if (client.roomId && client.participantId) {
        updateParticipantStatus(client.participantId, 'disconnected');
        broadcastToRoom(client.roomId, {
          type: 'NOTIFICATION',
          payload: { text: 'Dostun bağlantısı kəsildi...', kind: 'warning' }
        });
        broadcastRoomState(client.roomId);
      }
    });
  });

  return wss;
}

export function broadcastToRoom(roomId: string, message: any) {
  const data = JSON.stringify(message);
  for (const client of connections) {
    if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

export function broadcastRoomState(roomId: string) {
  const room = db.prepare('SELECT room_code FROM rooms WHERE id = ?').get(roomId) as { room_code: string } | undefined;
  if (!room) return;

  for (const client of connections) {
    if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
      const snapshot = getRoomSnapshot(roomId, client.participantId);
      const activeQ = client.participantId ? getActiveQuestionForClient(roomId, client.participantId) : null;
      const revealCards = snapshot.roomStatus === 'results' ? getRevealCards(roomId) : [];
      const chatMessages = getRoomChatMessages(roomId);

      client.ws.send(JSON.stringify({
        type: 'ROOM_STATE',
        payload: {
          snapshot,
          activeQuestion: activeQ,
          revealCards,
          chatMessages,
          yourParticipantId: client.participantId
        }
      }));
    }
  }
}

async function handleSocketMessage(client: ClientSocket, message: { type: string; payload: any }) {
  const { type, payload } = message;

  switch (type) {
    case 'CREATE_ROOM': {
      const { nickname } = payload;
      const res = createRoom(nickname);
      client.roomId = res.roomId;
      client.roomCode = res.roomCode;
      client.participantId = res.hostId;

      client.ws.send(JSON.stringify({
        type: 'ROOM_CREATED',
        payload: {
          roomCode: res.roomCode,
          sessionToken: res.sessionToken,
          participantId: res.hostId,
          role: 'host'
        }
      }));

      broadcastRoomState(res.roomId);
      break;
    }

    case 'JOIN_ROOM': {
      const { roomCode, nickname, sessionToken } = payload;
      const res = joinRoom(roomCode, nickname, sessionToken);
      client.roomId = res.roomId;
      client.roomCode = res.roomCode;
      client.participantId = res.participantId;

      client.ws.send(JSON.stringify({
        type: 'ROOM_JOINED',
        payload: {
          roomCode: res.roomCode,
          sessionToken: res.sessionToken,
          participantId: res.participantId,
          role: res.role,
          isReconnection: res.isReconnection
        }
      }));

      broadcastRoomState(res.roomId);
      break;
    }

    case 'RECONNECT': {
      const { roomCode, sessionToken } = payload;
      const res = joinRoom(roomCode, '', sessionToken);
      client.roomId = res.roomId;
      client.roomCode = res.roomCode;
      client.participantId = res.participantId;

      client.ws.send(JSON.stringify({
        type: 'ROOM_JOINED',
        payload: {
          roomCode: res.roomCode,
          sessionToken: res.sessionToken,
          participantId: res.participantId,
          role: res.role,
          isReconnection: true
        }
      }));

      broadcastRoomState(res.roomId);
      break;
    }

    case 'UPDATE_SETTINGS': {
      if (!client.roomId || !client.participantId) return;
      updateGameSettings(client.roomId, client.participantId, payload);
      broadcastRoomState(client.roomId);
      break;
    }

    case 'TOGGLE_READY': {
      if (!client.roomId || !client.participantId) return;
      toggleReady(client.roomId, client.participantId, payload.isReady);
      broadcastRoomState(client.roomId);
      break;
    }

    case 'START_GAME': {
      if (!client.roomId || !client.participantId) return;
      await startGame(client.roomId, client.participantId, (rId) => broadcastRoomState(rId));
      break;
    }

    case 'SUBMIT_ANSWER': {
      if (!client.roomId || !client.participantId) return;
      const { questionId, answer } = payload;
      submitAnswer(client.roomId, client.participantId, questionId, answer, (rId) => broadcastRoomState(rId));
      break;
    }

    case 'SEND_MESSAGE': {
      if (!client.roomId || !client.participantId) return;
      const { text, questionRef } = payload;
      const msg = postChatMessage(client.roomId, client.participantId, text, questionRef);
      broadcastToRoom(client.roomId, {
        type: 'NEW_CHAT_MESSAGE',
        payload: msg
      });
      break;
    }

    case 'TYPING_STATUS': {
      if (!client.roomId || !client.participantId) return;
      broadcastToRoom(client.roomId, {
        type: 'PARTNER_TYPING',
        payload: {
          participantId: client.participantId,
          isTyping: Boolean(payload.isTyping)
        }
      });
      break;
    }

    case 'REPLAY_REQUEST': {
      if (!client.roomId || !client.participantId) return;
      requestReplay(client.roomId, client.participantId, (rId) => broadcastRoomState(rId));
      break;
    }

    case 'LEAVE_ROOM': {
      if (client.roomId && client.participantId) {
        updateParticipantStatus(client.participantId, 'disconnected');
        broadcastRoomState(client.roomId);
      }
      client.roomId = undefined;
      client.participantId = undefined;
      break;
    }
  }
}
