// app/admin/ordenes/page.js
import { getProducts, getCategories } from "../../../app/actions/inventory"; 
import { getClients } from "../../../app/actions/clients";
import OrdersClient from "./OrdersClient";

export default async function OrdersPage() {
  


  const [products, categories, customers] = await Promise.all([
    getProducts(),
    getCategories(),
    getClients(),
  ]);

  // 2. Definimos los métodos de pago manualmente (consistente con lo que espera el Modal)
  const paymentMethods = [
    { _id: 'efectivo', name: 'Efectivo' },
    { _id: 'transferencia', name: 'Transferencia' },
    { _id: 'qr', name: 'QR / Mercado Pago' }
  ];

  return (
    <main className="h-screen overflow-hidden bg-slate-100">
      <OrdersClient 
        products={products || []} 
        categories={categories || []} 
        paymentMethods={paymentMethods} 
        customers={customers || []}
      />
    </main>
  );
}