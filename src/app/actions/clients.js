"use server";
import { revalidatePath } from "next/cache";
import Client from "../../models/Client";
import Order from "../../models/Order";
import dbConnect from "../../lib/mongodb"; // Verifica que sea mongodb o dbConnect

export async function getClients() {
  try {
    await dbConnect();
    // Verificación de seguridad: si Client es undefined, lanzamos error claro
    if (!Client || !Client.find) {
       console.error("El modelo Client no se cargó correctamente");
       return [];
    }
    const clients = await Client.find().sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(clients));
  } catch (e) {
    console.error("Error en getClients:", e);
    return [];
  }
}

export async function saveClient(formData, id = null) {
  await dbConnect();
  const data = {
    name: formData.get("name"),
    dni: formData.get("dni"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    credit: formData.get("credit") === "true",
  };

  if (id) {
    await Client.findByIdAndUpdate(id, data);
  } else {
    await Client.create(data);
  }
  revalidatePath("/admin/clientes");
}

export async function deleteClient(id) {
  await dbConnect();
  await Client.findByIdAndDelete(id);
  revalidatePath("/admin/clientes");
}

// ESTA ES LA FUNCIÓN QUE TE FALTA EXPORTAR
export async function payBalance(clientId, amount) {
  await dbConnect();
  try {
    const client = await Client.findById(clientId);
    const payAmount = Number(amount);

    // 1. Actualizar balance del cliente
    client.balance -= payAmount;
    await client.save();

    // 2. Crear registro de pago en Orders
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    const nextNumber = lastOrder ? (parseInt(lastOrder.number) + 1) : 1;

    await Order.create({
      number: String(nextNumber).padStart(5, "0"),
      customerName: client.name,
      client: client._id,
      items: [], // No hay productos
      subtotal: payAmount,
      total: payAmount,
      status: "COBRADO",
      payments: [
        { 
          method: "PAGOS_CUENTA_CORRIENTE", // Usamos tu enum
          amount: payAmount, 
          client: client._id 
        }
      ],
      paidAt: new Date()
    });

    revalidatePath("/admin/clientes");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}