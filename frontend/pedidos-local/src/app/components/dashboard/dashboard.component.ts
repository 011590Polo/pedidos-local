import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, DashboardData, PedidoDetallado, FiltrosPedidos, VentasUltimaSemana } from '../../services/analytics.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  dashboardData: DashboardData | null = null;
  cargando: boolean = true;
  error: string | null = null;
  
  // Propiedades para filtro de pedidos por cliente
  mostrarFiltroPedidos: boolean = false;
  pedidosFiltrados: PedidoDetallado[] = [];
  clientesUnicos: string[] = [];
  filtros: FiltrosPedidos = {
    cliente: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    totalMin: undefined,
    totalMax: undefined,
    limite: 50
  };
  estados = ['Pendiente', 'En preparación', 'Listo', 'Entregado', 'Cancelado'];

  constructor(private analyticsService: AnalyticsService) { }

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.cargando = true;
    this.error = null;
    
    this.analyticsService.getDashboard().subscribe({
      next: (response) => {
        this.dashboardData = response.data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar dashboard:', error);
        this.error = 'Error al cargar los datos del dashboard';
        this.cargando = false;
      }
    });
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO');
  }

  formatearHora(hora: number): string {
    return `${hora.toString().padStart(2, '0')}:00`;
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'En preparación': return 'bg-blue-100 text-blue-800';
      case 'Listo': return 'bg-green-100 text-green-800';
      case 'Entregado': return 'bg-gray-100 text-gray-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  calcularPorcentaje(valor: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  }

  recargar(): void {
    this.cargarDashboard();
  }

  // Métodos para filtro de pedidos por cliente
  toggleFiltroPedidos(): void {
    this.mostrarFiltroPedidos = !this.mostrarFiltroPedidos;
    if (this.mostrarFiltroPedidos && this.clientesUnicos.length === 0) {
      this.cargarClientesUnicos();
    }
  }

  cargarClientesUnicos(): void {
    this.analyticsService.getClientesUnicos().subscribe({
      next: (response) => {
        this.clientesUnicos = response.data;
      },
      error: (error) => {
        console.error('Error al cargar clientes únicos:', error);
      }
    });
  }

  buscarPedidos(): void {
    this.cargando = true;
    this.analyticsService.getPedidosPorCliente(this.filtros).subscribe({
      next: (response) => {
        this.pedidosFiltrados = response.data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar pedidos:', error);
        this.error = 'Error al buscar pedidos';
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      cliente: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: '',
      totalMin: undefined,
      totalMax: undefined,
      limite: 50
    };
    this.pedidosFiltrados = [];
  }

  formatearFechaCompleta(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO');
  }

  parsearProductos(productosDetalle: string): string[] {
    return productosDetalle ? productosDetalle.split(', ') : [];
  }

  parsearCantidades(cantidades: string): number[] {
    return cantidades ? cantidades.split(',').map(c => parseInt(c.trim())) : [];
  }

  parsearNombres(nombres: string): string[] {
    return nombres ? nombres.split(',') : [];
  }

  parsearSubtotales(subtotales: string): number[] {
    return subtotales ? subtotales.split(',').map(s => parseFloat(s.trim())) : [];
  }

  // Métodos para calcular totales de la semana
  getTotalPedidosSemana(): number {
    if (!this.dashboardData?.ventasUltimaSemana) return 0;
    return this.dashboardData.ventasUltimaSemana.reduce((total, venta) => total + venta.pedidos, 0);
  }

  getTotalVentasSemana(): number {
    if (!this.dashboardData?.ventasUltimaSemana) return 0;
    return this.dashboardData.ventasUltimaSemana.reduce((total, venta) => total + venta.ventas, 0);
  }

  getPromedioDiarioSemana(): number {
    if (!this.dashboardData?.ventasUltimaSemana) return 0;
    const totalVentas = this.getTotalVentasSemana();
    return totalVentas / 7;
  }
}
