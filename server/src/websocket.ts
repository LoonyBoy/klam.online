// ============================================================================
// KLAM.ONLINE - WebSocket Manager
// Управление WebSocket соединениями для real-time обновлений
// ============================================================================

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface Client {
  ws: WebSocket;
  userId?: string;
  companyId?: string;
  projectId?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();

  /**
   * Инициализация WebSocket сервера
   */
  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      
      console.log(`🔌 WebSocket client connected: ${clientId}`);
      
      this.clients.set(clientId, { ws });

      // Обработка сообщений от клиента
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(clientId, data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      // Обработка закрытия соединения
      ws.on('close', () => {
        console.log(`🔌 WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Обработка ошибок
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${clientId}:`, error);
      });

      // Отправляем приветственное сообщение
      this.sendToClient(clientId, {
        type: 'connected',
        clientId,
        message: 'Connected to KLAM.Online WebSocket',
      });
    });

    console.log('✅ WebSocket server initialized on /ws');
  }

  /**
   * Обработка сообщений от клиента
   */
  private handleClientMessage(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'subscribe':
        // Подписка на обновления проекта/компании
        if (data.projectId) {
          client.projectId = data.projectId;
        }
        if (data.companyId) {
          client.companyId = data.companyId;
        }
        if (data.userId) {
          client.userId = data.userId;
        }
        console.log(`📡 Client ${clientId} subscribed to:`, {
          projectId: data.projectId,
          companyId: data.companyId,
        });
        break;

      case 'ping':
        // Ответ на ping
        this.sendToClient(clientId, { type: 'pong' });
        break;
    }
  }

  /**
   * Отправка сообщения конкретному клиенту
   */
  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast обновления статуса альбома
   */
  broadcastAlbumStatusUpdate(albumId: number, projectId: number, companyId: number, data: any) {
    const message = {
      type: 'album_status_updated',
      albumId,
      projectId,
      companyId,
      data,
      timestamp: new Date().toISOString(),
    };

    this.clients.forEach((client, clientId) => {
      // Отправляем только клиентам, подписанным на этот проект или компанию
      if (
        (client.projectId && client.projectId === projectId.toString()) ||
        (client.companyId && client.companyId === companyId.toString())
      ) {
        this.sendToClient(clientId, message);
      }
    });

    console.log(`📡 Broadcasted album status update for album ${albumId} to subscribed clients`);
  }

  /**
   * Broadcast обновления проекта
   */
  broadcastProjectUpdate(projectId: number, companyId: number, data: any) {
    const message = {
      type: 'project_updated',
      projectId,
      companyId,
      data,
      timestamp: new Date().toISOString(),
    };

    this.clients.forEach((client, clientId) => {
      if (
        (client.projectId && client.projectId === projectId.toString()) ||
        (client.companyId && client.companyId === companyId.toString())
      ) {
        this.sendToClient(clientId, message);
      }
    });
  }

  /**
   * Генерация ID клиента
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получить количество активных подключений
   */
  getActiveConnections(): number {
    return this.clients.size;
  }

  /**
   * Закрыть все соединения
   */
  close() {
    this.clients.forEach((client) => {
      client.ws.close();
    });
    this.clients.clear();
    this.wss?.close();
    console.log('🔌 WebSocket server closed');
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();
