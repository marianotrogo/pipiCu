'use client'
import { useState } from 'react';
import { updateCategory } from '../app/actions/inventory';

export default function EditCategoryModal({ category, fullWidth = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(category.name);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`${fullWidth ? "w-full justify-center" : ""} flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all`}
      >
        ✏️ <span className={fullWidth ? "inline" : "hidden md:inline"}>Editar</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] md:rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />
            
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Editar Nombre</h3>
            <p className="text-slate-500 mb-6 text-sm">Cambia el nombre de la categoría en el menú.</p>
            
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl mb-6 outline-none text-lg font-medium text-slate-700 transition-all"
            />
            
            <div className="flex flex-col-reverse md:flex-row gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  await updateCategory(category._id, name);
                  setIsOpen(false);
                }}
                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}