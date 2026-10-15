// ACÁ PONDRÁS LA URL DE TU BACKEND EN RENDER CUANDO LO SUBAS
const API_URL = "http://127.0.0.1:8000"; 

// Verificar si ya está logueado
window.onload = () => {
    if(localStorage.getItem('admin_token')) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('panel-section').classList.remove('hidden');
        cargarAlumnos();
    }
}

async function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    });

    if(response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_token', data.token);
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('panel-section').classList.remove('hidden');
        cargarAlumnos();
    } else {
        alert("Credenciales incorrectas");
    }
}

function cerrarSesion() {
    localStorage.removeItem('admin_token');
    location.reload();
}

async function cargarAlumnos() {
    const response = await fetch(`${API_URL}/alumnos`);
    const alumnos = await response.json();
    const tbody = document.getElementById('tabla-alumnos');
    tbody.innerHTML = "";

    const hoy = new Date().toISOString().split('T')[0]; // Fecha actual YYYY-MM-DD

    alumnos.forEach(alumno => {
        // Lógica de Rojo y Verde
        const estaVencido = alumno.fecha_vencimiento < hoy;
        const claseEstado = estaVencido ? 'estado-rojo' : 'estado-verde';
        const textoEstado = estaVencido ? 'VENCIDO' : 'PAGO';

        tbody.innerHTML += `
            <tr>
                <td>${alumno.nombre}</td>
                <td>${alumno.apellido}</td>
                <td>${alumno.fecha_pago}</td>
                <td>${alumno.fecha_vencimiento}</td>
                <td class="${claseEstado}">${textoEstado}</td>
            </tr>
        `;
    });
}

async function agregarAlumno() {
    const nombre = document.getElementById('nuevo_nombre').value;
    const apellido = document.getElementById('nuevo_apellido').value;
    const pago = document.getElementById('nuevo_pago').value;
    const vencimiento = document.getElementById('nuevo_vencimiento').value;

    if(!nombre || !apellido || !pago || !vencimiento) {
        alert("Completá todos los campos");
        return;
    }

    await fetch(`${API_URL}/alumnos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: nombre,
            apellido: apellido,
            fecha_pago: pago,
            fecha_vencimiento: vencimiento
        })
    });

    // Limpiar inputs y recargar tabla
    document.getElementById('nuevo_nombre').value = "";
    document.getElementById('nuevo_apellido').value = "";
    cargarAlumnos();
}