import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido, PedidoRequest, PedidoResponse, PedidoSingleResponse, SeguimientoResponse } from '../models/pedido.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  // Usar backend local en desarrollo
  // Usar la URL base definida en environment (configurable por entorno)
  private apiUrl = `${environment.apiUrl}/api/pedidos`;

  constructor(private http: HttpClient) { }

  getPedidos(): Observable<PedidoResponse> {
    return this.http.get<PedidoResponse>(this.apiUrl);
  }

  getPedido(id: number): Observable<PedidoSingleResponse> {
    return this.http.get<PedidoSingleResponse>(`${this.apiUrl}/${id}`);
  }

  createPedido(pedido: PedidoRequest): Observable<PedidoSingleResponse> {
    return this.http.post<PedidoSingleResponse>(this.apiUrl, pedido);
  }

  updatePedido(id: number, pedido: Partial<Pedido>): Observable<PedidoSingleResponse> {
    return this.http.put<PedidoSingleResponse>(`${this.apiUrl}/${id}`, pedido);
  }

  deletePedido(id: number): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/${id}`);
  }

  getPedidoByCodigo(codigo: string): Observable<SeguimientoResponse> {
    return this.http.get<SeguimientoResponse>(`${this.apiUrl}/seguimiento/${codigo}`);
  }
}

