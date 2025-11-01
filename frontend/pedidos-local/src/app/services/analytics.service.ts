import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VentasPorPeriodo {
  fecha: string;
  total_pedidos: number;
  total_ventas: number;
  promedio_venta: number;
}

export interface ProductoMasVendido {
  id: number;
  nombre: string;
  precio: number;
  total_vendido: number;
  veces_pedido: number;
  ingresos_generados: number;
}

export interface ClienteMasFrecuente {
  cliente: string;
  total_pedidos: number;
  total_gastado: number;
  promedio_pedido: number;
  ultimo_pedido: string;
}

export interface IngresosTotales {
  ingresos_totales: number;
  pedidos_exitosos: number;
  pedidos_cancelados: number;
  total_pedidos: number;
  promedio_pedido: number;
}

export interface EstadoPedido {
  estado: string;
  cantidad: number;
  total_por_estado: number;
}

export interface VentasPorHora {
  hora: number;
  pedidos: number;
  ventas: number;
}

export interface VentasUltimaSemana {
  fecha: string;
  dia_semana: string;
  nombre_dia: string;
  pedidos: number;
  ventas: number;
  promedio_venta: number;
}

export interface PedidoDetallado {
  id: number;
  cliente: string;
  mesa: string;
  estado: string;
  total: number;
  fecha: string;
  codigo_publico: string;
  productos_detalle: string;
  cantidades: string;
  nombres_productos: string;
  subtotales: string;
}

export interface FiltrosPedidos {
  cliente?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  totalMin?: number;
  totalMax?: number;
  limite?: number;
}

export interface TendenciaVentas {
  fecha: string;
  pedidos: number;
  ventas: number;
}

export interface DashboardData {
  ingresos: IngresosTotales;
  estados: EstadoPedido[];
  productosMasVendidos: ProductoMasVendido[];
  clientesMasFrecuentes: ClienteMasFrecuente[];
  ventasDia: VentasPorPeriodo[];
  ventasUltimaSemana: VentasUltimaSemana[];
  tendenciaVentas: TendenciaVentas[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/api/analytics`;

  constructor(private http: HttpClient) { }

  getVentasPorPeriodo(periodo: 'dia' | 'semana' | 'mes'): Observable<{success: boolean, data: VentasPorPeriodo[], periodo: string}> {
    return this.http.get<{success: boolean, data: VentasPorPeriodo[], periodo: string}>(`${this.apiUrl}/ventas/${periodo}`);
  }

  getProductosMasVendidos(limite: number = 10): Observable<{success: boolean, data: ProductoMasVendido[], limite: number}> {
    return this.http.get<{success: boolean, data: ProductoMasVendido[], limite: number}>(`${this.apiUrl}/productos-mas-vendidos?limite=${limite}`);
  }

  getClientesMasFrecuentes(limite: number = 10): Observable<{success: boolean, data: ClienteMasFrecuente[], limite: number}> {
    return this.http.get<{success: boolean, data: ClienteMasFrecuente[], limite: number}>(`${this.apiUrl}/clientes-mas-frecuentes?limite=${limite}`);
  }

  getIngresosTotales(): Observable<{success: boolean, data: IngresosTotales}> {
    return this.http.get<{success: boolean, data: IngresosTotales}>(`${this.apiUrl}/ingresos-totales`);
  }

  getEstadoPedidos(): Observable<{success: boolean, data: EstadoPedido[]}> {
    return this.http.get<{success: boolean, data: EstadoPedido[]}>(`${this.apiUrl}/estado-pedidos`);
  }

  getVentasPorHora(): Observable<{success: boolean, data: VentasPorHora[]}> {
    return this.http.get<{success: boolean, data: VentasPorHora[]}>(`${this.apiUrl}/ventas-por-hora`);
  }

  getTendenciaVentas(): Observable<{success: boolean, data: TendenciaVentas[]}> {
    return this.http.get<{success: boolean, data: TendenciaVentas[]}>(`${this.apiUrl}/tendencia-ventas`);
  }

  getDashboard(): Observable<{success: boolean, data: DashboardData}> {
    return this.http.get<{success: boolean, data: DashboardData}>(`${this.apiUrl}/dashboard`);
  }

  getVentasUltimaSemana(): Observable<{success: boolean, data: VentasUltimaSemana[]}> {
    return this.http.get<{success: boolean, data: VentasUltimaSemana[]}>(`${this.apiUrl}/ventas-ultima-semana`);
  }

  getPedidosPorCliente(filtros: FiltrosPedidos): Observable<{success: boolean, data: PedidoDetallado[], filtros: FiltrosPedidos}> {
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key as keyof FiltrosPedidos] !== undefined && filtros[key as keyof FiltrosPedidos] !== '') {
        params.append(key, filtros[key as keyof FiltrosPedidos]!.toString());
      }
    });
    
    return this.http.get<{success: boolean, data: PedidoDetallado[], filtros: FiltrosPedidos}>(`${this.apiUrl}/pedidos-por-cliente?${params.toString()}`);
  }

  getClientesUnicos(): Observable<{success: boolean, data: string[]}> {
    return this.http.get<{success: boolean, data: string[]}>(`${this.apiUrl}/clientes-unicos`);
  }
}
