import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import customtkinter as ctk
from datetime import datetime
import os
import win32print
import threading

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

CONFIG_FILE = "printer_config.txt"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, CONFIG_FILE)

# 🛡️ Variable global para saber qué orden está en pantalla en este momento
orden_activa = None

# 📍 CARGA AMPLIADA: Lee impresora, rollo, nombre y subtitulo/teléfono
def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            lineas = f.read().splitlines()
            # Aseguramos que tenga las 4 líneas, sino autocompletamos por defecto
            while len(lineas) < 4:
                lineas.append("")
            
            impresora = lineas[0] if lineas[0] else None
            rollo = lineas[1] if lineas[1] else "80mm"
            comercio = lineas[2] if lineas[2] else "Pipi Cucu"
            subtitulo = lineas[3] if lineas[3] else "¡Gracias por su compra!"
            return impresora, rollo, comercio, subtitulo
    return None, "80mm", "PIPI-CUCU", "Tel: 387 214 8812"

# 📍 GUARDADO AMPLIADO: Graba los 4 datos estructurados en el archivo
def save_config(printer_name, paper_size, commerce_name, subtitle_text):
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            f.write(f"{printer_name}\n{paper_size}\n{commerce_name}\n{subtitle_text}")
    except Exception as e:
        pass

def get_printers():
    try:
        return [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
    except:
        return ["Impresora Predeterminada"]

# 📍 FORMATEO CORREGIDO: Ahora el encabezado usa los datos reales guardados
def formatear_ticket(data, ancho_papel, nombre_comercio, subtitulo_comercio):
    max_chars = 42 if ancho_papel == "80mm" else 32
    sep = "-" * max_chars
    fecha = datetime.now().strftime("%d/%m/%Y %H:%M")
    
    # Encabezado dinámico con centrado automático según el ancho del papel
    txt = f"*** {nombre_comercio.upper()} ***\n".center(max_chars)
    if subtitulo_comercio:
        txt += f"{subtitulo_comercio}\n".center(max_chars)
    txt += "\n"
    
    txt += f"Fecha: {fecha}\n"
    txt += f"{sep}\n"
    txt += f"ORDEN: #{data.get('number')}\n"
    txt += f"CLIENTE: {str(data.get('customerName'))[:max_chars-9]}\n"
    txt += f"DIR: {str(data.get('address', 'LOCAL'))[:max_chars-5]}\n"
    txt += f"{sep}\n"
    
    ancho_nombre = max_chars - 11
    for item in data.get('items', []):
        cant = f"{item['qty']}x"
        precio = f"${item['total']}"
        nombre = item['name'][:ancho_nombre].ljust(ancho_nombre)
        txt += f"{cant} {nombre} {precio:>6}\n"
    
    txt += f"{sep}\n"
    txt += f"TOTAL: ${data.get('total'):>15}\n"
    txt += f"{sep}\n\n"
    return txt

def enviar_a_impresora_real(nombre_impresora, texto_ticket, nro_orden):
    try:
        if nombre_impresora == "Impresora Predeterminada" or not nombre_impresora:
            nombre_impresora = win32print.GetDefaultPrinter()
            
        hPrinter = win32print.OpenPrinter(nombre_impresora)
        try:
            hJob = win32print.StartDocPrinter(hPrinter, 1, (f"Orden-{nro_orden}", None, "RAW"))
            win32print.StartPagePrinter(hPrinter)
            
            win32print.WritePrinter(hPrinter, texto_ticket.encode('cp850'))
            
            nro_string = str(nro_orden)
            init_barcode = b'\x1d\x68\x50\x1d\x77\x03\x1d\x48\x02' 
            barcode_data = b'\x1d\x6b\x49' + bytes([len(nro_string)]) + nro_string.encode('ascii')
            
            win32print.WritePrinter(hPrinter, init_barcode)
            win32print.WritePrinter(hPrinter, barcode_data)
            
            win32print.WritePrinter(hPrinter, b'\n\n\n\n\x1d\x56\x00') 
            
            win32print.EndPagePrinter(hPrinter)
            win32print.EndDocPrinter(hPrinter)
        finally:
            win32print.ClosePrinter(hPrinter)
    except Exception as e:
        pass

def launch_gui(data):
    global orden_activa
    nro_orden = data.get('number')
    orden_activa = nro_orden  # Registramos que esta orden ya abrió ventana

    ctk.set_appearance_mode("light")
    root = ctk.CTk()
    root.title("Ajuste de Ticket")
    
    window_width = 360
    window_height = 680  
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    
    center_x = int((screen_width / 2) - (window_width / 2))
    center_y = int((screen_height / 2) - (window_height / 2))
    
    root.geometry(f"{window_width}x{window_height}+{center_x}+{center_y}")
    root.resizable(False, False)
    root.attributes("-topmost", True)

    # Cargar variables actuales
    saved_printer, saved_paper, saved_commerce, saved_subtitle = load_config()
    lista_impresoras = get_printers()
    default_printer = saved_printer if saved_printer in lista_impresoras else (lista_impresoras[0] if lista_impresoras else "Impresora Predeterminada")
    
    printer_var = ctk.StringVar(value=default_printer)
    paper_var = ctk.StringVar(value=saved_paper)

    canvas = ctk.CTkScrollableFrame(root, fg_color="white", corner_radius=0)
    canvas.pack(fill="both", expand=True, padx=15, pady=15)

    lbl_text = ctk.CTkLabel(canvas, text="", font=("Courier", 11), text_color="black", justify="left")
    lbl_text.pack(pady=5)

    # Guardado y actualización automática en tiempo real
    def guardar_configuracion_actual(*args):
        save_config(printer_var.get(), paper_var.get(), entry_comercio.get(), entry_subtitulo.get())
        texto_listo = formatear_ticket(data, paper_var.get(), entry_comercio.get(), entry_subtitulo.get())
        lbl_text.configure(text=texto_listo)
        
    printer_var.trace_add("write", guardar_configuracion_actual)
    paper_var.trace_add("write", guardar_configuracion_actual)

    # PANEL DE CONFIGURACIÓN VISUAL
    config_frame = ctk.CTkFrame(root, fg_color="#E5E7EB")
    config_frame.pack(fill="x", padx=15, pady=5)

    # 1. Selector de Papel
    lbl_papel = ctk.CTkLabel(config_frame, text="Rollo:", font=("Roboto", 11, "bold"), text_color="black")
    lbl_papel.grid(row=0, column=0, padx=10, pady=4, sticky="w")
    menu_papel = ctk.CTkOptionMenu(config_frame, values=["80mm", "58mm"], variable=paper_var, height=25, width=90)
    menu_papel.grid(row=0, column=1, padx=10, pady=4, sticky="e")

    # 2. Selector de Impresora
    lbl_impresora = ctk.CTkLabel(config_frame, text="Impresora:", font=("Roboto", 11, "bold"), text_color="black")
    lbl_impresora.grid(row=1, column=0, padx=10, pady=4, sticky="w")
    menu_printer = ctk.CTkOptionMenu(config_frame, values=lista_impresoras, variable=printer_var, height=25, width=170)
    menu_printer.grid(row=1, column=1, padx=10, pady=4, sticky="e")

    # 3. Input Nombre Comercio
    lbl_comercio = ctk.CTkLabel(config_frame, text="Comercio:", font=("Roboto", 11, "bold"), text_color="black")
    lbl_comercio.grid(row=2, column=0, padx=10, pady=4, sticky="w")
    entry_comercio = ctk.CTkEntry(config_frame, height=25, width=170, font=("Roboto", 11))
    entry_comercio.insert(0, saved_commerce)
    entry_comercio.grid(row=2, column=1, padx=10, pady=4, sticky="e")
    entry_comercio.bind("<KeyRelease>", guardar_configuracion_actual)

    # 4. Input Subtítulo / Teléfono
    lbl_subtitulo = ctk.CTkLabel(config_frame, text="Eslogan/Tel:", font=("Roboto", 11, "bold"), text_color="black")
    lbl_subtitulo.grid(row=3, column=0, padx=10, pady=4, sticky="w")
    entry_subtitulo = ctk.CTkEntry(config_frame, height=25, width=170, font=("Roboto", 11))
    entry_subtitulo.insert(0, saved_subtitle)
    entry_subtitulo.grid(row=3, column=1, padx=10, pady=4, sticky="e")
    entry_subtitulo.bind("<KeyRelease>", guardar_configuracion_actual)

    # Carga del render inicial
    lbl_text.configure(text=formatear_ticket(data, paper_var.get(), saved_commerce, saved_subtitle))

    # 🔥 PARCHE DE CIERRE INMEDIATO ANTI-DUPLICADOS:
    def registrar_e_imprimir(event=None):
        global orden_activa
        # Desvinculamos el evento ENTER inmediatamente para evitar doble ejecución si se presiona rápido
        root.bind("<Return>", lambda e: None)
        
        # Guardamos e imprimimos
        save_config(printer_var.get(), paper_var.get(), entry_comercio.get(), entry_subtitulo.get())
        texto_final = formatear_ticket(data, paper_var.get(), entry_comercio.get(), entry_subtitulo.get())
        enviar_a_impresora_real(printer_var.get(), texto_final, data.get('number'))
        
        # Rompemos el ciclo de Tkinter y destruimos la ventana sin delays
        orden_activa = None  # Liberamos el candado al cerrar con éxito
        root.quit()
        root.destroy()

    root.bind("<Return>", registrar_e_imprimir)

    btn_print = ctk.CTkButton(root, text="IMPRIMIR (Presione ENTER)", fg_color="#10B981", hover_color="#059669", 
                              height=45, font=("Roboto", 13, "bold"), command=registrar_e_imprimir)
    btn_print.pack(fill="x", padx=15, pady=15)

    # Si cierran la ventana desde la "X" de Windows, también liberamos la orden
    def al_cerrar_ventana():
        global orden_activa
        orden_activa = None
        root.quit()
        root.destroy()
        
    root.protocol("WM_DELETE_WINDOW", al_cerrar_ventana)

    root.focus_force()
    root.mainloop()

@app.post("/print")
async def handle_print(request: Request):
    global orden_activa
    data = await request.json()
    nro_orden = data.get('number')
    
    # 🛡️ FILTRO ABSOLUTO: Si esa orden ya está abierta en pantalla, ignoramos el duplicado por completo
    if orden_activa == nro_orden:
        return {"status": "duplicado_ignorado"}
        
    gui_thread = threading.Thread(target=launch_gui, args=(data,))
    gui_thread.start()
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_config=None)