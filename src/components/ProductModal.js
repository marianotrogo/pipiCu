'use client'
import { useState } from 'react';
import { saveProduct } from '../app/actions/inventory';

export default function ProductModal({ product = null, categories = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={product 
          ? "text-[10px] text-blue-700 hover:underline uppercase font-bold" 
          : "bg-green-600 text-white px-3 py-1 text-xs font-bold rounded hover:bg-green-700"}
      >
        {product ? "Editar" : "+ Nuevo Producto"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form 
            action={async (formData) => {
              await saveProduct(formData, product?._id);
              setIsOpen(false);
            }}
            className="bg-white border border-gray-400 p-6 w-full max-w-md shadow-xl"
          >
            <h2 className="text-sm font-bold uppercase mb-4 border-b pb-2">{product ? 'Editar' : 'Nuevo'} Producto</h2>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase block">Nombre</label>
                <input name="name" defaultValue={product?.name} required className="w-full border border-gray-300 p-1 text-sm outline-none focus:border-black" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase block">Código</label>
                  <input name="code" defaultValue={product?.code} className="w-full border border-gray-300 p-1 text-sm outline-none focus:border-black" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase block">Categoría</label>
                  <select name="category" defaultValue={product?.category?._id} className="w-full border border-gray-300 p-1 text-sm outline-none focus:border-black bg-white text-black">
                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase block">Precio</label>
                  <input name="price" type="number" step="0.01" defaultValue={product?.price} required className="w-full border border-gray-300 p-1 text-sm outline-none focus:border-black" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase block">Stock</label>
                  <input name="stock" type="number" defaultValue={product?.stock || 0} required className="w-full border border-gray-300 p-1 text-sm outline-none focus:border-black" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="submit" className="flex-1 bg-black text-white py-2 text-[10px] font-bold uppercase tracking-widest">Guardar</button>
              <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-[10px] font-bold uppercase border border-gray-300">Cerrar</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}