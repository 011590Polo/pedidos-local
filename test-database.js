const { 
  createTables, 
  insertSampleData, 
  getProductos, 
  createPedido, 
  addDetallePedido, 
  getPedidos,
  closeDatabase 
} = require('./database');

// Función para probar la base de datos
async function testDatabase() {
  console.log('🧪 Iniciando pruebas de la base de datos...\n');

  try {
    // Esperar un poco para que se creen las tablas
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Insertar datos de ejemplo
    console.log('📝 Insertando datos de ejemplo...');
    insertSampleData();

    // Esperar un poco más
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Probar obtener productos
    console.log('\n📦 Obteniendo productos...');
    getProductos((err, productos) => {
      if (err) {
        console.error('❌ Error al obtener productos:', err);
      } else {
        console.log('✅ Productos obtenidos:', productos.length);
        productos.forEach(producto => {
          console.log(`  - ${producto.nombre}: $${producto.precio} (${producto.categoria})`);
        });
      }
    });

    // Esperar un poco más
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Probar crear un pedido
    console.log('\n🛒 Creando pedido de prueba...');
    const nuevoPedido = {
      cliente: 'Juan Pérez',
      mesa: 'Mesa 5',
      total: 25.50,
      codigo_publico: 'PED001'
    };

    createPedido(nuevoPedido, (err, pedidoId) => {
      if (err) {
        console.error('❌ Error al crear pedido:', err);
      } else {
        console.log(`✅ Pedido creado con ID: ${pedidoId}`);

        // Agregar detalle al pedido
        const detalle = {
          id_pedido: pedidoId,
          id_producto: 1, // Hamburguesa Clásica
          cantidad: 2,
          subtotal: 25.00
        };

        addDetallePedido(detalle, (err) => {
          if (err) {
            console.error('❌ Error al agregar detalle:', err);
          } else {
            console.log('✅ Detalle agregado al pedido');
          }
        });
      }
    });

    // Esperar un poco más
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Probar obtener pedidos
    console.log('\n📋 Obteniendo pedidos...');
    getPedidos((err, pedidos) => {
      if (err) {
        console.error('❌ Error al obtener pedidos:', err);
      } else {
        console.log('✅ Pedidos obtenidos:', pedidos.length);
        pedidos.forEach(pedido => {
          console.log(`  - Pedido ${pedido.id}: ${pedido.cliente} - Mesa ${pedido.mesa} - $${pedido.total} - ${pedido.estado}`);
        });
      }

      // Cerrar la base de datos después de las pruebas
      setTimeout(() => {
        console.log('\n🔚 Cerrando conexión a la base de datos...');
        closeDatabase();
        console.log('✅ Pruebas completadas');
      }, 1000);
    });

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    closeDatabase();
  }
}

// Ejecutar las pruebas
testDatabase();

