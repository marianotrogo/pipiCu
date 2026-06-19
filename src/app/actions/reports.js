// actions/reports.js
'use server'
import connectDB from "../../lib/mongodb"; // Tu conexión de confianza
import Order from "../../models/Order";    // Tu modelo real de órdenes

export async function obtenerDatosReporteAction(periodo = "hoy") {
  try {
    await connectDB();

    const ahora = new Date();
    let inicio = new Date();
    let fin = new Date();

    // Configuración estricta de fechas según tu pedido
    if (periodo === "hoy") {
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
    } else if (periodo === "semana") {
      inicio.setDate(ahora.getDate() - 7);
    } else if (periodo === "mes") {
      inicio.setMonth(ahora.getMonth() - 1);
    } else if (periodo === "anio") {
      inicio.setFullYear(ahora.getFullYear() - 1);
    }

    // Buscamos SOLO las órdenes con tus estados reales de facturación
    const query = {
      status: { $in: ["COBRADO", "CUENTA_CORRIENTE"] },
      ...(periodo === "hoy" 
        ? { createdAt: { $gte: inicio, $lte: fin } } 
        : { createdAt: { $gte: inicio } }
      )
    };

    const orders = await Order.find(query).lean();

    // Procesamos la data en el servidor para mandarte el reporte masticado
    let totalIngresos = 0;
    const porMetodo = { 
      EFECTIVO: 0, CREDITO: 0, TRANSFERENCIA: 0, 
      QR: 0, CUENTA_CORRIENTE: 0, PAGOS_CUENTA_CORRIENTE: 0 
    };
    const conteoProductos = {};

    orders.forEach(order => {
      // 1. Sumamos importes por pasarela/método real
      if (order.payments && order.payments.length > 0) {
        order.payments.forEach(p => {
          const monto = Number(p.amount || 0);
          totalIngresos += monto;

          // CORRECCIÓN ACÁ: Quitamos espacios vacíos que puedan venir de la DB (ej: "Efectivo " -> "EFECTIVO")
          let m = String(p.method || '').trim().toUpperCase();
          
          // Mapeos rápidos por si los guardás con variantes de texto común
          if (m === "MERCADOPAGO" || m === "MERCADO PAGO" || m.includes("QR")) m = "QR";
          if (m === "DEBITO" || m === "TARJETA") m = "CREDITO";

          if (porMetodo[m] !== undefined) {
            porMetodo[m] += monto;
          } else {
            // Si el status general es CUENTA_CORRIENTE y falló el método, va para ahí
            if (order.status === "CUENTA_CORRIENTE") {
              porMetodo["CUENTA_CORRIENTE"] += monto;
            } else {
              porMetodo["EFECTIVO"] += monto;
            }
          }
        });
      } else {
        const montoUnico = Number(order.total || 0);
        totalIngresos += montoUnico;
        
        if (order.status === "CUENTA_CORRIENTE") {
          porMetodo["CUENTA_CORRIENTE"] += montoUnico;
        } else {
          porMetodo["EFECTIVO"] += montoUnico;
        }
      }

      // 2. Conteo físico de ítems que salieron de cocina
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const nombre = item.name || "Producto General";
          const cantidad = Number(item.qty || 1);
          conteoProductos[nombre] = (conteoProductos[nombre] || 0) + cantidad;
        });
      }
    });

    // Ordenamos el ranking de salida
    const rankingProductos = Object.entries(conteoProductos)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    // 🌟 FORMATEO DE SEGURIDAD PARA NEXT.JS (Elimina los ObjectIds rebeldes de Mongo)
    const pedidosClonadosLimpios = JSON.parse(JSON.stringify(orders));

    return {
      success: true,
      data: {
        totalIngresos,
        porMetodo,
        comandasEmitidas: orders.length,
        rankingProductos,
        productoMasVendido: rankingProductos[0] || { name: "Ninguno", qty: 0 },
        // 👈 ACÁ SE LO INYECTAMOS: Enviamos el listado completo y limpio para el Modal Tabla
        pedidosDetalle: pedidosClonadosLimpios 
      }
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}