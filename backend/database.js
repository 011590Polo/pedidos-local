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
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (id_producto) REFERENCES productos(id)
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
  const { id_pedido, id_producto, cantidad, subtotal } = detalle;
  
  db.run(
    'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)',
    [id_pedido, id_producto, cantidad, subtotal],
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
    ORDER BY p.fecha DESC
  `, callback);
}

// Función para obtener un pedido por ID
function getPedidoById(id, callback) {
  db.get('SELECT * FROM pedidos WHERE id = ?', [id], callback);
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
  updatePedido,
  deletePedido,
  closeDatabase
};
