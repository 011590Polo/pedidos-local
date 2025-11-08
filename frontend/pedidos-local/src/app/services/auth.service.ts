import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Usuario {
  usuario: string;
  rol: 'admin' | 'cliente';
  id: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar sesión al inicializar
    this.checkSession();
  }

  // Login
  login(usuario: string, password: string): Observable<LoginResponse> {
    console.log('🔐 Intentando login:', { usuario, apiUrl: this.apiUrl });
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      usuario,
      password
    }).pipe(
      tap(response => {
        console.log('✅ Respuesta del login:', response);
        if (response.success && response.data) {
          this.currentUserSubject.next(response.data);
          localStorage.setItem('currentUser', JSON.stringify(response.data));
        }
      }),
      catchError(error => {
        console.error('❌ Error en login:', error);
        throw error;
      })
    );
  }

  // Logout
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        localStorage.removeItem('currentUser');
      })
    );
  }

  // Verificar sesión
  checkSession(): void {
    this.http.get<{success: boolean, data?: Usuario}>(`${this.apiUrl}/session`)
      .pipe(
        catchError(() => of({ success: false } as { success: boolean, data?: Usuario }))
      )
      .subscribe(response => {
        if (response.success && response.data) {
          const user = response.data;
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
          // Si no hay sesión, verificar localStorage como fallback
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              this.currentUserSubject.next(user);
            } catch (e) {
              localStorage.removeItem('currentUser');
              this.currentUserSubject.next(null);
            }
          } else {
            this.currentUserSubject.next(null);
          }
        }
      });
  }

  // Obtener usuario actual
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Verificar si es admin
  isAdmin(): boolean {
    return this.currentUserSubject.value?.rol === 'admin';
  }

  // Verificar si es cliente
  isCliente(): boolean {
    return this.currentUserSubject.value?.rol === 'cliente';
  }

  // Verificar si puede acceder a una ruta
  canAccessRoute(route: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    // Rutas de admin
    const adminRoutes = ['/pedidos', '/productos', '/dashboard'];
    // Rutas de cliente
    const clienteRoutes = ['/menu', '/seguimiento'];

    if (user.rol === 'admin') {
      return adminRoutes.some(r => route.startsWith(r)) || clienteRoutes.some(r => route.startsWith(r));
    } else if (user.rol === 'cliente') {
      return clienteRoutes.some(r => route.startsWith(r));
    }

    return false;
  }
}

