const express = require('express');
const router = express.Router();
const {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} = require('../database');

// GET /productos - Listar todos los productos
router.get('/', (req, res) => {
  getProductos((err, productos) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los productos'
      });
    }
    
    res.json({
      success: true,
      data: productos,
      count: productos.length
    });
  });
});

// GET /productos/:id - Obtener un producto específico
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  getProductoById(id, (err, producto) => {
    if (err) {
      console.error('Error al obtener producto:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el producto'
      });
    }
    
    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: 'El producto solicitado no existe'
      });
    }
    
    res.json({
      success: true,
      data: producto
    });
  });
});

// POST /productos - Crear un nuevo producto
router.post('/', (req, res) => {
  const { nombre, precio, categoria, imagen, descripcion } = req.body;
  
  // Validaciones
  if (!nombre || !precio) {
    return res.status(400).json({
      error: 'Datos requeridos faltantes',
      message: 'El nombre y precio son obligatorios'
    });
  }
  
  if (typeof precio !== 'number' || precio <= 0) {
    return res.status(400).json({
      error: 'Precio inválido',
      message: 'El precio debe ser un número mayor a 0'
    });
  }
  
  const producto = {
    nombre: nombre.trim(),
    precio: parseFloat(precio),
    categoria: categoria ? categoria.trim() : null,
    imagen: imagen ? imagen.trim() : null,
    descripcion: descripcion ? descripcion.trim() : null
  };
  
  createProducto(producto, (err, productoId) => {
    if (err) {
      console.error('Error al crear producto:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear el producto'
      });
    }
    const nuevoProducto = {
      id: productoId,
      ...producto
    };

    // Responder al cliente que creó el producto
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: nuevoProducto
    });

    // Emitir evento a todos los clientes conectados vía Socket.IO
    try {
      const io = req.app.get('io');
      if (io) io.emit('productoCreado', nuevoProducto);
    } catch (emitErr) {
      console.error('Error al emitir evento productoCreado:', emitErr);
    }
  });
});

// PUT /productos/:id - Actualizar un producto
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria, imagen, descripcion } = req.body;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  // Validaciones
  if (precio !== undefined && (typeof precio !== 'number' || precio <= 0)) {
    return res.status(400).json({
      error: 'Precio inválido',
      message: 'El precio debe ser un número mayor a 0'
    });
  }
  
  const producto = {};
  if (nombre !== undefined) producto.nombre = nombre.trim();
  if (precio !== undefined) producto.precio = parseFloat(precio);
  if (categoria !== undefined) producto.categoria = categoria ? categoria.trim() : null;
  if (imagen !== undefined) producto.imagen = imagen ? imagen.trim() : null;
  if (descripcion !== undefined) producto.descripcion = descripcion ? descripcion.trim() : null;
  
  if (Object.keys(producto).length === 0) {
    return res.status(400).json({
      error: 'Datos faltantes',
      message: 'Debe proporcionar al menos un campo para actualizar'
    });
  }
  
  updateProducto(id, producto, (err, changes) => {
    if (err) {
      console.error('Error al actualizar producto:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el producto'
      });
    }
    
    if (changes === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: 'El producto solicitado no existe'
      });
    }
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        id: parseInt(id),
        ...producto
      }
    });
  });
});

// DELETE /productos/:id - Eliminar un producto
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  deleteProducto(id, (err, changes) => {
    if (err) {
      console.error('Error al eliminar producto:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el producto'
      });
    }
    
    if (changes === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: 'El producto solicitado no existe'
      });
    }
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  });
});

module.exports = router;
