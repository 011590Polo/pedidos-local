import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private connected: boolean = false;

  constructor() {
    // Ajusta la URL si tu backend corre en otro host/puerto
    // En desarrollo apuntamos al backend local
    console.log('🔌 Inicializando Socket.IO con URL:', environment.apiUrl);
    this.socket = io(`${environment.apiUrl}`, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    
    // Agregar listeners para debug
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO conectado:', this.socket.id);
      this.connected = true;
    });
    
    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO desconectado');
      this.connected = false;
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error);
      this.connected = false;
    });
    
    // Verificar conexión después de un tiempo
    setTimeout(() => {
      if (!this.connected) {
        console.warn('⚠️ Socket.IO no se conectó después de 5 segundos');
      }
    }, 5000);
  }

  isConnected(): boolean {
    return this.connected && this.socket.connected;
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) this.socket.off(event, callback);
    else this.socket.removeAllListeners(event);
  }

  emit(event: string, data?: any) {
    this.socket.emit(event, data);
  }

  // Helpers para unirse y salir de salas de seguimiento por código
  joinSeguimiento(codigo: string) {
    this.emit('joinSeguimiento', codigo);
  }

  leaveSeguimiento(codigo: string) {
    this.emit('leaveSeguimiento', codigo);
  }
}
