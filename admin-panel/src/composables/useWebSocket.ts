import { io, Socket } from 'socket.io-client';
import { ref, onMounted, onUnmounted } from 'vue';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token?: string | null) {
    if (this.socket?.connected) return;

    const options: any = {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    };

    if (token) {
      options.auth = { token };
    }

    this.socket = io(SOCKET_URL, options);

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Forward events to listeners
    this.socket.onAny((event: string, data: any) => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach((listener) => listener(data));
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(room: string) {
    this.socket?.emit('join', { room });
  }

  leaveRoom(room: string) {
    this.socket?.emit('leave', { room });
  }

  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();

// Vue composable for WebSocket
export function useWebSocket() {
  const isConnected = ref(false);
  const events = ref<Record<string, any>>({});

  onMounted(() => {
    const token = localStorage.getItem('token');
    wsService.connect(token);
    isConnected.value = wsService.isConnected();

    // Subscribe to dashboard updates
    wsService.subscribe('dashboard:update', (data: any) => {
      events.value.dashboard = data;
    });

    // Subscribe to order updates
    wsService.subscribe('order:created', (data: any) => {
      events.value.orderCreated = data;
    });

    wsService.subscribe('order:updated', (data: any) => {
      events.value.orderUpdated = data;
    });

    // Subscribe to inventory alerts
    wsService.subscribe('inventory:low_stock', (data: any) => {
      events.value.lowStock = data;
    });

    // Subscribe to notifications
    wsService.subscribe('notification:new', (data: any) => {
      events.value.notification = data;
    });
  });

  onUnmounted(() => {
    // Cleanup listeners
  });

  const joinDashboard = () => {
    wsService.joinRoom('dashboard');
  };

  const leaveDashboard = () => {
    wsService.leaveRoom('dashboard');
  };

  const joinKitchen = () => {
    wsService.joinRoom('kitchen');
  };

  const leaveKitchen = () => {
    wsService.leaveRoom('kitchen');
  };

  return {
    isConnected,
    events,
    joinDashboard,
    leaveDashboard,
    joinKitchen,
    leaveKitchen,
  };
}
