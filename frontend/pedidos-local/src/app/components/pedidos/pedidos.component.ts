import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { SocketService } from '../../services/socket.service';
import { PedidoService } from '../../services/pedido.service';
import { Producto } from '../../models/producto.model';
import { environment } from '../../../environments/environment';
import { Pedido, PedidoRequest, ProductoPedido, PedidoAgrupado } from '../../models/pedido.model';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  pedidos: Pedido[] = [];
  pedidosAgrupados: PedidoAgrupado[] = [];
  carrito: ProductoPedido[] = [];
  cargando: boolean = false;
  mostrarFormulario: boolean = false;
  codigoGenerado: string = '';
  mostrarImagenModal: boolean = false;
  imagenSeleccionadaUrl: string = '';
  mostrarModalGrupo: boolean = false;
  pedidosGrupoActual: Pedido[] = [];
  grupoActual: PedidoAgrupado | null = null;
  cargandoGrupo: boolean = false;
  private endPressHandler = () => this.onPressEnd();

  // Formulario de pedido
  nuevoPedido: PedidoRequest = {
    cliente: '',
    mesa: '',
    productos: []
  };

  estados = ['Pendiente', 'En preparación', 'Listo', 'Entregado', 'Cancelado'];
  private productoCreadoHandler: ((p: any) => void) | null = null;
  private pedidoCreadoHandler: ((p: any) => void) | null = null;
  private pedidoActualizadoHandler: ((p: any) => void) | null = null;
  private detallePedidoActualizadoHandler: ((p: any) => void) | null = null;

  constructor(
    private productoService: ProductoService,
    private pedidoService: PedidoService
    ,
    private socketService: SocketService
  ) { }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarPedidos();

    // Verificar conexión Socket.IO
    console.log('🔍 Verificando conexión Socket.IO...');
    console.log('🔌 Socket conectado:', this.socketService.isConnected());

    // Suscribirse a eventos de productos creados para actualizar la vista en tiempo real
    this.productoCreadoHandler = (producto: any) => {
      console.log('📦 Evento productoCreado recibido:', producto);
      // evitar duplicados (si ya existe con mismo id)
      const exists = this.productos.some(p => p.id === producto.id);
      if (!exists) {
        this.productos.push(producto);
        console.log('✅ Producto agregado a la lista');
      }
    };

    this.socketService.on('productoCreado', this.productoCreadoHandler);

    // Suscribirse a eventos de pedidos creados para actualizar la lista de pedidos en tiempo real
    this.pedidoCreadoHandler = (pedido: any) => {
      debugger;
      console.log('🎉 Evento pedidoCreado recibido en el componente:', pedido);
      
      // Normalizar el objeto del evento para que coincida con el formato de cargarPedidos()
      const pedidoNormalizado = pedido;
      
      // Verificar si es un pedido reutilizado (agregado a pedido existente)
      if (pedido.reutilizado) {
        console.log('🔄 Pedido reutilizado detectado, actualizando pedido existente...');
        
        // Buscar el pedido existente por ID
        const pedidoExistenteIndex = this.pedidos.findIndex(p => p.id === pedido.id);
        
        if (pedidoExistenteIndex !== -1) {
          // Actualizar el pedido existente con los nuevos datos normalizados
          this.pedidos[pedidoExistenteIndex] = {
            ...this.pedidos[pedidoExistenteIndex],
            total: pedido.total_actualizado || pedido.total,
            productos: pedidoNormalizado.productos
          };
          console.log('✅ Pedido existente actualizado con nuevo total:', pedido.total_actualizado || pedido.total);
        } else {
          // Si no existe en la lista, agregarlo normalizado
          this.pedidos.unshift(pedidoNormalizado);
          console.log('✅ Pedido reutilizado agregado a la lista (no estaba cargado)');
        }
      } else {
        // Pedido nuevo normal
        const exists = this.pedidos.some(p => p.id === pedido.id);
        if (!exists) {
          // insertar al inicio (recientes primero) normalizado
          this.pedidos.unshift(pedidoNormalizado);
          console.log('✅ Pedido nuevo agregado a la lista. Total pedidos:', this.pedidos.length);
        } else {
          console.log('⚠️ Pedido ya existe en la lista, no se agregará');
        }
      }
    };
    this.socketService.on('pedidoCreado', this.pedidoCreadoHandler);
    
    // Recargar pedidos agrupados cuando se crea un nuevo pedido
    this.socketService.on('pedidoCreado', () => {
      this.cargarPedidosAgrupados();
    });

    // Suscripción a actualizaciones de pedidos (cambio de estado)
    this.pedidoActualizadoHandler = (payload: any) => {
      // Actualizar pedido en la lista de pedidos individuales si existe
      const prioridad: Record<string, number> = {
        'Pendiente': 1,
        'En preparación': 2,
        'Listo': 3,
        'Entregado': 4,
        'Cancelado': 5
      };
      const idx = this.pedidos.findIndex(p => p.id === payload.id);
      if (idx !== -1) {
        this.pedidos[idx] = {
          ...this.pedidos[idx],
          estado: payload.estado ?? this.pedidos[idx].estado,
          total: payload.total ?? this.pedidos[idx].total,
          fecha: payload.fecha ?? this.pedidos[idx].fecha
        } as any;
      }
      
      // Actualizar pedido en el modal si está abierto
      if (this.mostrarModalGrupo && this.pedidosGrupoActual.length > 0) {
        const idxModal = this.pedidosGrupoActual.findIndex(p => p.id === payload.id);
        if (idxModal !== -1) {
          this.pedidosGrupoActual[idxModal] = {
            ...this.pedidosGrupoActual[idxModal],
            estado: payload.estado ?? this.pedidosGrupoActual[idxModal].estado,
            total: payload.total ?? this.pedidosGrupoActual[idxModal].total,
            fecha: payload.fecha ?? this.pedidosGrupoActual[idxModal].fecha
          };
          // Recargar el grupo para actualizar estados
          if (this.grupoActual) {
            this.verPedidosGrupo(this.grupoActual);
          }
        }
      }
      
      // Recargar pedidos agrupados para reflejar cambios
      this.cargarPedidosAgrupados();
    };
    this.socketService.on('pedidoActualizado', this.pedidoActualizadoHandler);

    // Suscripción a actualizaciones de detalles de pedidos
    this.detallePedidoActualizadoHandler = (payload: any) => {
      const idx = this.pedidos.findIndex(p => p.id === payload.id_pedido);
      if (idx !== -1) {
        const pedido = this.pedidos[idx];
        if (pedido.detalles && payload.detalles) {
          pedido.detalles = payload.detalles;
        } else if (payload.id_detalle) {
          // Actualizar solo el detalle específico
          if (!pedido.detalles) pedido.detalles = [];
          const detIdx = pedido.detalles.findIndex((d: any) => d.id === payload.id_detalle);
          if (detIdx !== -1) {
            pedido.detalles[detIdx].estado = payload.nuevo_estado;
          }
        }
        // Reordenar por prioridad
        this.ordenarPedidos();
      }
    };
    this.socketService.on('detallePedidoActualizado', this.detallePedidoActualizadoHandler);

    // Verificar conexión después de un tiempo
    setTimeout(() => {
      console.log('🔍 Verificación tardía de Socket.IO:', this.socketService.isConnected());
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.productoCreadoHandler) {
      this.socketService.off('productoCreado', this.productoCreadoHandler);
    }
    if (this.pedidoCreadoHandler) {
      this.socketService.off('pedidoCreado', this.pedidoCreadoHandler);
    }
    if (this.pedidoActualizadoHandler) {
      this.socketService.off('pedidoActualizado', this.pedidoActualizadoHandler);
    }
    if (this.detallePedidoActualizadoHandler) {
      this.socketService.off('detallePedidoActualizado', this.detallePedidoActualizadoHandler);
    }
  }

  ordenarPedidos(): void {
    const prioridad: Record<string, number> = {
      'Pendiente': 1,
      'En preparación': 2,
      'Listo': 3,
      'Entregado': 4,
      'Cancelado': 5
    };
    this.pedidos = [...this.pedidos].sort((a: any, b: any) => {
      const pa = prioridad[a?.estado] ?? 99;
      const pb = prioridad[b?.estado] ?? 99;
      if (pa !== pb) return pa - pb;
      const ta = a?.fecha ? new Date(a.fecha).getTime() : 0;
      const tb = b?.fecha ? new Date(b.fecha).getTime() : 0;
      return tb - ta;
    });
  }

  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (response) => {
        this.productos = response.data;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  getImagenUrl(imagen?: string): string {
    if (!imagen) return '';
    if (imagen.startsWith('http') || imagen.startsWith('data:')) return imagen;
    const base = (environment.apiUrl || '').replace(/\/$/, '');
    // Normalizar rutas guardadas antiguas que solo tienen el nombre del archivo
    const normalized = imagen.startsWith('/')
      ? imagen
      : (imagen.includes('/uploads/') ? `/${imagen}` : `/uploads/products/${imagen}`);
    return `${base}${normalized}`;
  }

  verImagen(imagen?: string): void {
    const url = this.getImagenUrl(imagen);
    if (!url) return;
    this.imagenSeleccionadaUrl = url;
    this.mostrarImagenModal = true;
  }

  ocultarImagen(): void {
    this.mostrarImagenModal = false;
    this.imagenSeleccionadaUrl = '';
  }

  onPressStart(imagen?: string): void {
    this.verImagen(imagen);
    window.addEventListener('mouseup', this.endPressHandler, { once: true } as any);
    window.addEventListener('blur', this.endPressHandler, { once: true } as any);
  }

  onPressEnd(): void {
    this.ocultarImagen();
    window.removeEventListener('mouseup', this.endPressHandler);
    window.removeEventListener('blur', this.endPressHandler);
  }

  cargarPedidos(): void {
    // Mantener para compatibilidad con funcionalidad existente
    this.cargarPedidosAgrupados();
  }

  cargarPedidosAgrupados(): void {
    this.cargando = true;
    this.pedidoService.getPedidosAgrupados().subscribe({
      next: (response) => {
        this.pedidosAgrupados = response.data || [];
        // Ordenar por fecha del último pedido (más nuevos primero)
        this.pedidosAgrupados.sort((a, b) => {
          const fechaA = new Date(a.fecha_ultimo_pedido).getTime();
          const fechaB = new Date(b.fecha_ultimo_pedido).getTime();
          return fechaB - fechaA;
        });
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar pedidos agrupados:', error);
        this.cargando = false;
      }
    });
  }

  verPedidosGrupo(grupo: PedidoAgrupado): void {
    this.grupoActual = grupo;
    this.mostrarModalGrupo = true;
    this.cargandoGrupo = true;
    this.pedidoService.getPedidosPorGrupo(grupo.codigo_publico).subscribe({
      next: (response) => {
        this.pedidosGrupoActual = response.data || [];
        // Ordenar por fecha descendente (más nuevos primero)
        this.pedidosGrupoActual.sort((a, b) => {
          const fechaA = new Date(a.fecha || 0).getTime();
          const fechaB = new Date(b.fecha || 0).getTime();
          return fechaB - fechaA;
        });
        this.cargandoGrupo = false;
      },
      error: (error) => {
        console.error('Error al cargar pedidos del grupo:', error);
        this.cargandoGrupo = false;
      }
    });
  }

  cerrarModalGrupo(): void {
    this.mostrarModalGrupo = false;
    this.pedidosGrupoActual = [];
    this.grupoActual = null;
  }

  getEstadoGeneralGrupo(estados: string[]): string {
    if (!estados || estados.length === 0) return 'Pendiente';
    // Si hay algún pendiente o en preparación, mostrar el más prioritario
    const prioridad: Record<string, number> = {
      'Pendiente': 1,
      'En preparación': 2,
      'Listo': 3,
      'Entregado': 4,
      'Cancelado': 5
    };
    const estadosOrdenados = estados.sort((a, b) => {
      return (prioridad[a] || 99) - (prioridad[b] || 99);
    });
    return estadosOrdenados[0];
  }

  tienePedidosPendientes(estados: string[]): boolean {
    return estados && estados.some(e => e === 'Pendiente' || e === 'En preparación');
  }

  agregarAlCarrito(producto: Producto): void {
    const itemExistente = this.carrito.find(item => item.id === producto.id);
    
    if (itemExistente) {
      itemExistente.cantidad += 1;
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio;
    } else {
      const nuevoItem: ProductoPedido = {
        id: producto.id!,
        cantidad: 1,
        precio: producto.precio,
        subtotal: producto.precio
      };
      this.carrito.push(nuevoItem);
    }
  }

  quitarDelCarrito(id: number): void {
    const index = this.carrito.findIndex(item => item.id === id);
    if (index > -1) {
      this.carrito.splice(index, 1);
    }
  }

  actualizarCantidad(id: number, cantidad: number): void {
    const item = this.carrito.find(item => item.id === id);
    if (item) {
      if (cantidad <= 0) {
        this.quitarDelCarrito(id);
      } else {
        item.cantidad = cantidad;
        item.subtotal = item.cantidad * item.precio;
      }
    }
  }

  getTotalCarrito(): number {
    return this.carrito.reduce((total, item) => total + item.subtotal, 0);
  }

  abrirFormularioPedido(): void {
    if (this.carrito.length === 0) {
      alert('Agrega productos al carrito antes de crear un pedido');
      return;
    }
    this.mostrarFormulario = true;
    this.nuevoPedido = {
      cliente: '',
      mesa: '',
      productos: [...this.carrito]
    };
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.nuevoPedido = {
      cliente: '',
      mesa: '',
      productos: []
    };
    this.codigoGenerado = '';
  }

  crearPedido(): void {
    if (!this.nuevoPedido.cliente.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    this.cargando = true;
    this.pedidoService.createPedido(this.nuevoPedido).subscribe({
      next: (response) => {
        this.codigoGenerado = response.data.codigo_publico!;
        this.carrito = [];
        this.cargarPedidos();
        this.cargando = false;
        this.mostrarFormulario = false;
      },
      error: (error) => {
        console.error('Error al crear pedido:', error);
        alert('Error al crear el pedido');
        this.cargando = false;
      }
    });
  }

  actualizarEstadoPedido(id: number, nuevoEstado: string): void {
    this.pedidoService.updatePedido(id, { estado: nuevoEstado }).subscribe({
      next: () => {
        // Si el modal está abierto, recargar el grupo actual
        if (this.mostrarModalGrupo && this.grupoActual) {
          this.verPedidosGrupo(this.grupoActual);
        }
        // Recargar pedidos agrupados
        this.cargarPedidosAgrupados();
      },
      error: (error) => {
        console.error('Error al actualizar estado:', error);
        alert('Error al actualizar el estado del pedido');
      }
    });
  }

  actualizarEstadoDetalle(idPedido: number, idDetalle: number, nuevoEstado: string): void {
    this.pedidoService.updateEstadoDetalle(idPedido, idDetalle, nuevoEstado).subscribe({
      next: (response) => {
        // Actualizar localmente
        const pedido = this.pedidos.find(p => p.id === idPedido);
        if (pedido && pedido.detalles) {
          const detalle = pedido.detalles.find((d: any) => d.id === idDetalle);
          if (detalle) {
            detalle.estado = nuevoEstado;
          }
          // También actualizar con los detalles completos si vienen en la respuesta
          if (response.data && response.data.detalles) {
            pedido.detalles = response.data.detalles;
          }
        }
        
        // Si el modal está abierto, recargar el grupo actual
        if (this.mostrarModalGrupo && this.grupoActual) {
          // Actualizar en el modal
          const pedidoModal = this.pedidosGrupoActual.find(p => p.id === idPedido);
          if (pedidoModal && response.data && response.data.detalles) {
            pedidoModal.detalles = response.data.detalles;
          }
          // Recargar el grupo para reflejar cambios en estados agregados
          this.verPedidosGrupo(this.grupoActual);
        }
        
        this.ordenarPedidos();
        // Recargar pedidos agrupados
        this.cargarPedidosAgrupados();
      },
      error: (error) => {
        console.error('Error al actualizar estado del detalle:', error);
        alert('Error al actualizar el estado del detalle');
      }
    });
  }

  eliminarPedido(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      this.pedidoService.deletePedido(id).subscribe({
        next: () => {
          this.cargarPedidos();
        },
        error: (error) => {
          console.error('Error al eliminar pedido:', error);
          alert('Error al eliminar el pedido');
        }
      });
    }
  }

  limpiarCarrito(): void {
    this.carrito = [];
  }

  getProductoNombre(id: number): string {
    const producto = this.productos.find(p => p.id === id);
    return producto ? producto.nombre : 'Producto no encontrado';
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 animate-blink';
      case 'En preparación': return 'bg-blue-100 text-blue-800 animate-blink';
      case 'Listo': return 'bg-green-100 text-green-800';
      case 'Entregado': return 'bg-gray-100 text-gray-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getDetallesFormateados(pedido: any): Array<{id?: number, nombre: string, cantidad: number, estado: string}> {
    if (pedido.detalles && pedido.detalles.length > 0) {
      return pedido.detalles.map((d: any) => ({
        id: d.id,
        nombre: d.producto_nombre || this.getProductoNombre(d.id_producto),
        cantidad: d.cantidad,
        estado: d.estado || 'Pendiente'
      }));
    }
    // Fallback al formato string si no hay detalles
    if (pedido.productos) {
      const productos = pedido.productos.split(', ').map((p: string) => {
        const match = p.match(/^(\d+)x (.+)$/);
        return match ? {
          nombre: match[2],
          cantidad: parseInt(match[1]),
          estado: 'Pendiente' // Estado por defecto si no hay detalles
        } : { nombre: p, cantidad: 1, estado: 'Pendiente' };
      });
      return productos;
    }
    return [];
  }

}