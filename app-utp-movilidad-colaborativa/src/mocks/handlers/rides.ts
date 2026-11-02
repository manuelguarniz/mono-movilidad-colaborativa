import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";
import {
  db,
  measureRoute,
  publicName,
  saveDb,
  toLima,
  toRideCampus,
  toRideVehicle,
  type MockRide,
  type Place,
  type RideDirection,
} from "@/mocks/db";
import {
  api,
  apiError,
  authenticate,
  invalidJson,
  isBlank,
  isObjectId,
  readBody,
  validationError,
  type FieldError,
} from "@/mocks/http";

/** Viaje del listado: sin coordenadas, paradas ni datos internos. */
const toRideSummary = ({ campusId, stops, createdAt, ...ride }: MockRide) => ({
  ...ride,
  origin: { label: ride.origin.label, address: ride.origin.address },
  destination: {
    label: ride.destination.label,
    address: ride.destination.address,
  },
});

const toRideDetail = ({ campusId, ...ride }: MockRide) => ride;

const PAGE_SIZE = 20;
const ACTIVE_BOOKING = ["CONFIRMED", "IN_RIDE"];

/** Reserva activa del pasajero (RN-23), con lo que muestra la franja del dashboard. */
function toActiveBooking(passengerId: string) {
  const reservation = db.reservations.find(
    (item) => item.passengerId === passengerId && ACTIVE_BOOKING.includes(item.status),
  );
  const ride = reservation && db.rides.find((item) => item.id === reservation.rideId);
  if (!reservation || !ride) {
    return null;
  }
  return {
    id: reservation.id,
    rideId: ride.id,
    departureTime: ride.departureTime,
    origin: ride.origin.label,
    destination: ride.destination.label,
  };
}

/** Minúsculas y sin tildes, para buscar el destino. */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const limaDay = (date: Date) => toLima(date).toISOString().slice(0, 10);
const limaTime = (date: Date) => toLima(date).toISOString().slice(11, 16);

const isCoordinate = (value: unknown, limit: number) =>
  typeof value === "number" && Math.abs(value) <= limit;

/** Valida un lugar de la ruta; los errores llevan el campo con notación de punto. */
function checkPlace(
  value: unknown,
  field: string,
  required: string,
  errors: FieldError[],
) {
  if (value == null || typeof value !== "object") {
    errors.push({ field, message: required });
    return;
  }
  const place = value as Record<string, unknown>;

  if (isBlank(place.label)) {
    errors.push({
      field: `${field}.label`,
      message: "El nombre del lugar es obligatorio",
    });
  } else if ((place.label as string).length > 80) {
    errors.push({
      field: `${field}.label`,
      message: "El nombre del lugar debe tener como máximo 80 caracteres",
    });
  }

  if (
    place.address != null &&
    (typeof place.address !== "string" || place.address.length > 160)
  ) {
    errors.push({
      field: `${field}.address`,
      message: "La dirección debe tener como máximo 160 caracteres",
    });
  }

  if (place.location == null || typeof place.location !== "object") {
    errors.push({
      field: `${field}.location`,
      message: "La ubicación es obligatoria",
    });
    return;
  }
  const { lat, lng } = place.location as Record<string, unknown>;
  if (lat == null) {
    errors.push({
      field: `${field}.location.lat`,
      message: "La latitud es obligatoria",
    });
  } else if (!isCoordinate(lat, 90)) {
    errors.push({
      field: `${field}.location.lat`,
      message: "La latitud debe estar entre -90 y 90",
    });
  }
  if (lng == null) {
    errors.push({
      field: `${field}.location.lng`,
      message: "La longitud es obligatoria",
    });
  } else if (!isCoordinate(lng, 180)) {
    errors.push({
      field: `${field}.location.lng`,
      message: "La longitud debe estar entre -180 y 180",
    });
  }
}

const toPlace = (value: unknown): Place => {
  const place = value as Place;
  return {
    label: place.label.trim(),
    address: place.address ?? null,
    location: { lat: place.location.lat, lng: place.location.lng },
  };
};

const rideNotFound = () => apiError(404, "RIDE_NOT_FOUND", "Viaje no encontrado");

const invalidRideId = () =>
  validationError([
    { field: "rideId", message: "El parámetro rideId no es válido" },
  ]);

export const rideHandlers = [
  http.get(api("/rides"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }

    const params = new URL(request.url).searchParams;
    const campusId = params.get("campusId");
    const destination = params.get("destination");
    const time = params.get("time");
    const passengers = Number(params.get("passengers") ?? 1);
    const accessible = params.get("accessible");
    const page = Number(params.get("page") ?? 1);

    const errors: FieldError[] = [];
    if (campusId !== null && !isObjectId(campusId)) {
      errors.push({
        field: "campusId",
        message: "El parámetro campusId no es válido",
      });
    }
    if (destination !== null && destination.length > 100) {
      errors.push({
        field: "destination",
        message: "El destino debe tener como máximo 100 caracteres",
      });
    }
    if (time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      errors.push({
        field: "time",
        message: "La hora debe tener el formato HH:mm",
      });
    }
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 99) {
      errors.push({
        field: "passengers",
        message: "El número de pasajeros debe ser al menos 1",
      });
    }
    if (accessible !== null && accessible !== "true" && accessible !== "false") {
      errors.push({
        field: "accessible",
        message: "El parámetro accessible debe ser true o false",
      });
    }
    if (!Number.isInteger(page) || page < 1 || page > 9999) {
      errors.push({
        field: "page",
        message: "La página debe ser un número mayor o igual a 1",
      });
    }
    if (errors.length) {
      return validationError(errors);
    }

    // Todas las sedes (RN-49); `campusId` restringe a una.
    const search = destination ? normalize(destination.trim()) : "";
    const now = new Date();

    const rides = db.rides
      .filter((ride) => {
        const departure = new Date(ride.departureTime);
        const place = ride.destination;
        return (
          (!campusId || ride.campusId === campusId) &&
          (accessible !== "true" || ride.vehicle.wheelchairAccessible) &&
          ride.status === "PUBLISHED" &&
          ride.driver.id !== user.id &&
          departure > now &&
          ride.availableSeats >= passengers &&
          (!search ||
            normalize(`${place.label} ${place.address ?? ""}`).includes(search)) &&
          // Con `time` solo se devuelven los viajes de hoy desde esa hora.
          (!time ||
            (limaDay(departure) === limaDay(now) && limaTime(departure) >= time))
        );
      })
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime))
      .map(toRideSummary);

    // 20 viajes por página (RF-03), con la reserva activa del pasajero (RN-23). El mock no
    // registra cancelaciones, así que no hay bloqueo (RN-38).
    const start = (page - 1) * PAGE_SIZE;
    return HttpResponse.json({
      data: rides.slice(start, start + PAGE_SIZE),
      page,
      hasMore: rides.length > start + PAGE_SIZE,
      activeBooking: toActiveBooking(user.id),
      bookingBlock: null,
    });
  }),

  http.get(api("/rides/mine"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const rides = db.rides
      .filter(
        (ride) =>
          ride.driver.id === user.id &&
          (ride.status === "PUBLISHED" || ride.status === "IN_PROGRESS"),
      )
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime))
      .map(toRideSummary);
    return HttpResponse.json({ data: rides });
  }),

  http.post(api("/rides"), async ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }

    const errors: FieldError[] = [];

    if (body.direction == null) {
      errors.push({
        field: "direction",
        message: "El sentido del viaje es obligatorio",
      });
    } else if (body.direction !== "TO_CAMPUS" && body.direction !== "TO_HOME") {
      errors.push({
        field: "direction",
        message: "El sentido del viaje no es válido",
      });
    }

    const departure = new Date(body.departureTime as string);
    if (body.departureTime == null) {
      errors.push({
        field: "departureTime",
        message: "La hora de salida es obligatoria",
      });
    } else if (
      typeof body.departureTime !== "string" ||
      Number.isNaN(departure.getTime())
    ) {
      // El backend no llega a leer una fecha que no es ISO 8601.
      return invalidJson();
    } else {
      const time = limaTime(departure);
      if (departure <= new Date() || time < "06:00" || time > "23:00") {
        errors.push({
          field: "departureTime",
          message:
            "La hora de salida debe ser futura y estar entre las 6:00 y las 23:00",
        });
      }
    }

    checkPlace(body.origin, "origin", "El punto de partida es obligatorio", errors);
    checkPlace(body.destination, "destination", "El destino es obligatorio", errors);

    const stops = Array.isArray(body.stops) ? body.stops : [];
    if (stops.length > 5) {
      errors.push({
        field: "stops",
        message: "Puedes agregar como máximo 5 paradas",
      });
    } else {
      stops.forEach((stop, index) =>
        checkPlace(stop, `stops[${index}]`, "La parada no es válida", errors),
      );
    }

    if (body.pricePerSeat == null) {
      errors.push({
        field: "pricePerSeat",
        message: "El precio por plaza es obligatorio",
      });
    } else if (
      !Number.isInteger(body.pricePerSeat) ||
      (body.pricePerSeat as number) < 1 ||
      (body.pricePerSeat as number) > 10
    ) {
      errors.push({
        field: "pricePerSeat",
        message: "El precio por plaza debe estar entre 1 y 10",
      });
    }

    if (body.seats == null) {
      errors.push({ field: "seats", message: "Las plazas son obligatorias" });
    } else if (!Number.isInteger(body.seats) || (body.seats as number) < 1) {
      errors.push({ field: "seats", message: "Debes ofrecer al menos 1 plaza" });
    }

    const conditions = Array.isArray(body.conditions) ? body.conditions : [];
    if (conditions.length > 10) {
      errors.push({
        field: "conditions",
        message: "Puedes agregar como máximo 10 condiciones",
      });
    } else {
      conditions.forEach((condition, index) => {
        if (isBlank(condition) || (condition as string).length > 120) {
          errors.push({
            field: `conditions[${index}]`,
            message: "Cada condición debe tener entre 1 y 120 caracteres",
          });
        }
      });
    }

    if (errors.length) {
      return validationError(errors);
    }

    if (!user.vehicle || user.vehicle.status !== "ACTIVE") {
      return apiError(
        403,
        "VEHICLE_REQUIRED",
        "Registra un vehículo para publicar viajes",
      );
    }
    // RN-37: sin SOAT declarado no se valida (es opcional mientras P05 y P16 no lo pidan).
    const soat = user.vehicle.soat;
    const departureDay = toLima(departure).toISOString().slice(0, 10);
    if (soat && (departureDay < soat.startDate || departureDay > soat.endDate)) {
      return apiError(
        409,
        "SOAT_EXPIRES_BEFORE_DEPARTURE",
        "Tu SOAT vence antes de la salida. Actualízalo en tu perfil para publicar.",
      );
    }
    const seats = body.seats as number;
    if (seats > user.vehicle.seats) {
      return validationError([
        {
          field: "seats",
          message: "Las plazas no pueden superar las de tu vehículo",
        },
      ]);
    }

    // Conductor, vehículo y sede se copian del usuario; la distancia y la duración se
    // calculan en línea recta entre origen, paradas y destino.
    const origin = toPlace(body.origin);
    const destination = toPlace(body.destination);
    const route = stops.map(toPlace);
    const ride: MockRide = {
      id: faker.database.mongodbObjectId(),
      campusId: user.campus!.id,
      campus: toRideCampus(user.campus!.id),
      status: "PUBLISHED",
      direction: body.direction as RideDirection,
      departureTime: departure.toISOString(),
      pricePerSeat: body.pricePerSeat as number,
      totalSeats: seats,
      availableSeats: seats,
      ...measureRoute([origin, ...route, destination].map((place) => place.location)),
      driver: {
        id: user.id,
        name: publicName(user.firstName!, user.lastName!),
        photoUrl: user.photoUrl,
        rating: user.rating,
      },
      vehicle: toRideVehicle(user.vehicle),
      conditions: conditions.map((condition) => (condition as string).trim()),
      origin,
      destination,
      stops: route,
      createdAt: new Date().toISOString(),
    };
    db.rides.push(ride);
    saveDb();

    return HttpResponse.json(toRideDetail(ride), {
      status: 201,
      headers: { Location: `/api/rides/${ride.id}` },
    });
  }),

  http.get(api("/rides/:rideId"), ({ request, params }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    if (!isObjectId(params.rideId)) {
      return invalidRideId();
    }

    const ride = db.rides.find((item) => item.id === params.rideId);
    return ride ? HttpResponse.json(toRideDetail(ride)) : rideNotFound();
  }),

  http.post(api("/rides/:rideId/reserve"), async ({ request, params }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    if (!isObjectId(params.rideId)) {
      return invalidRideId();
    }
    // El cuerpo es opcional: sin cuerpo, o sin `seats`, se reserva 1 plaza.
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }
    const seats = body.seats ?? 1;
    if (typeof seats !== "number" || !Number.isInteger(seats) || seats < 1) {
      return validationError([
        { field: "seats", message: "Debes reservar al menos 1 plaza" },
      ]);
    }

    if (user.status === "PROFILE_PENDING") {
      return apiError(
        409,
        "PROFILE_INCOMPLETE",
        "Completa tu perfil antes de reservar un viaje",
      );
    }
    const ride = db.rides.find((item) => item.id === params.rideId);
    if (!ride) {
      return rideNotFound();
    }
    if (ride.driver.id === user.id) {
      return apiError(403, "OWN_RIDE", "No puedes reservar tu propio viaje");
    }
    if (ride.status !== "PUBLISHED" || new Date(ride.departureTime) <= new Date()) {
      return apiError(409, "RIDE_NOT_AVAILABLE", "Este viaje ya no está disponible");
    }
    const alreadyBooked = db.reservations.some(
      (item) =>
        item.rideId === ride.id &&
        item.passengerId === user.id &&
        item.status === "CONFIRMED",
    );
    if (alreadyBooked) {
      return apiError(
        409,
        "ALREADY_BOOKED",
        "Ya tienes una reserva confirmada en este viaje",
      );
    }
    if (toActiveBooking(user.id)) {
      return apiError(
        409,
        "ACTIVE_BOOKING_EXISTS",
        "Ya tienes una reserva activa. Cancélala para reservar otro viaje.",
      );
    }
    if (ride.availableSeats < seats) {
      return apiError(
        409,
        "NO_SEATS_AVAILABLE",
        "Este viaje ya no tiene asientos disponibles",
      );
    }

    ride.availableSeats -= seats;
    db.reservations.push({
      id: faker.database.mongodbObjectId(),
      rideId: ride.id,
      passengerId: user.id,
      seats,
      totalCredits: seats * ride.pricePerSeat,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    });
    saveDb();

    return HttpResponse.json({ message: "Reserva confirmada" }, { status: 201 });
  }),
];
