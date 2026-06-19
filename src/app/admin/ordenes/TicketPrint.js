// app/admin/ordenes/TicketPrint.js
'use client'
import Barcode from 'react-barcode';

export default function TicketPrint({ order }) {
  if (!order) return null;

  return (
    <div id="printable-ticket" className="hidden print:block bg-white text-black p-4 font-mono text-[12px] w-[80mm] mx-auto">
      {/* CABECERA */}
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold uppercase italic">MI TIENDA</h2>
        <p className="text-[10px]">Configuraciones - Tel: 123456</p>
      </div>

      <div className="border-b border-dashed border-black mb-2"></div>

      {/* INFO PEDIDO */}
      <div className="mb-2 uppercase">
        <p className="font-bold text-sm">Pedido: #{order.number}</p>
        <p>Fecha: {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</p>
        <p>Cliente: {order.customerName}</p>
        <p className="text-[10px]">Dir: {order.address || 'RETIRO LOCAL'}</p>
      </div>

      <div className="border-b border-solid border-black mb-2"></div>

      {/* DETALLE */}
      <table className="w-full mb-2">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="w-8">Cant</th>
            <th>Producto</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-100">
              <td>{item.qty}</td>
              <td className="uppercase">{item.name}</td>
              <td className="text-right">${item.total?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALES */}
      <div className="border-t border-dashed border-black pt-2 space-y-1">
        <div className="flex justify-between"><span>Subtotal:</span> <span>${order.subtotal?.toFixed(2)}</span></div>
        {order.discount > 0 && (
          <div className="flex justify-between"><span>Desc:</span> <span>-${order.discount?.toFixed(2)}</span></div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
          <span>TOTAL:</span> <span>${order.total?.toFixed(2)}</span>
        </div>
      </div>

      {/* CÓDIGO DE BARRAS */}
      <div className="mt-4 flex flex-col items-center">
        <Barcode 
          value={order.number} 
          width={1.2} 
          height={40} 
          fontSize={10}
          margin={0}
        />
        <p className="text-[9px] mt-1 italic">Escanee para cobrar al regresar</p>
      </div>

      <div className="mt-4 text-center text-[10px]">
        <p>*** Documento No Válido como Factura ***</p>
      </div>

      {/* ESTILOS DE IMPRESIÓN */}
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}