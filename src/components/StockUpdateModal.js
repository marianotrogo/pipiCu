'use client'
import { useState } from 'react';
import { addStock } from '../app/actions/inventory';

export default function StockUpdateModal({ product }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState("");

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded border border-gray-400 hover:bg-gray-300 text-black font-bold">+ Stock</button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
      <div className="bg-white p-4 border border-black shadow-lg w-64">
        <p className="text-[11px] font-bold mb-2 uppercase">Sumar Stock: {product.name}</p>
        <input 
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border border-gray-400 p-1 mb-3 text-sm outline-none focus:border-black"
          placeholder="Cantidad"
          autoFocus
        />
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              if(!quantity) return;
              await addStock(product._id, parseInt(quantity));
              setIsOpen(false);
              setQuantity("");
            }}
            className="flex-1 bg-black text-white text-[10px] py-1 uppercase font-bold"
          >
            Confirmar
          </button>
          <button onClick={() => setIsOpen(false)} className="flex-1 border border-gray-400 text-[10px] py-1 uppercase">Cerrar</button>
        </div>
      </div>
    </div>
  );
}