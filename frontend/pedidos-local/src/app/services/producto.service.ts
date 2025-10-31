import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoResponse, ProductoSingleResponse } from '../models/producto.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Usar backend local en desarrollo
  private apiUrl = `${environment.apiUrl}/api/productos`;

  constructor(private http: HttpClient) { }

  getProductos(): Observable<ProductoResponse> {
    return this.http.get<ProductoResponse>(this.apiUrl);
  }

  getProducto(id: number): Observable<ProductoSingleResponse> {
    return this.http.get<ProductoSingleResponse>(`${this.apiUrl}/${id}`);
  }

  createProducto(producto: Producto, imagenFile?: File): Observable<ProductoSingleResponse> {
    // Si hay archivo, usar FormData; si no, enviar JSON normal
    if (imagenFile) {
      const form = new FormData();
      form.append('nombre', producto.nombre);
      form.append('precio', String(producto.precio));
      if (producto.categoria) form.append('categoria', producto.categoria);
      if (producto.descripcion) form.append('descripcion', producto.descripcion);
      form.append('imagen', imagenFile);
      return this.http.post<ProductoSingleResponse>(this.apiUrl, form);
    }
    return this.http.post<ProductoSingleResponse>(this.apiUrl, producto);
  }

  updateProducto(id: number, producto: Producto, imagenFile?: File): Observable<ProductoSingleResponse> {
    if (imagenFile) {
      const form = new FormData();
      if (producto.nombre) form.append('nombre', producto.nombre);
      if (producto.precio !== undefined) form.append('precio', String(producto.precio));
      if (producto.categoria !== undefined) form.append('categoria', producto.categoria || '');
      if (producto.descripcion !== undefined) form.append('descripcion', producto.descripcion || '');
      form.append('imagen', imagenFile);
      return this.http.put<ProductoSingleResponse>(`${this.apiUrl}/${id}`, form);
    }
    return this.http.put<ProductoSingleResponse>(`${this.apiUrl}/${id}`, producto);
  }

  deleteProducto(id: number): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/${id}`);
  }
}

