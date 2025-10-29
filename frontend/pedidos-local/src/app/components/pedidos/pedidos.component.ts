import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { SocketService } from '../../services/socket.service';
import { PedidoService } from '../../services/pedido.service';
import { Producto } from '../../models/producto.model';
import { Pedido, PedidoRequest, ProductoPedido } from '../../models/pedido.model';

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
  carrito: ProductoPedido[] = [];
  cargando: boolean = false;
  mostrarFormulario: boolean = false;
  codigoGenerado: string = '';

  // Formulario de pedido
  nuevoPedido: PedidoRequest = {
    cliente: '',
    mesa: '',
    productos: []
  };

  estados = ['Pendiente', 'En preparación', 'Listo', 'Entregado', 'Cancelado'];
  private productoCreadoHandler: ((p: any) => void) | null = null;
  private pedidoCreadoHandler: ((p: any) => void) | null = null;

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

  cargarPedidos(): void {
    this.cargando = true;
    this.pedidoService.getPedidos().subscribe({
      next: (response) => {
        this.pedidos = response.data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar pedidos:', error);
        this.cargando = false;
      }
    });
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
        this.cargarPedidos();
      },
      error: (error) => {
        console.error('Error al actualizar estado:', error);
        alert('Error al actualizar el estado del pedido');
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
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'En preparación': return 'bg-blue-100 text-blue-800';
      case 'Listo': return 'bg-green-100 text-green-800';
      case 'Entregado': return 'bg-gray-100 text-gray-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }


}