'use client'
import { useState, useMemo, useRef, useEffect } from "react"
import { 
  Search, Plus, Minus, Trash2, User, Percent, 
  MapPin, ShoppingCart, Edit3, X, Check, CreditCard, DollarSign 
} from "lucide-react"
import { createOrderAction } from "../../../app/actions/orders"

// IMPORTACIÓN DEL TICKET
import TicketPrint from "./TicketPrint" 

// --- COMPONENTE MODAL DE PAGO ---
const PaymentModal = ({ isOpen, onClose, total, onConfirm, isProcessing }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-slate-800">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Confirmar Pedido</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-indigo-600">Para enviar a cocina</p>
          </div>
          <button disabled={isProcessing} onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors disabled:opacity-50"><X size={20}/></button>
        </div>

        <div className="p-10 text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <ShoppingCart size={40}/>
          </div>
          <p className="text-slate-600 font-medium">Se generará el ticket de despacho por un total de:</p>
          <h2 className="text-5xl font-black text-slate-800">${total.toFixed(2)}</h2>
          <p className="text-xs text-slate-400 italic">El cobro se registrará al regreso del cadete mediante el código de barras.</p>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
          <button 
            disabled={isProcessing}
            onClick={onConfirm}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {isProcessing ? "Abriendo ventana de impresión..." : "Confirmar e Imprimir"}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- PÁGINA PRINCIPAL ---
export default function OrdersClient({ products = [], categories = [], customers = [] }) {
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  const [customer, setCustomer] = useState({ name: "", address: "", _id: null })
  const [showCustomerResults, setShowCustomerResults] = useState(false)
  const customerRef = useRef(null)

  const [discount, setDiscount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Estados de control de flujo
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderFinished, setOrderFinished] = useState(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerRef.current && !customerRef.current.contains(event.target)) {
        setShowCustomerResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredCustomers = useMemo(() => {
    if (!customer.name || customer._id) return []
    return customers.filter(c => 
      c.name.toLowerCase().includes(customer.name.toLowerCase())
    ).slice(0, 5)
  }, [customer.name, customer._id, customers])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCat = selectedCategory === "all" || p.category?._id === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [products, searchTerm, selectedCategory])

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal - discountAmount

  const addToCart = (p) => {
    setCart(prev => {
      const exist = prev.find(item => item._id === p._id)
      if (exist) return prev.map(item => item._id === p._id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...prev, { ...p, quantity: 1 }]
    })
  }

  const selectCustomer = (c) => {
    setCustomer({ name: c.name, address: c.address || "", _id: c._id })
    setShowCustomerResults(false)
  }

  const updatePrice = (id) => {
    const val = prompt("Nuevo precio unitario:")
    if (val && !isNaN(val)) setCart(prev => prev.map(i => i._id === id ? {...i, price: parseFloat(val)} : i))
  }

  // FUNCIÓN PRINCIPAL CORREGIDA Y SINCRONIZADA CON TU APPARATUS
  const handleFinalConfirm = async () => {
    setIsProcessing(true) 

    const orderData = {
      customerName: customer.name || "Consumidor Final",
      address: customer.address,
      client: customer._id || null,
      items: cart.map(item => ({
        product: item._id,
        name: item.name,
        price: item.price,
        qty: item.quantity,
        total: item.price * item.quantity
      })),
      subtotal: subtotal,
      discount: discountAmount,
      total: total,
      payments: [], 
      status: 'PROCESO' 
    }

    const result = await createOrderAction(orderData)

    if (result.success) {
      setOrderFinished(result.order) // Guardamos la orden en tu estado original

      // Mandamos los datos a Python y ESPERAMOS a que termine la acción local antes de seguir
      try {
        await fetch('http://127.0.0.1:8000/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.order) 
        })
      } catch (printError) {
        console.error("Servidor de impresión local offline o cerrado", printError)
      }

      // Al cerrar la ventana de Python, quitamos los modales de carga y mostramos tu check verde
      setIsProcessing(false)
      setIsModalOpen(false)
      setIsSuccess(true)

      // Limpieza total y reinicio tras 3 segundos de gracia
      setTimeout(() => {
        setCart([])
        setCustomer({ name: "", address: "", _id: null })
        setDiscount(0)
        setOrderFinished(null)
        setIsSuccess(false) 
      }, 3000)

    } else {
      setIsProcessing(false)
      alert("Error crítico al guardar la orden: " + result.error)
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 p-4 gap-4 overflow-hidden font-sans">
      
      {/* COL 1: CATÁLOGO */}
      <div className="w-1/3 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <h2 className="font-bold flex items-center gap-2">📦 Productos</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Buscar..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
            >Todos</button>
            {categories.map(c => (
              <button 
                key={c._id} onClick={() => setSelectedCategory(c._id)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${selectedCategory === c._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
              >{c.name}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredProducts.map(p => (
            <button key={p._id} onClick={() => addToCart(p)} className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all group">
              <div className="text-left">
                <p className="font-bold text-slate-700 text-sm">{p.name}</p>
                <p className="text-xs font-black text-indigo-500">${p.price}</p>
              </div>
              <Plus size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
            </button>
          ))}
        </div>
      </div>

      {/* COL 2: CLIENTE Y DESCUENTO */}
      <div className="w-1/4 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Configuración Orden</h2>
          <div className="space-y-4">
            <div className="space-y-1 relative" ref={customerRef}>
              <label className="text-xs font-bold text-slate-500 ml-1">Cliente</label>
              <div className="relative">
                <input 
                  type="text" placeholder="Escribir para buscar..." 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-sm font-medium"
                  value={customer.name} 
                  onChange={e => {
                    setCustomer({ ...customer, name: e.target.value, _id: null });
                    setShowCustomerResults(true);
                  }}
                  onFocus={() => setShowCustomerResults(true)}
                />
                {customer._id && (
                  <button 
                    onClick={() => setCustomer({name: "", address: "", _id: null})}
                    className="absolute right-3 top-3 text-red-400 hover:text-red-600"
                  >
                    <X size={16}/>
                  </button>
                )}
              </div>

              {showCustomerResults && filteredCustomers.length > 0 && (
                <div className="absolute z-[110] w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                  {filteredCustomers.map(c => (
                    <button
                      key={c._id}
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-none flex flex-col"
                    >
                      <span className="text-sm font-bold text-slate-700">{c.name}</span>
                      <span className="text-[10px] text-slate-400 truncate">{c.address || 'Sin dirección'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Dirección de Entrega</label>
              <textarea 
                placeholder="Calle, altura, depto..." 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-sm h-32 resize-none transition-all"
                value={customer.address} 
                onChange={e => setCustomer({...customer, address: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Descuento (%)</h2>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100"><Percent size={24}/></div>
            <input 
              type="number" className="w-full text-3xl font-black text-slate-700 outline-none"
              value={discount} onChange={e => setDiscount(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* COL 3: CARRITO */}
      <div className="w-5/12 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2"><ShoppingCart size={20}/> Resumen</h2>
          <span className="bg-indigo-50 text-indigo-600 text-[10px] px-3 py-1 rounded-full font-black uppercase">{cart.length} productos</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/30">
          {cart.map(item => (
            <div key={item._id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group transition-all">
              <div className="flex-1 pr-4">
                <p className="text-sm font-bold text-slate-700">{item.name}</p>
                <p className="text-xs font-bold text-indigo-500">${item.price} <span className="text-slate-300">x {item.quantity}</span></p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden p-1">
                  <button onClick={() => setCart(cart.map(i => i._id === item._id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))} className="px-2 font-bold">-</button>
                  <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                  <button onClick={() => addToCart(item)} className="px-2 font-bold">+</button>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => updatePrice(item._id)} className="p-2 text-slate-400 hover:text-amber-500"><Edit3 size={16}/></button>
                  <button onClick={() => setCart(cart.filter(i => i._id !== item._id))} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs font-bold text-emerald-500 uppercase"><span>Descuento ({discount}%)</span><span>-${discountAmount.toFixed(2)}</span></div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="font-black text-slate-800 text-sm uppercase">Total final</span>
              <span className="text-5xl font-black text-indigo-600 tracking-tighter">${total.toFixed(2)}</span>
            </div>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => setIsModalOpen(true)}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
          >
            <Check size={24} strokeWidth={3}/> Confirmar Pedido
          </button>
        </div>
      </div>

      {/* LLAMADO AL MODAL DE PAGO PASÁNDOLE EL ESTADO DE PROCESAMIENTO */}
      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        total={total}
        onConfirm={handleFinalConfirm}
        isProcessing={isProcessing}
      />

      {/* SE BORRÓ EL MODAL DE ÉXITO DUPLICADO VIEJO QUE HACÍA EL LÍO */}

      {/* TICKET OCULTO (De respaldo para el navegador) */}
      <div className="hidden">
         <TicketPrint order={orderFinished} />
      </div>

      {/* TU CARTEL DE ÉXITO PROFESIONAL */}
      {isSuccess && (
        <div className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 transition-all scale-110">
            <Check size={60} strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black text-slate-800">¡Pedido Tomado!</h2>
          <p className="text-slate-500 font-medium mt-1">La orden ha sido enviada a cocina e impresión.</p>
          
          <div className="mt-8 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-[pulse_1.5s_infinite]"></div>
          </div>
        </div>
      )}
    </div>
  )
}