export default function TicketPrint({ order }) {
  if (!order) return null;
  return (
    <div id="ticket-print" className="hidden print:block p-4 font-mono text-[10px] w-[80mm] text-black">
      <div className="text-center font-bold uppercase mb-2 border-b pb-2">
        <p className="text-sm">Mi Sistema de Ventas</p>
        <p>Orden #{order.number}</p>
      </div>
      <div className="mb-2">
        <p>Fecha: {new Date(order.createdAt).toLocaleString()}</p>
        <p>Cliente: {order.customerName}</p>
      </div>
      <table className="w-full mb-2">
        <thead>
          <tr className="border-b">
            <th className="text-left">Cant</th>
            <th className="text-left">Prod</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td>{item.qty}</td>
              <td>{item.name}</td>
              <td className="text-right">${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t pt-2 text-right font-bold">
        <p>SUBTOTAL: ${order.subtotal.toFixed(2)}</p>
        <p className="text-sm">TOTAL: ${order.total.toFixed(2)}</p>
      </div>
      <div className="text-center mt-4 italic">
        Gracias por su compra
      </div>
    </div>
  );
}