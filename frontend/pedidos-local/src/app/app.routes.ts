import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/pedidos', pathMatch: 'full' },
  { path: 'productos', loadComponent: () => import('./components/productos/productos.component').then(m => m.ProductosComponent) },
  { path: 'pedidos', loadComponent: () => import('./components/pedidos/pedidos.component').then(m => m.PedidosComponent) },
  { path: 'seguimiento', loadComponent: () => import('./components/seguimiento/seguimiento.component').then(m => m.SeguimientoComponent) },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: '**', redirectTo: '/pedidos' }
];
