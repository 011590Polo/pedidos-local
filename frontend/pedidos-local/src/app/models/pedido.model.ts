export interface Pedido {
  id?: number;
  cliente: string;
  mesa?: string;
  estado: string;
  total: number;
  fecha?: string;
  codigo_publico?: string;
  productos?: string;
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



