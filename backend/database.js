const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta de la base de datos
const dbPath = path.join(__dirname, '..', 'pedidos.db');

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Función para inicializar la base de datos
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    createTables()
      .then(() => migrateDatabase())
      .then(() => {
        // Crear usuarios por defecto
        return new Promise((resolveUsers) => {
          createDefaultUsers((err) => {
            if (err) {
              console.warn('⚠️ Error al crear usuarios por defecto:', err);
            }
            resolveUsers();
          });
        });
      })
      .then(() => {
        console.log('✅ Base de datos inicializada correctamente');
        resolve();
      })
      .catch((err) => {
        console.error('❌ Error al inicializar la base de datos:', err);
        reject(err);
      });
  });
}

// Función para migraciones de esquema
function migrateDatabase() {
  return new Promise((resolve, reject) => {
    // Agregar columna estado a detalle_pedido si no existe
    db.all("PRAGMA table_info(detalle_pedido)", (err, rows) => {
      if (err) {
        console.warn('⚠️ No se pudo verificar estructura de detalle_pedido:', err);
        resolve(); // Continuar aunque falle
        return;
      }
      
      // Verificar si la columna estado existe
      const tieneEstado = rows && rows.some(col => col.name === 'estado');
      
      if (!tieneEstado) {
        db.run("ALTER TABLE detalle_pedido ADD COLUMN estado TEXT DEFAULT 'Pendiente'", (err) => {
          if (err) {
            console.warn('⚠️ No se pudo agregar columna estado a detalle_pedido:', err.message);
          } else {
            console.log('✅ Columna estado agregada a detalle_pedido');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

// Función para crear las tablas
function createTables() {
  return new Promise((resolve, reject) => {
    const tables = [
      // Tabla productos
      `CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        categoria TEXT,
        imagen TEXT,
        descripcion TEXT,
        activo INTEGER DEFAULT 1
      )`,
      
      // Tabla categorias
      `CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        activo INTEGER DEFAULT 1
      )`,
      
      // Tabla pedidos
      `CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT,
        mesa TEXT,
        estado TEXT DEFAULT 'Pendiente',
        total REAL,
        fecha TEXT,
        codigo_publico TEXT UNIQUE
      )`,
      
      // Tabla detalle_pedido
      `CREATE TABLE IF NOT EXISTS detalle_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_pedido INTEGER,
        id_producto INTEGER,
        cantidad INTEGER,
        subtotal REAL,
        estado TEXT DEFAULT 'Pendiente',
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (id_producto) REFERENCES productos(id)
      )`,
      
      // Tabla usuarios
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'cliente',
        activo INTEGER DEFAULT 1,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    let completed = 0;
    const total = tables.length;

    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`Error al crear tabla ${index + 1}:`, err.message);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === total) {
          console.log('✅ Todas las tablas creadas/verificadas');
          resolve();
        }
      });
    });
  });
}

// Función para insertar datos de ejemplo
function insertSampleData() {
  // Insertar categorías de ejemplo
  const categorias = [
    'Hamburguesas', 'Pizzas', 'Bebidas', 'Ensaladas', 'Pastas'
  ];

  categorias.forEach((nombre) => {
    db.run(
      'INSERT OR IGNORE INTO categorias (nombre, activo) VALUES (?, 1)',
      [nombre],
      (err) => {
        if (err) {
          console.error('Error al insertar categoría:', err.message);
        }
      }
    );
  });

  const productos = [
    { nombre: 'Hamburguesa Clásica', precio: 12.50, categoria: 'Hamburguesas', imagen: 'hamburguesa-clasica.jpg', descripcion: 'Hamburguesa con carne, lechuga, tomate y queso' },
    { nombre: 'Pizza Margherita', precio: 15.00, categoria: 'Pizzas', imagen: 'pizza-margherita.jpg', descripcion: 'Pizza con tomate, mozzarella y albahaca' },
    { nombre: 'Coca Cola', precio: 3.50, categoria: 'Bebidas', imagen: 'coca-cola.jpg', descripcion: 'Bebida gaseosa de cola' },
    { nombre: 'Ensalada César', precio: 8.00, categoria: 'Ensaladas', imagen: 'ensalada-cesar.jpg', descripcion: 'Ensalada con lechuga, crutones y aderezo césar' },
    { nombre: 'Pasta Carbonara', precio: 14.00, categoria: 'Pastas', imagen: 'pasta-carbonara.jpg', descripcion: 'Pasta con salsa carbonara y panceta' }
  ];

  productos.forEach(producto => {
    db.run(
      'INSERT OR IGNORE INTO productos (nombre, precio, categoria, imagen, descripcion) VALUES (?, ?, ?, ?, ?)',
      [producto.nombre, producto.precio, producto.categoria, producto.imagen, producto.descripcion],
      (err) => {
        if (err) {
          console.error('Error al insertar producto:', err.message);
        }
      }
    );
  });

  console.log('✅ Datos de ejemplo insertados');
}

// Función para generar código público único
function generarCodigoPublico() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

// Función para obtener todos los productos
function getProductos(callback) {
  db.all('SELECT * FROM productos WHERE activo = 1 ORDER BY categoria, nombre', callback);
}

// =====================
// Categorías
// =====================

function getCategorias(callback) {
  db.all('SELECT id, nombre, activo FROM categorias WHERE activo = 1 ORDER BY nombre ASC', callback);
}

function createCategoria(nombre, callback) {
  const nombreTrim = (nombre || '').trim();
  if (!nombreTrim) {
    callback(new Error('Nombre de categoría requerido'), null);
    return;
  }
  db.run(
    'INSERT OR IGNORE INTO categorias (nombre, activo) VALUES (?, 1)',
    [nombreTrim],
    function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, this.lastID);
      }
    }
  );
}

// Función para obtener un producto por ID
function getProductoById(id, callback) {
  db.get('SELECT * FROM productos WHERE id = ? AND activo = 1', [id], callback);
}

// Función para crear un nuevo producto
function createProducto(producto, callback) {
  const { nombre, precio, categoria, imagen, descripcion } = producto;
  
  db.run(
    'INSERT INTO productos (nombre, precio, categoria, imagen, descripcion) VALUES (?, ?, ?, ?, ?)',
    [nombre, precio, categoria, imagen, descripcion],
    function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, this.lastID);
      }
    }
  );
}

// Función para actualizar un producto
function updateProducto(id, producto, callback) {
  const { nombre, precio, categoria, imagen, descripcion } = producto;
  
  db.run(
    'UPDATE productos SET nombre = ?, precio = ?, categoria = ?, imagen = ?, descripcion = ? WHERE id = ?',
    [nombre, precio, categoria, imagen, descripcion, id],
    function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, this.changes);
      }
    }
  );
}

// Función para eliminar un producto (soft delete)
function deleteProducto(id, callback) {
  db.run(
    'UPDATE productos SET activo = 0 WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, this.changes);
      }
    }
  );
}

// Función para crear un nuevo pedido
function createPedido(pedido, callback) {
  const { cliente, mesa, total, productos } = pedido;
  const fecha = new Date().toISOString();
  const codigo_publico = generarCodigoPublico();
  
  db.run(
    'INSERT INTO pedidos (cliente, mesa, total, fecha, codigo_publico) VALUES (?, ?, ?, ?, ?)',
    [cliente, mesa, total, fecha, codigo_publico],
    function(err) {
      if (err) {
        callback(err, null);
      } else {
        const pedidoId = this.lastID;
        
        // Insertar detalles del pedido
        if (productos && productos.length > 0) {
          let completed = 0;
          const totalProductos = productos.length;
          
          productos.forEach((producto) => {
            addDetallePedido({
              id_pedido: pedidoId,
              id_producto: producto.id,
              cantidad: producto.cantidad,
              subtotal: producto.subtotal
            }, (err) => {
              if (err) {
                console.error('Error al insertar detalle:', err);
              }
              
              completed++;
              if (completed === totalProductos) {
                callback(null, { id: pedidoId, codigo_publico });
              }
            });
          });
        } else {
          callback(null, { id: pedidoId, codigo_publico });
        }
      }
    }
  );
}

// Función para crear un pedido con lógica de reutilización de código público
function createPedidoConReutilizacion(pedido, callback) {
  const { cliente, mesa, total, productos } = pedido;
  
  // Primero verificar si existe un pedido activo reciente del mismo cliente
  getPedidoActivoReciente(cliente, (err, pedidoActivo) => {
    if (err) {
      console.error('Error al verificar pedido activo:', err);
      // Si hay error, proceder con la lógica normal
      createPedido(pedido, callback);
      return;
    }
    
    if (pedidoActivo) {
      // Existe un pedido activo, agregar productos al pedido existente
      console.log(`Agregando productos al pedido existente ${pedidoActivo.codigo_publico} para cliente ${cliente}`);
      
      const pedidoId = pedidoActivo.id;
      const codigo_publico = pedidoActivo.codigo_publico;
      
      // Actualizar el total del pedido existente
      const nuevoTotal = pedidoActivo.total + total;
      
      db.run(
        'UPDATE pedidos SET total = ? WHERE id = ?',
        [nuevoTotal, pedidoId],
        function(err) {
          if (err) {
            callback(err, null);
            return;
          }
          
          // Insertar detalles del pedido
          if (productos && productos.length > 0) {
            let completed = 0;
            const totalProductos = productos.length;
            
            productos.forEach((producto) => {
              addDetallePedido({
                id_pedido: pedidoId,
                id_producto: producto.id,
                cantidad: producto.cantidad,
                subtotal: producto.subtotal
              }, (err) => {
                if (err) {
                  console.error('Error al insertar detalle:', err);
                }
                
                completed++;
                if (completed === totalProductos) {
                  callback(null, { 
                    id: pedidoId, 
                    codigo_publico,
                    reutilizado: true,
                    pedido_original_id: pedidoActivo.id,
                    total_actualizado: nuevoTotal
                  });
                }
              });
            });
          } else {
            callback(null, { 
              id: pedidoId, 
              codigo_publico,
              reutilizado: true,
              pedido_original_id: pedidoActivo.id,
              total_actualizado: nuevoTotal
            });
          }
        }
      );
    } else {
      // No existe pedido activo, proceder con la lógica normal
      createPedido(pedido, callback);
    }
  });
}

// Función para agregar detalle al pedido
function addDetallePedido(detalle, callback) {
  const { id_pedido, id_producto, cantidad, subtotal, estado } = detalle;
  const estadoDetalle = estado || 'Pendiente';
  
  db.run(
    'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, subtotal, estado) VALUES (?, ?, ?, ?, ?)',
    [id_pedido, id_producto, cantidad, subtotal, estadoDetalle],
    callback
  );
}

// Función para obtener todos los pedidos
function getPedidos(callback) {
  db.all(`
    SELECT p.*, 
           GROUP_CONCAT(d.cantidad || 'x ' || pr.nombre) as productos
    FROM pedidos p
    LEFT JOIN detalle_pedido d ON p.id = d.id_pedido
    LEFT JOIN productos pr ON d.id_producto = pr.id
    GROUP BY p.id
    ORDER BY 
      CASE 
        WHEN p.estado = 'Pendiente' THEN 1
        WHEN p.estado = 'En preparación' THEN 2
        WHEN p.estado = 'Listo' THEN 3
        WHEN p.estado = 'Entregado' THEN 4
        WHEN p.estado = 'Cancelado' THEN 5
        ELSE 6
      END ASC,
      p.fecha DESC
  `, callback);
}

// Función para obtener un pedido por ID
function getPedidoById(id, callback) {
  db.get('SELECT * FROM pedidos WHERE id = ?', [id], callback);
}

// Función para obtener detalles de un pedido con estados
function getDetallesPedido(idPedido, callback) {
  db.all(`
    SELECT d.id, d.id_pedido, d.id_producto, d.cantidad, d.subtotal, d.estado,
           pr.nombre as producto_nombre, pr.precio as producto_precio
    FROM detalle_pedido d
    LEFT JOIN productos pr ON d.id_producto = pr.id
    WHERE d.id_pedido = ?
    ORDER BY d.id ASC
  `, [idPedido], callback);
}

// Función para actualizar estado de un detalle específico
function updateDetalleEstado(idDetalle, nuevoEstado, callback) {
  db.run(
    'UPDATE detalle_pedido SET estado = ? WHERE id = ?',
    [nuevoEstado, idDetalle],
    function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, this.changes);
      }
    }
  );
}

// Función para obtener pedido por código público
function getPedidoByCodigo(codigo, callback) {
  db.get(`
    SELECT p.*, 
           GROUP_CONCAT(d.cantidad || 'x ' || pr.nombre) as productos,
           GROUP_CONCAT(d.cantidad) as cantidades,
           GROUP_CONCAT(pr.nombre) as nombres_productos
    FROM pedidos p
    LEFT JOIN detalle_pedido d ON p.id = d.id_pedido
    LEFT JOIN productos pr ON d.id_producto = pr.id
    WHERE p.codigo_publico = ?
    GROUP BY p.id
  `, [codigo], callback);
}

// Función para obtener pedidos agrupados por código público
function getPedidosAgrupados(callback) {
  db.all(`
    SELECT 
      p.codigo_publico,
      p.cliente,
      COUNT(DISTINCT p.id) as cantidad_pedidos,
      MAX(p.fecha) as fecha_ultimo_pedido,
      GROUP_CONCAT(DISTINCT p.id) as ids_pedidos,
      SUM(p.total) as total_grupo,
      GROUP_CONCAT(DISTINCT p.estado) as estados
    FROM pedidos p
    GROUP BY p.codigo_publico, p.cliente
    ORDER BY MAX(p.fecha) DESC
  `, (err, grupos) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    // Procesar los resultados para incluir información adicional
    const gruposProcesados = grupos.map(grupo => ({
      codigo_publico: grupo.codigo_publico,
      cliente: grupo.cliente,
      cantidad_pedidos: grupo.cantidad_pedidos,
      fecha_ultimo_pedido: grupo.fecha_ultimo_pedido,
      ids_pedidos: grupo.ids_pedidos ? grupo.ids_pedidos.split(',').map(id => parseInt(id.trim())) : [],
      total_grupo: grupo.total_grupo || 0,
      estados: grupo.estados ? grupo.estados.split(',') : []
    }));
    
    callback(null, gruposProcesados);
  });
}

// Función para obtener todos los pedidos de un grupo por código público
function getPedidosPorGrupo(codigo, callback) {
  db.all(`
    SELECT p.*, 
           GROUP_CONCAT(d.cantidad || 'x ' || pr.nombre) as productos_string
    FROM pedidos p
    LEFT JOIN detalle_pedido d ON p.id = d.id_pedido
    LEFT JOIN productos pr ON d.id_producto = pr.id
    WHERE p.codigo_publico = ?
    GROUP BY p.id
    ORDER BY p.fecha DESC
  `, [codigo], (err, pedidos) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    // Para cada pedido, obtener sus detalles completos con estados
    if (!pedidos || pedidos.length === 0) {
      callback(null, []);
      return;
    }
    
    let completed = 0;
    const pedidosConDetalles = [];
    
    pedidos.forEach((pedido, index) => {
      getDetallesPedido(pedido.id, (err2, detalles) => {
        if (!err2) {
          pedido.detalles = detalles || [];
        } else {
          pedido.detalles = [];
        }
        
        pedidosConDetalles[index] = pedido;
        completed++;
        
        if (completed === pedidos.length) {
          callback(null, pedidosConDetalles);
        }
      });
    });
  });
}

// Función para verificar si existe un pedido activo del mismo cliente en las últimas 6 horas
function getPedidoActivoReciente(cliente, callback) {
  const seisHorasAtras = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  
  db.get(`
    SELECT p.*, 
           GROUP_CONCAT(d.cantidad || 'x ' || pr.nombre) as productos,
           GROUP_CONCAT(d.cantidad) as cantidades,
           GROUP_CONCAT(pr.nombre) as nombres_productos
    FROM pedidos p
    LEFT JOIN detalle_pedido d ON p.id = d.id_pedido
    LEFT JOIN productos pr ON d.id_producto = pr.id
    WHERE p.cliente = ? 
      AND p.fecha > ? 
      AND p.estado NOT IN ('Entregado', 'Cancelado')
    GROUP BY p.id
    ORDER BY p.fecha DESC
    LIMIT 1
  `, [cliente, seisHorasAtras], callback);
}

// Función para actualizar un pedido
function updatePedido(id, pedido, callback) {
  const { cliente, mesa, estado, total } = pedido;
  
  let sql = 'UPDATE pedidos SET ';
  let params = [];
  let updates = [];
  
  if (cliente !== undefined) {
    updates.push('cliente = ?');
    params.push(cliente);
  }
  if (mesa !== undefined) {
    updates.push('mesa = ?');
    params.push(mesa);
  }
  if (estado !== undefined) {
    updates.push('estado = ?');
    params.push(estado);
  }
  if (total !== undefined) {
    updates.push('total = ?');
    params.push(total);
  }
  
  if (updates.length === 0) {
    callback(new Error('No hay campos para actualizar'), null);
    return;
  }
  
  sql += updates.join(', ') + ' WHERE id = ?';
  params.push(id);
  
  db.run(sql, params, function(err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, this.changes);
    }
  });
}

// Función para eliminar un pedido
function deletePedido(id, callback) {
  db.run('DELETE FROM pedidos WHERE id = ?', [id], function(err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, this.changes);
    }
  });
}

// Función para cerrar la conexión
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err.message);
    } else {
      console.log('✅ Conexión a la base de datos cerrada');
    }
  });
}

// ========================================
// FUNCIONES DE ANALYTICS/DASHBOARD
// ========================================

// Función para obtener ventas por período
function getVentasPorPeriodo(periodo, callback) {
  let fechaInicio, fechaFin;
  const ahora = new Date();
  
  switch (periodo) {
    case 'dia':
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      fechaFin = new Date(fechaInicio.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'semana':
      const inicioSemana = ahora.getDate() - ahora.getDay();
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), inicioSemana);
      fechaFin = new Date(fechaInicio.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'mes':
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
      break;
    default:
      fechaInicio = new Date(0);
      fechaFin = new Date();
  }
  
  db.all(`
    SELECT 
      DATE(fecha) as fecha,
      COUNT(*) as total_pedidos,
      SUM(total) as total_ventas,
      AVG(total) as promedio_venta
    FROM pedidos 
    WHERE fecha >= ? AND fecha < ? AND estado != 'Cancelado'
    GROUP BY DATE(fecha)
    ORDER BY fecha DESC
  `, [fechaInicio.toISOString(), fechaFin.toISOString()], callback);
}

// Función para obtener productos más vendidos
function getProductosMasVendidos(limite = 10, callback) {
  db.all(`
    SELECT 
      pr.id,
      pr.nombre,
      pr.precio,
      SUM(d.cantidad) as total_vendido,
      COUNT(DISTINCT d.id_pedido) as veces_pedido,
      SUM(d.subtotal) as ingresos_generados
    FROM productos pr
    INNER JOIN detalle_pedido d ON pr.id = d.id_producto
    INNER JOIN pedidos p ON d.id_pedido = p.id
    WHERE p.estado != 'Cancelado'
      AND d.cantidad > 0
      AND d.cantidad IS NOT NULL
      AND d.subtotal IS NOT NULL
      AND d.subtotal > 0
    GROUP BY pr.id, pr.nombre, pr.precio
    HAVING SUM(d.cantidad) > 0
      AND SUM(d.subtotal) > 0
    ORDER BY total_vendido DESC, ingresos_generados DESC
    LIMIT ?
  `, [limite], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }
    // Filtrar y asegurar que los valores numéricos sean números, no strings
    const productos = rows
      .filter(row => {
        const totalVendido = parseFloat(row.total_vendido) || 0;
        const vecesPedido = parseInt(row.veces_pedido) || 0;
        const ingresos = parseFloat(row.ingresos_generados) || 0;
        return totalVendido > 0 && vecesPedido > 0 && ingresos >= 0;
      })
      .map(row => ({
        id: row.id,
        nombre: row.nombre,
        precio: parseFloat(row.precio) || 0,
        total_vendido: parseFloat(row.total_vendido) || 0,
        veces_pedido: parseInt(row.veces_pedido) || 0,
        ingresos_generados: parseFloat(row.ingresos_generados) || 0
      }));
    callback(null, productos);
  });
}

// Función para obtener clientes que más compran
function getClientesMasFrecuentes(limite = 10, callback) {
  db.all(`
    SELECT 
      cliente,
      COUNT(*) as total_pedidos,
      SUM(total) as total_gastado,
      AVG(total) as promedio_pedido,
      MAX(fecha) as ultimo_pedido
    FROM pedidos 
    WHERE estado != 'Cancelado' AND cliente IS NOT NULL AND cliente != ''
    GROUP BY cliente
    ORDER BY total_gastado DESC
    LIMIT ?
  `, [limite], callback);
}

// Función para obtener ingresos totales
function getIngresosTotales(callback) {
  db.get(`
    SELECT 
      SUM(CASE WHEN estado != 'Cancelado' THEN total ELSE 0 END) as ingresos_totales,
      COUNT(CASE WHEN estado != 'Cancelado' THEN 1 END) as pedidos_exitosos,
      COUNT(CASE WHEN estado = 'Cancelado' THEN 1 END) as pedidos_cancelados,
      COUNT(*) as total_pedidos,
      AVG(CASE WHEN estado != 'Cancelado' THEN total END) as promedio_pedido
    FROM pedidos
  `, callback);
}

// Función para obtener estado de pedidos
function getEstadoPedidos(callback) {
  db.all(`
    SELECT 
      estado,
      COUNT(*) as cantidad,
      SUM(total) as total_por_estado
    FROM pedidos
    GROUP BY estado
    ORDER BY cantidad DESC
  `, callback);
}

// Función para obtener ventas por hora del día
function getVentasPorHora(callback) {
  db.all(`
    SELECT 
      CAST(strftime('%H', fecha) AS INTEGER) as hora,
      COUNT(*) as pedidos,
      SUM(total) as ventas
    FROM pedidos
    WHERE estado != 'Cancelado'
    GROUP BY hora
    ORDER BY hora
  `, callback);
}

// Función para obtener ventas de la última semana por día (7 días completos)
function getVentasUltimaSemana(callback) {
  const hoy = new Date();
  const hace7Dias = new Date(hoy.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 días atrás para incluir hoy
  
  // Generar las fechas de los últimos 7 días
  const fechas = [];
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(hoy.getTime() - i * 24 * 60 * 60 * 1000);
    fechas.push(fecha.toISOString().split('T')[0]); // Solo la fecha (YYYY-MM-DD)
  }
  
  // Crear la consulta con LEFT JOIN para incluir días sin ventas
  // Usando UNION ALL para crear las fechas de manera compatible con SQLite
  const valoresFechas = fechas.map(fecha => `SELECT '${fecha}' as fecha_dia`).join(' UNION ALL ');
  
  db.all(`
    WITH dias_semana AS (
      ${valoresFechas}
    )
    SELECT 
      ds.fecha_dia as fecha,
      strftime('%w', ds.fecha_dia) as dia_semana,
      CASE strftime('%w', ds.fecha_dia)
        WHEN '0' THEN 'Domingo'
        WHEN '1' THEN 'Lunes'
        WHEN '2' THEN 'Martes'
        WHEN '3' THEN 'Miércoles'
        WHEN '4' THEN 'Jueves'
        WHEN '5' THEN 'Viernes'
        WHEN '6' THEN 'Sábado'
      END as nombre_dia,
      COALESCE(COUNT(p.id), 0) as pedidos,
      COALESCE(SUM(p.total), 0) as ventas,
      COALESCE(AVG(p.total), 0) as promedio_venta
    FROM dias_semana ds
    LEFT JOIN pedidos p ON DATE(p.fecha) = ds.fecha_dia AND p.estado != 'Cancelado'
    GROUP BY ds.fecha_dia
    ORDER BY ds.fecha_dia ASC
  `, callback);
}

// Función para obtener tendencia de ventas (últimos 30 días)
function getTendenciaVentas(callback) {
  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  db.all(`
    SELECT 
      DATE(fecha) as fecha,
      COUNT(*) as pedidos,
      SUM(total) as ventas
    FROM pedidos
    WHERE fecha >= ? AND estado != 'Cancelado'
    GROUP BY DATE(fecha)
    ORDER BY fecha ASC
  `, [hace30Dias.toISOString()], callback);
}

// Función para obtener pedidos por cliente con filtros
function getPedidosPorCliente(filtros, callback) {
  let whereConditions = [];
  let params = [];
  
  // Filtro por cliente
  if (filtros.cliente && filtros.cliente.trim() !== '') {
    whereConditions.push('p.cliente LIKE ?');
    params.push(`%${filtros.cliente.trim()}%`);
  }
  
  // Filtro por estado
  if (filtros.estado && filtros.estado !== '') {
    whereConditions.push('p.estado = ?');
    params.push(filtros.estado);
  }
  
  // Filtro por fecha desde
  if (filtros.fechaDesde) {
    whereConditions.push('DATE(p.fecha) >= ?');
    params.push(filtros.fechaDesde);
  }
  
  // Filtro por fecha hasta
  if (filtros.fechaHasta) {
    whereConditions.push('DATE(p.fecha) <= ?');
    params.push(filtros.fechaHasta);
  }
  
  // Filtro por rango de total
  if (filtros.totalMin) {
    whereConditions.push('p.total >= ?');
    params.push(filtros.totalMin);
  }
  
  if (filtros.totalMax) {
    whereConditions.push('p.total <= ?');
    params.push(filtros.totalMax);
  }
  
  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
  
  db.all(`
    SELECT 
      p.id,
      p.cliente,
      p.mesa,
      p.estado,
      p.total,
      p.fecha,
      p.codigo_publico,
      GROUP_CONCAT(d.cantidad || 'x ' || pr.nombre, ', ') as productos_detalle,
      GROUP_CONCAT(d.cantidad) as cantidades,
      GROUP_CONCAT(pr.nombre) as nombres_productos,
      GROUP_CONCAT(d.subtotal) as subtotales
    FROM pedidos p
    LEFT JOIN detalle_pedido d ON p.id = d.id_pedido
    LEFT JOIN productos pr ON d.id_producto = pr.id
    ${whereClause}
    GROUP BY p.id
    ORDER BY 
      CASE 
        WHEN p.estado = 'Pendiente' THEN 1
        WHEN p.estado = 'En preparación' THEN 2
        ELSE 3
      END,
      p.fecha DESC
    LIMIT ?
  `, [...params, filtros.limite || 50], callback);
}

// Función para obtener lista de clientes únicos
function getClientesUnicos(callback) {
  db.all(`
    SELECT DISTINCT cliente
    FROM pedidos 
    WHERE cliente IS NOT NULL AND cliente != ''
    ORDER BY cliente ASC
  `, callback);
}

// ==========================================
// FUNCIONES DE AUTENTICACIÓN Y USUARIOS
// ==========================================

// Función para obtener usuario por nombre de usuario
function getUsuarioByUsername(usuario, callback) {
  db.get(
    'SELECT id, usuario, password, rol, activo FROM usuarios WHERE usuario = ? AND activo = 1',
    [usuario],
    callback
  );
}

// Función para crear usuarios iniciales (admin y cliente)
function createDefaultUsers(callback) {
  const usuarios = [
    { usuario: 'admin', password: 'admin123', rol: 'admin' },
    { usuario: 'cliente', password: 'cliente123', rol: 'cliente' }
  ];

  let completed = 0;
  const total = usuarios.length;
  
  if (total === 0) {
    callback(null);
    return;
  }

  console.log('👥 Iniciando creación de usuarios por defecto...');

  usuarios.forEach((user) => {
    db.get('SELECT id FROM usuarios WHERE usuario = ?', [user.usuario], (err, row) => {
      if (err) {
        console.error(`❌ Error al verificar usuario ${user.usuario}:`, err);
        completed++;
        if (completed === total) {
          console.log('✅ Proceso de creación de usuarios completado');
          callback(null);
        }
        return;
      }

      if (!row) {
        // Usuario no existe, crearlo
        console.log(`📝 Creando usuario ${user.usuario} con rol ${user.rol}...`);
        db.run(
          'INSERT INTO usuarios (usuario, password, rol, activo) VALUES (?, ?, ?, 1)',
          [user.usuario, user.password, user.rol],
          function(err) {
            if (err) {
              console.error(`❌ Error al crear usuario ${user.usuario}:`, err);
            } else {
              console.log(`✅ Usuario ${user.usuario} creado con rol ${user.rol} (ID: ${this.lastID})`);
            }
            completed++;
            if (completed === total) {
              console.log('✅ Proceso de creación de usuarios completado');
              callback(null);
            }
          }
        );
      } else {
        // Usuario ya existe
        console.log(`ℹ️ Usuario ${user.usuario} ya existe (ID: ${row.id})`);
        completed++;
        if (completed === total) {
          console.log('✅ Proceso de creación de usuarios completado');
          callback(null);
        }
      }
    });
  });
}

// Exportar funciones y la instancia de la base de datos
module.exports = {
  db,
  initializeDatabase,
  createTables,
  insertSampleData,
  generarCodigoPublico,
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  createPedido,
  createPedidoConReutilizacion,
  addDetallePedido,
  getPedidos,
  getPedidoById,
  getPedidoByCodigo,
  getPedidoActivoReciente,
  getPedidosAgrupados,
  getPedidosPorGrupo,
  getDetallesPedido,
  updateDetalleEstado,
  updatePedido,
  deletePedido,
  closeDatabase,
  // Funciones de Analytics
  getVentasPorPeriodo,
  getProductosMasVendidos,
  getClientesMasFrecuentes,
  getIngresosTotales,
  getEstadoPedidos,
  getVentasPorHora,
  getVentasUltimaSemana,
  getTendenciaVentas,
  getPedidosPorCliente,
  getClientesUnicos,
  // Categorías
  getCategorias,
  createCategoria,
  // Autenticación
  getUsuarioByUsername,
  createDefaultUsers
};
