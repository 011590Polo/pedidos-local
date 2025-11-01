# 📚 Documentación Completa del Proyecto PedidosLocal

## 📋 Índice
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Base de Datos](#base-de-datos)
6. [Backend - API REST](#backend---api-rest)
7. [Frontend - Angular](#frontend---angular)
8. [Comunicación en Tiempo Real](#comunicación-en-tiempo-real)
9. [Funcionalidades Principales](#funcionalidades-principales)
10. [Proceso de Desarrollo](#proceso-de-desarrollo)
11. [Guía de Instalación](#guía-de-instalación)
12. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)
13. [Solución Implementada para Socket.IO](#solución-implementada-para-socketio)
14. [Dashboard y Analytics](#dashboard-y-analytics)
15. [Pruebas y Testing](#pruebas-y-testing)
16. [Despliegue](#despliegue)
17. [Mejoras Futuras](#mejoras-futuras)

---

## 1. Introducción

**PedidosLocal** es un sistema de gestión de pedidos diseñado para restaurantes, cafeterías o negocios locales que necesitan gestionar pedidos de forma eficiente con comunicación en tiempo real. El sistema permite:

- ✅ Gestión completa de productos con sistema de categorías
- ✅ Subida de imágenes locales para productos
- ✅ Menú público organizado por categorías con diseño elegante
- ✅ Creación y seguimiento de pedidos con ordenamiento inteligente
- ✅ Dashboard con analytics y estadísticas
- ✅ Actualizaciones en tiempo real mediante Socket.IO
- ✅ Base de datos local con SQLite
- ✅ Interfaz moderna y responsive con Angular
- ✅ Reutilización automática de códigos de pedidos para el mismo cliente

---

## 2. Arquitectura del Sistema

### 2.1 Modelo de Arquitectura
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend       │         │    Base de      │
│   Angular 17    │◄───────►│   Node.js +      │◄───────►│    Datos        │
│                 │  HTTP   │   Express        │  SQL    │    SQLite       │
│                 │         │                  │         │                 │
│  Socket.IO      │◄───────►│   Socket.IO      │         │                 │
│  (WebSocket)    │  WS     │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### 2.2 Flujo de Datos

1. **Cliente (Browser)** → Petición HTTP/WebSocket → **Servidor Node.js**
2. **Servidor** → Consulta SQL → **Base de Datos SQLite**
3. **Base de Datos** → Resultados → **Servidor**
4. **Servidor** → Respuesta JSON → **Cliente**
5. **Servidor** → Evento Socket.IO → **Todos los clientes conectados**

---

## 3. Stack Tecnológico

### 3.1 Backend
- **Node.js** (v14+): Entorno de ejecución JavaScript
- **Express.js** (v4.18+): Framework web minimalista
- **SQLite3** (v5.1+): Base de datos relacional embebida
- **Socket.IO** (v4.8+): Biblioteca para comunicación en tiempo real
- **Multer** (v1.4+): Middleware para manejo de archivos multipart/form-data (subida de imágenes)
- **CORS**: Middleware para manejo de políticas de origen cruzado

### 3.2 Frontend
- **Angular** (v17): Framework para aplicaciones web
- **TypeScript** (v5.4+): Superset tipado de JavaScript
- **Tailwind CSS** (v3.4+): Framework de utilidades CSS
- **Socket.IO Client** (v4.8+): Cliente para Socket.IO
- **RxJS** (v7.8+): Librería reactiva para programación asíncrona

### 3.3 Herramientas de Desarrollo
- **Nodemon** (v3.0+): Auto-reinicio del servidor en desarrollo
- **Angular CLI** (v17.3+): Herramientas de línea de comandos
- **Autoprefixer** & **PostCSS**: Procesamiento de CSS

---

## 4. Estructura del Proyecto

```
pedidos-local-origin/
├── backend/                      # Servidor Node.js
│   ├── routes/                   # Rutas de la API
│   │   ├── pedidos.js           # Endpoints de pedidos
│   │   ├── productos.js         # Endpoints de productos
│   │   ├── categorias.js        # Endpoints de categorías
│   │   └── analytics.js         # Endpoints de analytics
│   ├── uploads/                  # Archivos subidos
│   │   └── products/            # Imágenes de productos
│   ├── database.js              # Conexión y lógica de BD
│   └── server.js                # Servidor principal
│
├── frontend/
│   └── pedidos-local/           # Aplicación Angular
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/  # Componentes Angular
│       │   │   │   ├── pedidos/
│       │   │   │   ├── productos/
│       │   │   │   ├── menu/    # Vista de menú público
│       │   │   │   ├── seguimiento/
│       │   │   │   └── dashboard/
│       │   │   ├── services/    # Servicios (HTTP, Socket, Analytics, Categoria)
│       │   │   ├── models/      # Interfaces TypeScript (Producto, Pedido, Categoria)
│       │   │   ├── app.routes.ts
│       │   │   └── app.config.ts
│       │   ├── environments/    # Configuración por ambiente
│       │   └── styles.css
│       ├── angular.json
│       ├── package.json
│       └── proxy.conf.json      # Configuración proxy dev
│
├── pedidos.db                   # Base de datos SQLite
├── package.json                 # Dependencias root
├── test-database.js            # Script de pruebas
└── DOCUMENTACION-PROYECTO.md    # Este archivo
```

---

## 5. Base de Datos

### 5.1 Diagrama Entidad-Relación

```
┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│ categorias   │         │  productos   │         │   pedidos        │
├──────────────┤         ├──────────────┤         ├──────────────────┤
│ id (PK)      │         │ id (PK)      │         │ id (PK)          │
│ nombre       │         │ nombre       │         │ cliente          │
│ activo       │         │ precio       │         │ mesa             │
└──────────────┘         │ categoria    │         │ estado           │
                         │ imagen       │         │ total            │
                         │ descripcion  │         │ fecha            │
                         │ activo       │         │ codigo_publico   │
                         └──────────────┘         └──────────────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │ detalle_pedido   │
                                                  ├──────────────────┤
                                                  │ id (PK)          │
                                                  │ id_pedido (FK)   │
                                                  │ id_producto (FK) │
                                                  │ cantidad         │
                                                  │ subtotal         │
                                                  └──────────────────┘
```

### 5.2 Descripción de Tablas

#### Tabla: `productos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Identificador único auto-incremental |
| `nombre` | TEXT NOT NULL | Nombre del producto |
| `precio` | REAL NOT NULL | Precio unitario |
| `categoria` | TEXT | Categoría (ej: "Hamburguesas", "Bebidas") |
| `imagen` | TEXT | Ruta o URL de la imagen |
| `descripcion` | TEXT | Descripción del producto |
| `activo` | INTEGER DEFAULT 1 | 1=activo, 0=eliminado (soft delete) |

#### Tabla: `categorias`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Identificador único auto-incremental |
| `nombre` | TEXT UNIQUE NOT NULL | Nombre de la categoría (ej: "Hamburguesas", "Bebidas") |
| `activo` | INTEGER DEFAULT 1 | 1=activa, 0=eliminada (soft delete) |

#### Tabla: `pedidos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Identificador único |
| `cliente` | TEXT | Nombre del cliente |
| `mesa` | TEXT | Mesa o ubicación |
| `estado` | TEXT DEFAULT 'Pendiente' | Estado del pedido |
| `total` | REAL | Precio total del pedido |
| `fecha` | TEXT | Fecha de creación (ISO) |
| `codigo_publico` | TEXT UNIQUE | Código para seguimiento |

**Estados posibles:** `Pendiente`, `En preparación`, `Listo`, `Entregado`, `Cancelado`

#### Tabla: `detalle_pedido`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Identificador único |
| `id_pedido` | INTEGER (FK) | Referencia a pedidos.id |
| `id_producto` | INTEGER (FK) | Referencia a productos.id |
| `cantidad` | INTEGER | Cantidad del producto |
| `subtotal` | REAL | Precio * cantidad |

### 5.3 Operaciones de Base de Datos

Ubicación: `backend/database.js`

#### Funciones Principales
- `initializeDatabase()`: Inicializa tablas si no existen
- `getProductos(callback)`: Obtiene todos los productos activos
- `getCategorias(callback)`: Obtiene todas las categorías activas
- `createCategoria(nombre, callback)`: Crea una nueva categoría
- `createPedido(pedido, callback)`: Crea un nuevo pedido
- `createPedidoConReutilizacion(pedido, callback)`: Crea un pedido con lógica de reutilización
- `getPedidoByCodigo(codigo, callback)`: Busca pedido por código público
- `updatePedido(id, pedido, callback)`: Actualiza un pedido
- `deletePedido(id, callback)`: Elimina un pedido

#### Funciones de Analytics
- `getVentasPorPeriodo(periodo, callback)`: Obtiene ventas por período (dia, semana, mes)
- `getProductosMasVendidos(limite, callback)`: Productos más vendidos
- `getClientesMasFrecuentes(limite, callback)`: Clientes más frecuentes
- `getIngresosTotales(callback)`: Ingresos totales y estadísticas
- `getEstadoPedidos(callback)`: Distribución de estados
- `getVentasPorHora(callback)`: Ventas por hora del día
- `getVentasUltimaSemana(callback)`: Ventas de los últimos 7 días
- `getTendenciaVentas(callback)`: Tendencia de últimos 30 días
- `getPedidosPorCliente(filtros, callback)`: Pedidos con filtros
- `getClientesUnicos(callback)`: Lista de clientes únicos

---

## 6. Backend - API REST

### 6.1 Endpoints de Productos

#### GET `/api/productos`
Obtiene todos los productos activos.
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Hamburguesa Clásica",
      "precio": 12.50,
      "categoria": "Hamburguesas",
      "imagen": "hamburguesa-clasica.jpg",
      "descripcion": "Hamburguesa con carne, lechuga, tomate y queso"
    }
  ],
  "count": 5
}
```

#### POST `/api/productos`
Crea un nuevo producto. **Acepta multipart/form-data para subir imágenes.**

**Formato JSON:**
```json
{
  "nombre": "Pizza Margherita",
  "precio": 15.00,
  "categoria": "Pizzas",
  "descripcion": "Pizza con tomate y mozzarella"
}
```

**Formato multipart/form-data (recomendado):**
- `nombre` (string): Nombre del producto
- `precio` (number): Precio del producto
- `categoria` (string, opcional): Categoría del producto
- `descripcion` (string, opcional): Descripción del producto
- `imagen` (File): Archivo de imagen (máximo 5MB, formatos: image/*)

**Nota:** Si se envía una imagen, se guarda en `backend/uploads/products/` y la ruta `/uploads/products/<nombre-archivo>` se almacena en la base de datos.

#### PUT `/api/productos/:id`
Actualiza un producto existente. **Acepta multipart/form-data para actualizar la imagen.**

Los mismos campos que POST. Si se envía una nueva imagen, reemplaza la anterior.

#### DELETE `/api/productos/:id`
Elimina un producto (soft delete - pone activo=0).

### 6.2 Endpoints de Categorías

#### GET `/api/categorias`
Obtiene todas las categorías activas.
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Hamburguesas",
      "activo": 1
    },
    {
      "id": 2,
      "nombre": "Bebidas",
      "activo": 1
    }
  ],
  "count": 5
}
```

#### POST `/api/categorias`
Crea una nueva categoría.
```json
{
  "nombre": "Pastas"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Categoría creada exitosamente",
  "data": {
    "id": 6,
    "nombre": "Pastas",
    "activo": 1
  }
}
```

### 6.3 Endpoints de Pedidos

#### GET `/api/pedidos`
Lista todos los pedidos con formato de productos.

#### GET `/api/pedidos/seguimiento/:codigo`
Consulta un pedido por su código público.

#### POST `/api/pedidos`
Crea un nuevo pedido.
```json
{
  "cliente": "Juan Pérez",
  "mesa": "Mesa 5",
  "productos": [
    {
      "id": 1,
      "cantidad": 2,
      "precio": 12.50
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Pedido creado exitosamente",
  "data": {
    "id": 42,
    "codigo_publico": "ABC12",
    "cliente": "Juan Pérez",
    "mesa": "Mesa 5",
    "total": 25.00
  }
}
```

#### PUT `/api/pedidos/:id`
Actualiza estado u otros datos del pedido.

**Funcionalidad de Reutilización:** Al crear un pedido del mismo cliente en las últimas 6 horas, el sistema:
1. Verifica si existe un pedido activo reciente del mismo cliente
2. Si existe, agrega los productos al pedido existente en lugar de crear uno nuevo
3. Actualiza el total del pedido existente
4. Emite evento Socket.IO con el pedido actualizado

**Respuesta de reutilización:**
```json
{
  "success": true,
  "message": "Productos agregados al pedido existente con código público ABC12",
  "data": {
    "id": 42,
    "codigo_publico": "ABC12",
    "reutilizado": true,
    "pedido_original_id": 42,
    "total_actualizado": 50.00
  }
}
```

#### DELETE `/api/pedidos/:id`
Elimina un pedido.

### 6.4 Endpoints de Analytics

#### GET `/api/analytics/dashboard`
Obtiene un resumen completo del dashboard con todos los datos principales.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "ingresos": {
      "ingresos_totales": 1500.00,
      "pedidos_exitosos": 100,
      "pedidos_cancelados": 5,
      "total_pedidos": 105,
      "promedio_pedido": 15.00
    },
    "estados": [...],
    "productosMasVendidos": [...],
    "clientesMasFrecuentes": [...],
    "ventasDia": [...],
    "ventasUltimaSemana": [...],
    "tendenciaVentas": [...]
  }
}
```

#### GET `/api/analytics/ventas/:periodo`
Obtiene ventas por período (dia, semana, mes).

#### GET `/api/analytics/productos-mas-vendidos?limite=10`
Obtiene los productos más vendidos.

#### GET `/api/analytics/clientes-mas-frecuentes?limite=10`
Obtiene los clientes que más compran.

#### GET `/api/analytics/ingresos-totales`
Obtiene ingresos totales y estadísticas generales.

#### GET `/api/analytics/estado-pedidos`
Obtiene distribución de estados de pedidos.

#### GET `/api/analytics/ventas-por-hora`
Obtiene ventas desglosadas por hora del día.

#### GET `/api/analytics/tendencia-ventas`
Obtiene tendencia de ventas de los últimos 30 días.

#### GET `/api/analytics/ventas-ultima-semana`
Obtiene ventas de la última semana por día.

#### GET `/api/analytics/pedidos-por-cliente`
Obtiene pedidos filtrados por cliente con múltiples filtros.

#### GET `/api/analytics/clientes-unicos`
Obtiene lista de todos los clientes únicos.

---

## 7. Frontend - Angular

### 7.1 Componentes Principales

#### PedidosComponent (`components/pedidos/`)
**Responsabilidades:**
- Mostrar lista de productos disponibles
- Gestionar carrito de compras
- Crear nuevos pedidos
- Mostrar lista de pedidos recientes
- Actualizar estados de pedidos

**Características:**
- Suscripción a eventos Socket.IO (`pedidoCreado`, `productoCreado`)
- Formularios reactivos para crear pedidos
- Cálculo automático de totales

#### ProductosComponent (`components/productos/`)
**Responsabilidades:**
- CRUD completo de productos
- Gestión de categorías

#### SeguimientoComponent (`components/seguimiento/`)
**Responsabilidades:**
- Consultar pedidos por código público
- Mostrar estado en tiempo real
- Suscripción a actualizaciones de estado

#### DashboardComponent (`components/dashboard/`)
**Responsabilidades:**
- Mostrar estadísticas generales del negocio
- Visualizar ingresos totales y promedios
- Mostrar productos y clientes más frecuentes
- Gráficos de ventas por período
- Filtrar pedidos por múltiples criterios

#### MenuComponent (`components/menu/`)
**Responsabilidades:**
- Mostrar menú público de productos organizado por categorías
- Visualización tipo carta de restaurante con diseño elegante
- Filtrado por categoría y búsqueda de productos
- Vista responsive optimizada para móviles y tablets
- Banner temático con estilo "El Barril & Brasa Bar"

### 7.2 Servicios

#### ProductoService (`services/producto.service.ts`)
```typescript
export class ProductoService {
  getProductos(): Observable<ProductoResponse>
  getProducto(id: number): Observable<ProductoSingleResponse>
  createProducto(producto: Producto, imagenFile?: File): Observable<ProductoSingleResponse>
  updateProducto(id: number, producto: Producto, imagenFile?: File): Observable<ProductoSingleResponse>
  deleteProducto(id: number): Observable<{success: boolean, message: string}>
}
```

#### CategoriaService (`services/categoria.service.ts`)
```typescript
export class CategoriaService {
  getCategorias(): Observable<CategoriaResponse>
  createCategoria(nombre: string): Observable<CategoriaSingleResponse>
}
```

#### PedidoService (`services/pedido.service.ts`)
```typescript
export class PedidoService {
  getPedidos(): Observable<PedidoResponse>
  createPedido(pedido: PedidoRequest): Observable<PedidoSingleResponse>
  updatePedido(id: number, pedido: Partial<Pedido>): Observable<PedidoSingleResponse>
  getPedidoByCodigo(codigo: string): Observable<SeguimientoResponse>
}
```

#### SocketService (`services/socket.service.ts`)
```typescript
export class SocketService {
  on(event: string, callback: (...args: any[]) => void)
  off(event: string, callback?: (...args: any[]) => void)
  emit(event: string, data?: any)
  joinSeguimiento(codigo: string)
  leaveSeguimiento(codigo: string)
}
```

#### AnalyticsService (`services/analytics.service.ts`)
```typescript
export class AnalyticsService {
  getDashboard(): Observable<DashboardData>
  getVentasPorPeriodo(periodo: 'dia' | 'semana' | 'mes'): Observable<VentasPorPeriodo[]>
  getProductosMasVendidos(limite: number): Observable<ProductoMasVendido[]>
  getClientesMasFrecuentes(limite: number): Observable<ClienteMasFrecuente[]>
  getIngresosTotales(): Observable<IngresosTotales>
  getEstadoPedidos(): Observable<EstadoPedido[]>
  getVentasPorHora(): Observable<VentasPorHora[]>
  getTendenciaVentas(): Observable<TendenciaVentas[]>
  getVentasUltimaSemana(): Observable<VentasUltimaSemana[]>
  getPedidosPorCliente(filtros: FiltrosPedidos): Observable<PedidoDetallado[]>
  getClientesUnicos(): Observable<string[]>
}
```

### 7.3 Modelos TypeScript

Ubicación: `models/`

**Pedido:**
```typescript
export interface Pedido {
  id?: number;
  cliente: string;
  mesa?: string;
  estado: string;
  total: number;
  fecha?: string;
  codigo_publico?: string;
  productos?: string;  // String formateado: "2x Hamburguesa, 1x Coca Cola"
}
```

**Producto:**
```typescript
export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  categoria: string;
  imagen?: string;
  descripcion?: string;
  activo?: number;
}
```

**Categoria:**
```typescript
export interface Categoria {
  id?: number;
  nombre: string;
  activo?: number;
}
```

---

## 8. Comunicación en Tiempo Real

### 8.1 Socket.IO - Eventos del Servidor

#### `productoCreado`
Se emite cuando se crea un nuevo producto.
```javascript
io.emit('productoCreado', {
  id: 1,
  nombre: "Pizza",
  precio: 15.00,
  categoria: "Pizzas"
});
```

#### `pedidoCreado`
Se emite cuando se crea un nuevo pedido.
```javascript
io.emit('pedidoCreado', {
  id: 42,
  codigo_publico: "ABC12",
  cliente: "Juan Pérez",
  mesa: "Mesa 5",
  estado: "Pendiente",
  total: 25.00,
  fecha: "2024-01-15T10:30:00Z",
  productos: "2x Hamburguesa Clásica, 1x Coca Cola"
});
```

**⚠️ IMPORTANTE:** El campo `productos` se envía como string formateado, no como array de objetos.

#### `pedidoActualizado`
Se emite cuando se actualiza el estado de un pedido. Se emite tanto a la sala de seguimiento específica como de forma global para actualizar todas las vistas (listas, dashboard, etc.).
```javascript
const room = `seguimiento:${codigo}`;
const payload = {
  id: 42,
  codigo_publico: "ABC12",
  estado: "En preparación",
  total: 25.00,
  fecha: "2024-01-15T10:30:00Z",
  cliente: "Juan Pérez",
  mesa: "Mesa 5"
};
// Emitir a la sala de seguimiento
io.to(room).emit('pedidoActualizado', payload);
// Emitir globalmente para actualizar todas las vistas
io.emit('pedidoActualizado', payload);
```

### 8.2 Socket.IO - Eventos del Cliente

#### `joinSeguimiento`
El cliente se une a una sala para recibir actualizaciones de un pedido específico.
```typescript
socketService.joinSeguimiento('ABC12');
```

#### `leaveSeguimiento`
El cliente abandona la sala de seguimiento.
```typescript
socketService.leaveSeguimiento('ABC12');
```

### 8.3 Solución al Problema "[object Object]"

**Problema Original:**
Al emitir eventos Socket.IO, el array de productos se convertía a "[object Object]" en la interfaz.

**Solución Implementada:**
```javascript
// backend/routes/pedidos.js (línea ~190)
// 1. Después de crear el pedido, se consulta la BD
db.get(`
  SELECT p.*, 
         GROUP_CONCAT(d.cantidad || 'x ' || pr.nombre) as productos
  FROM pedidos p
  LEFT JOIN detalle_pedido d ON p.id = d.id_pedido
  LEFT JOIN productos pr ON d.id_producto = pr.id
  WHERE p.id = ?
  GROUP BY p.id
`, [resultado.id], (err2, pedidoCompleto) => {
  // 2. Construir objeto con productos como string
  const pedidoParaSocket = {
    ...pedidoCompleto,
    productos: pedidoCompleto.productos || 'Sin productos'
  };
  
  // 3. Emitir con el formato correcto
  io.emit('pedidoCreado', pedidoParaSocket);
});
```

**Resultado:**
- Los productos se muestran correctamente: "2x Hamburguesa Clásica, 1x Coca Cola"
- Consistencia con el formato de `GET /api/pedidos`
- Sin errores de visualización

---

## 9. Funcionalidades Principales

### 9.1 Gestión de Productos
- ✅ Crear, editar, eliminar productos
- ✅ Sistema de categorías con tabla dedicada y combo selector
- ✅ Subida de imágenes locales (guardadas en `backend/uploads/products/`)
- ✅ Visualización ampliada de imágenes con modal al mantener presionado el botón "ojito"
- ✅ Soft delete (productos no se eliminan permanentemente)
- ✅ Actualización en tiempo real en todas las pantallas

### 9.2 Gestión de Pedidos
- ✅ Crear pedidos con múltiples productos
- ✅ Cálculo automático de totales
- ✅ Código de seguimiento único por pedido
- ✅ Actualización de estados con sincronización en tiempo real en todas las vistas
- ✅ Ordenamiento inteligente: primero por prioridad de estado (Pendiente, En preparación, etc.), luego por fecha (más nuevos primero)
- ✅ Indicadores visuales: estados "Pendiente" y "En preparación" con animación de parpadeo
- ✅ Visualización de fecha y hora en cada tarjeta de pedido
- ✅ Eliminación de pedidos

### 9.3 Seguimiento de Pedidos
- ✅ Consulta por código público
- ✅ Visualización de estado en tiempo real
- ✅ Actualizaciones instantáneas sin refrescar página
- ✅ Información completa: productos, total, fecha

### 9.4 Dashboard y Analytics
- ✅ Vista general de métricas del negocio
- ✅ Ingresos totales y promedios
- ✅ Productos y clientes más frecuentes
- ✅ Gráficos de ventas por período
- ✅ Filtros avanzados de pedidos
- ✅ Tendencia de ventas de últimos 30 días

### 9.5 Comunicación en Tiempo Real
- ✅ Notificaciones instantáneas de nuevos pedidos
- ✅ Actualización de estados en vivo
- ✅ Sincronización automática entre múltiples clientes

### 9.6 Reutilización de Pedidos
- ✅ Detección automática de pedidos activos recientes del mismo cliente
- ✅ Agregado de productos a pedidos existentes
- ✅ Actualización automática de totales

### 9.7 Menú Público
- ✅ Vista de menú tipo carta de restaurante organizado por categorías
- ✅ Diseño visual elegante con banner temático "El Barril & Brasa Bar"
- ✅ Filtrado por categoría y búsqueda de productos
- ✅ Visualización completa de productos: nombre, precio, categoría, descripción e imagen
- ✅ Vista responsive optimizada para móviles, tablets y escritorio
- ✅ Botón de refrescar para actualizar el menú manualmente

### 9.8 Gestión de Categorías
- ✅ Tabla dedicada de categorías en la base de datos
- ✅ Creación de categorías desde el formulario de productos
- ✅ Combo selector de categorías en lugar de campo de texto libre
- ✅ API REST completa para gestión de categorías

---

## 10. Proceso de Desarrollo

### 10.1 Flujo de Trabajo

1. **Cliente crea pedido:**
   ```
   Frontend → POST /api/pedidos
   ```

2. **Servidor procesa:**
   ```
   - Valida datos
   - Crea pedido en BD
   - Genera código público
   - Responde al cliente
   ```

3. **Servidor emite evento:**
   ```
   - Consulta pedido completo de BD
   - Formatea productos como string
   - Emite 'pedidoCreado' vía Socket.IO
   ```

4. **Clientes conectados reciben:**
   ```
   Socket.IO → 'pedidoCreado' → Actualiza lista de pedidos
   ```

### 10.2 Manejo de Errores

**Backend:**
- Validación de datos de entrada
- Manejo de errores de BD
- Respuestas HTTP con códigos apropiados
- Logs de errores en consola

**Frontend:**
- Manejo de errores en suscripciones RxJS
- Mensajes de error al usuario
- Fallback si Socket.IO falla

---

## 11. Guía de Instalación

### 11.1 Requisitos Previos
- Node.js (v14 o superior)
- npm o yarn
- Git (opcional)

### 11.2 Instalación Backend

```bash
# 1. Instalar dependencias
npm install

# 2. La base de datos se crea automáticamente al iniciar el servidor

# 3. Iniciar servidor
npm start
# o para desarrollo con auto-reload:
npm run dev
```

El servidor se inicia en: `http://localhost:3000`

### 11.3 Instalación Frontend

```bash
# 1. Navegar a directorio frontend
cd frontend/pedidos-local

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm start
```

La aplicación se abre en: `http://localhost:4200`

### 11.4 Verificar Instalación

1. Backend: Abrir `http://localhost:3000` → Debe mostrar JSON de bienvenida
2. Frontend: Abrir `http://localhost:4200` → Debe mostrar la aplicación
3. Crear un producto y un pedido para probar la funcionalidad

---

## 12. Configuración y Variables de Entorno

### 12.1 Backend

**server.js**
```javascript
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos de imágenes subidas
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
```

**CORS Configuration:**
```javascript
const allowedPatterns = [
  /^http:\/\/localhost(:\d+)?$/,           // Desarrollo local
  /^http:\/\/192\.168\.100\.75(:\d+)?$/,  // Red local
  /^https:\/\/.*\.trycloudflare\.com$/,    // Cloudflare Tunnel
  /^https:\/\/robertogroup\.org$/           // Dominio de producción
];
```

**Socket.IO CORS:**
```javascript
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:4200',
      'http://192.168.100.75:4200',
      'https://robertogroup.org',
      'https://*.trycloudflare.com',
      'http://127.0.0.1:4200'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

### 12.2 Frontend

**environment.ts**
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://game-betting-eric-pride.trycloudflare.com'
};
```

**proxy.conf.json** (solo desarrollo)
```json
{
  "/api/productos": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  },
  "/api/pedidos": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

---

## 13. Solución Implementada para Socket.IO

### 13.1 Problema Detallado

**Síntoma:**
- Al crear un pedido, clientes conectados veían "[object Object],[object Object]" en lugar de nombres de productos

**Causa Raíz:**
- El endpoint `POST /pedidos` devolvía un objeto con `productos` como array
- Al emitir por Socket.IO, el array se serializaba incorrectamente
- La vista mostraba `{{ pedido.productos }}` que intentaba renderizar objetos

### 13.2 Código de la Solución

**Antes (Incorrecto):**
```javascript
const nuevoPedido = {
  id: resultado.id,
  codigo_publico: resultado.codigo_publico,
  cliente: pedido.cliente,
  productos: pedido.productos  // ❌ Array de objetos
};
io.emit('pedidoCreado', nuevoPedido);
```

**Después (Correcto):**
```javascript
// 1. Consultar BD para obtener productos formateados
db.get(`
  SELECT p.*, 
         GROUP_CONCAT(d.cantidad || 'x ' || pr.nombre) as productos
  FROM pedidos p
  LEFT JOIN detalle_pedido d ON p.id = d.id_pedido
  LEFT JOIN productos pr ON d.id_producto = pr.id
  WHERE p.id = ?
  GROUP BY p.id
`, [resultado.id], (err2, pedidoCompleto) => {
  
  // 2. Construir objeto con productos como string
  const pedidoParaSocket = {
    id: pedidoCompleto.id,
    codigo_publico: pedidoCompleto.codigo_publico,
    cliente: pedidoCompleto.cliente,
    mesa: pedidoCompleto.mesa,
    estado: pedidoCompleto.estado || 'Pendiente',
    total: pedidoCompleto.total,
    fecha: pedidoCompleto.fecha,
    productos: pedidoCompleto.productos || 'Sin productos'  // ✅ String
  };

  // 3. Emitir
  io.emit('pedidoCreado', pedidoParaSocket);
});
```

### 13.3 Resultado

**Antes:**
```
Productos: [object Object],[object Object]
```

**Después:**
```
Productos: 2x Hamburguesa Clásica, 1x Coca Cola
```

---

## 14. Dashboard y Analytics

### 14.1 Descripción General

El dashboard proporciona una vista completa de las métricas del negocio en tiempo real, permitiendo tomar decisiones basadas en datos.

### 14.2 Funcionalidades del Dashboard

#### Panel de Resumen
- **Ingresos Totales**: Suma de todos los pedidos completados
- **Pedidos Exitosos**: Cantidad de pedidos entregados
- **Pedidos Cancelados**: Cantidad de pedidos cancelados
- **Promedio por Pedido**: Valor promedio de cada pedido
- **Total de Pedidos**: Cantidad total de pedidos

#### Distribución de Estados
Visualización de pedidos agrupados por estado actual:
- Pendiente
- En preparación
- Listo
- Entregado
- Cancelado

#### Top Productos Más Vendidos
Lista de productos más populares con métricas:
- Cantidad total vendida
- Veces que ha sido pedido
- Ingresos generados

#### Top Clientes Más Frecuentes
Clientes con mayor actividad:
- Total de pedidos realizados
- Total gastado
- Promedio por pedido
- Fecha del último pedido

#### Ventas por Día
Desglose de ventas de los últimos 7 días con:
- Fecha y día de la semana
- Cantidad de pedidos por día
- Total de ventas por día
- Promedio de venta por día

#### Tendencia de Ventas
Gráfica de los últimos 30 días mostrando la evolución de las ventas.

### 14.3 Filtros Avanzados de Pedidos

El dashboard incluye un sistema de filtros para búsquedas específicas:

**Filtros Disponibles:**
- **Cliente**: Búsqueda parcial por nombre
- **Estado**: Filtro por estado específico
- **Fecha Desde/Hasta**: Rango de fechas
- **Total Mínimo/Máximo**: Rango de montos
- **Límite**: Cantidad máxima de resultados

**Resultados:**
- Lista detallada de pedidos que cumplen los criterios
- Información completa de cada pedido
- Productos, cantidades y subtotales desglosados

### 14.4 Formato de Datos

Todos los endpoints de analytics devuelven datos consistentes con formato:
- Fechas en ISO 8601
- Montos con precisión de 2 decimales
- Agrupaciones por día, hora o período según corresponda

### 14.5 Integración Frontend-Backend

El componente `DashboardComponent` se conecta automáticamente con el backend para obtener:
1. Resumen general del dashboard (endpoint `/dashboard`)
2. Datos específicos según necesidad
3. Actualización automática en tiempo real mediante recarga manual

---

## 15. Pruebas y Testing

### 15.1 Prueba Manual de Base de Datos

```bash
npm test
```

Este comando ejecuta `test-database.js` que:
- Crea tablas si no existen
- Inserta datos de ejemplo
- Crea un pedido de prueba
- Muestra resultados en consola

### 15.2 Pruebas de Funcionalidad

**1. Crear Producto:**
- Abrir `/productos`
- Llenar formulario
- Verificar que aparece en lista

**2. Crear Pedido:**
- Abrir `/pedidos`
- Agregar productos al carrito
- Crear pedido
- Verificar código generado

**3. Seguimiento:**
- Abrir `/seguimiento`
- Ingresar código de pedido
- Verificar información mostrada

**4. Actualización en Tiempo Real:**
- Abrir aplicación en dos pestañas
- Crear pedido en una pestaña
- Verificar que aparece en la otra

### 15.3 Testing con Postman

**Colección de Endpoints:**

1. `GET http://localhost:3000/api/productos`
2. `POST http://localhost:3000/api/pedidos`
3. `GET http://localhost:3000/api/pedidos/seguimiento/{codigo}`
4. `PUT http://localhost:3000/api/pedidos/{id}`

---

## 16. Despliegue

### 16.1 Build de Producción

**Frontend:**
```bash
cd frontend/pedidos-local
npm run build
```
Output: `frontend/pedidos-local/dist/pedidos-local/`

**Backend:**
El servidor ya está configurado para servir el build de Angular:

```javascript
// server.js línea ~100
const angularDistPath = path.join(__dirname, '../frontend/pedidos-local/dist/pedidos-local');
app.use(express.static(angularDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(angularDistPath, 'index.html'));
});
```

### 16.2 Despliegue Local

```bash
# 1. Build del frontend
cd frontend/pedidos-local && npm run build && cd ../..

# 2. Iniciar servidor (sirve frontend y backend)
npm start
```

### 16.3 Despliegue con Cloudflare Tunnel

```bash
# 1. Instalar cloudflared
# 2. Crear tunnel
cloudflared tunnel create my-tunnel

# 3. Iniciar tunnel
cloudflared tunnel route dns my-tunnel myapp.example.com
cloudflared tunnel run my-tunnel
```

Actualizar `environment.ts` con la URL del tunnel.

### 16.4 Consideraciones de Producción

- ⚠️ Cambiar CORS para dominios específicos
- ⚠️ Usar variables de entorno para configuración sensible
- ⚠️ Implementar autenticación y autorización
- ⚠️ Configurar HTTPS
- ⚠️ Hacer backup regular de la base de datos
- ⚠️ Configurar logs y monitoreo

---

## 17. Mejoras Futuras

### 17.1 Funcionalidades Sugeridas

- ⚠️ **Autenticación de usuarios** (JWT)
- ⚠️ **Roles y permisos** (Admin, Mesero, Cliente)
- ⚠️ **Sistema de mesas con mapa visual**
- ⚠️ **Impresión de tickets**
- ⚠️ **Reportes personalizados** (ya existe dashboard básico)
- ⚠️ **Historial de pedidos por cliente** (parcialmente implementado)
- ⚠️ **Sistema de favoritos**
- ⚠️ **Descuentos y promociones**
- ⚠️ **Múltiples métodos de pago**
- ⚠️ **Notificaciones push**

### 17.2 Mejoras Técnicas

- ⚠️ **Base de datos PostgreSQL** para producción
- ⚠️ **Caché Redis** para sesiones
- ⚠️ **Tests unitarios y de integración**
- ⚠️ **Documentación API** (Swagger/OpenAPI)
- ⚠️ **CI/CD Pipeline**
- ⚠️ **Docker Containerization**
- ✅ **Manejo de archivos** para imágenes de productos (implementado con Multer)
- ⚠️ **Internacionalización (i18n)**

### 17.3 Optimizaciones

- ⚠️ **Lazy loading** de componentes Angular
- ⚠️ **Paginación** en listas grandes
- ⚠️ **Compresión de respuestas**
- ⚠️ **CDN** para assets estáticos
- ⚠️ **Service Workers** para PWA

---

## 📞 Contacto y Soporte

Para dudas o consultas sobre este proyecto, revisar la documentación o contactar al equipo de desarrollo.

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Versión de la Documentación:** 3.0  
**Última actualización:** Enero 2025  
**Autor:** Equipo de Desarrollo PedidosLocal

---

## 📝 Notas de Versión

### Versión 3.0 (Enero 2025)
- ✅ Sistema de categorías: tabla dedicada y API REST completa
- ✅ Subida de imágenes locales con Multer (guardadas en `backend/uploads/products/`)
- ✅ Nuevo módulo de Menú público (`/menu`) organizado por categorías
- ✅ Vista ampliada de imágenes con modal interactivo (botón "ojito")
- ✅ Mejoras en módulo de pedidos:
  - Ordenamiento inteligente por prioridad de estado y fecha
  - Indicadores visuales con animación de parpadeo para estados prioritarios
  - Visualización de fecha y hora en tarjetas de pedidos
- ✅ Sincronización mejorada: evento `pedidoActualizado` global para todas las vistas
- ✅ Botones de refrescar en módulos de productos y menú
- ✅ Diseño responsive mejorado para móviles
- ✅ Actualizada documentación de endpoints con soporte multipart/form-data
- ✅ Agregado Multer al stack tecnológico

### Versión 2.0 (Diciembre 2024)
- ✅ Agregada sección completa de Dashboard y Analytics
- ✅ Documentados 9+ endpoints de analytics nuevos
- ✅ Documentada funcionalidad de reutilización de pedidos
- ✅ Actualizada estructura del proyecto con componentes dashboard
- ✅ Documentado servicio AnalyticsService
- ✅ Actualizada configuración CORS con dominios de producción
- ✅ Reorganizada numeración de secciones
- ✅ Actualizado estado de mejoras futuras

### Versión 1.0 (Enero 2024)
- Versión inicial de la documentación
- Funcionalidades básicas de productos y pedidos
- Comunicación en tiempo real con Socket.IO
