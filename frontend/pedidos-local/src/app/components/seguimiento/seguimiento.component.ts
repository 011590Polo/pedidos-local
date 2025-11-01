import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { SocketService } from '../../services/socket.service';
import { SeguimientoResponse } from '../../models/pedido.model';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguimiento.component.html',
  styleUrls: ['./seguimiento.component.css']
})
export class SeguimientoComponent implements OnInit, OnDestroy {
  codigo: string = '';
  cargando: boolean = false;
  pedido: SeguimientoResponse['data'] | null = null;
  error: string = '';
  private pedidoActualizadoHandler: ((p: any) => void) | null = null;

  constructor(
    private pedidoService: PedidoService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Leer el código desde los query params
    this.route.queryParams.subscribe(params => {
      const codigoParam = params['codigo'];
      if (codigoParam && codigoParam.trim()) {
        this.codigo = codigoParam.trim().toUpperCase();
        // Buscar automáticamente el pedido
        this.buscarPedido();
      }
    });
  }

  buscarPedido(): void {
    if (!this.codigo.trim()) {
      this.error = 'Por favor ingresa un código de seguimiento';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.pedido = null;

    this.pedidoService.getPedidoByCodigo(this.codigo.trim().toUpperCase()).subscribe({
      next: (response) => {
        this.pedido = response.data;
        this.cargando = false;

        // Unirse a la sala de seguimiento para este código y suscribirse a actualizaciones
        const codigo = (this.pedido as any)?.codigo_publico;
        if (codigo) {
          try {
            this.socketService.joinSeguimiento(codigo);
          } catch (e) { /* ignore */ }

          // Registrar handler para actualizaciones
          this.pedidoActualizadoHandler = (payload: any) => {
            if (!this.pedido) return;
            if (payload.estado !== undefined) this.pedido.estado = payload.estado;
            if (payload.total !== undefined) this.pedido.total = payload.total;
            if (payload.fecha !== undefined) this.pedido.fecha = payload.fecha;
          };

          this.socketService.on('pedidoActualizado', this.pedidoActualizadoHandler);
        }
      },
      error: (error) => {
        console.error('Error al buscar pedido:', error);
        this.error = 'No se encontró un pedido con ese código';
        this.cargando = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.codigo = '';
    this.pedido = null;
    this.error = '';
    // Salir de la sala y limpiar handler
    try {
      const codigo = (this.pedido as any)?.codigo_publico;
      if (codigo) this.socketService.leaveSeguimiento(codigo);
    } catch (e) {}

    if (this.pedidoActualizadoHandler) {
      try { this.socketService.off('pedidoActualizado', this.pedidoActualizadoHandler); } catch (e) {}
      this.pedidoActualizadoHandler = null;
    }
  }

  ngOnDestroy(): void {
    // Cleanup: leave room and remove handler
    try {
      const codigo = (this.pedido as any)?.codigo_publico;
      if (codigo) this.socketService.leaveSeguimiento(codigo);
    } catch (e) {}

    if (this.pedidoActualizadoHandler) {
      try { this.socketService.off('pedidoActualizado', this.pedidoActualizadoHandler); } catch (e) {}
      this.pedidoActualizadoHandler = null;
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'En preparación': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Listo': return 'bg-green-100 text-green-800 border-green-200';
      case 'Entregado': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'Pendiente': return '⏳';
      case 'En preparación': return '👨‍🍳';
      case 'Listo': return '✅';
      case 'Entregado': return '🎉';
      case 'Cancelado': return '❌';
      default: return '❓';
    }
  }

  getEstadoMensaje(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'Tu pedido está en cola, será preparado pronto';
      case 'En preparación': return 'Tu pedido está siendo preparado por nuestros chefs';
      case 'Listo': return '¡Tu pedido está listo! Puedes recogerlo';
      case 'Entregado': return '¡Gracias! Tu pedido ha sido entregado';
      case 'Cancelado': return 'Tu pedido ha sido cancelado';
      default: return 'Estado desconocido';
    }
  }

  formatearFecha(fecha: string): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}