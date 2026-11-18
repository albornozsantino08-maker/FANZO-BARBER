const escena = document.getElementById("escena");
const titulo = document.getElementById("titulo");

titulo.addEventListener("click", () => {
    escena.classList.toggle("activo");
});

const peluqueros = [
    { nombre: "Quillan", dias: [1, 2, 3, 4, 5, 6] },
    { nombre: "Alvaro",  dias: [1, 2, 3, 4, 5] },
    { nombre: "Lucio",   dias: [3, 4, 5, 6] },
    { nombre: "Tomas",   dias: [2, 4, 6] }
];

const servicios = [
    { nombre: "Corte",                  precio: 8000 },
    { nombre: "Barba",                  precio: 5000 },
    { nombre: "Corte + Barba",          precio: 11000 },
    { nombre: "Corte infantil",         precio: 6000 },
    { nombre: "Tintura",                precio: 15000 },
    { nombre: "Asesoramiento completo", precio: 12000 }
];

const CLAVE = "turnos_fanzo_barber";

function cargarTurnos() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE)) || [];
    } catch (error) {
        return [];
    }
}

function guardarTurnos(turnos) {
    localStorage.setItem(CLAVE, JSON.stringify(turnos));
}

const selectServicio = document.getElementById("servicio");

function formatoPrecio(valor) {
    return "$" + valor.toLocaleString("es-AR");
}

servicios.forEach(s => {
    const opcion = document.createElement("option");
    opcion.value = s.nombre;
    opcion.textContent = `${s.nombre} - ${formatoPrecio(s.precio)}`;
    selectServicio.appendChild(opcion);
});

const modal = document.getElementById("modal");
const fecha = document.getElementById("fecha");
const selectPeluquero = document.getElementById("peluquero");
const mensaje = document.getElementById("mensaje");
const modalTurnos = document.getElementById("modalTurnos");
const diaTurnos = document.getElementById("diaTurnos");
const cuerpoTurnos = document.getElementById("cuerpoTurnos");
const totalDia = document.getElementById("totalDia");

const diasConTurnos = document.getElementById("diasConTurnos");

function mostrarDias(diaActivo) {
    const dias = [...new Set(cargarTurnos().map(t => t.fecha.slice(0, 10)))].sort();

    diasConTurnos.innerHTML = "";

    if (dias.length === 0) {
        const aviso = document.createElement("span");
        aviso.className = "sin-dias";
        aviso.textContent = "Todavía no hay turnos guardados";
        diasConTurnos.appendChild(aviso);
        return;
    }

    dias.forEach(d => {
        const cantidad = cargarTurnos().filter(t => t.fecha.slice(0, 10) === d).length;
        const texto = new Date(d + "T00:00").toLocaleDateString("es-AR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit"
        });

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "dia-btn" + (d === diaActivo ? " activo" : "");
        boton.textContent = `${texto} (${cantidad})`;
        boton.dataset.dia = d;
        diasConTurnos.appendChild(boton);
    });
}

diasConTurnos.addEventListener("click", (e) => {
    if (!e.target.classList.contains("dia-btn")) return;
    diaTurnos.value = e.target.dataset.dia;
    mostrarTurnos();
});

const tituloModal = document.getElementById("tituloModal");
const btnEnviar = document.getElementById("btnEnviar");
let editandoId = null;

function modoNuevo() {
    editandoId = null;
    tituloModal.textContent = "Reservar Turno";
    btnEnviar.textContent = "Confirmar turno";
}

function hoy() {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 10);
}

function fechaMinima() {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    fecha.min = ahora.toISOString().slice(0, 16);
}

document.getElementById("btn1").addEventListener("click", () => {
    modoNuevo();
    document.getElementById("formTurno").reset();
    selectPeluquero.innerHTML = '<option value="">Primero elige fecha y hora</option>';
    selectPeluquero.disabled = true;
    fechaMinima();
    mensaje.textContent = "";
    modal.classList.add("abierto");
});

function cerrarModales() {
    modal.classList.remove("abierto");
    modalTurnos.classList.remove("abierto");
    modoNuevo();
}

document.getElementById("cerrar").addEventListener("click", cerrarModales);
document.getElementById("cerrarTurnos").addEventListener("click", cerrarModales);

[modal, modalTurnos].forEach(m => {
    m.addEventListener("click", (e) => {
        if (e.target === m) cerrarModales();
    });
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarModales();
});

function llenarPeluqueros() {
    if (!fecha.value) return;

    const dia = new Date(fecha.value).getDay();
    const disponibles = peluqueros.filter(p => p.dias.includes(dia));

    selectPeluquero.innerHTML = "";

    if (disponibles.length === 0) {
        selectPeluquero.innerHTML = '<option value="">No hay peluqueros ese día</option>';
        selectPeluquero.disabled = true;
        return;
    }

    selectPeluquero.innerHTML = '<option value="">Selecciona un peluquero</option>';
    disponibles.forEach(p => {
        const opcion = document.createElement("option");
        opcion.textContent = p.nombre;
        selectPeluquero.appendChild(opcion);
    });
    selectPeluquero.disabled = false;
}

fecha.addEventListener("change", llenarPeluqueros);

document.getElementById("formTurno").addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const servicio = selectServicio.value;
    const precio = servicios.find(s => s.nombre === servicio).precio;
    const barbero = selectPeluquero.value;

    const turnos = cargarTurnos();

    // Evita doble reserva (ignorando el propio turno si se está editando)
    const ocupado = turnos.some(t =>
        t.id !== editandoId && t.fecha === fecha.value && t.peluquero === barbero
    );
    if (ocupado) {
        mensaje.style.color = "#ff7b7b";
        mensaje.textContent = `${barbero} ya tiene un turno a esa hora. Elige otro horario o peluquero.`;
        return;
    }

    // ===== Modo edición =====
    if (editandoId !== null) {
        const turno = turnos.find(t => t.id === editandoId);
        turno.fecha = fecha.value;
        turno.nombre = nombre;
        turno.servicio = servicio;
        turno.precio = precio;
        turno.peluquero = barbero;
        guardarTurnos(turnos);

        const diaEditado = fecha.value.slice(0, 10);
        cerrarModales();
        diaTurnos.value = diaEditado;
        mostrarTurnos();
        modalTurnos.classList.add("abierto");
        return;
    }

    // ===== Modo nuevo =====
    turnos.push({
        id: Date.now(),
        fecha: fecha.value,
        nombre: nombre,
        servicio: servicio,
        precio: precio,
        peluquero: barbero
    });
    guardarTurnos(turnos);

    const fechaTexto = new Date(fecha.value).toLocaleString("es-AR", {
        dateStyle: "full",
        timeStyle: "short"
    });

    mensaje.style.color = "#6fdc8c";
    mensaje.textContent = `¡Listo ${nombre}! Turno de "${servicio}" (${formatoPrecio(precio)}) con ${barbero} el ${fechaTexto}.`;
    e.target.reset();
    selectPeluquero.innerHTML = '<option value="">Primero elige fecha y hora</option>';
    selectPeluquero.disabled = true;
});

function mostrarTurnos() {
    const dia = diaTurnos.value;
    mostrarDias(dia);
    document.getElementById("fechaImpresion").textContent =
    "FANZO BARBER - " + new Date(dia + "T00:00").toLocaleDateString("es-AR", { dateStyle: "full" });
    const lista = cargarTurnos()
        .filter(t => t.fecha.slice(0, 10) === dia)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

    cuerpoTurnos.innerHTML = "";

    if (lista.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 6;
        celda.className = "vacio";
        celda.textContent = "No hay turnos para este día";
        fila.appendChild(celda);
        cuerpoTurnos.appendChild(fila);
        totalDia.textContent = "Total del día: " + formatoPrecio(0);
        return;
    }

    let total = 0;

    lista.forEach(t => {
        total += t.precio;
        const fila = document.createElement("tr");

        [t.fecha.slice(11), t.nombre, t.servicio, t.peluquero, formatoPrecio(t.precio)]
            .forEach(texto => {
                const celda = document.createElement("td");
                celda.textContent = texto;
                fila.appendChild(celda);
            });

        const celdaAcciones = document.createElement("td");

const botonEditar = document.createElement("button");
botonEditar.className = "editar";
botonEditar.textContent = "Editar";
botonEditar.dataset.id = t.id;

const botonBorrar = document.createElement("button");
botonBorrar.className = "borrar";
botonBorrar.textContent = "Borrar";
botonBorrar.dataset.id = t.id;

celdaAcciones.appendChild(botonEditar);
celdaAcciones.appendChild(botonBorrar);
fila.appendChild(celdaAcciones);

        cuerpoTurnos.appendChild(fila);
    });

    totalDia.textContent = `Total del día (${lista.length} turnos): ${formatoPrecio(total)}`;
}

document.getElementById("btn2").addEventListener("click", () => {
    diaTurnos.value = hoy();
    mostrarTurnos();
    modalTurnos.classList.add("abierto");
});

diaTurnos.addEventListener("change", mostrarTurnos);

cuerpoTurnos.addEventListener("click", (e) => {
    const id = Number(e.target.dataset.id);

    if (e.target.classList.contains("borrar")) {
        guardarTurnos(cargarTurnos().filter(t => t.id !== id));
        mostrarTurnos();
        return;
    }

    if (e.target.classList.contains("editar")) {
        const t = cargarTurnos().find(t => t.id === id);
        if (!t) return;

        editandoId = id;
        fecha.min = "";   // permite editar turnos de fechas pasadas
        fecha.value = t.fecha;
        document.getElementById("nombre").value = t.nombre;
        selectServicio.value = t.servicio;
        llenarPeluqueros();
        selectPeluquero.value = t.peluquero;

        tituloModal.textContent = "Editar turno";
        btnEnviar.textContent = "Guardar cambios";
        mensaje.textContent = "";

        modalTurnos.classList.remove("abierto");
        modal.classList.add("abierto");
    }
});
document.getElementById("btn3").addEventListener("click", () => {
    if (!diaTurnos.value) diaTurnos.value = hoy();
    mostrarTurnos();
    modal.classList.remove("abierto");
    modalTurnos.classList.add("abierto");
    setTimeout(() => window.print(), 300);
});