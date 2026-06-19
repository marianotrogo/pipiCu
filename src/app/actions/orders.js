'use server'
import dbConnect from '../../lib/mongodb';
import Order from '../../models/Order';
import Product from '../../models/Product';
import { revalidatePath } from 'next/cache';

// 1. ACCIÓN PARA CREAR ORDEN
export async function createOrderAction(formData) {
  await dbConnect();
  try {
    const cleanFormData = JSON.parse(JSON.stringify(formData));

    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    const nextNumber = lastOrder?.number ? (parseInt(lastOrder.number) + 1) : 1;
    const paddingNumber = String(nextNumber).padStart(5, "0");
    
    // Creamos la orden en MongoDB
    const newOrder = await Order.create({
      ...cleanFormData,
      number: paddingNumber,
      status: 'PROCESO'
    });

    // Tu fetch original "fuego y olvido" tal cual lo tenías
    try {
      fetch('http://127.0.0.1:8000/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: paddingNumber,
          customerName: newOrder.customerName || "Consumidor Final",
          address: newOrder.address || "Retira en Local",
          items: newOrder.items,
          total: newOrder.total
        }),
      });
    } catch (printError) {
      console.log("El servidor de impresión Python no respondió localmente:", printError.message);
    }

    for (const item of cleanFormData.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }

    revalidatePath('/admin/dashboard'); 
    revalidatePath('/admin/panel'); 
    
    return { success: true, order: JSON.parse(JSON.stringify(newOrder)) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// 2. ACCIÓN PARA ACTUALIZAR ESTADOS, CADETE Y MOTIVOS DE CANCELACIÓN
// 📝 Nota: Agregamos cancelReason y canceledAt a la desestructuración de los argumentos
export async function updateOrderAction({ orderId, status, cadete, payments, notes, cancelReason, canceledAt }) {
  try {
    await dbConnect();
    
    const updateData = { status };
    
    if (cadete !== undefined) {
      updateData.cadete = cadete;
    }

    if (payments !== undefined) {
      updateData.payments = payments; 
    }

    if (notes !== undefined) {
      updateData.notes = notes; 
    }

    // 🔒 Guardamos el motivo de la cancelación si viene en los datos
    if (cancelReason !== undefined) {
      updateData.cancelReason = cancelReason;
    }

    // 🔒 Guardamos la fecha/hora exacta de la cancelación si viene en los datos
    if (canceledAt !== undefined) {
      updateData.canceledAt = canceledAt;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId, 
      updateData,
      { new: true }
    );

    if (!updatedOrder) {
      return { success: false, error: "No se encontró la comanda especificada." };
    }

    revalidatePath('/admin/panel');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/reportes'); 

    return { success: true, order: JSON.parse(JSON.stringify(updatedOrder)) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// 3. NUEVA ACCIÓN: RESETEAR CAJA EN 0 (SOLO ADMIN)
export async function resetCajaAction() {
  await dbConnect();
  try {
    await Order.updateMany(
      { status: { $in: ['COBRADO', 'CANCELADO'] } }, 
      { $set: { status: 'ARCHIVADO' } }
    );

    revalidatePath('/admin/panel');
    revalidatePath('/admin/reportes');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}