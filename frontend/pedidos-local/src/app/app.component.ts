import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService, Usuario } from './services/auth.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'PedidosLocal';
  menuOpen = false;
  currentUser: Usuario | null = null;
  isLoginPage = false;
  private subscriptions = new Subscription();
  private autoLoginInProgress = false;
  private autoLoginDisabled = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Prevenir caché del navegador en desarrollo
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.update();
        });
      });
    }

    // Suscribirse a cambios de usuario
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.attemptClientAutoLogin();
        }
      })
    );

    // Detectar si estamos en la página de login
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.isLoginPage = this.router.url === '/login';
        if (!this.isLoginPage) {
          this.autoLoginDisabled = false;
        }
        this.attemptClientAutoLogin();
      })
    );

    // Verificar inicial
    this.isLoginPage = this.router.url === '/login';
    if (!this.isLoginPage) {
      this.autoLoginDisabled = false;
    }
    this.attemptClientAutoLogin();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  logout(): void {
    this.autoLoginDisabled = true;
    this.authService.logout().subscribe({
      next: () => {
        this.autoLoginInProgress = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.autoLoginInProgress = false;
        // Aun si hay error, redirigir al login
        this.router.navigate(['/login']);
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isCliente(): boolean {
    return this.authService.isCliente();
  }

  shouldShowNav(): boolean {
    return !this.isLoginPage && this.authService.isAuthenticated();
  }

  private attemptClientAutoLogin(): void {
    const currentUrl = this.router.url;
    if (this.autoLoginDisabled) {
      return;
    }
    if (this.isLoginPage || currentUrl === '/login') {
      return;
    }
    if (this.authService.isAuthenticated()) {
      return;
    }
    if (this.autoLoginInProgress) {
      return;
    }

    this.autoLoginInProgress = true;
    this.authService.login('cliente', 'cliente123').subscribe({
      next: (response) => {
        this.autoLoginInProgress = false;
        if (!response.success) {
          console.warn('Auto login de cliente no fue exitoso.');
        }
      },
      error: (err) => {
        this.autoLoginInProgress = false;
        console.error('Error durante el auto login de cliente:', err);
      }
    });
  }
}
