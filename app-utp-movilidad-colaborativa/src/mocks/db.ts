// Datos en memoria de la API simulada. Las formas siguen el contrato `docs/openapi.yaml`
// y los catálogos son los mismos de `docs/seed.js`.

export type Role = "PASSENGER" | "DRIVER";
export type UserStatus = "PROFILE_PENDING" | "ACTIVE" | "BLOCKED";
export type DocumentType = "DNI" | "CE";
export type VehicleType = "SEDAN" | "HATCHBACK" | "SUV" | "VAN" | "MOTORCYCLE";
export type RideDirection = "TO_CAMPUS" | "TO_HOME";
export type RideStatus = "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type FilePurpose = "PROFILE_PHOTO" | "VEHICLE_PHOTO";

export type NamedRef = { id: string; name: string };
export type GeoPoint = { lat: number; lng: number };
export type Place = { label: string; address: string | null; location: GeoPoint };
export type Rating = { average: number; count: number };

export type Vehicle = {
  plate: string;
  type: VehicleType;
  brand: string;
  model: string;
  color: string;
  year: number;
  seats: number;
  ownerDni: string | null;
  isOwner: boolean;
  status: "ACTIVE" | "INACTIVE";
  photoUrl: string | null;
  registeredAt: string;
};

export type MockUser = {
  id: string;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  documentType: DocumentType | null;
  documentNumber: string | null;
  photoUrl: string | null;
  department: NamedRef | null;
  district: NamedRef | null;
  campus: (NamedRef & { address: string }) | null;
  homeAddress: Place | null;
  roles: Role[];
  activeMode: Role | null;
  status: UserStatus;
  vehicle: Vehicle | null;
  stats: { trips: number; compliance: number; co2SavedKg: number };
  rating: Rating | null;
  createdAt: string;
};

export type MockRide = {
  id: string;
  campusId: string;
  status: RideStatus;
  direction: RideDirection;
  departureTime: string;
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
  distanceKm: number;
  durationMin: number;
  driver: { id: string; name: string; photoUrl: string | null; rating: Rating | null };
  vehicle: { brand: string; model: string; color: string; plate: string };
  conditions: string[];
  origin: Place;
  destination: Place;
  stops: Place[];
  createdAt: string;
};

export type MockReservation = {
  id: string;
  rideId: string;
  passengerId: string;
  seats: number;
  totalCredits: number;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
};

export type MockOtp = {
  code: string;
  expiresAt: number;
  resendAt: number;
  attemptsLeft: number;
};

export type MockFile = {
  id: string;
  ownerId: string;
  url: string;
  purpose: FilePurpose;
  mimeType: string;
  sizeBytes: number;
};

type Database = {
  users: MockUser[];
  rides: MockRide[];
  reservations: MockReservation[];
  otps: Record<string, MockOtp>;
  files: MockFile[];
};

// Los id siguen la numeración de `docs/seed.js` y de los ejemplos del README:
// ...01xx departamentos, ...02xx distritos, ...03xx sedes y ...05xx viajes.
const oid = (n: number) => "6705a1f0c3d4e5f6" + String(n).padStart(8, "0");

export const DEPARTMENTS = [
  { id: oid(101), code: "13", name: "La Libertad" },
  { id: oid(102), code: "02", name: "Áncash" },
  { id: oid(103), code: "04", name: "Arequipa" },
  { id: oid(104), code: "11", name: "Ica" },
  { id: oid(105), code: "12", name: "Junín" },
  { id: oid(106), code: "14", name: "Lambayeque" },
  { id: oid(107), code: "15", name: "Lima" },
  { id: oid(108), code: "16", name: "Loreto" },
  { id: oid(109), code: "20", name: "Piura" },
  { id: oid(110), code: "23", name: "Tacna" },
  { id: oid(111), code: "25", name: "Ucayali" },
];

export const DISTRICTS = [
  { id: oid(201), code: "130101", name: "Trujillo", departmentId: oid(101) },
  { id: oid(202), code: "021809", name: "Nuevo Chimbote", departmentId: oid(102) },
  { id: oid(203), code: "040101", name: "Arequipa", departmentId: oid(103) },
  { id: oid(204), code: "110101", name: "Ica", departmentId: oid(104) },
  { id: oid(205), code: "120114", name: "El Tambo", departmentId: oid(105) },
  { id: oid(206), code: "140101", name: "Chiclayo", departmentId: oid(106) },
  { id: oid(207), code: "150101", name: "Lima", departmentId: oid(107) },
  { id: oid(208), code: "150103", name: "Ate", departmentId: oid(107) },
  { id: oid(209), code: "150117", name: "Los Olivos", departmentId: oid(107) },
  { id: oid(210), code: "150132", name: "San Juan de Lurigancho", departmentId: oid(107) },
  { id: oid(211), code: "150142", name: "Villa El Salvador", departmentId: oid(107) },
  { id: oid(212), code: "160113", name: "San Juan Bautista", departmentId: oid(108) },
  { id: oid(213), code: "200101", name: "Piura", departmentId: oid(109) },
  { id: oid(214), code: "230101", name: "Tacna", departmentId: oid(110) },
  { id: oid(215), code: "250101", name: "Callería", departmentId: oid(111) },
];

export const CAMPUSES = [
  {
    id: oid(301),
    name: "UTP Sede Trujillo",
    address: "Av. Nicolás de Piérola 1221, Trujillo",
    districtId: oid(201),
    location: { lat: -8.098099, lng: -79.038363 },
  },
  {
    id: oid(302),
    name: "UTP Sede Chimbote",
    address: "Km 424 Panamericana Norte, Calle 56 S/N, frente a Plaza Vea, Nuevo Chimbote",
    districtId: oid(202),
    location: { lat: -9.128825, lng: -78.534044 },
  },
  {
    id: oid(303),
    name: "UTP Sede Arequipa",
    address: "Av. Tacna y Arica 160, Arequipa",
    districtId: oid(203),
    location: { lat: -16.408973, lng: -71.54043 },
  },
  {
    id: oid(304),
    name: "UTP Sede Ica",
    address: "Av. Ayabaca S/N, Sector San José, al costado de la SUNAT, Ica",
    districtId: oid(204),
    location: { lat: -14.072116, lng: -75.735937 },
  },
  {
    id: oid(305),
    name: "UTP Sede Huancayo",
    address: "Av. Circunvalación 449 (ex Av. Intihuatana), Urb. Acuario, El Tambo",
    districtId: oid(205),
    location: { lat: -12.022847, lng: -75.234008 },
  },
  {
    id: oid(306),
    name: "UTP Sede Chiclayo",
    address: "Esquina Prol. Augusto B. Leguía con Av. Hernán Meiner, Chiclayo",
    districtId: oid(206),
    location: { lat: -6.76386, lng: -79.863151 },
  },
  {
    id: oid(307),
    name: "UTP Sede Lima Centro",
    address: "Jr. Hernán Velarde 289, Lima",
    districtId: oid(207),
    location: { lat: -12.065888, lng: -77.036969 },
  },
  {
    id: oid(308),
    name: "UTP Sede Lima Este - Ate",
    address: "Carretera Central Km 11.6, a una cuadra del Real Plaza Santa Clara, Ate",
    districtId: oid(208),
    location: { lat: -12.014263, lng: -76.882427 },
  },
  {
    id: oid(309),
    name: "UTP Sede Lima Norte",
    address: "Av. Alfredo Mendiola 6377, Los Olivos",
    districtId: oid(209),
    location: { lat: -11.9529, lng: -77.070564 },
  },
  {
    id: oid(310),
    name: "UTP Sede Lima Este - SJL",
    address: "Av. El Sol cuadra 2, San Juan de Lurigancho",
    districtId: oid(210),
    location: { lat: -11.983541, lng: -77.009283 },
  },
  {
    id: oid(311),
    name: "UTP Sede Lima Sur",
    address: "Carretera Panamericana Sur Km 16, Villa El Salvador",
    districtId: oid(211),
    location: { lat: -12.193926, lng: -76.971385 },
  },
  {
    id: oid(312),
    name: "UTP Sede Iquitos",
    address: "Av. José Abelardo Quiñones 1478, San Juan Bautista, Iquitos",
    districtId: oid(212),
    location: { lat: -3.769974, lng: -73.27973 },
  },
  {
    id: oid(313),
    name: "UTP Sede Piura",
    address: "Av. Vice cuadra 1, al costado de Real Plaza, Piura",
    districtId: oid(213),
    location: { lat: -5.182641, lng: -80.640701 },
  },
  {
    id: oid(314),
    name: "UTP Sede Tacna",
    address: "Av. Billinghurst 800, Zona Pago Collana, Tacna",
    districtId: oid(214),
    location: { lat: -18.0224, lng: -70.242158 },
  },
  {
    id: oid(315),
    name: "UTP Sede Pucallpa",
    address: "Av. Centenario 3915, Callería, Pucallpa",
    districtId: oid(215),
    location: { lat: -8.389349, lng: -74.563548 },
  },
];

/** Contraseña de las cuentas de prueba. */
export const DEMO_PASSWORD = "Clave#2026";

// Perú no tiene horario de verano: siempre UTC-5.
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Fecha desplazada a la hora de Perú; se lee con los métodos `getUTC*`. */
export const toLima = (date: Date) => new Date(date.getTime() - LIMA_OFFSET_MS);

/** Próxima vez que el reloj de Perú marca esa hora: hoy si aún no pasa, si no mañana. */
function nextDeparture(hour: number, minute: number) {
  const lima = toLima(new Date());
  lima.setUTCHours(hour, minute, 0, 0);
  const departure = new Date(lima.getTime() + LIMA_OFFSET_MS);
  if (departure.getTime() <= Date.now()) {
    departure.setUTCDate(departure.getUTCDate() + 1);
  }
  return departure.toISOString();
}

function distanceBetween(a: GeoPoint, b: GeoPoint) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Distancia en línea recta entre los puntos y duración estimada a 35 km/h. */
export function measureRoute(points: GeoPoint[]) {
  let km = 0;
  for (let i = 1; i < points.length; i += 1) {
    km += distanceBetween(points[i - 1], points[i]);
  }
  const distanceKm = Math.round(km * 10) / 10;
  return { distanceKm, durationMin: Math.max(1, Math.round((km / 35) * 60)) };
}

/** Primer nombre e inicial del apellido («Carlos M.»). */
export const publicName = (firstName: string, lastName: string) =>
  `${firstName.trim().split(/\s+/)[0]} ${Array.from(lastName.trim())[0]}.`;

function seed(): Database {
  const trujillo = CAMPUSES[0];
  const profile = {
    password: DEMO_PASSWORD,
    photoUrl: null,
    department: { id: DEPARTMENTS[0].id, name: DEPARTMENTS[0].name },
    district: { id: DISTRICTS[0].id, name: DISTRICTS[0].name },
    campus: { id: trujillo.id, name: trujillo.name, address: trujillo.address },
    status: "ACTIVE" as const,
  };

  const valeria: MockUser = {
    ...profile,
    id: oid(1),
    email: "valeria.rodriguez@utp.edu.pe",
    firstName: "Valeria Andrea",
    lastName: "Rodríguez Paredes",
    phone: null,
    documentType: null,
    documentNumber: null,
    homeAddress: null,
    roles: ["PASSENGER"],
    activeMode: "PASSENGER",
    vehicle: null,
    stats: { trips: 0, compliance: 0, co2SavedKg: 0 },
    rating: null,
    createdAt: "2026-10-01T15:04:00Z",
  };

  const carlos: MockUser = {
    ...profile,
    id: oid(2),
    email: "carlos.mendoza@utp.edu.pe",
    firstName: "Carlos Alberto",
    lastName: "Mendoza Ruiz",
    phone: "+51987654321",
    documentType: "DNI",
    documentNumber: "45678912",
    homeAddress: {
      label: "Víctor Larco Herrera",
      address: "Av. Larco 1250, Trujillo, La Libertad",
      location: { lat: -8.1321, lng: -79.0437 },
    },
    roles: ["PASSENGER", "DRIVER"],
    activeMode: "DRIVER",
    vehicle: {
      plate: "ABC-123",
      type: "SEDAN",
      brand: "Toyota",
      model: "Yaris",
      color: "Blanco",
      year: 2021,
      seats: 3,
      ownerDni: "45678912",
      isOwner: true,
      status: "ACTIVE",
      photoUrl: null,
      registeredAt: "2026-10-02T10:00:00Z",
    },
    stats: { trips: 342, compliance: 99, co2SavedKg: 128 },
    rating: { average: 4.9, count: 120 },
    createdAt: "2026-10-01T15:04:00Z",
  };

  const andrea: MockUser = {
    ...profile,
    id: oid(3),
    email: "andrea.paredes@utp.edu.pe",
    firstName: "Andrea",
    lastName: "Paredes León",
    phone: "+51912345678",
    documentType: "DNI",
    documentNumber: "71234567",
    homeAddress: null,
    roles: ["PASSENGER", "DRIVER"],
    activeMode: "DRIVER",
    vehicle: {
      plate: "XYZ-789",
      type: "HATCHBACK",
      brand: "Chevrolet",
      model: "Spark",
      color: "Rojo",
      year: 2019,
      seats: 3,
      ownerDni: "71234567",
      isOwner: true,
      status: "ACTIVE",
      photoUrl: null,
      registeredAt: "2026-10-03T09:00:00Z",
    },
    stats: { trips: 58, compliance: 96, co2SavedKg: 21 },
    rating: { average: 4.7, count: 45 },
    createdAt: "2026-10-03T09:00:00Z",
  };

  const campusPlace: Place = {
    label: "Universidad Tecnológica del Perú",
    address: "Sede Trujillo, Av. Nicolás de Piérola",
    location: trujillo.location,
  };

  const buildRide = (
    n: number,
    driver: MockUser,
    data: Pick<
      MockRide,
      | "direction"
      | "departureTime"
      | "pricePerSeat"
      | "availableSeats"
      | "conditions"
      | "origin"
      | "destination"
      | "stops"
    >,
  ): MockRide => {
    const vehicle = driver.vehicle!;
    return {
      ...data,
      id: oid(n),
      campusId: trujillo.id,
      status: "PUBLISHED",
      totalSeats: vehicle.seats,
      ...measureRoute(
        [data.origin, ...data.stops, data.destination].map((place) => place.location),
      ),
      driver: {
        id: driver.id,
        name: publicName(driver.firstName!, driver.lastName!),
        photoUrl: driver.photoUrl,
        rating: driver.rating,
      },
      vehicle: {
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        plate: vehicle.plate,
      },
      createdAt: new Date().toISOString(),
    };
  };

  const rides = [
    buildRide(501, carlos, {
      direction: "TO_HOME",
      departureTime: nextDeparture(13, 30),
      pricePerSeat: 5,
      availableSeats: 3,
      conditions: ["No se admite desvíos", "Máximo de espera 5 minutos", "No gritar"],
      origin: campusPlace,
      destination: {
        label: "Huaca del Dragón (Arco Iris)",
        address: "La Esperanza, Trujillo",
        location: { lat: -8.0716, lng: -79.0412 },
      },
      stops: [
        { label: "Óvalo Papal", address: null, location: { lat: -8.0851, lng: -79.0389 } },
      ],
    }),
    buildRide(502, andrea, {
      direction: "TO_HOME",
      departureTime: nextDeparture(18, 45),
      pricePerSeat: 4,
      availableSeats: 1,
      conditions: ["No fumar"],
      origin: campusPlace,
      destination: {
        label: "Plaza de Armas de Trujillo",
        address: "Centro Histórico, Trujillo",
        location: { lat: -8.1116, lng: -79.0288 },
      },
      stops: [],
    }),
    buildRide(503, carlos, {
      direction: "TO_CAMPUS",
      departureTime: nextDeparture(7, 15),
      pricePerSeat: 6,
      availableSeats: 2,
      conditions: [],
      origin: {
        label: "Víctor Larco Herrera",
        address: "Av. Larco 1250, Trujillo",
        location: { lat: -8.1321, lng: -79.0437 },
      },
      destination: campusPlace,
      stops: [],
    }),
  ];

  return { users: [valeria, carlos, andrea], rides, reservations: [], otps: {}, files: [] };
}

// El estado se guarda en sessionStorage para que sobreviva a las recargas de la página
// (el token de la cookie sigue apuntando a un usuario que existe). Se pierde al cerrar la
// pestaña; `resetDb()` lo devuelve a los datos iniciales.
const STORAGE_KEY = "colaboracar_mock_db";

function load(): Database {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Database;
    }
  } catch {
    // Sin sessionStorage, o con datos ilegibles, se parte de los datos iniciales.
  }
  return seed();
}

export const db: Database = load();

/** Guarda el estado; se llama después de cada cambio. */
export function saveDb() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // El mock sigue funcionando en memoria.
  }
}

export function resetDb() {
  Object.assign(db, seed());
  saveDb();
}

/** Copia los datos del conductor en sus viajes activos, como hace el backend. */
export function syncDriverRides(user: MockUser) {
  for (const ride of db.rides) {
    const isActive = ride.status === "PUBLISHED" || ride.status === "IN_PROGRESS";
    if (ride.driver.id !== user.id || !isActive) {
      continue;
    }
    ride.driver.name = publicName(user.firstName!, user.lastName!);
    ride.driver.photoUrl = user.photoUrl;
    if (user.vehicle) {
      const { brand, model, color, plate } = user.vehicle;
      ride.vehicle = { brand, model, color, plate };
    }
  }
}
