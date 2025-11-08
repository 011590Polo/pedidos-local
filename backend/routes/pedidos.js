const express = require('express');
const router = express.Router();
const {
  getPedidos,
  getPedidoById,
  getPedidoByCodigo,
  createPedidoConReutilizacion,
  updatePedido,
  deletePedido,
  getDetallesPedido,
  updateDetalleEstado,
  getPedidosAgrupados,
  getPedidosPorGrupo
} = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /pedidos - Listar todos los pedidos (solo admin)
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const includeDetalles = req.query.include === 'detalles';
  
  getPedidos((err, pedidos) => {
    if (err) {
      console.error('Error al obtener pedidos:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los pedidos'
      });
    }
    
    if (includeDetalles && pedidos && pedidos.length > 0) {
      // Obtener detalles para cada pedido
      let pedidosConDetalles = [];
      let completed = 0;
      
      pedidos.forEach((pedido, index) => {
        getDetallesPedido(pedido.id, (err2, detalles) => {
          if (!err2 && detalles) {
            pedido.detalles = detalles;
          } else {
            pedido.detalles = [];
          }
          
          pedidosConDetalles[index] = pedido;
          completed++;
          
          if (completed === pedidos.length) {
            res.json({
              success: true,
              data: pedidosConDetalles,
              count: pedidosConDetalles.length
            });
          }
        });
      });
    } else {
      res.json({
        success: true,
        data: pedidos,
        count: pedidos.length
      });
    }
  });
});

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros genéricos
// GET /pedidos/agrupados - Obtener pedidos agrupados por código público (solo admin)
router.get('/agrupados', requireAuth, requireAdmin, (req, res) => {
  getPedidosAgrupados((err, grupos) => {
    if (err) {
      console.error('Error al obtener pedidos agrupados:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los pedidos agrupados'
      });
    }
    
    res.json({
      success: true,
      data: grupos || [],
      count: grupos ? grupos.length : 0
    });
  });
});

// GET /pedidos/grupo/:codigo - Obtener todos los pedidos de un grupo por código público (solo admin)
router.get('/grupo/:codigo', requireAuth, requireAdmin, (req, res) => {
  const { codigo } = req.params;
  
  if (!codigo || codigo.trim().length === 0) {
    return res.status(400).json({
      error: 'Código inválido',
      message: 'El código público es requerido'
    });
  }
  
  getPedidosPorGrupo(codigo, (err, pedidos) => {
    if (err) {
      console.error('Error al obtener pedidos del grupo:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los pedidos del grupo'
      });
    }
    
    res.json({
      success: true,
      data: pedidos || [],
      count: pedidos ? pedidos.length : 0
    });
  });
});

// GET /pedidos/seguimiento/:codigo - Consultar pedido por código público
router.get('/seguimiento/:codigo', (req, res) => {
  const { codigo } = req.params;
  
  if (!codigo || codigo.trim().length === 0) {
    return res.status(400).json({
      error: 'Código inválido',
      message: 'El código de seguimiento es requerido'
    });
  }
  
  getPedidoByCodigo(codigo.trim().toUpperCase(), (err, pedido) => {
    if (err) {
      console.error('Error al obtener pedido por código:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el pedido'
      });
    }
    
    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
        message: 'No se encontró un pedido con ese código de seguimiento'
      });
    }
    
    // Formatear la respuesta para el seguimiento
    const respuesta = {
      codigo_publico: pedido.codigo_publico,
      estado: pedido.estado,
      total: pedido.total,
      fecha: pedido.fecha,
      cliente: pedido.cliente,
      mesa: pedido.mesa,
      productos: pedido.productos || 'Sin productos',
      cantidades: pedido.cantidades || '',
      nombres_productos: pedido.nombres_productos || ''
    };
    
    res.json({
      success: true,
      data: respuesta
    });
  });
});

// GET /pedidos/:id/detalles - Obtener detalles de un pedido con estados (solo admin)
router.get('/:id/detalles', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  getDetallesPedido(id, (err, detalles) => {
    if (err) {
      console.error('Error al obtener detalles:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los detalles del pedido'
      });
    }
    
    res.json({
      success: true,
      data: detalles || [],
      count: detalles ? detalles.length : 0
    });
  });
});

// GET /pedidos/:id - Obtener un pedido específico (DEBE IR AL FINAL) (solo admin)
router.get('/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  getPedidoById(id, (err, pedido) => {
    if (err) {
      console.error('Error al obtener pedido:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el pedido'
      });
    }
    
    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
        message: 'El pedido solicitado no existe'
      });
    }
    
    res.json({
      success: true,
      data: pedido
    });
  });
});

// PUT /pedidos/:id/detalle/:detalleId - Actualizar estado de un detalle específico (solo admin)
router.put('/:id/detalle/:detalleId', requireAuth, requireAdmin, (req, res) => {
  const { id, detalleId } = req.params;
  const { estado } = req.body;
  
  if (!id || isNaN(id) || !detalleId || isNaN(detalleId)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'Los IDs deben ser números válidos'
    });
  }
  
  if (!estado || !['Pendiente', 'En preparación', 'Listo', 'Entregado', 'Cancelado'].includes(estado)) {
    return res.status(400).json({
      error: 'Estado inválido',
      message: 'El estado debe ser: Pendiente, En preparación, Listo, Entregado o Cancelado'
    });
  }
  
  updateDetalleEstado(detalleId, estado, (err, changes) => {
    if (err) {
      console.error('Error al actualizar detalle:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el estado del detalle'
      });
    }
    
    if (changes === 0) {
      return res.status(404).json({
        error: 'Detalle no encontrado',
        message: 'El detalle solicitado no existe'
      });
    }
    
    // Obtener el detalle actualizado y el pedido completo para emitir evento
    getDetallesPedido(id, (err2, detalles) => {
      if (err2) {
        console.error('Error al obtener detalles actualizados:', err2);
      }
      
      getPedidoById(id, (err3, pedido) => {
        if (err3) {
          console.error('Error al obtener pedido:', err3);
        }
        
        res.json({
          success: true,
          message: 'Estado del detalle actualizado exitosamente',
          data: {
            detalleId: parseInt(detalleId),
            nuevoEstado: estado,
            detalles: detalles || []
          }
        });
        
        // Emitir evento de actualización de detalle
        try {
          const io = req.app.get('io');
          if (io && pedido && pedido.codigo_publico) {
            const payload = {
              id_pedido: parseInt(id),
              id_detalle: parseInt(detalleId),
              nuevo_estado: estado,
              codigo_publico: pedido.codigo_publico,
              detalles: detalles || []
            };
            // Emitir a la sala de seguimiento
            const room = `seguimiento:${pedido.codigo_publico}`;
            io.to(room).emit('detallePedidoActualizado', payload);
            // Emitir globalmente para actualizar todas las vistas
            io.emit('detallePedidoActualizado', payload);
          }
        } catch (emitErr) {
          console.error('Error al emitir evento detallePedidoActualizado:', emitErr);
        }
      });
    });
  });
});

// POST /pedidos - Crear un nuevo pedido (público - cualquier cliente puede crear pedidos)
router.post('/', (req, res) => {
  const { cliente, mesa, productos } = req.body;
  
  // Validaciones básicas
  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      error: 'Productos requeridos',
      message: 'Debe incluir al menos un producto en el pedido'
    });
  }
  
  // Validar estructura de productos
  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];
    console.log(producto);
    if (!producto.id || !producto.cantidad || !producto.precio) {
      return res.status(400).json({
        error: 'Datos de producto inválidos',
        message: `El producto ${i + 1} debe tener id, cantidad y precio`
      });
    }
    
    if (producto.cantidad <= 0 || producto.precio <= 0) {
      return res.status(400).json({
        error: 'Datos de producto inválidos',
        message: `El producto ${i + 1} debe tener cantidad y precio mayores a 0`
      });
    }
  }
  
  // Calcular total
  debugger;
  let total = 0;
  const productosConSubtotal = productos.map(producto => {
    console.log(producto);
    const subtotal = producto.cantidad * producto.precio;
    total += subtotal;
    return {
      id: producto.id,
      cantidad: producto.cantidad,
      subtotal: subtotal
    };
  });
  
  const pedido = {
    cliente: cliente ? cliente.trim() : 'Cliente no especificado',
    mesa: mesa ? mesa.trim() : null,
    total: parseFloat(total.toFixed(2)),
    productos: productosConSubtotal,
    concat_productos_nombres: productosConSubtotal.map(producto => producto.nombre).join(', ')
  };
  createPedidoConReutilizacion(pedido, (err, resultado) => {
    if (err) {
      console.error('Error al crear pedido:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear el pedido'
      });
    }
    
    // Construir respuesta base y luego complementar con agregados desde la BD
    const basePedido = {
      id: resultado.id,
      codigo_publico: resultado.codigo_publico,
      cliente: pedido.cliente,
      mesa: pedido.mesa,
      total: resultado.total_actualizado || pedido.total
    };

    // Determinar el mensaje según si se reutilizó el código o no
    let mensaje = 'Pedido creado exitosamente';
    if (resultado.reutilizado) {
      mensaje = `Productos agregados al pedido existente con código público ${resultado.codigo_publico}`;
      basePedido.reutilizado = true;
      basePedido.pedido_original_id = resultado.pedido_original_id;
      basePedido.total_actualizado = resultado.total_actualizado;
    }

    // Consultar el pedido con productos agregados (cadena concatenada como en getPedidos)
    getPedidoByCodigo(basePedido.codigo_publico, (aggErr, pedidoAgg) => {
      const respuesta = {
        ...basePedido,
        // Asegurar consistencia de campos esperados en frontend
        estado: (pedidoAgg && pedidoAgg.estado) ? pedidoAgg.estado : 'Pendiente',
        fecha: (pedidoAgg && pedidoAgg.fecha) ? pedidoAgg.fecha : new Date().toISOString(),
        cliente: (pedidoAgg && pedidoAgg.cliente) ? pedidoAgg.cliente : basePedido.cliente,
        mesa: (pedidoAgg && pedidoAgg.mesa) ? pedidoAgg.mesa : basePedido.mesa,
        // Si la consulta falla o no trae productos, caer al formato original
        productos: (pedidoAgg && pedidoAgg.productos) ? pedidoAgg.productos : pedido.productos
      };

      // Responder al cliente HTTP con datos consistentes
      res.status(201).json({
        success: true,
        message: mensaje,
        data: respuesta
      });

      // Emitir evento por Socket.IO para notificar a clientes conectados con los productos concatenados
      try {
        const io = req.app.get('io');
        if (io) io.emit('pedidoCreado', respuesta);
      } catch (emitErr) {
        console.error('Error al emitir evento pedidoCreado:', emitErr);
      }
    });
  });
});

// PUT /pedidos/:id - Actualizar un pedido (solo admin)
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { cliente, mesa, estado, total } = req.body;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  // Validaciones
  if (estado && !['Pendiente', 'En preparación', 'Listo', 'Entregado', 'Cancelado'].includes(estado)) {
    return res.status(400).json({
      error: 'Estado inválido',
      message: 'El estado debe ser: Pendiente, En preparación, Listo, Entregado o Cancelado'
    });
  }
  
  if (total !== undefined && (typeof total !== 'number' || total < 0)) {
    return res.status(400).json({
      error: 'Total inválido',
      message: 'El total debe ser un número mayor o igual a 0'
    });
  }
  
  const pedido = {};
  if (cliente !== undefined) pedido.cliente = cliente.trim();
  if (mesa !== undefined) pedido.mesa = mesa ? mesa.trim() : null;
  if (estado !== undefined) pedido.estado = estado;
  if (total !== undefined) pedido.total = parseFloat(total);
  
  if (Object.keys(pedido).length === 0) {
    return res.status(400).json({
      error: 'Datos faltantes',
      message: 'Debe proporcionar al menos un campo para actualizar'
    });
  }
  
  updatePedido(id, pedido, (err, changes) => {
    if (err) {
      console.error('Error al actualizar pedido:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el pedido'
      });
    }
    
    if (changes === 0) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
        message: 'El pedido solicitado no existe'
      });
    }
    // Obtener el pedido actualizado para conocer su codigo_publico y estado
    getPedidoById(id, (err2, pedidoActualizado) => {
      if (err2) {
        console.error('Error al obtener pedido actualizado:', err2);
      }

      // Responder al cliente HTTP
      res.json({
        success: true,
        message: 'Pedido actualizado exitosamente',
        data: {
          id: parseInt(id),
          ...pedido
        }
      });

      // Emitir evento solo si en la petición se actualizó el estado (interesa a quien está en seguimiento)
      try {
        if (pedido.estado !== undefined && pedidoActualizado && pedidoActualizado.codigo_publico) {
          const io = req.app.get('io');
          const room = `seguimiento:${pedidoActualizado.codigo_publico}`;
          const payload = {
            id: pedidoActualizado.id,
            codigo_publico: pedidoActualizado.codigo_publico,
            estado: pedidoActualizado.estado,
            total: pedidoActualizado.total,
            fecha: pedidoActualizado.fecha,
            cliente: pedidoActualizado.cliente,
            mesa: pedidoActualizado.mesa
          };
          if (io) {
            io.to(room).emit('pedidoActualizado', payload);
            // Emitir también de forma global para que otras vistas (listas/dashboard) actualicen
            io.emit('pedidoActualizado', payload);
          }
        }
      } catch (emitErr) {
        console.error('Error al emitir evento pedidoActualizado:', emitErr);
      }
    });
  });
});

// DELETE /pedidos/:id - Eliminar un pedido (solo admin)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  deletePedido(id, (err, changes) => {
    if (err) {
      console.error('Error al eliminar pedido:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el pedido'
      });
    }
    
    if (changes === 0) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
        message: 'El pedido solicitado no existe'
      });
    }
    
    res.json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });
  });
});

module.exports = router;
