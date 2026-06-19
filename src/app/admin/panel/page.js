import PanelOrder from "./PanelOrder"
import dbConnect from "../../../lib/mongodb"
import Order from "../../../models/Order"
import { updateOrderAction } from "../../actions/orders"

export const dynamic = 'force-dynamic' 

export default async function AdminPanelPage() {
  await dbConnect()
  
  // TRAE ABSOLUTAMENTE TODO (PROCESO, ENVIADO Y CANCELADO) SIN LÍMITE DE TIEMPO
  const orders = await Order.find({ 
    status: { $in: ['PROCESO', 'ENVIADO', 'CANCELADO'] } 
  }).sort({ createdAt: -1 }).lean() // Ordenados del más nuevo al más viejo

  const serializedOrders = orders.map(o => {
    return {
      _id: o._id.toString(),
      number: o.number,
      customerName: o.customerName,
      address: o.address || 'Retira en Local',
      total: o.total,
      status: o.status,
      cadete: o.cadete || "", 
      cancelReason: o.cancelReason || "",
      canceledAt: o.canceledAt ? new Date(o.canceledAt).toISOString() : null,
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
      items: (o.items || []).map(item => {
        return {
          name: item.name,
          price: Number(item.price),
          qty: Number(item.qty),
          total: Number(item.total),
          product: item.product ? String(item.product._id || item.product) : ""
        }
      })
    }
  })

  const cleanOrdersForClient = JSON.parse(JSON.stringify(serializedOrders))

  return (
    <PanelOrder 
      initialOrders={cleanOrdersForClient} 
      updateOrderAction={updateOrderAction} 
    />
  )
}