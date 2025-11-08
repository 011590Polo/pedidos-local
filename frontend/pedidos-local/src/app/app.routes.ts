import { Routes } from '@angular/router';
import { adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/menu', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'productos',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/productos/productos.component').then(m => m.ProductosComponent)
  },
  {
    path: 'pedidos',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/pedidos/pedidos.component').then(m => m.PedidosComponent)
  },
  {
    path: 'menu',
    loadComponent: () => import('./components/menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'seguimiento',
    loadComponent: () => import('./components/seguimiento/seguimiento.component').then(m => m.SeguimientoComponent)
  },
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { path: '**', redirectTo: '/menu' }
];
