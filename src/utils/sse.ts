/**
 * SSE 工具函数（支持断线重连）
 * @author <a href="https://codefather.cn">编程导航学习圈</a>
 */

import { BACKEND_HOST_LOCAL } from '@/constants';

const isDev = process.env.NODE_ENV === 'development';

// 开发环境直连后端（绕过代理，避免 SSE 被代理缓冲），生产环境用相对路径
const SSE_BASE_URL = isDev ? BACKEND_HOST_LOCAL : '';

export interface SSEMessage {
  type: string
  data?: any
  [key: string]: any
}

export interface SSEOptions {
  onMessage: (message: SSEMessage) => void
  onError?: (error: Event) => void
  onComplete?: () => void
  onReconnecting?: (attempt: number, maxRetries: number) => void
  onReconnectFailed?: () => void
  onOpen?: () => void
}

interface SSEConnection {
  eventSource: EventSource | null
  lastMessageType: string | null
  retryCount: number
  maxRetries: number
  baseDelay: number
  isCompleted: boolean
  isManuallyClosed: boolean
  reconnectTimer: ReturnType<typeof setTimeout> | null
}

const connections = new Map<string, SSEConnection>();

function getConnectionKey(taskId: string): string {
  return `/api/article/progress/${taskId}`;
}

function getReconnectDelay(attempt: number, baseDelay: number): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000);
}

function createEventSource(taskId: string, options: SSEOptions): EventSource {
  const { onMessage, onError, onComplete, onReconnecting, onReconnectFailed, onOpen } = options;
  const key = getConnectionKey(taskId);
  let conn = connections.get(key);

  if (!conn) {
    conn = {
      eventSource: null,
      lastMessageType: null,
      retryCount: 0,
      maxRetries: 5,
      baseDelay: 2000,
      isCompleted: false,
      isManuallyClosed: false,
      reconnectTimer: null,
    };
    connections.set(key, conn);
  }

  const url = conn.lastMessageType
    ? `${SSE_BASE_URL}/api/article/progress/${taskId}?lastType=${encodeURIComponent(conn.lastMessageType)}`
    : `${SSE_BASE_URL}/api/article/progress/${taskId}`;

  const eventSource = new EventSource(url, { withCredentials: true });
  conn.eventSource = eventSource;
  conn.isManuallyClosed = false;

  eventSource.onopen = () => {
    conn!.retryCount = 0;
    console.log('[SSE] 连接已建立, taskId=', taskId);
    onOpen?.();
  };

  eventSource.onmessage = (event) => {
    console.log('[SSE] 收到原始消息:', event.data);
    try {
      const message: SSEMessage = JSON.parse(event.data);
      console.log('[SSE] 解析后消息类型:', message.type, message);
      conn!.lastMessageType = message.type;
      onMessage(message);

      if (message.type === 'ALL_COMPLETE' || message.type === 'ERROR') {
        conn!.isCompleted = true;
        eventSource.close();
        onComplete?.();
      }
    } catch (error) {
      console.error('SSE 消息解析失败:', error);
    }
  };

  eventSource.onerror = (error) => {
    if (conn!.isCompleted || conn!.isManuallyClosed) {
      eventSource.close();
      return;
    }

    console.error('SSE 连接错误:', error);
    onError?.(error);

    conn!.eventSource = null;

    if (conn!.retryCount >= conn!.maxRetries) {
      console.error('SSE 重连次数已达上限');
      onReconnectFailed?.();
      return;
    }

    const delay = getReconnectDelay(conn!.retryCount, conn!.baseDelay);
    conn!.retryCount += 1;

    console.log(`SSE 将在 ${delay}ms 后进行第 ${conn!.retryCount} 次重连...`);
    onReconnecting?.(conn!.retryCount, conn!.maxRetries);

    conn!.reconnectTimer = setTimeout(() => {
      if (!conn!.isCompleted && !conn!.isManuallyClosed) {
        createEventSource(taskId, options);
      }
    }, delay);
  };

  return eventSource;
}

/**
 * 建立 SSE 连接（支持断线自动重连）
 */
export const connectSSE = (taskId: string, options: SSEOptions): EventSource => {
  return createEventSource(taskId, options);
};

/**
 * 关闭 SSE 连接
 */
export const closeSSE = (eventSource: EventSource | null) => {
  if (eventSource) {
    const key = [...connections.entries()].find(
      ([, conn]) => conn.eventSource === eventSource,
    )?.[0];
    if (key) {
      const conn = connections.get(key);
      if (conn) {
        conn.isManuallyClosed = true;
        if (conn.reconnectTimer) {
          clearTimeout(conn.reconnectTimer);
          conn.reconnectTimer = null;
        }
      }
      connections.delete(key);
    }
    eventSource.close();
  }
};
