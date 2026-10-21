from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import urllib.parse

# 1. Cargar variables de entorno (.env)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Faltan las variables SUPABASE_URL o SUPABASE_KEY en el archivo .env")

# 2. Conectar a Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Gimnasio de Boxeo API")

# --- CONFIGURACIÓN DE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite conexiones desde cualquier origen
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE
    allow_headers=["*"],
)

# --- CONFIGURACIÓN PARA SERVIR LA PÁGINA WEB (FRONTEND) ---
# 1. Montar la carpeta "static" para que sirva el CSS, JS, imágenes y videos
app.mount("/static", StaticFiles(directory="static"), name="static")

# 2. Rutas para mostrar los archivos HTML que están en la carpeta "templates"
@app.get("/")
def leer_index():
    return FileResponse("templates/index.html")

@app.get("/admin.html")
def leer_admin():
    return FileResponse("templates/admin.html")

# 3. Ruta para que el celular del profe encuentre el manifest y pueda instalar la app
@app.get("/manifest.json")
def leer_manifest():
    return FileResponse("manifest.json")
# -----------------------------------------------------------


# 3. Esquema del alumno (sin DNI para evitar errores de unicidad)
class Alumno(BaseModel):
    nombre: str
    apellido: str
    telefono: str = None
    email: str = None
    fecha_pago: str = None
    fecha_vencimiento: str = None

# 4. Registrar alumno nuevo
@app.post("/alumnos")
@app.post("/alumnos/")
def crear_alumno(alumno: Alumno):
    try:
        data = alumno.model_dump()
        print("Datos recibidos para guardar:", data)
        response = supabase.table("alumnos").insert(data).execute()
        return {"mensaje": "Alumno registrado con éxito", "datos": response.data}
    except Exception as e:
        print("--- ERROR DETALLADO DE SUPABASE ---", str(e))
        raise HTTPException(status_code=400, detail=str(e))

# 5. Listar alumnos (Ordenados alfabéticamente por nombre)
@app.get("/alumnos")
@app.get("/alumnos/")
def listar_alumnos():
    try:
        # Se agrega .order("nombre", desc=False) para el orden alfabético
        response = supabase.table("alumnos").select("*").order("nombre", desc=False).execute()
        alumnos = response.data
        
        hoy = datetime.now().date()

        for alumno in alumnos:
            telefono = alumno.get("telefono")
            nombre = alumno.get("nombre", "Alumno")
            vencimiento_str = alumno.get("fecha_vencimiento")
            
            estado_pago = "Sin fecha de vencimiento"
            link_whatsapp = "#"

            if vencimiento_str:
                try:
                    fecha_venc = datetime.strptime(vencimiento_str, "%Y-%m-%d").date()
                    dias_restantes = (fecha_venc - hoy).days

                    if dias_restantes < 0:
                        estado_pago = f"Vencido hace {abs(dias_restantes)} días"
                        mensaje = f"Hola {nombre}, te escribimos del gimnasio. Notamos que tu cuota venció hace {abs(dias_restantes)} días. ¡Te esperamos para abonar y seguir entrenando!"
                    elif dias_restantes <= 5:
                        estado_pago = f"Vence en {dias_restantes} días"
                        mensaje = f"Hola {nombre}, te recordamos que tu cuota del gimnasio vence en {dias_restantes} días ({vencimiento_str}). ¡No te cuelgues!"
                    else:
                        estado_pago = f"Al día (Vence el {vencimiento_str})"
                        mensaje = f"Hola {nombre}, ¡gracias por entrenar con nosotros! Tu cuota está al día y vence el {vencimiento_str}."

                    if telefono:
                        tel_limpio = "".join(filter(str.isdigit, str(telefono)))
                        if len(tel_limpio) == 10:
                            tel_limpio = f"549{tel_limpio}"

                        mensaje_codificado = urllib.parse.quote(mensaje)
                        link_whatsapp = f"https://wa.me/{tel_limpio}?text={mensaje_codificado}"

                except ValueError:
                    estado_pago = "Fecha inválida"

            alumno["estado_pago"] = estado_pago
            alumno["link_whatsapp"] = link_whatsapp

        return alumnos
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 6. Renovar cuota rápidamente (+30 días desde hoy)
@app.put("/alumnos/{id}/renovar")
def renovar_cuota(id: str):
    try:
        hoy = datetime.now().date()
        nuevo_vencimiento = hoy + timedelta(days=30)
        
        # Actualizamos la fecha de pago a hoy y el vencimiento a 30 días
        response = supabase.table("alumnos").update({
            "fecha_pago": str(hoy),
            "fecha_vencimiento": str(nuevo_vencimiento)
        }).eq("id", id).execute()
        
        return {"mensaje": "Cuota renovada", "datos": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 7. Eliminar alumno de la base de datos
@app.delete("/alumnos/{id}")
def eliminar_alumno(id: str):
    try:
        response = supabase.table("alumnos").delete().eq("id", id).execute()
        return {"mensaje": "Alumno eliminado", "datos": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))