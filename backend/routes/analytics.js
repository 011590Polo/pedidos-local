const express = require('express');
const router = express.Router();
const {
  getVentasPorPeriodo,
  getProductosMasVendidos,
  getClientesMasFrecuentes,
  getIngresosTotales,
  getEstadoPedidos,
  getVentasPorHora,
  getVentasUltimaSemana,
  getTendenciaVentas,
  getPedidosPorCliente,
  getClientesUnicos
} = require('../database');

// GET /analytics/ventas/:periodo - Ventas por período (dia, semana, mes)
router.get('/ventas/:periodo', (req, res) => {
  const { periodo } = req.params;
  
  if (!['dia', 'semana', 'mes'].includes(periodo)) {
    return res.status(400).json({
      error: 'Período inválido',
      message: 'El período debe ser: dia, semana o mes'
    });
  }
  
  getVentasPorPeriodo(periodo, (err, ventas) => {
    if (err) {
      console.error('Error al obtener ventas por período:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las ventas'
      });
    }
    
    res.json({
      success: true,
      data: ventas,
      periodo: periodo
    });
  });
});

// GET /analytics/productos-mas-vendidos - Productos más vendidos
router.get('/productos-mas-vendidos', (req, res) => {
  const limite = parseInt(req.query.limite) || 10;
  
  getProductosMasVendidos(limite, (err, productos) => {
    if (err) {
      console.error('Error al obtener productos más vendidos:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los productos'
      });
    }
    
    res.json({
      success: true,
      data: productos,
      limite: limite
    });
  });
});

// GET /analytics/clientes-mas-frecuentes - Clientes que más compran
router.get('/clientes-mas-frecuentes', (req, res) => {
  const limite = parseInt(req.query.limite) || 10;
  
  getClientesMasFrecuentes(limite, (err, clientes) => {
    if (err) {
      console.error('Error al obtener clientes más frecuentes:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los clientes'
      });
    }
    
    res.json({
      success: true,
      data: clientes,
      limite: limite
    });
  });
});

// GET /analytics/ingresos-totales - Ingresos totales y estadísticas generales
router.get('/ingresos-totales', (req, res) => {
  getIngresosTotales((err, ingresos) => {
    if (err) {
      console.error('Error al obtener ingresos totales:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los ingresos'
      });
    }
    
    res.json({
      success: true,
      data: ingresos
    });
  });
});

// GET /analytics/estado-pedidos - Estado de pedidos
router.get('/estado-pedidos', (req, res) => {
  getEstadoPedidos((err, estados) => {
    if (err) {
      console.error('Error al obtener estado de pedidos:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el estado de pedidos'
      });
    }
    
    res.json({
      success: true,
      data: estados
    });
  });
});

// GET /analytics/ventas-por-hora - Ventas por hora del día
router.get('/ventas-por-hora', (req, res) => {
  getVentasPorHora((err, ventasHora) => {
    if (err) {
      console.error('Error al obtener ventas por hora:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las ventas por hora'
      });
    }
    
    res.json({
      success: true,
      data: ventasHora
    });
  });
});

// GET /analytics/tendencia-ventas - Tendencia de ventas (últimos 30 días)
router.get('/tendencia-ventas', (req, res) => {
  getTendenciaVentas((err, tendencia) => {
    if (err) {
      console.error('Error al obtener tendencia de ventas:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la tendencia de ventas'
      });
    }
    
    res.json({
      success: true,
      data: tendencia
    });
  });
});

// GET /analytics/ventas-ultima-semana - Ventas de la última semana por día
router.get('/ventas-ultima-semana', (req, res) => {
  getVentasUltimaSemana((err, ventasSemana) => {
    if (err) {
      console.error('Error al obtener ventas de la última semana:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las ventas de la última semana'
      });
    }
    
    res.json({
      success: true,
      data: ventasSemana
    });
  });
});

// GET /analytics/pedidos-por-cliente - Pedidos por cliente con filtros
router.get('/pedidos-por-cliente', (req, res) => {
  const filtros = {
    cliente: req.query.cliente || '',
    estado: req.query.estado || '',
    fechaDesde: req.query.fechaDesde || '',
    fechaHasta: req.query.fechaHasta || '',
    totalMin: req.query.totalMin ? parseFloat(req.query.totalMin) : null,
    totalMax: req.query.totalMax ? parseFloat(req.query.totalMax) : null,
    limite: req.query.limite ? parseInt(req.query.limite) : 50
  };
  
  getPedidosPorCliente(filtros, (err, pedidos) => {
    if (err) {
      console.error('Error al obtener pedidos por cliente:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los pedidos'
      });
    }
    
    res.json({
      success: true,
      data: pedidos,
      filtros: filtros
    });
  });
});

// GET /analytics/clientes-unicos - Lista de clientes únicos
router.get('/clientes-unicos', (req, res) => {
  getClientesUnicos((err, clientes) => {
    if (err) {
      console.error('Error al obtener clientes únicos:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los clientes'
      });
    }
    
    res.json({
      success: true,
      data: clientes.map(c => c.cliente)
    });
  });
});

// GET /analytics/dashboard - Resumen completo del dashboard
router.get('/dashboard', (req, res) => {
  let completados = 0;
  const totalConsultas = 7;
  const resultados = {};
  
  // Función para verificar si todas las consultas están completas
  const verificarCompletado = () => {
    completados++;
    if (completados === totalConsultas) {
      res.json({
        success: true,
        data: resultados
      });
    }
  };
  
  // Obtener ingresos totales
  getIngresosTotales((err, ingresos) => {
    if (err) console.error('Error en ingresos totales:', err);
    resultados.ingresos = ingresos || {};
    verificarCompletado();
  });
  
  // Obtener estado de pedidos
  getEstadoPedidos((err, estados) => {
    if (err) console.error('Error en estado pedidos:', err);
    resultados.estados = estados || [];
    verificarCompletado();
  });
  
  // Obtener productos más vendidos
  getProductosMasVendidos(5, (err, productos) => {
    if (err) console.error('Error en productos más vendidos:', err);
    resultados.productosMasVendidos = productos || [];
    verificarCompletado();
  });
  
  // Obtener clientes más frecuentes
  getClientesMasFrecuentes(5, (err, clientes) => {
    if (err) console.error('Error en clientes más frecuentes:', err);
    resultados.clientesMasFrecuentes = clientes || [];
    verificarCompletado();
  });
  
  // Obtener ventas del día
  getVentasPorPeriodo('dia', (err, ventasDia) => {
    if (err) console.error('Error en ventas del día:', err);
    resultados.ventasDia = ventasDia || [];
    verificarCompletado();
  });
  
  // Obtener ventas de la última semana (reemplaza ventas por hora)
  getVentasUltimaSemana((err, ventasSemana) => {
    if (err) console.error('Error en ventas de la última semana:', err);
    resultados.ventasUltimaSemana = ventasSemana || [];
    verificarCompletado();
  });
  
  // Obtener tendencia de ventas
  getTendenciaVentas((err, tendencia) => {
    if (err) console.error('Error en tendencia de ventas:', err);
    resultados.tendenciaVentas = tendencia || [];
    verificarCompletado();
  });
});

module.exports = router;
