// CORRECCIÓN: Dejamos la URL vacía para que se adapte automáticamente a Render
const API_URL = "";

const MENSAJE_DEFAULT = "Hola {nombre}, te recordamos que tu cuota en Barrios Team vence el {fecha}. ¡Te esperamos en el entrenamiento!";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar plantilla de WhatsApp guardada
    const plantillaInput = document.getElementById("plantilla-ws");
    if (plantillaInput) {
        plantillaInput.value = localStorage.getItem("plantillaWS") || MENSAJE_DEFAULT;
    }
    // 2. Cargar alumnos directamente (sin esperar un login)
    cargarAlumnos();
});

// CONFIGURACIÓN DEL MENSAJE DE WHATSAPP
function guardarPlantillaWhatsApp() {
    const texto = document.getElementById("plantilla-ws").value;
    localStorage.setItem("plantillaWS", texto);
    alert("Plantilla de mensaje guardada correctamente.");
}

// OBTENER ALUMNOS Y CALCULAR ESTADO/ALERTAS
async function cargarAlumnos() {
    try {
        const response = await fetch(`${API_URL}/alumnos`);
        if (!response.ok) throw new Error("Error al consultar la API");
        
        const alumnos = await response.json();
        const tbody = document.getElementById("tabla-alumnos");
        if (!tbody) return;
        tbody.innerHTML = "";

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let contTotal = alumnos.length;
        let contAlDia = 0;
        let contProximos = 0;
        let contVencidos = 0;

        alumnos.forEach(alumno => {
            const fechaVenc = new Date(alumno.fecha_vencimiento);
            fechaVenc.setHours(0, 0, 0, 0);

            const diffTiempo = fechaVenc - hoy;
            const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

            let badgeHtml = "";
            let requiereAviso = false;

            if (diffDias < 0) {
                badgeHtml = `<span class="badge-red">VENCIDO (${Math.abs(diffDias)} días)</span>`;
                requiereAviso = true;
                contVencidos++;
            } else if (diffDias <= 5) {
                badgeHtml = `<span class="badge-yellow">Vence en ${diffDias} día(s)</span>`;
                requiereAviso = true;
                contProximos++;
            } else {
                badgeHtml = `<span class="badge-green">Al día</span>`;
                contAlDia++;
            }

            const plantilla = localStorage.getItem("plantillaWS") || MENSAJE_DEFAULT;
            const mensajePersonalizado = plantilla
                .replace("{nombre}", `${alumno.nombre} ${alumno.apellido}`)
                .replace("{fecha}", alumno.fecha_vencimiento);
            
            const urlWhatsApp = `https://wa.me/${alumno.telefono}?text=${encodeURIComponent(mensajePersonalizado)}`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${alumno.nombre} ${alumno.apellido}</strong></td>
                <td>${alumno.telefono || 'Sin número'}</td>
                <td>${alumno.fecha_pago}</td>
                <td><strong>${alumno.fecha_vencimiento}</strong></td>
                <td>${badgeHtml}</td>
                <td>
                    <button onclick="renovarCuota('${alumno.id}')" class="btn-renovar">🔄 Renovar</button>
                    ${requiereAviso ? `<a href="${urlWhatsApp}" target="_blank" class="btn-ws">📱 Aviso</a>` : ''}
                    <button onclick="eliminarAlumno('${alumno.id}')" class="btn-danger">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById("count-total").innerText = contTotal;
        document.getElementById("count-aldia").innerText = contAlDia;
        document.getElementById("count-proximos").innerText = contProximos;
        document.getElementById("count-vencidos").innerText = contVencidos;

    } catch (error) {
        console.error("Error al cargar alumnos:", error);
    }
}

// BUSCADOR EN TIEMPO REAL
function filtrarAlumnos() {
    const textoBuscado = document.getElementById("buscador").value.toLowerCase();
    const filas = document.querySelectorAll("#tabla-alumnos tr");

    filas.forEach(fila => {
        const nombreCompleto = fila.cells[0].textContent.toLowerCase();
        if (nombreCompleto.includes(textoBuscado)) {
            fila.style.display = ""; 
        } else {
            fila.style.display = "none"; 
        }
    });
}

// AGREGAR UN NUEVO ALUMNO
async function agregarAlumno(event) {
    event.preventDefault(); // <- ESTO EVITA QUE SE BORREN LOS DATOS AL DAR ENTER

    const nuevoAlumno = {
        nombre: document.getElementById("nuevo_nombre").value,
        apellido: document.getElementById("nuevo_apellido").value,
        telefono: document.getElementById("nuevo_telefono").value,
        email: "", 
        fecha_pago: document.getElementById("nuevo_pago").value,
        fecha_vencimiento: document.getElementById("nuevo_vencimiento").value
    };

    try {
        const response = await fetch(`${API_URL}/alumnos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoAlumno)
        });

        if (response.ok) {
            alert("Alumno añadido correctamente");
            document.getElementById("nuevo_nombre").value = "";
            document.getElementById("nuevo_apellido").value = "";
            document.getElementById("nuevo_telefono").value = "";
            document.getElementById("nuevo_pago").value = "";
            document.getElementById("nuevo_vencimiento").value = "";
            cargarAlumnos();
        } else {
            alert("Error al guardar el alumno en la base de datos.");
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

// RENOVAR CUOTA (+30 DÍAS)
async function renovarCuota(id) {
    if (!confirm("¿Renovar la cuota por 1 mes? Esto actualizará la fecha de pago a hoy y extenderá el vencimiento 30 días.")) return;

    try {
        const response = await fetch(`${API_URL}/alumnos/${id}/renovar`, {
            method: "PUT"
        });

        if (response.ok) {
            alert("✅ Cuota renovada exitosamente.");
            cargarAlumnos(); 
        } else {
            alert("Error al renovar la cuota.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// ELIMINAR UN ALUMNO (BORRADO DEFINITIVO)
async function eliminarAlumno(id) {
    if (!confirm("⚠️ ¿Estás seguro de eliminar DEFINITIVAMENTE a este alumno?")) return;

    try {
        const response = await fetch(`${API_URL}/alumnos/${id}`, {
            method: "DELETE"
        });

        if (response.ok) {
            cargarAlumnos();
        } else {
            alert("No se pudo eliminar el alumno.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}