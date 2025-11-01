import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria, CategoriaResponse, CategoriaSingleResponse } from '../models/categoria.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = `${environment.apiUrl}/api/categorias`;

  constructor(private http: HttpClient) {}

  getCategorias(): Observable<CategoriaResponse> {
    return this.http.get<CategoriaResponse>(this.apiUrl);
  }

  createCategoria(nombre: string): Observable<CategoriaSingleResponse> {
    return this.http.post<CategoriaSingleResponse>(this.apiUrl, { nombre });
  }
}


