import { http, HttpResponse } from "msw";
import { db, type MockReservation, type MockRide } from "@/mocks/db";
import { api, authenticate, validationError } from "@/mocks/http";
import { ratingDeadline } from "@/mocks/handlers/ratings";

const PAGE_SIZE = 20;
const FINAL_BOOKING = ["COMPLETED", "CANCELLED", "NO_SHOW"];

const place = (value: MockRide["origin"]) => ({ label: value.label, address: value.address });
const vehicle = (ride: MockRide) => ({
  brand: ride.vehicle.brand,
  model: ride.vehicle.model,
  color: ride.vehicle.color,
  plate: ride.vehicle.plate,
});

function rating(ride: MockRide, pending: number, given: { userId: string; name: string; score: number }[]) {
  const deadline = ratingDeadline(ride);
  return {
    deadline: deadline?.toISOString() ?? null,
    open: deadline !== null && Date.now() < deadline.getTime(),
    pending,
    given,
  };
}

const base = (ride: MockRide) => ({
  rideId: ride.id,
  finishedAt: ride.finishedAt,
  campus: ride.campus,
  origin: place(ride.origin),
  destination: place(ride.destination),
});

/** Entrada del pasajero: misma forma que `HistorialService.entradaPasajero`. */
function passengerEntry(userId: string, booking: MockReservation, ride: MockRide) {
  const given = db.ratings.find((item) => item.bookingId === booking.id && item.authorId === userId);
  const rateable = booking.status === "COMPLETED" && ride.status === "COMPLETED";
  return {
    id: booking.id,
    role: "PASSENGER",
    status: booking.status,
    cancelledBy: booking.cancelledBy,
    departureTime: ride.departureTime,
    ...base(ride),
    seats: booking.seats,
    credits: booking.settled === undefined ? 0 : booking.totalCredits,
    driver: ride.driver,
    vehicle: vehicle(ride),
    passengers: null,
    noShows: null,
    refundedBookings: null,
    rating: rateable
      ? rating(ride, given ? 0 : 1, given ? [{ userId: ride.driver.id, name: ride.driver.name, score: given.score }] : [])
      : null,
  };
}

/** Entrada del conductor: misma forma que `HistorialService.entradaConductor`. */
function driverEntry(userId: string, ride: MockRide) {
  const bookings = db.reservations.filter((item) => item.rideId === ride.id);
  const boarded = bookings.filter((item) => item.status === "COMPLETED");
  const given = boarded.flatMap((item) => {
    const found = db.ratings.find((r) => r.bookingId === item.id && r.authorId === userId);
    return found ? [{ userId: item.passengerId, name: item.passenger.name, score: found.score }] : [];
  });
  return {
    id: ride.id,
    role: "DRIVER",
    status: ride.status,
    cancelledBy: ride.cancelledBy,
    departureTime: ride.departureTime,
    ...base(ride),
    seats: null,
    credits: bookings
      .filter((item) => (item.status === "COMPLETED" || item.status === "NO_SHOW") && item.settled === true)
      .reduce((sum, item) => sum + item.totalCredits, 0),
    driver: null,
    vehicle: vehicle(ride),
    passengers: boarded.map((item) => ({
      bookingId: item.id,
      id: item.passengerId,
      name: item.passenger.name,
      photoUrl: item.passenger.photoUrl,
      seats: item.seats,
    })),
    noShows: bookings.filter((item) => item.status === "NO_SHOW").length,
    refundedBookings: bookings.filter(
      (item) => item.status === "CANCELLED" && (item.cancelledBy === "DRIVER" || item.cancelledBy === "SYSTEM"),
    ).length,
    rating: ride.status === "COMPLETED" ? rating(ride, boarded.length - given.length, given) : null,
  };
}

const byDepartureDesc = (a: { departureTime: string }, b: { departureTime: string }) =>
  b.departureTime.localeCompare(a.departureTime);

/** Historial (P19): mismas reglas que `HistorialService` del backend (RF-09, RN-50). */
export const historyHandlers = [
  http.get(api("/history"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    if (role !== "PASSENGER" && role !== "DRIVER") {
      return validationError([{ field: "role", message: "El rol debe ser PASSENGER o DRIVER" }]);
    }
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

    const entries =
      role === "DRIVER"
        ? db.rides
            .filter((ride) => ride.driver.id === user.id && (ride.status === "COMPLETED" || ride.status === "CANCELLED"))
            .sort(byDepartureDesc)
            .map((ride) => driverEntry(user.id, ride))
        : db.reservations
            .filter((item) => item.passengerId === user.id && FINAL_BOOKING.includes(item.status))
            .flatMap((item) => {
              const ride = db.rides.find((r) => r.id === item.rideId);
              return ride ? [passengerEntry(user.id, item, ride)] : [];
            })
            .sort(byDepartureDesc);

    const start = (page - 1) * PAGE_SIZE;
    return HttpResponse.json({
      data: entries.slice(start, start + PAGE_SIZE),
      page,
      hasMore: entries.length > start + PAGE_SIZE,
    });
  }),
];
