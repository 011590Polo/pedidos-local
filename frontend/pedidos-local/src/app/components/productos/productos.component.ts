import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
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

  // Formulario
  nuevoProducto: Producto = {
    nombre: '',
    precio: 0,
    categoria: '',
    imagen: '',
    descripcion: ''
  };

  constructor(private productoService: ProductoService) { }

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productoService.getProductos().subscribe({
      next: (response) => {
        this.productos = response.data;
        this.extraerCategorias();
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
  }

  guardarProducto(): void {
    if (!this.nuevoProducto.nombre || !this.nuevoProducto.precio) {
      alert('Nombre y precio son obligatorios');
      return;
    }

    if (this.productoEditando) {
      // Actualizar producto existente
      this.productoService.updateProducto(this.productoEditando.id!, this.nuevoProducto).subscribe({
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
      this.productoService.createProducto(this.nuevoProducto).subscribe({
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