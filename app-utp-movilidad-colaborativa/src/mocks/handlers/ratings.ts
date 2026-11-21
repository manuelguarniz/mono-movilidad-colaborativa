import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";
import { db, publicName, saveDb, type MockRide } from "@/mocks/db";
import {
  api,
  apiError,
  authenticate,
  invalidJson,
  isObjectId,
  readBody,
  validationError,
  type FieldError,
} from "@/mocks/http";

// `dias_para_calificar` de la colección `app` (RN-47): 1 día = 24 h desde el fin del viaje.
const RATING_DAYS = 1;
const DAY_MS = 24 * 60 * 60 * 1000;
const NOT_PARTICIPANT = "Solo pueden calificar quienes hicieron el viaje";

/** fin del viaje + dias_para_calificar; `null` si el viaje no terminó. */
export const ratingDeadline = (ride: MockRide) =>
  ride.finishedAt ? new Date(Date.parse(ride.finishedAt) + RATING_DAYS * DAY_MS) : null;

/** Promedio redondeado a un decimal, como `CalificacionService.promedioDe`. */
function recomputeRating(userId: string) {
  const received = db.ratings.filter((item) => item.ratedUserId === userId);
  if (!received.length) {
    return null;
  }
  const average = received.reduce((sum, item) => sum + item.score, 0) / received.length;
  return { average: Math.round(average * 10) / 10, count: received.length };
}

/** Calificaciones (P20): mismas reglas y mensajes que `CalificacionService` del backend. */
export const ratingHandlers = [
  http.get(api("/ratings/rides/:rideId"), ({ request, params }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const ride = isObjectId(params.rideId) ? db.rides.find((item) => item.id === params.rideId) : undefined;
    if (!ride) {
      return apiError(404, "RIDE_NOT_FOUND", "Viaje no encontrado");
    }
    if (ride.status !== "COMPLETED") {
      return apiError(403, "RATING_NOT_ALLOWED", NOT_PARTICIPANT);
    }
    const isDriver = ride.driver.id === user.id;
    const completed = db.reservations.filter((item) => item.rideId === ride.id && item.status === "COMPLETED");
    const rated = (bookingId: string) =>
      db.ratings.some((item) => item.bookingId === bookingId && item.authorId === user.id);

    let targets;
    if (isDriver) {
      targets = completed.map((item) => ({
        bookingId: item.id,
        userId: item.passengerId,
        name: item.passenger.name,
        photoUrl: item.passenger.photoUrl,
        role: "PASSENGER",
        seats: item.seats,
        vehicle: null,
        rated: rated(item.id),
      }));
    } else {
      const own = completed.find((item) => item.passengerId === user.id);
      if (!own) {
        return apiError(403, "RATING_NOT_ALLOWED", NOT_PARTICIPANT);
      }
      targets = [
        {
          bookingId: own.id,
          userId: ride.driver.id,
          name: ride.driver.name,
          photoUrl: ride.driver.photoUrl,
          role: "DRIVER",
          seats: null,
          vehicle: {
            brand: ride.vehicle.brand,
            model: ride.vehicle.model,
            color: ride.vehicle.color,
            plate: ride.vehicle.plate,
          },
          rated: rated(own.id),
        },
      ];
    }
    const deadline = ratingDeadline(ride);
    return HttpResponse.json({
      ride: {
        id: ride.id,
        departureTime: ride.departureTime,
        finishedAt: ride.finishedAt,
        campus: ride.campus,
        origin: { label: ride.origin.label, address: ride.origin.address },
        destination: { label: ride.destination.label, address: ride.destination.address },
      },
      role: isDriver ? "DRIVER" : "PASSENGER",
      deadline: deadline?.toISOString() ?? null,
      open: deadline !== null && Date.now() < deadline.getTime(),
      targets,
    });
  }),

  http.post(api("/ratings"), async ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }
    const errors: FieldError[] = [];
    if (body.bookingId == null) {
      errors.push({ field: "bookingId", message: "Indica la reserva que calificas" });
    } else if (!isObjectId(body.bookingId)) {
      errors.push({ field: "bookingId", message: "El identificador no es válido" });
    }
    const score = body.score;
    if (score == null) {
      errors.push({ field: "score", message: "Toca una estrella para calificar" });
    } else if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 5) {
      errors.push({ field: "score", message: "Elige de 1 a 5 estrellas" });
    }
    const comment = typeof body.comment === "string" && body.comment.trim() ? body.comment.trim() : null;
    if (typeof body.comment === "string" && body.comment.length > 200) {
      errors.push({ field: "comment", message: "El comentario admite hasta 200 caracteres" });
    }
    if (errors.length) {
      return validationError(errors);
    }

    const booking = db.reservations.find((item) => item.id === body.bookingId);
    const ride = booking && db.rides.find((item) => item.id === booking.rideId);
    const asPassenger = booking?.passengerId === user.id;
    const asDriver = ride?.driver.id === user.id;
    if (!booking || !ride || (!asPassenger && !asDriver) || booking.status !== "COMPLETED" || ride.status !== "COMPLETED") {
      return apiError(403, "RATING_NOT_ALLOWED", NOT_PARTICIPANT);
    }
    const deadline = ratingDeadline(ride);
    if (!deadline || Date.now() >= deadline.getTime()) {
      return apiError(409, "RATING_WINDOW_CLOSED", "El plazo para calificar este viaje terminó");
    }
    const ratedUserId = asPassenger ? ride.driver.id : booking.passengerId;
    if (db.ratings.some((item) => item.bookingId === booking.id && item.authorId === user.id && item.ratedUserId === ratedUserId)) {
      return apiError(409, "ALREADY_RATED", "Ya calificaste a esta persona en este viaje");
    }

    const rating = {
      id: faker.database.mongodbObjectId(),
      rideId: ride.id,
      bookingId: booking.id,
      authorId: user.id,
      authorName: publicName(user.firstName ?? "", user.lastName ?? ""),
      ratedUserId,
      ratedRole: asPassenger ? ("DRIVER" as const) : ("PASSENGER" as const),
      score: score as number,
      comment,
      createdAt: new Date().toISOString(),
    };
    db.ratings.push(rating);

    // RN-47: el promedio del calificado y su copia en los viajes activos.
    const average = recomputeRating(ratedUserId);
    const rated = db.users.find((item) => item.id === ratedUserId);
    if (rated) {
      rated.rating = average;
    }
    for (const item of db.rides) {
      if (item.driver.id === ratedUserId && (item.status === "PUBLISHED" || item.status === "IN_PROGRESS")) {
        item.driver.rating = average;
      }
    }
    saveDb();

    const { authorId, authorName, ...response } = rating;
    void authorId;
    void authorName;
    return HttpResponse.json(response, { status: 201 });
  }),
];
