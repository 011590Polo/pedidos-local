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

  createProducto(producto: Producto): Observable<ProductoSingleResponse> {
    return this.http.post<ProductoSingleResponse>(this.apiUrl, producto);
  }

  updateProducto(id: number, producto: Producto): Observable<ProductoSingleResponse> {
    return this.http.put<ProductoSingleResponse>(`${this.apiUrl}/${id}`, producto);
  }

  deleteProducto(id: number): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/${id}`);
  }
}
