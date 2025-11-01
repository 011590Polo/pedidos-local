import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido, PedidoRequest, PedidoResponse, PedidoSingleResponse, SeguimientoResponse, DetallePedidoCompleto, PedidoAgrupado, PedidosAgrupadosResponse, PedidosGrupoResponse } from '../models/pedido.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  // Usar backend local en desarrollo
  // Usar la URL base definida en environment (configurable por entorno)
  private apiUrl = `${environment.apiUrl}/api/pedidos`;

  constructor(private http: HttpClient) { }

  getPedidos(includeDetalles: boolean = false): Observable<PedidoResponse> {
    const url = includeDetalles ? `${this.apiUrl}?include=detalles` : this.apiUrl;
    return this.http.get<PedidoResponse>(url);
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

  getDetallesPedido(idPedido: number): Observable<{success: boolean, data: DetallePedidoCompleto[], count: number}> {
    return this.http.get<{success: boolean, data: DetallePedidoCompleto[], count: number}>(`${this.apiUrl}/${idPedido}/detalles`);
  }

  updateEstadoDetalle(idPedido: number, idDetalle: number, estado: string): Observable<{success: boolean, message: string, data: any}> {
    return this.http.put<{success: boolean, message: string, data: any}>(`${this.apiUrl}/${idPedido}/detalle/${idDetalle}`, { estado });
  }

  getPedidosAgrupados(): Observable<PedidosAgrupadosResponse> {
    return this.http.get<PedidosAgrupadosResponse>(`${this.apiUrl}/agrupados`);
  }

  getPedidosPorGrupo(codigo: string): Observable<PedidosGrupoResponse> {
    return this.http.get<PedidosGrupoResponse>(`${this.apiUrl}/grupo/${codigo}`);
  }
}

