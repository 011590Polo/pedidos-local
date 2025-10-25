import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // Ajusta la URL si tu backend corre en otro host/puerto
  // En desarrollo apuntamos al backend local
  this.socket = io(`${environment.apiUrl}`);
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
