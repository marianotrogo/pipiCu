'use client'
import { useState, useMemo } from 'react';
import ClientModal from "./ClientModal";
import ClientPayModal from "./ClientPayModal";
import { deleteClient } from "../app/actions/clients";

export default function ClientTableClient({ initialClients }) {
  const [query, setQuery] = useState("");

  const filteredClients = useMemo(() => {
    return initialClients.filter(c => 
      c.name?.toLowerCase().includes(query.toLowerCase()) || 
      c.dni?.includes(query)
    );
  }, [initialClients, query]);

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold uppercase tracking-tight text-gray-800">Clientes</h1>
          <ClientModal />
        </div>
        
        <input
          type="text"
          placeholder="BUSCAR CLIENTE O DNI..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-64 border border-gray-200 px-3 py-1.5 text-[11px] outline-none focus:border-blue-300 uppercase transition-all bg-gray-50/50"
        />
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-sm shadow-sm">
        <table className="w-full border-collapse text-[12px] bg-white">
          <thead>
            <tr className="bg-gray-50 text-gray-600 font-bold uppercase border-b border-gray-200">
              <th className="px-3 py-2 text-left">Nombre del Cliente</th>
              <th className="px-3 py-2 text-left w-32">DNI / ID</th>
              <th className="px-3 py-2 text-center w-20">Crédito</th>
              <th className="px-3 py-2 text-right w-28">Saldo</th>
              <th className="px-3 py-2 text-center w-44 font-normal text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredClients.map((c) => (
              <tr key={c._id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-3 py-2 font-semibold text-gray-700 uppercase">{c.name}</td>
                <td className="px-3 py-2 font-mono text-gray-500 uppercase tracking-tighter">
                  {c.dni || '---'}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${c.credit ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                    {c.credit ? 'ACTIVO' : 'NO'}
                  </span>
                </td>
                <td className={`px-3 py-2 text-right font-bold ${c.balance > 0 ? 'text-red-500' : 'text-gray-700'}`}>
                  ${c.balance?.toLocaleString()}
                </td>
                <td className="px-3 py-2">
                   <div className="flex justify-center items-center gap-2">
                      <ClientPayModal client={c} />
                      <ClientModal client={c} />
                      <button 
                        onClick={async () => { if(confirm('¿ELIMINAR CLIENTE?')) await deleteClient(c._id)}} 
                        className="text-[10px] bg-red-50 text-red-500 px-2 py-1 font-bold uppercase rounded hover:bg-red-100 transition-all"
                      >
                        Eliminar
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}