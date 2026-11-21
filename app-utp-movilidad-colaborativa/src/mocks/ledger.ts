import { faker } from "@faker-js/faker";
import {
  db,
  type Actor,
  type MockMovement,
  type MockReservation,
  type MockRide,
  type MockUser,
  type MovementType,
} from "@/mocks/db";

/**
 * Libro de créditos de la API simulada, con las mismas reglas que `LibroCreditos` del backend:
 * cada cambio de saldo va con su movimiento, y el saldo y los retenidos nunca son negativos.
 */

export const balanceOf = (user: MockUser) => user.credits ?? 0;
export const heldOf = (user: MockUser) => user.heldCredits ?? 0;

type Entry = {
  type: MovementType;
  amount: number;
  heldDelta?: number;
  description: string;
  operationCode?: string | null;
  withdrawalId?: string | null;
};

/** Aplica el movimiento y devuelve el saldo posterior. */
export function record(user: MockUser, entry: Entry): number {
  user.credits = balanceOf(user) + entry.amount;
  user.heldCredits = heldOf(user) + (entry.heldDelta ?? 0);
  const movement: MockMovement = {
    id: faker.database.mongodbObjectId(),
    userId: user.id,
    type: entry.type,
    amount: entry.amount,
    balanceAfter: user.credits,
    description: entry.description,
    operationCode: entry.operationCode ?? null,
    withdrawalId: entry.withdrawalId ?? null,
    createdAt: new Date().toISOString(),
  };
  db.movements.push(movement);
  return user.credits;
}

const route = (ride: MockRide) => `${ride.origin.label} → ${ride.destination.label}`;

/** RN-39: pasa el total de la reserva de disponible a retenido. */
export function holdCredits(user: MockUser, reservation: MockReservation, ride: MockRide) {
  reservation.settled = false;
  record(user, {
    type: "BOOKING_HOLD",
    amount: -reservation.totalCredits,
    heldDelta: reservation.totalCredits,
    description: `${route(ride)} · ${reservation.seats} ${reservation.seats === 1 ? "plaza" : "plazas"}`,
  });
}

const CANCELLED_BY: Record<Actor, string> = {
  PASSENGER: "Cancelada por ti",
  DRIVER: "Cancelado por el conductor",
  SYSTEM: "Cancelado: el viaje no se inició",
};

/** RN-40: devuelve lo retenido de una reserva cancelada; 0 si no retuvo o ya se liquidó. */
export function refundReservation(reservation: MockReservation, ride: MockRide, by: Actor): number {
  if (reservation.settled !== false) {
    return 0;
  }
  reservation.settled = true;
  const passenger = db.users.find((user) => user.id === reservation.passengerId);
  // Los pasajeros de ejemplo de P17 no tienen cuenta: no hay a quién devolver.
  if (passenger) {
    record(passenger, {
      type: "REFUND",
      amount: reservation.totalCredits,
      heldDelta: -reservation.totalCredits,
      description: `${CANCELLED_BY[by]} · ${route(ride)}`,
    });
  }
  return reservation.totalCredits;
}

/** RN-40: paga al conductor lo retenido de cada reserva COMPLETED o NO_SHOW. */
export function settleRide(ride: MockRide) {
  const driver = db.users.find((user) => user.id === ride.driver.id);
  for (const reservation of db.reservations) {
    const isPayable = reservation.status === "COMPLETED" || reservation.status === "NO_SHOW";
    if (reservation.rideId !== ride.id || !isPayable || reservation.settled !== false) {
      continue;
    }
    reservation.settled = true;
    const passenger = db.users.find((user) => user.id === reservation.passengerId);
    if (passenger) {
      passenger.heldCredits = Math.max(0, heldOf(passenger) - reservation.totalCredits);
    }
    if (driver) {
      record(driver, {
        type: "RIDE_EARNING",
        amount: reservation.totalCredits,
        description: `${reservation.passenger.name} · ${route(ride)}`,
      });
    }
  }
}

/** RN-42: mín(disponible, Σ RIDE_EARNING − Σ retiros no rechazados), nunca negativo. */
export function withdrawableOf(user: MockUser): number {
  const earned = db.movements
    .filter((item) => item.userId === user.id && item.type === "RIDE_EARNING")
    .reduce((total, item) => total + item.amount, 0);
  const withdrawn = db.withdrawals
    .filter((item) => item.userId === user.id && item.status !== "REJECTED")
    .reduce((total, item) => total + item.credits, 0);
  return Math.max(0, Math.min(balanceOf(user), earned - withdrawn));
}
