"use client";
import { useState } from "react";
// Importa la acción que conecta con tu endpoint payClientBalance
import { payBalance } from "../app/actions/clients";

export default function ClientPayModal({ client }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");

  if (client.balance <= 0) return <div className="w-10"></div>;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 font-bold uppercase rounded hover:bg-emerald-100 transition-all"
      >
        Cobrar Saldo
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-black p-6 w-full max-w-xs shadow-[8px_8px_0px_0px_rgba(34,197,94,1)]">
            <h3 className="text-xs font-bold uppercase mb-1">Cobro de Saldo</h3>
            <p className="text-[10px] text-gray-500 mb-6 uppercase">
              Cliente: {client.name}
            </p>

            <div className="mb-6">
              <label className="text-[10px] font-bold uppercase block mb-1">
                Monto a pagar
              </label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-gray-400">$</span>
                <input
                  type="number"
                  max={client.balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={client.balance}
                  className="w-full border border-black p-2 pl-6 text-xl font-bold outline-none"
                  autoFocus
                />
              </div>
              <p className="text-[9px] text-gray-400 mt-1 uppercase text-right tracking-tighter">
                Deuda pendiente: ${client.balance}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  if (!amount || amount <= 0) return;
                  await payBalance(client._id, amount);
                  setIsOpen(false);
                }}
                className="w-full bg-black text-white py-3 text-[10px] font-bold uppercase"
              >
                Confirmar Pago
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-[10px] font-bold uppercase text-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
