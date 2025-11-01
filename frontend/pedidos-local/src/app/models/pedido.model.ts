export interface DetallePedidoCompleto {
  id: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  subtotal: number;
  estado: string;
  producto_nombre?: string;
  producto_precio?: number;
}

export interface Pedido {
  id?: number;
  cliente: string;
  mesa?: string;
  estado: string;
  total: number;
  fecha?: string;
  codigo_publico?: string;
  productos?: string; // String formateado para compatibilidad
  detalles?: DetallePedidoCompleto[]; // Detalles con estados individuales
}

export interface DetallePedido {
  id: number;
  cantidad: number;
  subtotal: number;
}

export interface ProductoPedido {
  id: number;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface PedidoRequest {
  cliente: string;
  mesa?: string;
  productos: ProductoPedido[];
}

export interface PedidoResponse {
  success: boolean;
  data: Pedido[];
  count: number;
}

export interface PedidoSingleResponse {
  success: boolean;
  data: Pedido;
}

export interface SeguimientoResponse {
  success: boolean;
  data: {
    codigo_publico: string;
    estado: string;
    total: number;
    fecha: string;
    cliente: string;
    mesa: string;
    productos: string;
    cantidades: string;
    nombres_productos: string;
  };
}

export interface PedidoAgrupado {
  codigo_publico: string;
  cliente: string;
  cantidad_pedidos: number;
  fecha_ultimo_pedido: string;
  ids_pedidos: number[];
  total_grupo: number;
  estados: string[];
}

export interface PedidosAgrupadosResponse {
  success: boolean;
  data: PedidoAgrupado[];
  count: number;
}

export interface PedidosGrupoResponse {
  success: boolean;
  data: Pedido[];
  count: number;
}




