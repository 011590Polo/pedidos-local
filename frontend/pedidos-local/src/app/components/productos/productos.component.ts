import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { environment } from '../../../environments/environment';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  categorias: string[] = [];
  categoriaFiltro: string = '';
  busqueda: string = '';
  productoEditando: Producto | null = null;
  mostrarFormulario: boolean = false;
  cargando: boolean = false;
  nuevaCategoriaNombre: string = '';
  imagenFile: File | null = null;
  mostrarImagenModal: boolean = false;
  imagenSeleccionadaUrl: string = '';
  private endPressHandler = () => this.onPressEnd();

  // Formulario
  nuevoProducto: Producto = {
    nombre: '',
    precio: 0,
    categoria: '',
    imagen: '',
    descripcion: ''
  };

  constructor(private productoService: ProductoService, private categoriaService: CategoriaService) { }

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (response) => {
        const desdeBackend = (response.data || []).map(c => c.nombre).filter(Boolean);
        const set = new Set([...(this.categorias || []), ...desdeBackend]);
        this.categorias = Array.from(set).sort();
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        // Fallback: mantener las derivadas de los productos
        this.extraerCategorias();
      }
    });
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productoService.getProductos().subscribe({
      next: (response) => {
        this.productos = response.data;
        this.extraerCategorias();
        // Después de derivar desde productos, intenta fusionar con las del backend
        this.cargarCategorias();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.cargando = false;
      }
    });
  }

  extraerCategorias(): void {
    const categoriasUnicas = [...new Set(this.productos.map(p => p.categoria))];
    this.categorias = categoriasUnicas.filter(c => c);
  }

  filtrarProductos(): Producto[] {
    let productosFiltrados = this.productos;

    if (this.categoriaFiltro) {
      productosFiltrados = productosFiltrados.filter(p => p.categoria === this.categoriaFiltro);
    }

    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase();
      productosFiltrados = productosFiltrados.filter(p => 
        p.nombre.toLowerCase().includes(busquedaLower) ||
        p.descripcion?.toLowerCase().includes(busquedaLower)
      );
    }

    return productosFiltrados;
  }

  abrirFormulario(producto?: Producto): void {
    if (producto) {
      this.productoEditando = { ...producto };
      this.nuevoProducto = { ...producto };
      // Asegurar que la categoría actual esté en el combo
      if (this.nuevoProducto.categoria && !this.categorias.includes(this.nuevoProducto.categoria)) {
        this.categorias = [...this.categorias, this.nuevoProducto.categoria].sort();
      }
    } else {
      this.productoEditando = null;
      this.nuevoProducto = {
        nombre: '',
        precio: 0,
        categoria: '',
        imagen: '',
        descripcion: ''
      };
    }
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.productoEditando = null;
    this.nuevoProducto = {
      nombre: '',
      precio: 0,
      categoria: '',
      imagen: '',
      descripcion: ''
    };
    this.imagenFile = null;
  }

  crearCategoria(): void {
    const nombre = (this.nuevaCategoriaNombre || '').trim();
    if (!nombre) { return; }

    // Actualizar inmediatamente el combo para UX, luego confirmar con backend
    if (!this.categorias.includes(nombre)) {
      this.categorias = [...this.categorias, nombre].sort();
    }
    this.nuevoProducto.categoria = nombre;

    this.categoriaService.createCategoria(nombre).subscribe({
      next: () => {
        // Sin acción adicional; ya está en la lista
        this.nuevaCategoriaNombre = '';
      },
      error: (error) => {
        console.error('Error al crear categoría:', error);
        // Si falla, mantener la selección pero mostrar alerta mínima
        alert('No se pudo crear la categoría en el servidor');
      }
    });
  }

  guardarProducto(): void {
    if (!this.nuevoProducto.nombre || !this.nuevoProducto.precio) {
      alert('Nombre y precio son obligatorios');
      return;
    }

    if (this.productoEditando) {
      // Actualizar producto existente
      this.productoService.updateProducto(this.productoEditando.id!, this.nuevoProducto, this.imagenFile || undefined).subscribe({
        next: () => {
          this.cargarProductos();
          this.cerrarFormulario();
        },
        error: (error) => {
          console.error('Error al actualizar producto:', error);
          alert('Error al actualizar el producto');
        }
      });
    } else {
      // Crear nuevo producto
      this.productoService.createProducto(this.nuevoProducto, this.imagenFile || undefined).subscribe({
        next: () => {
          this.cargarProductos();
          this.cerrarFormulario();
        },
        error: (error) => {
          console.error('Error al crear producto:', error);
          alert('Error al crear el producto');
        }
      });
    }
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.imagenFile = file;
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
    // Cerrar cuando se suelte el mouse en cualquier parte o la ventana pierda foco
    window.addEventListener('mouseup', this.endPressHandler, { once: true } as any);
    window.addEventListener('blur', this.endPressHandler, { once: true } as any);
  }

  onPressEnd(): void {
    this.ocultarImagen();
    window.removeEventListener('mouseup', this.endPressHandler);
    window.removeEventListener('blur', this.endPressHandler);
  }

  eliminarProducto(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productoService.deleteProducto(id).subscribe({
        next: () => {
          this.cargarProductos();
        },
        error: (error) => {
          console.error('Error al eliminar producto:', error);
          alert('Error al eliminar el producto');
        }
      });
    }
  }

  limpiarFiltros(): void {
    this.categoriaFiltro = '';
    this.busqueda = '';
  }
}