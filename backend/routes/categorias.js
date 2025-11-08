const express = require('express');
const router = express.Router();
const { getCategorias, createCategoria } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /categorias - Listar categorías activas
router.get('/', (req, res) => {
  getCategorias((err, categorias) => {
    if (err) {
      console.error('Error al obtener categorías:', err);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las categorías'
      });
    }
    res.json({ success: true, data: categorias, count: categorias.length });
  });
});

// POST /categorias - Crear nueva categoría (solo admin)
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({
      success: false,
      error: 'Datos requeridos faltantes',
      message: 'El nombre de la categoría es obligatorio'
    });
  }

  createCategoria(nombre, (err, id) => {
    if (err) {
      console.error('Error al crear categoría:', err);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo crear la categoría'
      });
    }
    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: { id, nombre: String(nombre).trim(), activo: 1 }
    });
  });
});

module.exports = router;


