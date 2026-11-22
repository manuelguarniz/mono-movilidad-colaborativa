// Data de prueba de ColaboraCar: usuarios, vehículos, viajes, reservas, calificaciones y billetera.
//
// Uso (mongosh, después de seed.js, que carga los catálogos):
//   mongosh "mongodb+srv://<usuario>:<clave>@<cluster>/db_colabora_car" seed-data.js
//   SEED_DRY_RUN=1 mongosh "<uri>" seed-data.js   → solo genera y muestra el resumen, no escribe.
//
// Qué genera (relativo a la fecha en que se ejecuta):
//   - 200 usuarios con la contraseña «Peru123..» y ultima_conexion registrada (entran sin OTP), salvo los
//     4 de perfil pendiente. 60 % en las 5 sedes de Lima y el resto en provincias.
//   - 50 con vehículo: 20 conductores frecuentes (ida y vuelta casi todos los días) y 30 ocasionales.
//   - 10 000 viajes históricos de los últimos 12 meses (COMPLETADO y CANCELADO), llenos y con plazas libres,
//     más los vigentes: PUBLICADO en los próximos 7 días con reservas CONFIRMADA y hasta 2 EN_CURSO.
//   - Reservas en todos los estados, calificaciones, recargas, cobros, retiros (pagados, rechazados y
//     pendientes) y sanciones vigentes (RN-30 y RN-38).
//
// Es idempotente: todos los _id empiezan con «5eed», y antes de insertar se borran solo esos documentos.
// Los datos reales (cualquier otro _id) no se tocan.

const DRY_RUN = typeof process !== "undefined" && process.env.SEED_DRY_RUN === "1";

// BCrypt de «Peru123..» (el backend usa BCryptPasswordEncoder, que acepta el prefijo $2a$).
const CONTRASENA_HASH = "$2a$10$bljSYDHPQCHkSe89AC/pnei2OKhXYHkvz6GnRkrcdgg8RO8MH7yNm";
const FACTOR_CO2_KG_KM = 0.18;

// ───────────────────────────── Utilidades ─────────────────────────────

// Azar con semilla fija (mulberry32): la misma fecha de ejecución genera la misma data.
let semilla = 20261121;
const azar = () => {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
const real = (a, b) => a + azar() * (b - a);
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
const prob = (p) => azar() < p;
const normal = () => Math.sqrt(-2 * Math.log(1 - azar())) * Math.cos(2 * Math.PI * azar());
const barajar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};
const digitos = (n) => Array.from({ length: n }, () => entre(0, 9)).join("");

const MIN = 60 * 1000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;
const OFFSET_PERU = 5 * HORA; // Perú es UTC−5 todo el año.

// _id con prefijo fijo por colección: 5eed + código de 2 hex + contador de 18 hex.
const CODIGOS = { usuarios: "01", viajes: "02", reservas: "03", calificaciones: "04", pagos: "05", movimientos_creditos: "06", retiros: "07" };
const contadores = {};
const nuevoId = (coleccion) => {
  contadores[coleccion] = (contadores[coleccion] || 0) + 1;
  return new ObjectId("5eed" + CODIGOS[coleccion] + contadores[coleccion].toString(16).padStart(18, "0"));
};

const inicioDiaPeru = (ms) => Math.floor((ms - OFFSET_PERU) / DIA) * DIA + OFFSET_PERU;
const diaSemanaPeru = (ms) => new Date(ms - OFFSET_PERU).getUTCDay();
const fechaLocal = (ms) => new Date(ms - OFFSET_PERU); // usar con getUTC*
const horaLocal = (ms) => { const f = fechaLocal(ms); return f.getUTCHours() + f.getUTCMinutes() / 60; };

const haversineKm = ([lon1, lat1], [lon2, lat2]) => {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a));
};
const punto = (coordenadas) => ({ type: "Point", coordinates: coordenadas });
// Spring Data no escribe los campos null: se quitan para que los documentos sean iguales a los del backend.
const sinNulos = (objeto) => Object.fromEntries(Object.entries(objeto).filter(([, v]) => v !== null && v !== undefined));
const nombrePublico = (u) => `${u.nombres.split(" ")[0]} ${u.apellidos[0]}.`;

const AHORA = Math.floor(Date.now() / MIN) * MIN;
const INICIO_HISTORIAL = AHORA - 365 * DIA;
const FIN_HISTORIAL = AHORA - 3 * HORA;
const VENTANA_SANCION = AHORA - 30 * DIA;

// ───────────────────────────── Catálogos (de seed.js) ─────────────────────────────

const sedesBd = db.sedes.find({ activa: true }).toArray();
if (sedesBd.length === 0) throw new Error("No hay sedes: ejecuta primero seed.js");
const distritosBd = new Map(db.distritos.find().toArray().map((d) => [d._id.toHexString(), d]));

// Barrios de referencia por sede: [nombre, longitud, latitud]. Son los domicilios de los usuarios y las paradas.
const BARRIOS = {
  "UTP Sede Trujillo": [["Urb. California", -79.045, -8.118], ["Víctor Larco Herrera", -79.0437, -8.1321], ["La Esperanza", -79.044, -8.076], ["El Porvenir", -79.001, -8.078], ["Florencia de Mora", -79.023, -8.082], ["Huanchaco", -79.12, -8.079], ["Urb. El Golf", -79.039, -8.123]],
  "UTP Sede Chimbote": [["Urb. Buenos Aires", -78.542, -9.114], ["Chimbote Centro", -78.592, -9.075], ["Urb. Los Pinos", -78.556, -9.104], ["Villa María", -78.548, -9.122], ["Bellamar", -78.516, -9.135]],
  "UTP Sede Arequipa": [["Cayma", -71.545, -16.387], ["Yanahuara", -71.547, -16.392], ["Cerro Colorado", -71.565, -16.372], ["Paucarpata", -71.51, -16.43], ["José Luis Bustamante y Rivero", -71.525, -16.425], ["Miraflores", -71.525, -16.395], ["Sachaca", -71.565, -16.42]],
  "UTP Sede Ica": [["Ica Centro", -75.7286, -14.0678], ["Parcona", -75.702, -14.048], ["La Tinguiña", -75.71, -14.035], ["Subtanjalla", -75.758, -14.02], ["San Joaquín", -75.738, -14.056], ["Los Aquijes", -75.695, -14.095]],
  "UTP Sede Huancayo": [["Huancayo Centro", -75.2049, -12.0651], ["Chilca", -75.2, -12.085], ["El Tambo - Av. Huancavelica", -75.217, -12.05], ["Pio Pata", -75.195, -12.045], ["San Carlos", -75.198, -12.058], ["Saño", -75.242, -11.96]],
  "UTP Sede Chiclayo": [["Chiclayo Centro", -79.8409, -6.7714], ["José Leonardo Ortiz", -79.845, -6.75], ["La Victoria", -79.835, -6.79], ["Pimentel", -79.934, -6.837], ["Urb. Santa Victoria", -79.848, -6.78], ["Lambayeque", -79.906, -6.701]],
  "UTP Sede Lima Centro": [["Breña", -77.051, -12.059], ["Jesús María", -77.048, -12.075], ["Lince", -77.035, -12.085], ["La Victoria", -77.028, -12.07], ["San Miguel", -77.09, -12.077], ["Pueblo Libre", -77.063, -12.075], ["Rímac", -77.03, -12.03], ["Callao Cercado", -77.118, -12.056]],
  "UTP Sede Lima Este - Ate": [["Santa Clara", -76.88, -12.017], ["Huaycán", -76.818, -12.017], ["Vitarte", -76.93, -12.028], ["Chosica", -76.695, -11.942], ["Chaclacayo", -76.77, -11.98], ["La Molina", -76.94, -12.085], ["Santa Anita", -76.97, -12.043]],
  "UTP Sede Lima Norte": [["Pro - Los Olivos", -77.075, -11.94], ["Comas", -77.05, -11.94], ["San Martín de Porres", -77.07, -12.0], ["Independencia", -77.055, -11.99], ["Puente Piedra", -77.078, -11.865], ["Carabayllo", -77.035, -11.86], ["Ventanilla", -77.13, -11.875]],
  "UTP Sede Lima Este - SJL": [["Zárate", -77.001, -12.023], ["Canto Grande", -76.988, -11.955], ["Mangomarca", -76.985, -12.01], ["Campoy", -76.975, -12.02], ["El Agustino", -76.995, -12.044], ["Bayóvar", -76.993, -11.95]],
  "UTP Sede Lima Sur": [["Villa María del Triunfo", -76.94, -12.16], ["San Juan de Miraflores", -76.97, -12.155], ["Chorrillos", -77.01, -12.17], ["Lurín", -76.87, -12.27], ["Pachacámac", -76.86, -12.23], ["Surco - Las Gardenias", -76.99, -12.135], ["Villa El Salvador - Sector 2", -76.94, -12.21]],
  "UTP Sede Iquitos": [["Iquitos Centro", -73.2516, -3.7491], ["Belén", -73.247, -3.76], ["Punchana", -73.245, -3.73], ["San Juan Bautista", -73.28, -3.78], ["Santa Clara de Nanay", -73.305, -3.78]],
  "UTP Sede Piura": [["Piura Centro", -80.6328, -5.1945], ["Castilla", -80.62, -5.195], ["Veintiséis de Octubre", -80.67, -5.185], ["Urb. Santa Isabel", -80.65, -5.18], ["Catacaos", -80.675, -5.265], ["Urb. Miraflores (Castilla)", -80.615, -5.2]],
  "UTP Sede Tacna": [["Tacna Centro", -70.2483, -18.0146], ["Ciudad Nueva", -70.235, -17.995], ["Alto de la Alianza", -70.25, -17.995], ["Gregorio Albarracín", -70.26, -18.04], ["Pocollay", -70.22, -18.0], ["Calana", -70.19, -17.99]],
  "UTP Sede Pucallpa": [["Pucallpa Centro", -74.5539, -8.3791], ["Yarinacocha", -74.59, -8.35], ["Manantay", -74.545, -8.405], ["Urb. Las Palmeras", -74.565, -8.395], ["Campo Verde", -74.65, -8.48]],
};

const sedes = sedesBd.map((s) => {
  const distrito = distritosBd.get(s.distrito.id.toHexString());
  const barrios = BARRIOS[s.nombre];
  if (!barrios) throw new Error(`Faltan barrios para ${s.nombre}`);
  return {
    id: s._id,
    nombre: s.nombre,
    direccion: s.direccion,
    coordenadas: s.ubicacion.coordinates,
    ciudad: s.distrito.nombre,
    distrito: { id: s.distrito.id, nombre: s.distrito.nombre },
    departamento: { id: distrito.departamento.id, nombre: distrito.departamento.nombre },
    esLima: s.nombre.startsWith("UTP Sede Lima"),
    barrios,
  };
});
const sedePorNombre = new Map(sedes.map((s) => [s.nombre, s]));

// Composición por sede: [conductores frecuentes, ocasionales, pasajeros]. Suma 200 usuarios, 20 + 30 + 150.
const COMPOSICION = {
  "UTP Sede Lima Centro": [3, 2, 19], "UTP Sede Lima Este - Ate": [3, 2, 19], "UTP Sede Lima Norte": [3, 2, 19],
  "UTP Sede Lima Este - SJL": [3, 2, 19], "UTP Sede Lima Sur": [3, 2, 19],
  "UTP Sede Trujillo": [1, 2, 5], "UTP Sede Arequipa": [1, 2, 5], "UTP Sede Chiclayo": [1, 2, 5],
  "UTP Sede Piura": [1, 2, 5], "UTP Sede Huancayo": [1, 2, 5],
  "UTP Sede Chimbote": [0, 2, 6], "UTP Sede Ica": [0, 2, 6], "UTP Sede Iquitos": [0, 2, 6],
  "UTP Sede Tacna": [0, 2, 6], "UTP Sede Pucallpa": [0, 2, 6],
};

// ───────────────────────────── Datos de referencia ─────────────────────────────

const NOMBRES_F = ["María Fernanda", "Valeria", "Camila", "Lucía", "Daniela", "Andrea", "Ximena", "Sofía", "Alejandra", "Gabriela", "Natalia", "Mariana", "Fiorella", "Rosa", "Milagros", "Katherine", "Diana", "Paola", "Ana Lucía", "Brenda", "Claudia", "Estefany", "Jimena", "Nicole", "Karla", "Luz Mery", "Yesenia", "Angie", "Carolina", "Pamela"];
const NOMBRES_M = ["Carlos Alberto", "José Luis", "Luis Miguel", "Jorge", "Diego", "Sebastián", "Renzo", "Kevin", "Jhon", "Miguel Ángel", "Juan Carlos", "Bryan", "Christian", "Piero", "Gonzalo", "Eduardo", "Marco Antonio", "Rodrigo", "Franco", "Jean Pierre", "Alonso", "Fernando", "Ricardo", "Anthony", "Joel", "Víctor Hugo", "César", "Martín", "Raúl", "Gustavo"];
const APELLIDOS = ["Quispe", "Flores", "Sánchez", "Rodríguez", "García", "Rojas", "Huamán", "Mendoza", "Díaz", "Torres", "Ramírez", "Vásquez", "Chávez", "Castillo", "Mamani", "Gutiérrez", "Espinoza", "Ramos", "Ruiz", "Salazar", "Paredes", "Cárdenas", "Valverde", "Guarniz", "Alvarado", "Pérez", "Vargas", "Romero", "Medina", "Cruz", "Aguilar", "Silva", "Ccahuana", "Tello", "Huertas", "Villanueva", "León", "Navarro", "Soto", "Zapata"];

// [tipo, marca, modelo, plazas máximas]
const VEHICULOS = [
  ["SEDAN", "Toyota", "Yaris", 4], ["SEDAN", "Kia", "Rio", 4], ["SEDAN", "Hyundai", "Accent", 4], ["SEDAN", "Chevrolet", "Onix", 4],
  ["SEDAN", "Nissan", "Versa", 4], ["SEDAN", "Toyota", "Corolla", 4], ["HATCHBACK", "Kia", "Picanto", 4], ["HATCHBACK", "Suzuki", "Swift", 4],
  ["HATCHBACK", "Hyundai", "Grand i10", 4], ["HATCHBACK", "Volkswagen", "Gol", 4], ["SUV", "Toyota", "RAV4", 4], ["SUV", "Hyundai", "Tucson", 4],
  ["SUV", "Kia", "Sportage", 4], ["SUV", "Suzuki", "Vitara", 4],
];
const VANS = [["VAN", "Hyundai", "H-1", 7], ["VAN", "Toyota", "Hiace", 8]];
const MOTOS = [["MOTO", "Honda", "CB190R", 1], ["MOTO", "Yamaha", "FZ 2.0", 1], ["MOTO", "Bajaj", "Pulsar NS200", 1]];
const COLORES = ["Blanco", "Plata", "Gris", "Negro", "Rojo", "Azul", "Guinda", "Beige"];
const ASEGURADORAS = ["Rímac Seguros", "Pacífico Seguros", "La Positiva", "Mapfre Perú", "Interseguro", "Protecta"];
const CONDICIONES = ["No se admiten desvíos", "Máximo de espera 5 minutos", "No comer dentro del vehículo", "Puntualidad", "Solo equipaje de mano", "No fumar", "Uso obligatorio del cinturón", "Música a volumen moderado", "No se admiten mascotas"];
const MOTIVOS_CANCELACION = ["Se me presentó un imprevisto familiar", "El vehículo tiene una falla mecánica", "Me cambiaron el horario de clases", "Estoy enfermo", "Problemas con el tránsito en la zona", null, null];
const MOTIVOS_RECHAZO = ["El número de Yape no coincide con el titular", "El número de Yape no está activo", "Datos de la cuenta incompletos"];
const NOTAS_ASISTENCIA = {
  SILLA_RUEDAS: ["Silla plegable, puedo pasar al asiento solo.", "Uso silla de ruedas plegable, necesito apoyo para guardarla.", null],
  MULETAS_ANDADOR: ["Uso muletas, necesito un poco más de tiempo para subir.", "Camino con andador plegable."],
  OTRA: ["Tengo baja visión, por favor avísenme al llegar.", "Prefiero el asiento delantero por un tema de salud."],
};
const COMENTARIOS = {
  5: ["Puntual y amable.", "Excelente viaje, muy seguro.", "Muy buena conversación, recomendado.", "Todo perfecto.", "Muy respetuoso y puntual.", "Manejo tranquilo, gracias."],
  4: ["Buen viaje, llegó un poco tarde.", "Todo bien.", "Buen trato.", "Cumplió con la ruta."],
  3: ["Se demoró en salir.", "La música estaba muy fuerte.", "Regular, pero llegamos a tiempo."],
  2: ["Llegó tarde y no avisó.", "Manejo un poco brusco."],
  1: ["No respetó las condiciones del viaje.", "Muy impuntual."],
};

// Turnos habituales de un conductor: horas de ida a la sede y de regreso (hora de Perú).
const TURNOS = {
  manana: { ida: [6.5, 6.75, 7, 7.25, 7.5, 8], regreso: [12, 12.5, 13, 13.5, 14] },
  tarde: { ida: [12.5, 13, 13.5, 14], regreso: [17.5, 18, 18.5, 19, 19.5] },
  noche: { ida: [17.5, 17.75, 18, 18.5], regreso: [21.75, 22, 22.25, 22.5, 22.75] },
};

// Feriados de Perú (mes-día) y factor del calendario académico de la UTP (ciclo de verano, vacaciones de medio año).
const FERIADOS = new Set(["1-1", "4-2", "4-3", "5-1", "6-7", "6-29", "7-23", "7-28", "7-29", "8-6", "8-30", "10-8", "11-1", "12-8", "12-9", "12-25"]);
const factorAcademico = (ms) => {
  const f = fechaLocal(ms);
  const mes = f.getUTCMonth() + 1;
  const dia = f.getUTCDate();
  if (FERIADOS.has(`${mes}-${dia}`)) return 0.05;
  if (mes === 1 || mes === 2) return 0.4;
  if (mes === 3 && dia <= 15) return 0.6;
  if (mes === 12 && dia >= 20) return 0.15;
  if ((mes === 7 && dia >= 20) || (mes === 8 && dia <= 10)) return 0.4;
  return 1;
};

// ───────────────────────────── Usuarios ─────────────────────────────

const existentes = db.usuarios.find({ _id: { $not: { $gte: new ObjectId("5eed00000000000000000000"), $lte: new ObjectId("5eedffffffffffffffffffff") } } }, { correo: 1, "vehiculo.placa": 1 }).toArray();
const correosUsados = new Set(existentes.map((u) => u.correo));
const placasUsadas = new Set(existentes.filter((u) => u.vehiculo).map((u) => u.vehiculo.placa));
const documentosUsados = new Set();

const nuevaPlaca = () => {
  const letras = "ABCDEFGHJKLMNPRSTUVWXZ";
  let placa;
  do placa = `${elegir(letras)}${entre(1, 9)}${elegir(letras)}-${digitos(3)}`; while (placasUsadas.has(placa));
  placasUsadas.add(placa);
  return placa;
};
const nuevoDocumento = (tipo) => {
  let numero;
  do numero = tipo === "DNI" ? `${entre(4, 7)}${digitos(7)}` : `00${digitos(7)}`; while (documentosUsados.has(numero));
  documentosUsados.add(numero);
  return numero;
};

const usuarios = [];
let indiceCorreo = 0;
for (const [nombreSede, [frecuentes, ocasionales, pasajeros]] of Object.entries(COMPOSICION)) {
  const sede = sedePorNombre.get(nombreSede);
  const tipos = [...Array(frecuentes).fill("FRECUENTE"), ...Array(ocasionales).fill("OCASIONAL"), ...Array(pasajeros).fill("PASAJERO")];
  for (const tipo of tipos) {
    const mujer = prob(0.48);
    let correo;
    do correo = `u2${5900001 + indiceCorreo++ * 37}@utp.edu.pe`; while (correosUsados.has(correo));
    correosUsados.add(correo);
    usuarios.push({
      _id: nuevoId("usuarios"),
      tipo,
      sede,
      correo,
      nombres: elegir(mujer ? NOMBRES_F : NOMBRES_M),
      apellidos: `${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`,
    });
  }
}

const frecuentes = usuarios.filter((u) => u.tipo === "FRECUENTE");
const ocasionales = usuarios.filter((u) => u.tipo === "OCASIONAL");
const soloPasajeros = usuarios.filter((u) => u.tipo === "PASAJERO");

// Cohortes de los 150 sin vehículo: 4 con perfil pendiente, 2 cuentas bloqueadas, 26 que no usan el servicio
// (6 de ellos con una recarga) y 118 activos (79 %). De los activos: 6 sancionados hoy y 8 cerca del límite.
const pasajerosBarajados = barajar(soloPasajeros);
pasajerosBarajados.forEach((u, i) => {
  u.cohorte = i < 4 ? "PENDIENTE" : i < 6 ? "BLOQUEADO" : i < 32 ? "INACTIVO" : "ACTIVO";
  if (u.cohorte === "INACTIVO" && i < 12) u.soloRecarga = true;
});
const activosLima = barajar(soloPasajeros.filter((u) => u.cohorte === "ACTIVO" && u.sede.esLima));
activosLima.slice(0, 6).forEach((u) => { u.sancion = "BLOQUEADO"; u.metaSancion = entre(5, 7); });
activosLima.slice(6, 14).forEach((u) => { u.sancion = "CERCA"; u.metaSancion = entre(3, 4); });
barajar(soloPasajeros.filter((u) => u.cohorte === "ACTIVO")).slice(0, 8).forEach((u, i) => {
  u.asistenciaTipo = i < 4 ? "SILLA_RUEDAS" : i < 6 ? "MULETAS_ANDADOR" : "OTRA";
});
for (const u of soloPasajeros) {
  if (u.cohorte !== "ACTIVO" && u.cohorte !== "BLOQUEADO") continue;
  u.intensidad = u.sancion ? 3 : elegir([0.5, 1, 1, 1.5, 2, 3]);
  u.calidad = u.sancion ? 3.7 : real(4.2, 5);
}

// Conductores: casos especiales para probar RN-30, RN-36/37 y vehículos inactivos.
const frecuentesLima = barajar(frecuentes.filter((u) => u.sede.esLima));
frecuentesLima[0].sancion = "BLOQUEADO"; frecuentesLima[0].metaSancion = 11;
frecuentesLima[1].sancion = "CERCA"; frecuentesLima[1].metaSancion = 7;
frecuentesLima[2].soatPorVencer = true;
const ocasionalesBarajados = barajar(ocasionales);
ocasionalesBarajados[0].vehiculoInactivo = true;
ocasionalesBarajados[1].vehiculoInactivo = true;
ocasionalesBarajados[2].soatVencido = true;
ocasionalesBarajados.slice(3, 9).forEach((u) => { u.ingresoTardio = true; });
ocasionalesBarajados[9].calidadBaja = true;
const motosPara = new Set(ocasionalesBarajados.slice(10, 13));
const vansPara = new Set([ocasionalesBarajados[13], frecuentesLima[3]]);
const aptos = new Set([...barajar(frecuentes).slice(0, 3), ...ocasionalesBarajados.slice(14, 19)]);

for (const u of usuarios) {
  // Fecha de creación: la mayoría antes del historial; algunos se suman durante el año.
  if (u.cohorte === "PENDIENTE") u.creacion = AHORA - entre(1, 25) * DIA - entre(0, 600) * MIN;
  else if (u.ingresoTardio || (u.tipo === "PASAJERO" && prob(0.15))) u.creacion = AHORA - entre(30, 300) * DIA - entre(0, 600) * MIN;
  else u.creacion = INICIO_HISTORIAL - entre(1, 45) * DIA - entre(0, 600) * MIN;
  u.inicioActividad = u.creacion + entre(1, 3) * DIA;
  if (u.cohorte === "BLOQUEADO") u.fechaBloqueo = AHORA - entre(20, 60) * DIA;

  if (u.cohorte === "PENDIENTE") continue;
  const [nombreBarrio, lon, lat] = elegir(u.sede.barrios);
  u.barrio = nombreBarrio;
  u.casa = [Number((lon + real(-0.004, 0.004)).toFixed(6)), Number((lat + real(-0.004, 0.004)).toFixed(6))];
  u.tipoDocumento = prob(0.96) ? "DNI" : "CE";
  u.numeroDocumento = nuevoDocumento(u.tipoDocumento);
  u.telefono = `+519${digitos(8)}`;
  u.saldo = 0;
  u.retenidos = 0;

  if (u.tipo !== "PASAJERO") {
    const modelo = motosPara.has(u) ? elegir(MOTOS) : vansPara.has(u) ? elegir(VANS) : elegir(VEHICULOS);
    const [tipoVehiculo, marca, nombreModelo, plazasMax] = modelo;
    const esApto = aptos.has(u) && tipoVehiculo !== "MOTO";
    const registro = u.creacion + entre(10, 300) * MIN;
    // SOAT actual: 366 días contando inicio y fin; los viajes anteriores copian la póliza de su año.
    let finSoat;
    if (u.soatPorVencer) finSoat = inicioDiaPeru(AHORA + 2 * DIA);
    else if (u.soatVencido) finSoat = inicioDiaPeru(AHORA - 10 * DIA);
    else finSoat = inicioDiaPeru(AHORA + entre(30, 340) * DIA);
    const inicioSoat = finSoat - 365 * DIA;
    u.vehiculo = {
      placa: nuevaPlaca(),
      tipo: tipoVehiculo,
      marca,
      modelo: nombreModelo,
      color: elegir(COLORES),
      anio: entre(2012, 2025),
      plazas: tipoVehiculo === "MOTO" ? 1 : tipoVehiculo === "VAN" ? plazasMax : entre(3, plazasMax),
      dni_propietario: prob(0.8) ? u.numeroDocumento : `${entre(1, 4)}${digitos(7)}`,
      es_propietario: true,
      estado: u.vehiculoInactivo ? "INACTIVO" : "ACTIVO",
      fecha_aceptacion_terminos: new Date(registro),
      fecha_registro: new Date(registro),
      accesibilidad: { silla_ruedas: esApto, ayuda_abordaje: esApto && prob(0.6) },
      soat: {
        aseguradora: elegir(ASEGURADORAS),
        numero_poliza: `${entre(2301, 2612)}-${digitos(6)}`,
        fecha_inicio: new Date(inicioSoat),
        fecha_fin: new Date(finSoat),
        fecha_declaracion: new Date(Math.min(AHORA - DIA, Math.max(inicioSoat, registro) + entre(0, 4) * DIA)),
      },
    };
    u.vehiculo.es_propietario = u.vehiculo.dni_propietario === u.numeroDocumento;
    u.soatInicio = inicioSoat;
    u.soatFin = finSoat;
    u.apto = esApto;
    // Fin de la actividad como conductor: vehículo desactivado o SOAT vencido.
    u.finConductor = u.vehiculoInactivo ? AHORA - entre(60, 200) * DIA : u.soatVencido ? finSoat : Infinity;
    u.turno = elegir(Object.keys(TURNOS));
    u.ajustePrecio = entre(-1, 1);
    u.condiciones = barajar(CONDICIONES).slice(0, entre(0, 4));
    u.paradasHabituales = barajar(u.sede.barrios.filter(([n]) => n !== u.barrio)).slice(0, entre(0, 2));
    u.calidad = u.calidadBaja ? 3.4 : u.tipo === "FRECUENTE" ? real(4.4, 4.95) : real(3.9, 4.9);
    u.intensidad = 0.8; // los ocasionales también viajan como pasajeros
    u.cohorte = "ACTIVO";
    u.modo = u.tipo === "FRECUENTE" || u.sancion ? "CONDUCTOR"
      : u.vehiculoInactivo ? "PASAJERO" : u.soatVencido ? "CONDUCTOR" : prob(0.5) ? "CONDUCTOR" : "PASAJERO";
  } else {
    u.modo = "PASAJERO";
  }
  if (u.asistenciaTipo) {
    u.asistencia = sinNulos({ tipo: u.asistenciaTipo, nota: elegir(NOTAS_ASISTENCIA[u.asistenciaTipo]), fecha_consentimiento: new Date(u.creacion + 20 * MIN) });
  }
}

// ───────────────────────────── Viajes ─────────────────────────────

const lugarSede = (sede) => ({ etiqueta: sede.nombre, direccion: sede.direccion, ubicacion: punto(sede.coordenadas) });
const lugarCasa = (u) => ({ etiqueta: u.barrio, direccion: `${u.barrio}, ${u.sede.ciudad}`, ubicacion: punto(u.casa) });

const armarRuta = (conductor, sentido) => {
  const paradas = prob(0.7) ? conductor.paradasHabituales.map(([n, lon, lat]) => ({ etiqueta: n, ubicacion: punto([lon, lat]) })) : [];
  const ida = sentido === "IDA_UNIVERSIDAD";
  const origen = ida ? lugarCasa(conductor) : lugarSede(conductor.sede);
  const destino = ida ? lugarSede(conductor.sede) : lugarCasa(conductor);
  const tramo = ida ? paradas : [...paradas].reverse();
  const puntos = [origen, ...tramo, destino].map((l) => l.ubicacion.coordinates);
  let distancia = 0;
  for (let i = 1; i < puntos.length; i++) distancia += haversineKm(puntos[i - 1], puntos[i]);
  distancia = Math.max(0.5, Math.round(distancia * 10) / 10);
  return { origen, destino, paradas: tramo, distancia, duracion: Math.max(1, Math.ceil((distancia / 35) * 60)) };
};

const crearViaje = (conductor, salida, sentido) => {
  const ruta = armarRuta(conductor, sentido);
  const plazasTotales = conductor.vehiculo.plazas === 1 || prob(0.7) ? conductor.vehiculo.plazas : entre(1, conductor.vehiculo.plazas - 1);
  return {
    _id: null,
    conductor,
    salida,
    sentido,
    ...ruta,
    precio: Math.min(10, Math.max(1, Math.round(1 + ruta.distancia * 0.45) + conductor.ajustePrecio)),
    plazasTotales,
    condiciones: prob(0.85) ? conductor.condiciones : barajar(CONDICIONES).slice(0, entre(0, 3)),
    creacion: salida - entre(4 * 60, 72 * 60) * MIN,
    reservas: [],
  };
};

const salidaEn = (dia, horas) => dia + Math.round(horas * 60) * MIN + elegir([0, 0, 0, 15, -15]) * MIN;
const puedeConducir = (u, salida) => salida >= u.inicioActividad && salida < u.finConductor && salida < u.soatFin + DIA;

// Viajes de un conductor en un día, según su turno y su frecuencia.
const viajesDelDia = (u, dia, frecuencia) => {
  const dow = diaSemanaPeru(dia + HORA);
  const base = dow === 0 ? 0.03 : dow === 6 ? 0.4 : 0.95;
  if (!prob(base * frecuencia * factorAcademico(dia + 12 * HORA))) return [];
  const turno = TURNOS[u.turno];
  const viajes = [];
  if (prob(0.95)) viajes.push(crearViaje(u, salidaEn(dia, elegir(turno.ida)), "IDA_UNIVERSIDAD"));
  if (prob(0.92)) viajes.push(crearViaje(u, salidaEn(dia, elegir(turno.regreso)), "REGRESO_CASA"));
  return viajes;
};

const conductores = [...frecuentes, ...ocasionales];
const frecuenciaDe = (u) => (u.tipo === "FRECUENTE" ? 1 : 0.22);
let historicos = [];
for (let dia = inicioDiaPeru(INICIO_HISTORIAL) + DIA; dia < AHORA; dia += DIA) {
  for (const u of conductores) {
    for (const v of viajesDelDia(u, dia, frecuenciaDe(u))) {
      if (v.salida < FIN_HISTORIAL && v.salida > INICIO_HISTORIAL && puedeConducir(u, v.salida) && v.creacion > u.inicioActividad) historicos.push(v);
    }
  }
}
// Exactamente 10 000 históricos: se completan con sábados de los frecuentes o se descartan al azar.
while (historicos.length < 10000) {
  const u = elegir(frecuentes);
  const dia = inicioDiaPeru(INICIO_HISTORIAL) + entre(1, 360) * DIA;
  const v = crearViaje(u, salidaEn(dia, elegir(TURNOS[u.turno].ida)), "IDA_UNIVERSIDAD");
  if (v.salida < FIN_HISTORIAL && puedeConducir(u, v.salida) && v.creacion > u.inicioActividad) historicos.push(v);
}
historicos = barajar(historicos).slice(0, 10000);

// Vigentes: viajes PUBLICADO de los próximos 7 días y hasta 2 EN_CURSO ahora mismo.
const puedePublicarHoy = (u) => u.modo === "CONDUCTOR" && u.vehiculo.estado === "ACTIVO" && u.sancion !== "BLOQUEADO" && u.soatFin > AHORA;
const vigentes = [];
for (let dia = inicioDiaPeru(AHORA); dia < AHORA + 7 * DIA; dia += DIA) {
  for (const u of conductores.filter(puedePublicarHoy)) {
    for (const v of viajesDelDia(u, dia, frecuenciaDe(u))) {
      if (v.salida > AHORA + HORA && v.salida < AHORA + 7 * DIA && v.salida < u.soatFin + DIA) {
        v.creacion = Math.min(v.creacion, AHORA - entre(5, 600) * MIN);
        v.vigente = "PUBLICADO";
        vigentes.push(v);
      }
    }
  }
}
const horaAhora = horaLocal(AHORA);
if (horaAhora >= 6.5 && horaAhora <= 22.5) {
  for (const u of frecuentesLima.filter(puedePublicarHoy).slice(0, 2)) {
    const v = crearViaje(u, AHORA - entre(5, 15) * MIN, horaAhora < 12 ? "IDA_UNIVERSIDAD" : "REGRESO_CASA");
    v.vigente = "EN_CURSO";
    vigentes.push(v);
  }
}

const viajes = [...historicos, ...vigentes].sort((a, b) => a.salida - b.salida);
viajes.forEach((v) => { v._id = nuevoId("viajes"); });

// ───────────────────────────── Reservas y desenlaces ─────────────────────────────

// Agenda de cada usuario: no puede estar en dos viajes con menos de 2 h 30 de diferencia.
const agenda = new Map();
const claveAgenda = (u, ms) => `${u._id.toHexString()}|${Math.floor((ms - OFFSET_PERU) / DIA)}`;
const ocupado = (u, ms) => {
  for (const d of [-1, 0, 1]) {
    const horas = agenda.get(claveAgenda(u, ms + d * DIA));
    if (horas && horas.some((h) => Math.abs(h - ms) < 150 * MIN)) return true;
  }
  return false;
};
const agendar = (u, ms) => {
  const clave = claveAgenda(u, ms);
  if (!agenda.has(clave)) agenda.set(clave, []);
  agenda.get(clave).push(ms);
};
viajes.forEach((v) => agendar(v.conductor, v.salida));

const pasajerosPorSede = new Map(sedes.map((s) => [s.nombre, usuarios.filter((u) => u.sede === s && (u.cohorte === "ACTIVO" || u.cohorte === "BLOQUEADO"))]));
const reservas = [];
const conReservaActiva = new Set();
// Cancelaciones en la ventana de 30 días: del conductor (RN-30) y del pasajero (RN-38), por separado.
const sancionesConductor = new Map();
const sancionesPasajero = new Map();
const sumar = (mapa, u, ms) => { if (ms >= VENTANA_SANCION) mapa.set(u, (mapa.get(u) || 0) + 1); };
const sumarSancion = (u, ms) => sumar(sancionesPasajero, u, ms);
const sancionesDe = (u) => sancionesPasajero.get(u) || 0;
const cancelacionesDe = (u) => sancionesConductor.get(u) || 0;

const elegirPasajeros = (v, plazasObjetivo) => {
  const candidatos = pasajerosPorSede.get(v.conductor.sede.nombre).filter((p) => p !== v.conductor
    && p.inicioActividad < v.creacion
    && !(p.fechaBloqueo && v.salida > p.fechaBloqueo)
    && !ocupado(p, v.salida)
    && !(v.vigente && (conReservaActiva.has(p) || p.modo !== "PASAJERO" || p.sancion === "BLOQUEADO")));
  const elegidos = [];
  let restantes = plazasObjetivo;
  while (restantes > 0 && candidatos.length > 0) {
    const total = candidatos.reduce((s, p) => s + p.intensidad, 0);
    let r = azar() * total;
    let i = 0;
    while (r > candidatos[i].intensidad && i < candidatos.length - 1) { r -= candidatos[i].intensidad; i++; }
    const [p] = candidatos.splice(i, 1);
    const plazas = restantes >= 2 && prob(0.1) ? 2 : 1;
    elegidos.push({ pasajero: p, plazas });
    restantes -= plazas;
  }
  return elegidos;
};

for (const v of viajes) {
  const r = azar();
  const plazasObjetivo = v.vigente === "EN_CURSO" ? Math.min(v.plazasTotales, 3)
    : r < 0.35 ? v.plazasTotales : r < 0.88 ? entre(1, v.plazasTotales) : 0;
  const conductor = v.conductor;
  const enVentana = v.salida >= VENTANA_SANCION;

  for (const { pasajero, plazas } of elegirPasajeros(v, plazasObjetivo)) {
    const limiteCreacion = v.vigente === "PUBLICADO" ? Math.min(AHORA - MIN, v.salida - 60 * MIN) : v.salida - 60 * MIN;
    const creacion = Math.max(v.creacion + 5 * MIN, limiteCreacion - entre(0, Math.max(0, Math.floor((limiteCreacion - v.creacion) / MIN) - 5)) * MIN);
    v.reservas.push({ pasajero, plazas, total: plazas * v.precio, creacion });
    agendar(pasajero, v.salida);
  }

  // Desenlace del viaje.
  if (v.vigente === "PUBLICADO") {
    v.estado = "PUBLICADO";
  } else if (v.vigente === "EN_CURSO") {
    v.estado = "EN_CURSO";
    v.inicio = Math.min(AHORA - MIN, v.salida + entre(0, 3) * MIN);
  } else {
    let cancelar;
    const sinPasajeros = v.reservas.length === 0;
    if (conductor.sancion && enVentana && cancelacionesDe(conductor) < conductor.metaSancion) cancelar = prob(0.6) ? (sinPasajeros && prob(0.5) ? "SISTEMA" : "CONDUCTOR") : null;
    else if (sinPasajeros) cancelar = elegir([null, null, "SISTEMA", "SISTEMA", "CONDUCTOR"]);
    else cancelar = prob(0.03) ? "CONDUCTOR" : prob(0.01) ? "SISTEMA" : null;
    // Fuera de los casos de prueba, nadie llega al límite de RN-30 por azar.
    if (cancelar && enVentana && !conductor.sancion && cancelacionesDe(conductor) >= 3) cancelar = null;

    if (cancelar) {
      v.estado = "CANCELADO";
      v.canceladoPor = cancelar;
      const ultimaReserva = Math.max(v.creacion, ...v.reservas.map((x) => x.creacion));
      v.cancelacion = cancelar === "SISTEMA" ? v.salida + 30 * MIN + entre(0, 50) * 1000
        : Math.min(v.salida - 30 * MIN, ultimaReserva + entre(1, Math.max(1, Math.floor((v.salida - 30 * MIN - ultimaReserva) / MIN))) * MIN);
      if (cancelar === "CONDUCTOR") v.motivo = elegir(MOTIVOS_CANCELACION);
      sumar(sancionesConductor, conductor, v.cancelacion);
    } else {
      v.estado = "COMPLETADO";
      v.inicio = v.salida + entre(-10, 20) * MIN;
      if (prob(0.88)) {
        v.finalizadoPor = "CONDUCTOR";
        v.fin = v.inicio + Math.max(1, v.duracion + entre(-2, 12)) * MIN;
      } else {
        v.finalizadoPor = "SISTEMA";
        v.fin = Math.max(v.inicio + MIN, v.salida + (v.duracion + 15) * MIN) + entre(0, 50) * 1000;
      }
    }
  }

  // Desenlace de cada reserva.
  for (const x of v.reservas) {
    const p = x.pasajero;
    if (v.estado === "CANCELADO") {
      x.estado = "CANCELADA"; x.canceladaPor = v.canceladoPor; x.cancelacion = v.cancelacion;
      continue;
    }
    let pCancelar = 0.05;
    let pFaltar = 0.025;
    if (enVentana) {
      const meta = p.sancion ? p.metaSancion : 2;
      if (sancionesDe(p) >= meta) { pCancelar = 0; pFaltar = 0; }
      else if (p.sancion) { pCancelar = 0.3; pFaltar = 0.2; }
    }
    const puedeCancelar = x.creacion < v.salida - 32 * MIN && (v.estado === "COMPLETADO" || (v.estado === "PUBLICADO" && prob(0.5)));
    if (puedeCancelar && prob(pCancelar)) {
      x.estado = "CANCELADA"; x.canceladaPor = "PASAJERO";
      const limite = v.estado === "PUBLICADO" ? Math.min(AHORA - MIN, v.salida - 30 * MIN) : v.salida - 30 * MIN;
      x.cancelacion = Math.min(limite, x.creacion + entre(1, Math.max(1, Math.floor((limite - x.creacion) / MIN))) * MIN);
      sumarSancion(p, x.cancelacion);
    } else if (v.estado === "PUBLICADO") {
      x.estado = "CONFIRMADA";
      conReservaActiva.add(p);
    } else if (prob(pFaltar) || (v.estado === "EN_CURSO" && x === v.reservas[v.reservas.length - 1] && v.reservas.length > 1)) {
      x.estado = "NO_SE_PRESENTO";
      sumarSancion(p, v.fin || v.inicio);
    } else {
      x.estado = v.estado === "EN_CURSO" ? "EN_VIAJE" : "COMPLETADA";
      if (x.estado === "EN_VIAJE") conReservaActiva.add(p);
    }
  }
  const ocupadas = v.reservas.filter((x) => x.estado !== "CANCELADA").reduce((s, x) => s + x.plazas, 0);
  // La cancelación del conductor no devuelve plazas (MisViajesService); la del pasajero, sí.
  v.plazasDisponibles = v.estado === "CANCELADO"
    ? v.plazasTotales - v.reservas.filter((x) => x.canceladaPor !== "PASAJERO").reduce((s, x) => s + x.plazas, 0)
    : v.plazasTotales - ocupadas;
}

// Si a un pasajero sancionado le faltan casos en la ventana, se completan con inasistencias en viajes completados.
for (const p of usuarios.filter((u) => u.tipo === "PASAJERO" && u.sancion)) {
  const candidatas = viajes.filter((v) => v.estado === "COMPLETADO" && v.fin >= VENTANA_SANCION)
    .flatMap((v) => v.reservas.filter((x) => x.pasajero === p && x.estado === "COMPLETADA"));
  while (sancionesDe(p) < p.metaSancion && candidatas.length > 0) {
    candidatas.pop().estado = "NO_SE_PRESENTO";
    sumarSancion(p, AHORA);
  }
}

// ───────────────────────────── Calificaciones ─────────────────────────────

const calificaciones = [];
const puntaje = (calidad) => Math.min(5, Math.max(1, Math.round(calidad + normal() * 0.6)));
for (const v of viajes) {
  if (v.estado !== "COMPLETADO") continue;
  for (const x of v.reservas) {
    if (x.estado !== "COMPLETADA") continue;
    if (prob(0.55)) calificaciones.push({ v, x, autor: x.pasajero, calificado: v.conductor, rol: "CONDUCTOR", puntaje: puntaje(v.conductor.calidad), fecha: v.fin + entre(3, 23 * 60) * MIN });
    if (prob(0.35)) calificaciones.push({ v, x, autor: v.conductor, calificado: x.pasajero, rol: "PASAJERO", puntaje: puntaje(x.pasajero.calidad), fecha: v.fin + entre(3, 23 * 60) * MIN });
  }
}
const calificacionesValidas = calificaciones.filter((c) => c.fecha < AHORA).sort((a, b) => a.fecha - b.fecha);

// Promedio de cada usuario en el tiempo, para la copia del conductor en sus viajes.
const historialCalificacion = new Map();
for (const c of calificacionesValidas) {
  const lista = historialCalificacion.get(c.calificado) || [];
  const anterior = lista[lista.length - 1] || { suma: 0, cantidad: 0 };
  lista.push({ fecha: c.fecha, suma: anterior.suma + c.puntaje, cantidad: anterior.cantidad + 1 });
  historialCalificacion.set(c.calificado, lista);
}
const calificacionEn = (u, ms) => {
  const lista = historialCalificacion.get(u);
  if (!lista) return null;
  let lo = 0, hi = lista.length - 1, ultimo = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (lista[mid].fecha <= ms) { ultimo = mid; lo = mid + 1; } else hi = mid - 1; }
  if (ultimo < 0) return null;
  const { suma, cantidad } = lista[ultimo];
  return { promedio: Math.round((suma / cantidad) * 10) / 10, cantidad };
};

// ───────────────────────────── Documentos de viajes y reservas ─────────────────────────────

const docsViajes = [];
const docsReservas = [];
for (const v of viajes) {
  const c = v.conductor;
  const finEstado = v.fin || v.cancelacion || AHORA;
  const ultimaAct = Math.max(v.creacion, finEstado === AHORA ? v.creacion : finEstado, v.inicio || 0,
    ...v.reservas.map((x) => Math.max(x.creacion, x.cancelacion || 0)));
  docsViajes.push(sinNulos({
    _id: v._id,
    conductor: sinNulos({ id: c._id, nombre: nombrePublico(c), calificacion: calificacionEn(c, finEstado) }),
    vehiculo: {
      marca: c.vehiculo.marca, modelo: c.vehiculo.modelo, color: c.vehiculo.color, placa: c.vehiculo.placa,
      apto_movilidad_reducida: c.apto,
      soat_fecha_fin: new Date(c.soatInicio + (Math.floor((v.salida - c.soatInicio) / (365 * DIA)) + 1) * 365 * DIA),
    },
    sede: { id: c.sede.id, nombre: c.sede.nombre, ciudad: c.sede.ciudad },
    sentido: v.sentido,
    origen: v.origen,
    destino: v.destino,
    paradas: v.paradas,
    distancia_km: v.distancia,
    duracion_min: v.duracion,
    fecha_salida: new Date(v.salida),
    precio_por_plaza: v.precio,
    plazas_totales: v.plazasTotales,
    plazas_disponibles: v.plazasDisponibles,
    condiciones: v.condiciones,
    estado: v.estado,
    cancelado_por: v.canceladoPor,
    motivo_cancelacion: v.motivo,
    fecha_cancelacion: v.cancelacion && new Date(v.cancelacion),
    fecha_inicio: v.inicio && new Date(v.inicio),
    fecha_fin: v.fin && new Date(v.fin),
    finalizado_por: v.finalizadoPor,
    fecha_creacion: new Date(v.creacion),
    fecha_actualizacion: new Date(ultimaAct),
  }));
  for (const x of v.reservas) {
    x._id = nuevoId("reservas");
    x.viaje = v;
    x.liquidada = !["CONFIRMADA", "EN_VIAJE"].includes(x.estado) && !(x.estado === "NO_SE_PRESENTO" && v.estado === "EN_CURSO");
    const actualizacion = x.estado === "CANCELADA" ? x.cancelacion
      : x.estado === "COMPLETADA" || (x.estado === "NO_SE_PRESENTO" && v.fin) ? v.fin
        : x.estado === "CONFIRMADA" ? x.creacion : v.inicio;
    docsReservas.push(sinNulos({
      _id: x._id,
      viaje_id: v._id,
      pasajero: { id: x.pasajero._id, nombre: nombrePublico(x.pasajero) },
      viaje: {
        origen: v.origen.etiqueta,
        destino: v.destino.etiqueta,
        fecha_salida: new Date(v.salida),
        conductor: nombrePublico(c),
        vehiculo: { marca: c.vehiculo.marca, modelo: c.vehiculo.modelo, color: c.vehiculo.color },
      },
      plazas: x.plazas,
      total_creditos: x.total,
      asistencia: x.pasajero.asistencia && sinNulos({ tipo: x.pasajero.asistencia.tipo, nota: x.pasajero.asistencia.nota }),
      estado: x.estado,
      liquidada: x.liquidada,
      cancelada_por: x.canceladaPor,
      fecha_cancelacion: x.cancelacion && new Date(x.cancelacion),
      fecha_creacion: new Date(x.creacion),
      fecha_actualizacion: new Date(actualizacion),
    }));
  }
}

const docsCalificaciones = calificacionesValidas.map((c) => sinNulos({
  _id: nuevoId("calificaciones"),
  viaje_id: c.v._id,
  reserva_id: c.x._id,
  autor: { id: c.autor._id, nombre: nombrePublico(c.autor) },
  usuario_calificado_id: c.calificado._id,
  rol_calificado: c.rol,
  puntaje: c.puntaje,
  comentario: prob(0.35) ? elegir(COMENTARIOS[c.puntaje]) : null,
  fecha_creacion: new Date(c.fecha),
}));

// ───────────────────────────── Billetera ─────────────────────────────
// Se simula en orden cronológico por usuario, igual que LibroCreditos: cada cambio de saldo con su movimiento.

const eventos = new Map(usuarios.map((u) => [u, []]));
const agregarEvento = (u, evento) => eventos.get(u).push(evento);
for (const v of viajes) {
  for (const x of v.reservas) {
    agregarEvento(x.pasajero, { t: x.creacion, orden: 1, tipo: "RETENER", x });
    if (x.estado === "CANCELADA") agregarEvento(x.pasajero, { t: x.cancelacion, orden: 2, tipo: "REEMBOLSO", x });
    if (v.estado === "COMPLETADO" && ["COMPLETADA", "NO_SE_PRESENTO"].includes(x.estado)) {
      agregarEvento(x.pasajero, { t: v.fin, orden: 3, tipo: "LIBERAR", x });
      agregarEvento(v.conductor, { t: v.fin, orden: 4, tipo: "COBRO", x });
    }
  }
}
// Revisiones de retiro de los conductores cada 2 a 6 semanas; 3 frecuentes tienen uno pendiente hoy.
const conPendienteHoy = new Set(barajar(frecuentes.filter((u) => !u.sancion)).slice(0, 3));
for (const u of conductores) {
  for (let t = u.inicioActividad + entre(14, 30) * DIA; t < AHORA - 3 * DIA; t += entre(14, 42) * DIA) {
    if (prob(u.tipo === "FRECUENTE" ? 0.75 : 0.35)) agregarEvento(u, { t: inicioDiaPeru(t) + entre(10 * 60, 21 * 60) * MIN, orden: 5, tipo: "RETIRO" });
  }
  if (conPendienteHoy.has(u)) agregarEvento(u, { t: AHORA - entre(2 * 60, 40 * 60) * MIN, orden: 5, tipo: "RETIRO" });
}
for (const u of usuarios.filter((x) => x.soloRecarga)) agregarEvento(u, { t: u.creacion + entre(2, 200) * DIA, orden: 0, tipo: "RECARGA_SUELTA" });

const docsPagos = [];
const docsMovimientos = [];
const docsRetiros = [];
const referenciasUsadas = new Set(db.pagos.distinct("referencia_proveedor"));
const nuevaReferencia = () => { let r; do r = `${entre(1, 9)}${digitos(entre(7, 10))}`; while (referenciasUsadas.has(r)); referenciasUsadas.add(r); return r; };

for (const [u, lista] of eventos) {
  if (lista.length === 0) continue;
  lista.sort((a, b) => a.t - b.t || a.orden - b.orden);
  let ultimo = u.creacion;
  let cobrado = 0;
  let retirado = 0; // retiros PENDIENTE o PAGADO
  let pendiente = false;
  const mover = (tipo, monto, t, descripcion, refs) => {
    u.saldo += monto;
    if (u.saldo < 0) throw new Error(`Saldo negativo para ${u.correo}`);
    docsMovimientos.push(sinNulos({ _id: nuevoId("movimientos_creditos"), usuario_id: u._id, tipo, monto, saldo_posterior: u.saldo, descripcion, ...refs, fecha_creacion: new Date(t) }));
    ultimo = Math.max(ultimo, t);
  };
  const recargar = (t, minimo) => {
    const opciones = [10, 20, 20, 30, 30, 50, 50, 50, 100, 100, 150, 200].filter((m) => m >= Math.max(5, minimo));
    const grandes = opciones.filter((m) => m >= 50);
    const monto = u.intensidad >= 2 && grandes.length > 0 ? elegir(grandes) : elegir(opciones);
    const codigo = nuevaReferencia();
    const pagoId = nuevoId("pagos");
    docsPagos.push({ _id: pagoId, usuario_id: u._id, monto_centimos: monto * 100, creditos: monto, creditos_por_sol: 1, metodo: "YAPE", proveedor: "SIMULADO", referencia_proveedor: codigo, estado: "APROBADO", fecha_creacion: new Date(t) });
    mover("RECARGA", monto, t, `Operación ${codigo}`, { pago_id: pagoId });
  };

  for (let i = 0; i < lista.length; i++) {
    const e = lista[i];
    const x = e.x;
    const ruta = x && `${x.viaje.origen.etiqueta} → ${x.viaje.destino.etiqueta}`;
    if (e.tipo === "RECARGA_SUELTA") {
      recargar(Math.min(e.t, AHORA - HORA), 10);
    } else if (e.tipo === "RETENER") {
      if (u.saldo < x.total) {
        const antes = e.t - entre(1, 36 * 60) * MIN;
        recargar(antes > ultimo ? antes : ultimo + Math.max(1000, Math.floor((e.t - ultimo) / 2)), x.total - u.saldo);
      }
      u.retenidos += x.total;
      mover("RETENCION_RESERVA", -x.total, e.t, `${ruta} · ${x.plazas} ${x.plazas === 1 ? "plaza" : "plazas"}`, { reserva_id: x._id, viaje_id: x.viaje._id });
    } else if (e.tipo === "REEMBOLSO") {
      const motivo = { PASAJERO: "Cancelada por ti", CONDUCTOR: "Cancelado por el conductor", SISTEMA: "Cancelado: el viaje no se inició" }[x.canceladaPor];
      u.retenidos -= x.total;
      mover("REEMBOLSO", x.total, e.t, `${motivo} · ${ruta}`, { reserva_id: x._id, viaje_id: x.viaje._id });
    } else if (e.tipo === "LIBERAR") {
      u.retenidos -= x.total;
      ultimo = Math.max(ultimo, e.t);
    } else if (e.tipo === "COBRO") {
      cobrado += x.total;
      mover("COBRO_VIAJE", x.total, e.t, `${nombrePublico(x.pasajero)} · ${ruta}`, { reserva_id: x._id, viaje_id: x.viaje._id });
    } else if (e.tipo === "RETIRO") {
      const retirable = Math.min(u.saldo, cobrado - retirado);
      if (pendiente || retirable < 10) continue;
      const creditos = Math.max(10, Math.floor(retirable * real(0.55, 0.9)));
      const celular = u.telefono.slice(3);
      const retiroId = nuevoId("retiros");
      const retiro = { _id: retiroId, usuario_id: u._id, creditos, celular_yape: celular, estado: "PENDIENTE", reversion_aplicada: false, fecha_solicitud: new Date(e.t) };
      retirado += creditos;
      mover("RETIRO", -creditos, e.t, `Celular •••• ${celular.slice(-3)}`, { retiro_id: retiroId });
      if (e.t > AHORA - 60 * HORA) {
        pendiente = true;
      } else if (prob(0.07)) {
        const resolucion = e.t + entre(3 * 60, 30 * 60) * MIN;
        Object.assign(retiro, { estado: "RECHAZADO", motivo_rechazo: elegir(MOTIVOS_RECHAZO), fecha_resolucion: new Date(resolucion), reversion_aplicada: true });
        retirado -= creditos;
        // El job devuelve los créditos en menos de un minuto (RN-42).
        const reversion = { t: resolucion + entre(5, 55) * 1000, orden: 6, tipo: "REVERSION", retiro };
        let j = i + 1;
        while (j < lista.length && (lista[j].t < reversion.t)) j++;
        lista.splice(j, 0, reversion);
      } else {
        Object.assign(retiro, { estado: "PAGADO", codigo_operacion: digitos(8), fecha_resolucion: new Date(e.t + entre(2 * 60, 40 * 60) * MIN) });
      }
      docsRetiros.push(retiro);
    } else if (e.tipo === "REVERSION") {
      mover("REVERSION_RETIRO", e.retiro.creditos, e.t, `Rechazado: ${e.retiro.motivo_rechazo}`, { retiro_id: e.retiro._id });
    }
  }
  u.ultimaActividad = ultimo;
}

// ───────────────────────────── Estadísticas (RN-28) y documentos de usuarios ─────────────────────────────

const stats = new Map(usuarios.map((u) => [u, { viajes: 0, fallas: 0, co2: 0 }]));
for (const v of viajes) {
  const sc = stats.get(v.conductor);
  if (v.estado === "CANCELADO") sc.fallas++;
  if (v.estado === "COMPLETADO") {
    const subieron = v.reservas.filter((x) => x.estado === "COMPLETADA");
    if (subieron.length > 0) sc.viajes++;
    for (const x of subieron) sc.co2 += v.distancia * FACTOR_CO2_KG_KM * x.plazas;
  }
  for (const x of v.reservas) {
    const sp = stats.get(x.pasajero);
    if (x.estado === "COMPLETADA" && v.estado === "COMPLETADO") { sp.viajes++; sp.co2 += v.distancia * FACTOR_CO2_KG_KM * x.plazas; }
    if ((x.estado === "CANCELADA" && x.canceladaPor === "PASAJERO") || x.estado === "NO_SE_PRESENTO") sp.fallas++;
  }
}

const docsUsuarios = usuarios.map((u) => {
  if (u.cohorte === "PENDIENTE") {
    return { _id: u._id, correo: u.correo, contrasena_hash: CONTRASENA_HASH, roles: [], estado: "PERFIL_PENDIENTE", fecha_aceptacion_terminos: new Date(u.creacion), fecha_creacion: new Date(u.creacion), fecha_actualizacion: new Date(u.creacion) };
  }
  const s = stats.get(u);
  const actividad = s.viajes + s.fallas > 0;
  const ultimaConexion = u.fechaBloqueo ? u.fechaBloqueo - entre(1, 5) * DIA
    : u.cohorte === "INACTIVO" ? u.creacion + entre(1, 10) * DIA
      : AHORA - entre(10, 10 * 24 * 60) * MIN;
  const vehiculo = u.vehiculo && { ...u.vehiculo };
  return sinNulos({
    _id: u._id,
    correo: u.correo,
    contrasena_hash: CONTRASENA_HASH,
    nombres: u.nombres,
    apellidos: u.apellidos,
    telefono: u.telefono,
    tipo_documento: u.tipoDocumento,
    numero_documento: u.numeroDocumento,
    departamento: u.sede.departamento,
    distrito: u.sede.distrito,
    sede: { id: u.sede.id, nombre: u.sede.nombre, direccion: u.sede.direccion },
    direccion_residencia: { etiqueta: u.barrio, direccion: `${u.barrio}, ${u.sede.ciudad}, ${u.sede.departamento.nombre}`, ubicacion: punto(u.casa) },
    asistencia_movilidad: u.asistencia,
    roles: u.vehiculo ? ["PASAJERO", "CONDUCTOR"] : ["PASAJERO"],
    modo_activo: u.modo,
    estado: u.cohorte === "BLOQUEADO" ? "BLOQUEADO" : "ACTIVO",
    vehiculo,
    estadisticas: actividad ? { viajes: s.viajes, cumplimiento: Math.round((s.viajes / (s.viajes + s.fallas)) * 100), ahorro_co2_kg: Math.round(s.co2 * 10) / 10 } : null,
    calificacion: calificacionEn(u, AHORA),
    saldo_creditos: u.saldo,
    creditos_retenidos: u.retenidos,
    fecha_aceptacion_terminos: new Date(u.creacion),
    ultima_conexion: new Date(Math.max(ultimaConexion, u.creacion + HORA)),
    fecha_creacion: new Date(u.creacion),
    fecha_actualizacion: new Date(Math.max(u.creacion + HORA, u.ultimaActividad || 0)),
  });
});

// ───────────────────────────── Verificaciones ─────────────────────────────

const sumaPorUsuario = new Map();
for (const m of docsMovimientos) sumaPorUsuario.set(m.usuario_id.toHexString(), (sumaPorUsuario.get(m.usuario_id.toHexString()) || 0) + m.monto);
const retenidosPorUsuario = new Map();
for (const r of docsReservas) if (!r.liquidada) retenidosPorUsuario.set(r.pasajero.id.toHexString(), (retenidosPorUsuario.get(r.pasajero.id.toHexString()) || 0) + r.total_creditos);
for (const u of docsUsuarios) {
  const id = u._id.toHexString();
  if ((u.saldo_creditos || 0) !== (sumaPorUsuario.get(id) || 0)) throw new Error(`Saldo descuadrado: ${u.correo}`);
  if ((u.creditos_retenidos || 0) !== (retenidosPorUsuario.get(id) || 0)) throw new Error(`Retenidos descuadrados: ${u.correo}`);
}
const activasPorPasajero = new Map();
for (const r of docsReservas) if (["CONFIRMADA", "EN_VIAJE"].includes(r.estado)) {
  const id = r.pasajero.id.toHexString();
  if (activasPorPasajero.has(id)) throw new Error(`Dos reservas activas: ${id}`);
  activasPorPasajero.set(id, true);
}

// ───────────────────────────── Resumen ─────────────────────────────

const contar = (lista, campo) => lista.reduce((acc, d) => { acc[d[campo]] = (acc[d[campo]] || 0) + 1; return acc; }, {});
const usaronServicio = soloPasajeros.filter((u) => docsReservas.some((r) => r.pasajero.id.equals(u._id))).length;
print(`Referencia: ${new Date(AHORA).toISOString()}${DRY_RUN ? "  (SEED_DRY_RUN: no se escribe nada)" : ""}`);
print(`usuarios: ${docsUsuarios.length} · con vehículo ${docsUsuarios.filter((u) => u.vehiculo).length} · ${JSON.stringify(contar(docsUsuarios, "estado"))}`);
print(`pasajeros sin vehículo que usaron el servicio: ${usaronServicio} de ${soloPasajeros.length} (${Math.round((usaronServicio / soloPasajeros.length) * 100)} %)`);
print(`viajes: ${docsViajes.length} (históricos ${historicos.length}) · ${JSON.stringify(contar(docsViajes, "estado"))}`);
print(`  llenos: ${docsViajes.filter((v) => v.estado === "COMPLETADO" && v.plazas_disponibles === 0).length} · con plazas libres: ${docsViajes.filter((v) => v.estado === "COMPLETADO" && v.plazas_disponibles > 0).length}`);
print(`reservas: ${docsReservas.length} · ${JSON.stringify(contar(docsReservas, "estado"))}`);
print(`calificaciones: ${docsCalificaciones.length} · pagos: ${docsPagos.length} · movimientos: ${docsMovimientos.length} · retiros: ${docsRetiros.length} ${JSON.stringify(contar(docsRetiros, "estado"))}`);
print("Casos de prueba (contraseña Peru123..):");
for (const u of usuarios.filter((x) => x.sancion)) print(`  ${u.tipo === "PASAJERO" ? "pasajero" : "conductor"} ${u.sancion === "BLOQUEADO" ? "sancionado" : "cerca del límite"}: ${u.correo} (${u.tipo === "PASAJERO" ? sancionesDe(u) : cancelacionesDe(u)} en 30 días)`);
for (const u of conductores.filter((x) => x.soatPorVencer || x.soatVencido || x.vehiculoInactivo)) print(`  conductor ${u.soatPorVencer ? "SOAT por vencer" : u.soatVencido ? "SOAT vencido" : "vehículo inactivo"}: ${u.correo}`);
for (const u of conductores.filter((x) => conPendienteHoy.has(x))) print(`  conductor frecuente con retiro pendiente: ${u.correo}`);
for (const u of usuarios.filter((x) => x.asistencia)) print(`  pasajero con asistencia ${u.asistencia.tipo}: ${u.correo}`);
for (const u of usuarios.filter((x) => x.cohorte === "BLOQUEADO" || x.cohorte === "PENDIENTE")) print(`  cuenta ${u.cohorte === "BLOQUEADO" ? "BLOQUEADO" : "PERFIL_PENDIENTE"}: ${u.correo}`);
const enCurso = viajes.filter((v) => v.estado === "EN_CURSO");
for (const v of enCurso) print(`  conductor con viaje EN_CURSO: ${v.conductor.correo}`);
print(`  conductor frecuente: ${frecuentes.find((u) => !u.sancion && !u.soatPorVencer).correo}`);

// ───────────────────────────── Escritura ─────────────────────────────

if (!DRY_RUN) {
  const rango = { _id: { $gte: new ObjectId("5eed00000000000000000000"), $lte: new ObjectId("5eedffffffffffffffffffff") } };
  // Primero se borra la data de prueba anterior, de las colecciones que referencian a usuarios hacia usuarios.
  for (const coleccion of ["calificaciones", "movimientos_creditos", "retiros", "pagos", "reservas", "viajes", "usuarios"]) {
    print(`${coleccion}: ${db.getCollection(coleccion).deleteMany(rango).deletedCount} documentos de prueba anteriores borrados`);
  }
  const insertar = (coleccion, documentos) => {
    for (let i = 0; i < documentos.length; i += 2000) db.getCollection(coleccion).insertMany(documentos.slice(i, i + 2000));
    print(`${coleccion}: ${documentos.length} insertados`);
  };
  insertar("usuarios", docsUsuarios);
  insertar("viajes", docsViajes);
  insertar("reservas", docsReservas);
  insertar("calificaciones", docsCalificaciones);
  insertar("pagos", docsPagos);
  insertar("movimientos_creditos", docsMovimientos);
  insertar("retiros", docsRetiros);
}
