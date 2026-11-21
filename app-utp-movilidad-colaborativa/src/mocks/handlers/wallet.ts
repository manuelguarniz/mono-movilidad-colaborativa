import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";
import { db, saveDb, type MockMovement, type MockWithdrawal } from "@/mocks/db";
import { api, apiError, authenticate, invalidJson, readBody, validationError } from "@/mocks/http";
import { balanceOf, heldOf, record, withdrawableOf } from "@/mocks/ledger";

// Valores por defecto de la colección `app` (RN-41, RN-42).
const LIMITS = { topUpMin: 5, topUpMax: 200, withdrawalMin: 10 };
const PAGE_SIZE = 20;
const ACTIVE_BOOKING = ["CONFIRMED", "IN_RIDE"];

const last3 = (phone: string) => phone.slice(-3);

const toMovement = (movement: MockMovement) => {
  const withdrawal = movement.withdrawalId
    ? db.withdrawals.find((item) => item.id === movement.withdrawalId)
    : undefined;
  return {
    id: movement.id,
    type: movement.type,
    amount: movement.amount,
    balanceAfter: movement.balanceAfter,
    description: movement.description,
    createdAt: movement.createdAt,
    withdrawal: withdrawal
      ? { id: withdrawal.id, status: withdrawal.status, rejectionReason: withdrawal.rejectionReason }
      : null,
  };
};

const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

/** Billetera (P21): misma forma y mismas reglas que `BilleteraService` del backend. */
export const walletHandlers = [
  http.get(api("/wallet"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const booking = db.reservations.find(
      (item) =>
        item.passengerId === user.id &&
        ACTIVE_BOOKING.includes(item.status) &&
        item.settled === false,
    );
    const ride = booking && db.rides.find((item) => item.id === booking.rideId);
    const own = db.withdrawals
      .filter((item) => item.userId === user.id)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    const pending = own.find((item) => item.status === "PENDING");

    return HttpResponse.json({
      available: balanceOf(user),
      held: heldOf(user),
      withdrawable: withdrawableOf(user),
      activeMode: user.activeMode ?? "PASSENGER",
      driver: user.roles.includes("DRIVER"),
      heldBooking:
        booking && ride
          ? {
              id: booking.id,
              rideId: ride.id,
              departureTime: ride.departureTime,
              origin: ride.origin.label,
              destination: ride.destination.label,
              credits: booking.totalCredits,
            }
          : null,
      pendingWithdrawal: pending
        ? {
            id: pending.id,
            credits: pending.credits,
            phoneLast3: last3(pending.yapePhone),
            requestedAt: pending.requestedAt,
          }
        : null,
      lastYapePhone: own[0]?.yapePhone ?? null,
      limits: LIMITS,
    });
  }),

  http.get(api("/wallet/movements"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const page = Math.max(1, Number(new URL(request.url).searchParams.get("page")) || 1);
    const all = db.movements
      .filter((item) => item.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (page - 1) * PAGE_SIZE;
    return HttpResponse.json({
      data: all.slice(start, start + PAGE_SIZE).map(toMovement),
      page,
      hasMore: all.length > start + PAGE_SIZE,
    });
  }),

  http.post(api("/wallet/top-ups"), async ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }
    const amountMessage = `Elige un monto entre S/ ${LIMITS.topUpMin} y S/ ${LIMITS.topUpMax}.`;
    const code = body.operationCode;
    if (typeof code !== "string" || !/^\d{6,12}$/.test(code)) {
      return validationError([
        { field: "operationCode", message: "El código de operación tiene de 6 a 12 dígitos." },
      ]);
    }
    if (body.amount == null) {
      return validationError([{ field: "amount", message: amountMessage }]);
    }
    if (user.status === "PROFILE_PENDING") {
      return apiError(409, "PROFILE_INCOMPLETE", "Completa tu perfil antes de recargar créditos");
    }
    const amount = body.amount;
    if (!isInteger(amount) || amount < LIMITS.topUpMin || amount > LIMITS.topUpMax) {
      return validationError([{ field: "amount", message: amountMessage }]);
    }
    if (db.movements.some((item) => item.operationCode === code)) {
      return apiError(409, "OPERATION_CODE_ALREADY_USED", "Este código de operación ya fue registrado");
    }
    const balance = record(user, {
      type: "TOP_UP",
      amount,
      description: `Operación ${code}`,
      operationCode: code,
    });
    saveDb();
    return HttpResponse.json(
      { credits: amount, balance, operationCode: code, createdAt: new Date().toISOString() },
      { status: 201 },
    );
  }),

  http.post(api("/wallet/withdrawals"), async ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }
    const phone = body.yapePhone;
    if (typeof phone !== "string" || !/^9\d{8}$/.test(phone)) {
      return validationError([
        { field: "yapePhone", message: "Ingresa un celular de 9 dígitos que empiece con 9." },
      ]);
    }
    const minMessage = `El retiro mínimo es de ${LIMITS.withdrawalMin} créditos.`;
    if (body.amount == null) {
      return validationError([{ field: "amount", message: minMessage }]);
    }
    if (!user.roles.includes("DRIVER")) {
      return apiError(403, "DRIVER_ROLE_REQUIRED", "Solo los conductores pueden retirar créditos");
    }
    const amount = body.amount;
    if (!isInteger(amount) || amount < LIMITS.withdrawalMin) {
      return validationError([{ field: "amount", message: minMessage }]);
    }
    if (db.withdrawals.some((item) => item.userId === user.id && item.status === "PENDING")) {
      return apiError(409, "WITHDRAWAL_PENDING", "Ya tienes un retiro pendiente");
    }
    const withdrawable = withdrawableOf(user);
    if (amount > withdrawable) {
      return validationError([
        {
          field: "amount",
          message: `Solo puedes retirar hasta ${withdrawable} créditos (lo que ganaste como conductor)`,
        },
      ]);
    }
    const withdrawal: MockWithdrawal = {
      id: faker.database.mongodbObjectId(),
      userId: user.id,
      credits: amount,
      yapePhone: phone,
      status: "PENDING",
      rejectionReason: null,
      reversalApplied: false,
      requestedAt: new Date().toISOString(),
    };
    db.withdrawals.push(withdrawal);
    const balance = record(user, {
      type: "WITHDRAWAL",
      amount: -amount,
      description: `Celular •••• ${last3(phone)}`,
      withdrawalId: withdrawal.id,
    });
    saveDb();
    return HttpResponse.json(
      {
        id: withdrawal.id,
        credits: amount,
        phoneLast3: last3(phone),
        status: "PENDING",
        requestedAt: withdrawal.requestedAt,
        balance,
      },
      { status: 201 },
    );
  }),
];
