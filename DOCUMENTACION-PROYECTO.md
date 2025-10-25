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
14. [Pruebas y Testing](#pruebas-y-testing)
15. [Despliegue](#despliegue)
16. [Mejoras Futuras](#mejoras-futuras)

---

## 1. Introducción

**PedidosLocal** es un sistema de gestión de pedidos diseñado para restaurantes, cafeterías o negocios locales que necesitan gestionar pedidos de forma eficiente con comunicación en tiempo real. El sistema permite:

- ✅ Gestión completa de productos
- ✅ Creación y seguimiento de pedidos
- ✅ Actualizaciones en tiempo real mediante Socket.IO
- ✅ Base de datos local con SQLite
- ✅ Interfaz moderna y responsive con Angular

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
prole/
├── backend/                      # Servidor Node.js
│   ├── routes/                   # Rutas de la API
│   │   ├── pedidos.js           # Endpoints de pedidos
│   │   └── productos.js         # Endpoints de productos
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
│       │   │   │   └── seguimiento/
│       │   │   ├── services/    # Servicios (HTTP, Socket)
│       │   │   ├── models/      # Interfaces TypeScript
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
└── DOCUMENTACION.md            # Este archivo
```

---

## 5. Base de Datos

### 5.1 Diagrama Entidad-Relación

```
┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│  productos   │         │   pedidos    │         │ detalle_pedido   │
├──────────────┤         ├──────────────┤         ├──────────────────┤
│ id (PK)      │◄────────│ id (PK)      │◄────────│ id (PK)          │
│ nombre       │         │ cliente      │         │ id_pedido (FK)   │
│ precio       │         │ mesa         │         │ id_producto (FK) │
│ categoria    │         │ estado       │         │ cantidad         │
│ imagen       │         │ total        │         │ subtotal         │
│ descripcion  │         │ fecha        │         └──────────────────┘
│ activo       │         │ codigo_...   │
└──────────────┘         └──────────────┘
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
- `createPedido(pedido, callback)`: Crea un nuevo pedido
- `getPedidoByCodigo(codigo, callback)`: Busca pedido por código público
- `updatePedido(id, pedido, callback)`: Actualiza un pedido
- `deletePedido(id, callback)`: Elimina un pedido

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
Crea un nuevo producto.
```json
{
  "nombre": "Pizza Margherita",
  "precio": 15.00,
  "categoria": "Pizzas",
  "imagen": "pizza-margherita.jpg",
  "descripcion": "Pizza con tomate y mozzarella"
}
```

#### PUT `/api/productos/:id`
Actualiza un producto existente.

#### DELETE `/api/productos/:id`
Elimina un producto (soft delete - pone activo=0).

### 6.2 Endpoints de Pedidos

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

**Solución Implementada:** Al crear un pedido, el servidor:
1. Responde inmediatamente al cliente HTTP con datos básicos
2. Consulta la BD para obtener el pedido completo con productos formateados
3. Emite evento Socket.IO con el formato correcto (productos como string)

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

### 7.2 Servicios

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
Se emite cuando se actualiza el estado de un pedido.
```javascript
const room = `seguimiento:${codigo}`;
io.to(room).emit('pedidoActualizado', {
  id: 42,
  codigo_publico: "ABC12",
  estado: "En preparación",
  total: 25.00,
  cliente: "Juan Pérez",
  mesa: "Mesa 5"
});
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
- ✅ Categorización
- ✅ Soft delete (productos no se eliminan permanentemente)
- ✅ Actualización en tiempo real en todas las pantallas

### 9.2 Gestión de Pedidos
- ✅ Crear pedidos con múltiples productos
- ✅ Cálculo automático de totales
- ✅ Código de seguimiento único por pedido
- ✅ Actualización de estados
- ✅ Eliminación de pedidos

### 9.3 Seguimiento de Pedidos
- ✅ Consulta por código público
- ✅ Visualización de estado en tiempo real
- ✅ Actualizaciones instantáneas sin refrescar página
- ✅ Información completa: productos, total, fecha

### 9.4 Comunicación en Tiempo Real
- ✅ Notificaciones instantáneas de nuevos pedidos
- ✅ Actualización de estados en vivo
- ✅ Sincronización automática entre múltiples clientes

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
```

**CORS Configuration:**
```javascript
const allowedPatterns = [
  /^http:\/\/localhost(:\d+)?$/,           // Desarrollo local
  /^http:\/\/192\.168\.100\.75(:\d+)?$/,  // Red local
  /^https:\/\/.*\.trycloudflare\.com$/     // Cloudflare Tunnel
];
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

## 14. Pruebas y Testing

### 14.1 Prueba Manual de Base de Datos

```bash
npm test
```

Este comando ejecuta `test-database.js` que:
- Crea tablas si no existen
- Inserta datos de ejemplo
- Crea un pedido de prueba
- Muestra resultados en consola

### 14.2 Pruebas de Funcionalidad

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

### 14.3 Testing con Postman

**Colección de Endpoints:**

1. `GET http://localhost:3000/api/productos`
2. `POST http://localhost:3000/api/pedidos`
3. `GET http://localhost:3000/api/pedidos/seguimiento/{codigo}`
4. `PUT http://localhost:3000/api/pedidos/{id}`

---

## 15. Despliegue

### 15.1 Build de Producción

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

### 15.2 Despliegue Local

```bash
# 1. Build del frontend
cd frontend/pedidos-local && npm run build && cd ../..

# 2. Iniciar servidor (sirve frontend y backend)
npm start
```

### 15.3 Despliegue con Cloudflare Tunnel

```bash
# 1. Instalar cloudflared
# 2. Crear tunnel
cloudflared tunnel create my-tunnel

# 3. Iniciar tunnel
cloudflared tunnel route dns my-tunnel myapp.example.com
cloudflared tunnel run my-tunnel
```

Actualizar `environment.ts` con la URL del tunnel.

### 15.4 Consideraciones de Producción

- ⚠️ Cambiar CORS para dominios específicos
- ⚠️ Usar variables de entorno para configuración sensible
- ⚠️ Implementar autenticación y autorización
- ⚠️ Configurar HTTPS
- ⚠️ Hacer backup regular de la base de datos
- ⚠️ Configurar logs y monitoreo

---

## 16. Mejoras Futuras

### 16.1 Funcionalidades Sugeridas

- ✅ **Autenticación de usuarios** (JWT)
- ✅ **Roles y permisos** (Admin, Mesero, Cliente)
- ✅ **Sistema de mesas con mapa visual**
- ✅ **Impresión de tickets**
- ✅ **Reportes y estadísticas**
- ✅ **Historial de pedidos por cliente**
- ✅ **Sistema de favoritos**
- ✅ **Descuentos y promociones**
- ✅ **Múltiples métodos de pago**
- ✅ **Notificaciones push**

### 16.2 Mejoras Técnicas

- ✅ **Base de datos PostgreSQL** para producción
- ✅ **Caché Redis** para sesiones
- ✅ **Tests unitarios y de integración**
- ✅ **Documentación API** (Swagger/OpenAPI)
- ✅ **CI/CD Pipeline**
- ✅ **Docker Containerization**
- ✅ **Manejo de archivos** para imágenes de productos
- ✅ **Internacionalización (i18n)**

### 16.3 Optimizaciones

- ✅ **Lazy loading** de componentes Angular
- ✅ **Paginación** en listas grandes
- ✅ **Compresión de respuestas**
- ✅ **CDN** para assets estáticos
- ✅ **Service Workers** para PWA

---

## 📞 Contacto y Soporte

Para dudas o consultas sobre este proyecto, revisar la documentación o contactar al equipo de desarrollo.

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Versión de la Documentación:** 1.0  
**Última actualización:** Enero 2024  
**Autor:** Equipo de Desarrollo PedidosLocal
