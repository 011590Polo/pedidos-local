export interface Categoria {
  id?: number;
  nombre: string;
  activo?: number;
}

export interface CategoriaResponse {
  success: boolean;
  data: Categoria[];
  count: number;
}

export interface CategoriaSingleResponse {
  success: boolean;
  data: Categoria;
}


