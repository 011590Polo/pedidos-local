export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  categoria: string;
  imagen?: string;
  descripcion?: string;
  activo?: number;
}

export interface ProductoResponse {
  success: boolean;
  data: Producto[];
  count: number;
}

export interface ProductoSingleResponse {
  success: boolean;
  data: Producto;
}




