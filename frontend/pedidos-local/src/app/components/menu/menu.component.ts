import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  productos: Producto[] = [];
  cargando: boolean = false;
  categoriaFiltro: string = '';
  busqueda: string = '';
  categorias: string[] = [];
  mostrarImagenModal: boolean = false;
  imagenSeleccionadaUrl: string = '';
  private endPressHandler = () => this.ocultarImagen();

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productoService.getProductos().subscribe({
      next: (resp) => {
        this.productos = resp.data || [];
        const set = new Set<string>();
        this.productos.forEach(p => { if (p.categoria) set.add(p.categoria); });
        this.categorias = Array.from(set).sort();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.cargando = false;
      }
    });
  }

  filtrar(): Producto[] {
    let list = this.productos;
    if (this.categoriaFiltro) list = list.filter(p => p.categoria === this.categoriaFiltro);
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      list = list.filter(p => p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q));
    }
    return list;
  }

  categoriasAgrupadas(): { categoria: string; productos: Producto[] }[] {
    const map = new Map<string, Producto[]>();
    for (const p of this.filtrar()) {
      const cat = p.categoria || 'Sin categoría';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([categoria, productos]) => ({ categoria, productos }));
  }

  getImagenUrl(imagen?: string): string {
    if (!imagen) return '';
    if (imagen.startsWith('http') || imagen.startsWith('data:')) return imagen;
    const base = (environment.apiUrl || '').replace(/\/$/, '');
    const normalized = imagen.startsWith('/')
      ? imagen
      : (imagen.includes('/uploads/') ? `/${imagen}` : `/uploads/products/${imagen}`);
    return `${base}${normalized}`;
  }

  verImagen(imagen?: string): void {
    const url = this.getImagenUrl(imagen);
    if (!url) return;
    this.imagenSeleccionadaUrl = url;
    this.mostrarImagenModal = true;
  }

  ocultarImagen(): void {
    this.mostrarImagenModal = false;
    this.imagenSeleccionadaUrl = '';
  }

  onPressStart(imagen?: string): void {
    this.verImagen(imagen);
    window.addEventListener('mouseup', this.endPressHandler, { once: true } as any);
    window.addEventListener('blur', this.endPressHandler, { once: true } as any);
  }

  onPressEnd(): void {
    this.ocultarImagen();
    window.removeEventListener('mouseup', this.endPressHandler);
    window.removeEventListener('blur', this.endPressHandler);
  }
}


