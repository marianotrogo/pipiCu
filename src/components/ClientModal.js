'use client'
import { useState } from 'react';
import { saveClient } from '../app/actions/clients';

export default function ClientModal({ client = null }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón de apertura con colores suaves */}
      <button 
        onClick={() => setIsOpen(true)}
        className={
          client 
            ? "text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 font-bold uppercase rounded hover:bg-blue-100 transition-all" 
            : "bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 text-[11px] font-bold uppercase rounded hover:bg-indigo-100 transition-all shadow-sm"
        }
      >
        {client ? "Editar" : "+ Nuevo Cliente"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form 
            action={async (formData) => {
              await saveClient(formData, client?._id);
              setIsOpen(false);
            }}
            className="bg-white border border-gray-200 p-6 w-full max-w-sm rounded-lg shadow-xl"
          >
            <h2 className="text-sm font-bold uppercase mb-6 border-b border-gray-100 pb-2 text-gray-700">
                {client ? 'Actualizar Datos' : 'Registrar Nuevo Cliente'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase block text-gray-400 mb-1">Nombre Completo</label>
                <input 
                  name="name" 
                  defaultValue={client?.name} 
                  required 
                  placeholder="Ej: Juan Pérez"
                  className="w-full border border-gray-200 p-2 text-xs rounded outline-none focus:border-indigo-300 bg-gray-50/50" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase block text-gray-400 mb-1">DNI / ID</label>
                  <input 
                    name="dni" 
                    defaultValue={client?.dni} 
                    className="w-full border border-gray-200 p-2 text-xs rounded outline-none focus:border-indigo-300 bg-gray-50/50" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase block text-gray-400 mb-1">Teléfono</label>
                  <input 
                    name="phone" 
                    defaultValue={client?.phone} 
                    className="w-full border border-gray-200 p-2 text-xs rounded outline-none focus:border-indigo-300 bg-gray-50/50" 
                  />
                </div>
              </div>

              {/* Toggle de Crédito con color Indigo cuando está activo */}
              <div className="flex items-center justify-between p-3 bg-indigo-50/30 border border-indigo-100 rounded-md mt-4">
                <span className="text-[10px] font-bold uppercase text-indigo-700">Permitir Cuenta Corriente</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="credit" 
                    value="true" 
                    defaultChecked={client?.credit} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              <button 
                type="submit" 
                className="flex-1 bg-indigo-500 text-white py-2.5 text-[10px] font-bold uppercase rounded shadow-md hover:bg-indigo-600 transition-colors"
              >
                Guardar Cliente
              </button>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className="px-4 py-2.5 text-[10px] font-bold uppercase border border-gray-200 rounded text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}