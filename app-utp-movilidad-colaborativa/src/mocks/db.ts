// Datos en memoria de la API simulada. Las formas siguen el contrato `docs/openapi.yaml`
// y los catálogos son los mismos de `docs/seed.js`.

export type Role = "PASSENGER" | "DRIVER";
export type UserStatus = "PROFILE_PENDING" | "ACTIVE" | "BLOCKED";
export type DocumentType = "DNI" | "CE";
export type VehicleType = "SEDAN" | "HATCHBACK" | "SUV" | "VAN" | "MOTORCYCLE";
export type RideDirection = "TO_CAMPUS" | "TO_HOME";
export type RideStatus = "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type FilePurpose = "PROFILE_PHOTO" | "VEHICLE_PHOTO" | "SOAT_PHOTO";

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
  // RN-18: apto para movilidad reducida si `wheelchair` es `true`.
  accessibility: { wheelchair: boolean; boardingAssistance: boolean };
  // RN-36. Fechas `AAAA-MM-DD` de Perú; `null` si el conductor no lo declaró.
  soat: Soat | null;
};

export type Soat = {
  insurer: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  photoUrl: string | null;
  declaredAt: string;
};

export type RideVehicle = {
  brand: string;
  model: string;
  color: string;
  plate: string;
  wheelchairAccessible: boolean;
  soatEndDate: string | null;
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
  // RN-17: `null` o ausente si no declaró asistencia de movilidad. Nunca se copia en viajes.
  mobilityAssistance?: {
    type: "WHEELCHAIR" | "CRUTCHES_OR_WALKER" | "OTHER";
    note: string | null;
  } | null;
  homeAddress: Place | null;
  roles: Role[];
  activeMode: Role | null;
  status: UserStatus;
  vehicle: Vehicle | null;
  stats: { trips: number; compliance: number; co2SavedKg: number };
  rating: Rating | null;
  // Billetera (RN-39). Opcionales: un usuario recién registrado empieza en 0.
  credits?: number;
  heldCredits?: number;
  // RN-35: último login exitoso. `null` o ausente ⇒ el próximo login pide OTP.
  lastLoginAt?: string | null;
  createdAt: string;
};

export type MockRide = {
  id: string;
  campusId: string;
  // Copia de la sede con su ciudad: la etiqueta del dashboard (RN-49).
  campus: { id: string; name: string; city: string | null };
  status: RideStatus;
  direction: RideDirection;
  departureTime: string;
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
  distanceKm: number;
  durationMin: number;
  driver: { id: string; name: string; photoUrl: string | null; rating: Rating | null };
  vehicle: RideVehicle;
  conditions: string[];
  origin: Place;
  destination: Place;
  stops: Place[];
  // Inicio, cancelación y fin (RF-06, RF-07); `null` mientras no ocurren.
  startedAt: string | null;
  cancelledBy: Actor | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type Actor = "PASSENGER" | "DRIVER" | "SYSTEM";

export type MockReservation = {
  id: string;
  rideId: string;
  passengerId: string;
  // Copia del pasajero al reservar; la calificación es la de su perfil.
  passenger: { name: string; photoUrl: string | null; rating: Rating | null };
  // RN-21: copia de la asistencia del pasajero al reservar; solo la ve el conductor (RN-22).
  mobilityAssistance?: MockUser["mobilityAssistance"];
  seats: number;
  totalCredits: number;
  status: "CONFIRMED" | "IN_RIDE" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  cancelledBy: Actor | null;
  cancelledAt: string | null;
  // false mientras sus créditos están retenidos; true al reembolsarlos o pagarlos (RN-40).
  settled?: boolean;
  updatedAt: string;
  createdAt: string;
};

export type MovementType =
  | "TOP_UP"
  | "BOOKING_HOLD"
  | "REFUND"
  | "RIDE_EARNING"
  | "WITHDRAWAL"
  | "WITHDRAWAL_REVERSAL";

export type MockMovement = {
  id: string;
  userId: string;
  type: MovementType;
  amount: number;
  balanceAfter: number;
  description: string;
  operationCode: string | null;
  withdrawalId: string | null;
  createdAt: string;
};

export type WithdrawalStatus = "PENDING" | "PAID" | "REJECTED";

export type MockWithdrawal = {
  id: string;
  userId: string;
  credits: number;
  yapePhone: string;
  status: WithdrawalStatus;
  rejectionReason: string | null;
  reversalApplied: boolean;
  requestedAt: string;
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

/** Calificación de `calificaciones` (RN-47). El comentario solo se devuelve a su autor. */
export type MockRating = {
  id: string;
  rideId: string;
  bookingId: string;
  authorId: string;
  authorName: string;
  ratedUserId: string;
  ratedRole: Role;
  score: number;
  comment: string | null;
  createdAt: string;
};

export type NotificationType =
  | "NUEVA_RESERVA"
  | "RESERVA_CANCELADA"
  | "VIAJE_CANCELADO"
  | "RECORDATORIO_SALIDA"
  | "VIAJE_INICIADO"
  | "NO_SE_PRESENTO"
  | "VIAJE_COMPLETADO"
  | "RETIRO_RECHAZADO";

/** Notificación de `notificaciones` (RF-13), ya con la forma de la API. */
export type MockNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  assistance: string | null;
  rideId: string | null;
  bookingId: string | null;
  read: boolean;
  createdAt: string;
};

/** Título de cada tipo (RF-13). */
export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  NUEVA_RESERVA: "Nueva reserva",
  RESERVA_CANCELADA: "Reserva cancelada",
  VIAJE_CANCELADO: "Viaje cancelado",
  RECORDATORIO_SALIDA: "Recordatorio de salida",
  VIAJE_INICIADO: "Viaje iniciado",
  NO_SE_PRESENTO: "No te presentaste",
  VIAJE_COMPLETADO: "Viaje completado",
  RETIRO_RECHAZADO: "Retiro rechazado",
};

const limaDayTime = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** `dd/mm hh:mm` en la hora de Perú, como en los textos de RF-13. */
export const formatDayTime = (iso: string) => limaDayTime.format(new Date(iso)).replace(",", "");

type Database = {
  users: MockUser[];
  rides: MockRide[];
  reservations: MockReservation[];
  otps: Record<string, MockOtp>;
  files: MockFile[];
  movements: MockMovement[];
  withdrawals: MockWithdrawal[];
  ratings: MockRating[];
  notifications: MockNotification[];
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
/** Copia de la sede en el viaje; la ciudad es el distrito de la sede (RN-49). */
export function toRideCampus(campusId: string) {
  const campus = CAMPUSES.find((item) => item.id === campusId)!;
  const district = DISTRICTS.find((item) => item.id === campus.districtId);
  return { id: campus.id, name: campus.name, city: district?.name ?? null };
}

/** Copia del vehículo dentro del viaje, como en `viajes.vehiculo`. */
export const toRideVehicle = (vehicle: Vehicle): RideVehicle => ({
  brand: vehicle.brand,
  model: vehicle.model,
  color: vehicle.color,
  plate: vehicle.plate,
  wheelchairAccessible: vehicle.accessibility.wheelchair,
  soatEndDate: vehicle.soat?.endDate ?? null,
});

/** `AAAA-MM-DD` de hoy en Perú, desplazado `days` días. */
export const limaDate = (days = 0) =>
  toLima(new Date(Date.now() + days * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);

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
      accessibility: { wheelchair: true, boardingAssistance: false },
      soat: {
        insurer: "Rímac Seguros",
        policyNumber: "2401-123456",
        startDate: limaDate(-60),
        endDate: limaDate(305),
        photoUrl: null,
        declaredAt: "2026-10-02T10:00:00Z",
      },
    },
    stats: { trips: 86, compliance: 97, co2SavedKg: 187 },
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
      accessibility: { wheelchair: false, boardingAssistance: false },
      soat: null,
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
      campus: toRideCampus(trujillo.id),
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
      vehicle: toRideVehicle(vehicle),
      startedAt: null,
      cancelledBy: null,
      cancelReason: null,
      cancelledAt: null,
      finishedAt: null,
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

  const golf: Place = {
    label: "Urb. El Golf",
    address: "Víctor Larco",
    location: { lat: -8.1257, lng: -79.0402 },
  };
  const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

  // Datos de los frames de P17: un viaje de Carlos que sale en 10 min (se puede iniciar) y un
  // viaje cancelado por Andrea en las últimas 24 h, que Valeria ve en «Cancelados recientemente».
  rides.push(
    buildRide(504, carlos, {
      direction: "TO_HOME",
      departureTime: minutesFromNow(10),
      pricePerSeat: 6,
      availableSeats: 0,
      conditions: ["Máximo de espera 5 minutos"],
      origin: campusPlace,
      destination: golf,
      stops: [],
    }),
    {
      ...buildRide(505, andrea, {
        direction: "TO_HOME",
        departureTime: minutesFromNow(-20 * 60),
        pricePerSeat: 4,
        availableSeats: 3,
        conditions: [],
        origin: campusPlace,
        destination: {
          label: "Huanchaco",
          address: "Huanchaco, Trujillo",
          location: { lat: -8.0783, lng: -79.1213 },
        },
        stops: [],
      }),
      status: "CANCELLED",
      cancelledBy: "DRIVER",
      cancelledAt: minutesFromNow(-22 * 60),
    },
  );
  // Diego C. reservó 1 de las 3 plazas del viaje de mañana de Carlos (503).
  const passenger = (name: string, average: number) => ({
    name,
    photoUrl: null,
    rating: { average, count: 12 },
  });
  const now = new Date().toISOString();
  const reservation = (
    n: number,
    rideId: string,
    who: MockReservation["passenger"],
    seats: number,
    price: number,
    extra: Partial<MockReservation> = {},
  ): MockReservation => ({
    id: oid(n),
    rideId,
    passengerId: oid(n + 100),
    passenger: who,
    seats,
    totalCredits: seats * price,
    status: "CONFIRMED",
    cancelledBy: null,
    cancelledAt: null,
    updatedAt: now,
    createdAt: now,
    ...extra,
  });
  const reservations: MockReservation[] = [
    reservation(601, oid(504), passenger("Lucía R.", 4.8), 2, 6, { settled: false }),
    reservation(602, oid(504), passenger("Jorge P.", 4.6), 1, 6, {
      settled: false,
      mobilityAssistance: { type: "WHEELCHAIR", note: "Necesita espacio en la maletera." },
    }),
    reservation(603, oid(503), passenger("Diego C.", 4.7), 1, 6, { settled: false }),
    {
      ...reservation(604, oid(505), passenger("Valeria R.", 4.8), 2, 4, {
        status: "CANCELLED",
        cancelledBy: "DRIVER",
        cancelledAt: minutesFromNow(-22 * 60),
        settled: true,
      }),
      passengerId: valeria.id,
    },
  ];
  rides.find((ride) => ride.id === oid(503))!.availableSeats = 2;

  const history = seedHistory({ valeria, carlos, andrea, buildRide, reservation, passenger, campusPlace, golf });
  rides.push(...history.rides);
  reservations.push(...history.reservations);

  const wallet = seedWallets(valeria, carlos, andrea, minutesFromNow);

  return {
    users: [valeria, carlos, andrea],
    rides,
    reservations,
    otps: {},
    files: [],
    ...wallet,
    ratings: history.ratings,
    notifications: seedNotifications(valeria, carlos, andrea, rides, minutesFromNow),
  };
}

// El estado se guarda en sessionStorage para que sobreviva a las recargas de la página
// (el token de la cookie sigue apuntando a un usuario que existe). Se pierde al cerrar la
// pestaña; `resetDb()` lo devuelve a los datos iniciales.
// El sufijo cambia cuando cambia la forma de los datos, para descartar lo guardado antes.
const STORAGE_KEY = "colaboracar_mock_db_v10";

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
      ride.vehicle = toRideVehicle(user.vehicle);
    }
  }
}

/**
 * Billeteras de los frames de P21. Los movimientos van del más antiguo al más reciente y el
 * saldo de cada uno se acumula, así que el último coincide con el saldo del usuario:
 * Carlos 96 (21-A, retirable mín(96, 128 − 50) = 78), Valeria 38 (21-B) y Andrea 40, con un
 * retiro rechazado y devuelto.
 */
function seedWallets(
  valeria: MockUser,
  carlos: MockUser,
  andrea: MockUser,
  minutesFromNow: (minutes: number) => string,
) {
  const movements: MockMovement[] = [];
  const withdrawals: MockWithdrawal[] = [];
  let next = 801;
  const add = (
    user: MockUser,
    minutesAgo: number,
    type: MovementType,
    amount: number,
    description: string,
    extra: Partial<MockMovement> = {},
  ) => {
    user.credits = (user.credits ?? 0) + amount;
    movements.push({
      id: oid(next++),
      userId: user.id,
      type,
      amount,
      balanceAfter: user.credits,
      description,
      operationCode: null,
      withdrawalId: null,
      createdAt: minutesFromNow(-minutesAgo),
      ...extra,
    });
  };
  const withdrawal = (
    user: MockUser,
    minutesAgo: number,
    credits: number,
    status: WithdrawalStatus,
    rejectionReason: string | null = null,
  ) => {
    const item: MockWithdrawal = {
      id: oid(next++),
      userId: user.id,
      credits,
      yapePhone: "987654321",
      status,
      rejectionReason,
      reversalApplied: status === "REJECTED",
      requestedAt: minutesFromNow(-minutesAgo),
    };
    withdrawals.push(item);
    add(user, minutesAgo, "WITHDRAWAL", -credits, "Celular •••• 321", { withdrawalId: item.id });
    return item;
  };
  const DAY = 24 * 60;
  const campus = "Campus UTP Trujillo";

  for (const user of [valeria, carlos, andrea]) {
    user.credits = 0;
    user.heldCredits = 0;
  }

  // Carlos M. (conductor): 128 cobrados, 50 retirados y pagados.
  for (const [days, name, credits] of [
    [8, "Diego C.", 24],
    [7, "Jorge P.", 18],
    [6, "Mateo R.", 20],
    [5, "Sofía A.", 18],
    [4, "Lucía R.", 18],
  ] as const) {
    add(carlos, days * DAY, "RIDE_EARNING", credits, `${name} · Urb. California → ${campus}`);
  }
  add(carlos, 3 * DAY, "BOOKING_HOLD", -2, `${campus} → Urb. Las Quintanas · 1 plaza`);
  add(carlos, 2 * DAY + 60, "RIDE_EARNING", 12, `Lucía R. · ${campus} → Urb. El Golf`);
  add(carlos, 2 * DAY, "TOP_UP", 20, "Operación 08451236", { operationCode: "08451236" });
  withdrawal(carlos, DAY, 50, "PAID");
  add(carlos, 90, "RIDE_EARNING", 9, `Mateo R. · Urb. California → ${campus}`);
  add(carlos, 89, "RIDE_EARNING", 9, `Sofía A. · Urb. California → ${campus}`);

  // Valeria R. (pasajera): el reembolso es el viaje que le canceló Andrea (P17).
  add(valeria, 4 * DAY, "TOP_UP", 50, "Operación 77310452", { operationCode: "77310452" });
  add(valeria, 3 * DAY, "BOOKING_HOLD", -12, `${campus} → Urb. El Golf · 2 plazas`);
  add(valeria, 30 * 60, "BOOKING_HOLD", -8, `${campus} → Huanchaco · 2 plazas`);
  add(valeria, 22 * 60, "REFUND", 8, `Cancelado por el conductor · ${campus} → Huanchaco`);

  // Andrea P. (conductora): un retiro rechazado por el operador y su devolución (RF-12).
  add(andrea, 6 * DAY, "RIDE_EARNING", 24, `Valeria R. · ${campus} → Huanchaco`);
  add(andrea, 5 * DAY, "RIDE_EARNING", 16, `Diego C. · ${campus} → Huanchaco`);
  const rejected = withdrawal(andrea, 2 * DAY, 20, "REJECTED", "El número no tiene Yape activo");
  add(andrea, 2 * DAY - 120, "WITHDRAWAL_REVERSAL", 20, `Rechazado: ${rejected.rejectionReason}`, {
    withdrawalId: rejected.id,
  });

  return { movements, withdrawals };
}

type SeedHelpers = {
  valeria: MockUser;
  carlos: MockUser;
  andrea: MockUser;
  buildRide: (
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
  ) => MockRide;
  reservation: (
    n: number,
    rideId: string,
    who: { name: string; photoUrl: string | null; rating: Rating | null },
    seats: number,
    price: number,
    extra?: Partial<MockReservation>,
  ) => MockReservation;
  passenger: (name: string, average: number) => { name: string; photoUrl: null; rating: Rating };
  campusPlace: Place;
  golf: Place;
};

/**
 * Viajes terminados de los frames de P19 y P20 (ids ...051x y ...061x). Valeria hace el papel
 * de Lucía R. en 19-A: el viaje de hace 3 h con Carlos se puede calificar (24 h desde el fin),
 * el de hace 3 días ya venció y el de Andrea ya está calificado. Carlos (19-B) tiene dos viajes
 * de hoy por calificar, uno calificado, dos cancelados y uno con calificación completa.
 */
function seedHistory({ valeria, carlos, andrea, buildRide, reservation, passenger, campusPlace, golf }: SeedHelpers) {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const at = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
  const huanchaco: Place = {
    label: "Huanchaco",
    address: "Huanchaco, Trujillo",
    location: { lat: -8.0783, lng: -79.1213 },
  };
  const california: Place = {
    label: "Urb. California",
    address: "Víctor Larco",
    location: { lat: -8.1162, lng: -79.0365 },
  };
  const valeriaCopy = { name: "Valeria R.", photoUrl: null, rating: { average: 4.8, count: 15 } };

  const finished = (
    n: number,
    driver: MockUser,
    departedAgo: number,
    price: number,
    origin: Place,
    destination: Place,
    status: "COMPLETED" | "CANCELLED" = "COMPLETED",
    cancelledBy: Actor | null = null,
  ): MockRide => {
    const ride = buildRide(n, driver, {
      direction: origin === campusPlace ? "TO_HOME" : "TO_CAMPUS",
      departureTime: at(departedAgo),
      pricePerSeat: price,
      availableSeats: 0,
      conditions: [],
      origin,
      destination,
      stops: [],
    });
    return status === "COMPLETED"
      ? { ...ride, status, startedAt: at(departedAgo), finishedAt: at(departedAgo - 30 * 60 * 1000) }
      : { ...ride, status, cancelledBy, cancelledAt: at(departedAgo + HOUR) };
  };

  const rides = [
    finished(511, carlos, 3 * HOUR, 6, campusPlace, golf),
    finished(512, carlos, 4 * HOUR, 9, california, campusPlace),
    finished(513, carlos, 3 * DAY, 6, campusPlace, golf),
    finished(514, carlos, 5 * DAY, 6, golf, campusPlace, "CANCELLED", "DRIVER"),
    finished(515, carlos, 8 * DAY, 6, golf, campusPlace, "CANCELLED", "SYSTEM"),
    finished(516, carlos, 9 * DAY, 6, golf, campusPlace),
    finished(517, andrea, 7 * DAY, 4, huanchaco, campusPlace),
    finished(518, carlos, 14 * DAY, 6, campusPlace, golf),
    finished(519, carlos, 17 * DAY, 6, campusPlace, golf),
  ];
  const settled = { settled: true };
  const own = (r: MockReservation) => ({ ...r, passengerId: valeria.id, passenger: valeriaCopy });
  const cancelled = (by: Actor, ago: number) => ({
    status: "CANCELLED" as const,
    cancelledBy: by,
    cancelledAt: at(ago),
    settled: true,
  });

  const reservations: MockReservation[] = [
    own(reservation(611, oid(511), valeriaCopy, 2, 6, { status: "COMPLETED", ...settled })),
    reservation(612, oid(511), passenger("Jorge P.", 4.6), 1, 6, { status: "NO_SHOW", ...settled }),
    reservation(613, oid(512), passenger("Mateo R.", 4.7), 1, 9, { status: "COMPLETED", ...settled }),
    reservation(614, oid(512), passenger("Sofía A.", 4.9), 1, 9, { status: "COMPLETED", ...settled }),
    own(reservation(615, oid(513), valeriaCopy, 2, 6, { status: "COMPLETED", ...settled })),
    reservation(616, oid(514), passenger("Diego C.", 4.7), 1, 6, cancelled("DRIVER", 5 * DAY + HOUR)),
    reservation(617, oid(514), passenger("Ana V.", 4.5), 1, 6, cancelled("DRIVER", 5 * DAY + HOUR)),
    reservation(618, oid(515), passenger("Mateo R.", 4.7), 1, 6, cancelled("SYSTEM", 8 * DAY - HOUR)),
    reservation(619, oid(516), passenger("Diego C.", 4.7), 1, 6, { status: "COMPLETED", ...settled }),
    reservation(620, oid(516), passenger("Ana V.", 4.5), 2, 6, { status: "COMPLETED", ...settled }),
    own(reservation(621, oid(516), valeriaCopy, 1, 6, { status: "NO_SHOW", ...settled })),
    own(reservation(622, oid(517), valeriaCopy, 1, 4, { status: "COMPLETED", ...settled })),
    own(reservation(623, oid(518), valeriaCopy, 1, 6, { status: "COMPLETED", ...settled })),
    own(reservation(624, oid(519), valeriaCopy, 1, 6, cancelled("PASSENGER", 18 * DAY))),
  ];

  const rating = (
    n: number,
    bookingId: string,
    rideId: string,
    author: MockUser,
    authorName: string,
    ratedUserId: string,
    ratedRole: Role,
    score: number,
  ): MockRating => ({
    id: oid(n),
    rideId,
    bookingId,
    authorId: author.id,
    authorName,
    ratedUserId,
    ratedRole,
    score,
    comment: null,
    createdAt: at(2 * DAY),
  });
  const ratings = [
    rating(1001, oid(615), oid(513), carlos, "Carlos M.", valeria.id, "PASSENGER", 5),
    rating(1002, oid(619), oid(516), carlos, "Carlos M.", oid(719), "PASSENGER", 5),
    rating(1003, oid(620), oid(516), carlos, "Carlos M.", oid(720), "PASSENGER", 5),
    rating(1004, oid(622), oid(517), valeria, "Valeria R.", andrea.id, "DRIVER", 5),
  ];
  return { rides, reservations, ratings };
}

/**
 * Bandejas de los frames de P18: Valeria (18-A) con 3 sin leer y Carlos (18-B) con 2 sin leer y
 * la asistencia de Jorge P. (RN-22). Andrea tiene el aviso de su retiro rechazado (RN-42).
 */
function seedNotifications(
  valeria: MockUser,
  carlos: MockUser,
  andrea: MockUser,
  rides: MockRide[],
  minutesFromNow: (minutes: number) => string,
): MockNotification[] {
  const ride = (n: number) => rides.find((item) => item.id === oid(n))!;
  const hourMinute = (iso: string) => formatDayTime(iso).slice(-5);
  let next = 1101;
  const item = (
    user: MockUser,
    minutesAgo: number,
    type: NotificationType,
    message: string,
    extra: Partial<MockNotification> = {},
  ): MockNotification => ({
    id: oid(next++),
    userId: user.id,
    type,
    title: NOTIFICATION_TITLES[type],
    message,
    assistance: null,
    rideId: null,
    bookingId: null,
    read: false,
    createdAt: minutesFromNow(-minutesAgo),
    ...extra,
  });
  const golf = ride(511).destination.label;
  const cancelled = ride(505);
  const now = ride(504);

  return [
    // 18-A — Valeria (pasajera).
    item(valeria, 10, "VIAJE_COMPLETADO", `Tu viaje a ${golf} terminó. ¡Califica a Carlos M.!`, {
      rideId: oid(511),
      bookingId: oid(611),
    }),
    item(valeria, 38, "VIAJE_INICIADO", `Tu viaje a ${golf} inició.`, { rideId: oid(511) }),
    item(valeria, 60, "RECORDATORIO_SALIDA", `Tu viaje a ${golf} sale a las ${hourMinute(ride(511).departureTime)}.`, {
      rideId: oid(511),
    }),
    item(
      valeria,
      22 * 60,
      "VIAJE_CANCELADO",
      `${cancelled.driver.name} canceló el viaje del ${formatDayTime(cancelled.departureTime)} a ${cancelled.destination.label}. Te devolvimos 8 créditos. Motivo: Tuve un problema con el auto.`,
      { rideId: cancelled.id, bookingId: oid(604), read: true },
    ),
    // 18-B — Carlos (conductor).
    item(carlos, 10, "VIAJE_COMPLETADO", `Tu viaje a ${golf} terminó. ¡Califica a Valeria R.! Recibiste 18 créditos.`, {
      rideId: oid(511),
    }),
    item(
      carlos,
      54,
      "VIAJE_COMPLETADO",
      `Tu viaje a ${ride(512).destination.label} terminó. ¡Califica a Mateo R. y Sofía A.! Recibiste 18 créditos.`,
      { rideId: oid(512) },
    ),
    item(carlos, 60, "RECORDATORIO_SALIDA", `Tu viaje a ${now.destination.label} sale a las ${hourMinute(now.departureTime)}.`, {
      rideId: now.id,
      read: true,
    }),
    item(carlos, 65, "NUEVA_RESERVA", `Lucía R. reservó 2 plaza(s) en tu viaje del ${formatDayTime(now.departureTime)}.`, {
      rideId: now.id,
      bookingId: oid(601),
      read: true,
    }),
    item(carlos, 5 * 60, "NUEVA_RESERVA", `Jorge P. reservó 1 plaza(s) en tu viaje del ${formatDayTime(now.departureTime)}.`, {
      assistance: "Necesita asistencia: Silla de ruedas.",
      rideId: now.id,
      bookingId: oid(602),
      read: true,
    }),
    // Andrea: retiro rechazado y devuelto (21, RN-42).
    item(andrea, 2 * 24 * 60 - 2, "RETIRO_RECHAZADO", "Tu retiro de 20 créditos fue rechazado: El número no tiene Yape activo. Te devolvimos los créditos.", {
      read: true,
    }),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
