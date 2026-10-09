// Seed de catálogos de ColaboraCar: departamentos, distritos y sedes de la UTP.
//
// Uso (mongosh):
//   mongosh "mongodb+srv://<usuario>:<clave>@<cluster>/db_colabora_car" seed.js
//
// Es idempotente: cada documento tiene un _id fijo y se inserta con upsert, así que se
// puede ejecutar varias veces sin duplicar datos.
//
// Fuentes (consultadas el 2026-10-08):
//   - Sedes y direcciones: https://www.utp.edu.pe/como-llegar
//   - Coordenadas: OpenStreetMap (Nominatim). La de Iquitos es aproximada, ver nota abajo.
//   - Códigos: ubigeo del INEI (2 dígitos el departamento, 6 el distrito).

const INSTITUCION = "Universidad Tecnológica del Perú";

// Los _id siguen la numeración de los ejemplos del README:
// ...01xx departamentos, ...02xx distritos y ...03xx sedes.
const oid = (n) => new ObjectId("6705a1f0c3d4e5f6" + String(n).padStart(8, "0"));

const departamentos = [
  { _id: oid(101), codigo: "13", nombre: "La Libertad" },
  { _id: oid(102), codigo: "02", nombre: "Áncash" },
  { _id: oid(103), codigo: "04", nombre: "Arequipa" },
  { _id: oid(104), codigo: "11", nombre: "Ica" },
  { _id: oid(105), codigo: "12", nombre: "Junín" },
  { _id: oid(106), codigo: "14", nombre: "Lambayeque" },
  { _id: oid(107), codigo: "15", nombre: "Lima" },
  { _id: oid(108), codigo: "16", nombre: "Loreto" },
  { _id: oid(109), codigo: "20", nombre: "Piura" },
  { _id: oid(110), codigo: "23", nombre: "Tacna" },
  { _id: oid(111), codigo: "25", nombre: "Ucayali" },
];

// departamento: código ubigeo del departamento al que pertenece.
const distritos = [
  { _id: oid(201), codigo: "130101", nombre: "Trujillo", departamento: "13" },
  { _id: oid(202), codigo: "021809", nombre: "Nuevo Chimbote", departamento: "02" },
  { _id: oid(203), codigo: "040101", nombre: "Arequipa", departamento: "04" },
  { _id: oid(204), codigo: "110101", nombre: "Ica", departamento: "11" },
  { _id: oid(205), codigo: "120114", nombre: "El Tambo", departamento: "12" },
  { _id: oid(206), codigo: "140101", nombre: "Chiclayo", departamento: "14" },
  { _id: oid(207), codigo: "150101", nombre: "Lima", departamento: "15" },
  { _id: oid(208), codigo: "150103", nombre: "Ate", departamento: "15" },
  { _id: oid(209), codigo: "150117", nombre: "Los Olivos", departamento: "15" },
  { _id: oid(210), codigo: "150132", nombre: "San Juan de Lurigancho", departamento: "15" },
  { _id: oid(211), codigo: "150142", nombre: "Villa El Salvador", departamento: "15" },
  { _id: oid(212), codigo: "160113", nombre: "San Juan Bautista", departamento: "16" },
  { _id: oid(213), codigo: "200101", nombre: "Piura", departamento: "20" },
  { _id: oid(214), codigo: "230101", nombre: "Tacna", departamento: "23" },
  { _id: oid(215), codigo: "250101", nombre: "Callería", departamento: "25" },
];

// distrito: código ubigeo del distrito. coordenadas: [longitud, latitud] (GeoJSON).
const sedes = [
  {
    _id: oid(301),
    nombre: "UTP Sede Trujillo",
    direccion: "Av. Nicolás de Piérola 1221, Trujillo",
    distrito: "130101",
    coordenadas: [-79.038363, -8.098099],
  },
  {
    _id: oid(302),
    nombre: "UTP Sede Chimbote",
    direccion: "Km 424 Panamericana Norte, Calle 56 S/N, frente a Plaza Vea, Nuevo Chimbote",
    distrito: "021809",
    coordenadas: [-78.534044, -9.128825],
  },
  {
    _id: oid(303),
    nombre: "UTP Sede Arequipa",
    direccion: "Av. Tacna y Arica 160, Arequipa",
    distrito: "040101",
    coordenadas: [-71.54043, -16.408973],
  },
  {
    _id: oid(304),
    nombre: "UTP Sede Ica",
    direccion: "Av. Ayabaca S/N, Sector San José, al costado de la SUNAT, Ica",
    distrito: "110101",
    coordenadas: [-75.735937, -14.072116],
  },
  {
    _id: oid(305),
    nombre: "UTP Sede Huancayo",
    direccion: "Av. Circunvalación 449 (ex Av. Intihuatana), Urb. Acuario, El Tambo",
    distrito: "120114",
    coordenadas: [-75.234008, -12.022847],
  },
  {
    _id: oid(306),
    nombre: "UTP Sede Chiclayo",
    direccion: "Esquina Prol. Augusto B. Leguía con Av. Hernán Meiner, Chiclayo",
    distrito: "140101",
    coordenadas: [-79.863151, -6.76386],
  },
  {
    _id: oid(307),
    nombre: "UTP Sede Lima Centro",
    direccion: "Jr. Hernán Velarde 289, Lima",
    distrito: "150101",
    coordenadas: [-77.036969, -12.065888],
  },
  {
    _id: oid(308),
    nombre: "UTP Sede Lima Este - Ate",
    direccion: "Carretera Central Km 11.6, a una cuadra del Real Plaza Santa Clara, Ate",
    distrito: "150103",
    coordenadas: [-76.882427, -12.014263],
  },
  {
    _id: oid(309),
    nombre: "UTP Sede Lima Norte",
    direccion: "Av. Alfredo Mendiola 6377, Los Olivos",
    distrito: "150117",
    coordenadas: [-77.070564, -11.9529],
  },
  {
    _id: oid(310),
    nombre: "UTP Sede Lima Este - SJL",
    direccion: "Av. El Sol cuadra 2, San Juan de Lurigancho",
    distrito: "150132",
    coordenadas: [-77.009283, -11.983541],
  },
  {
    _id: oid(311),
    nombre: "UTP Sede Lima Sur",
    direccion: "Carretera Panamericana Sur Km 16, Villa El Salvador",
    distrito: "150142",
    coordenadas: [-76.971385, -12.193926],
  },
  {
    // Coordenadas aproximadas: la sede no figura en OpenStreetMap, el punto está sobre
    // la Av. José Abelardo Quiñones en San Juan Bautista. Ajustar con la ubicación real.
    _id: oid(312),
    nombre: "UTP Sede Iquitos",
    direccion: "Av. José Abelardo Quiñones 1478, San Juan Bautista, Iquitos",
    distrito: "160113",
    coordenadas: [-73.27973, -3.769974],
  },
  {
    _id: oid(313),
    nombre: "UTP Sede Piura",
    direccion: "Av. Vice cuadra 1, al costado de Real Plaza, Piura",
    distrito: "200101",
    coordenadas: [-80.640701, -5.182641],
  },
  {
    _id: oid(314),
    nombre: "UTP Sede Tacna",
    direccion: "Av. Billinghurst 800, Zona Pago Collana, Tacna",
    distrito: "230101",
    coordenadas: [-70.242158, -18.0224],
  },
  {
    _id: oid(315),
    nombre: "UTP Sede Pucallpa",
    direccion: "Av. Centenario 3915, Callería, Pucallpa",
    distrito: "250101",
    coordenadas: [-74.563548, -8.389349],
  },
];

// Busca por código y falla si la referencia no existe, para no insertar copias rotas.
const indexarPorCodigo = (documentos, tipo) => {
  const porCodigo = new Map(documentos.map((d) => [d.codigo, d]));
  return (codigo) => {
    const documento = porCodigo.get(codigo);
    if (!documento) throw new Error(`${tipo} con código ${codigo} no existe en el seed`);
    return { id: documento._id, nombre: documento.nombre };
  };
};

const refDepartamento = indexarPorCodigo(departamentos, "Departamento");
const refDistrito = indexarPorCodigo(distritos, "Distrito");

const documentosDistritos = distritos.map((d) => ({
  _id: d._id,
  codigo: d.codigo,
  nombre: d.nombre,
  departamento: refDepartamento(d.departamento),
}));

const documentosSedes = sedes.map((s) => ({
  _id: s._id,
  nombre: s.nombre,
  institucion: INSTITUCION,
  direccion: s.direccion,
  distrito: refDistrito(s.distrito),
  ubicacion: { type: "Point", coordinates: s.coordenadas },
  activa: true,
}));

const upsert = (coleccion, documentos) => {
  const resultado = db.getCollection(coleccion).bulkWrite(
    documentos.map((documento) => ({
      replaceOne: { filter: { _id: documento._id }, replacement: documento, upsert: true },
    })),
  );
  print(
    `${coleccion}: ${documentos.length} documentos ` +
    `(${resultado.upsertedCount} nuevos, ${resultado.modifiedCount} actualizados)`,
  );
};

// Índices de los catálogos definidos en la sección 5.3 del README. Los de usuarios, codigos_otp,
// viajes y reservas los crea el backend al arrancar.
db.departamentos.createIndex({ codigo: 1 }, { unique: true });
db.distritos.createIndex({ codigo: 1 }, { unique: true });
db.distritos.createIndex({ "departamento.id": 1 });

upsert("departamentos", departamentos);
upsert("distritos", documentosDistritos);
upsert("sedes", documentosSedes);
