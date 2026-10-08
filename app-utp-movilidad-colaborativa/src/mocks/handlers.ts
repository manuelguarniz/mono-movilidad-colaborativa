import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

const buildUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(["driver", "passenger", "admin"]),
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});

const MOCK_RIDES = [
  {
    id: "ride-1",
    price: 45,
    vehicle: "Toyota Yaris Blanco • ABC-123",
    availableSeats: 3,
    luggageAvailable: true,
    driver: {
      name: "Carlos M.",
      rating: 4.9,
      reviewCount: 120,
    },
    departure: {
      window: "14:15 - 14:25",
    },
  },
  {
    id: "ride-2",
    price: 35,
    vehicle: "Chevrolet Spark Rojo • XYZ-789",
    availableSeats: 1,
    luggageAvailable: false,
    driver: {
      name: "Andrea P.",
      rating: 4.7,
      reviewCount: 45,
    },
    departure: {
      window: "14:30 - 14:40",
    },
  },
];

export const handlers = [
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: "Correo y contraseña requeridos" },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        token: faker.string.alphanumeric(24),
        user: buildUser({
          email: body.email,
          name: body.email.split("@")[0] ?? "Usuario",
        }),
      },
      { status: 200 },
    );
  }),

  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        message: "Usuario registrado correctamente",
        registrationId: faker.string.uuid(),
        user: buildUser({
          email: body.email,
          name: body.email.split("@")[0] ?? "Usuario",
        }),
      },
      { status: 201 },
    );
  }),

  http.post(`${API_BASE}/auth/verify-code`, async ({ request }) => {
    const body = (await request.json()) as { code?: string };

    if (!body.code || body.code.length !== 6) {
      return HttpResponse.json(
        { message: "Código inválido. Debe tener 6 dígitos." },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      { message: "Cuenta verificada correctamente" },
      { status: 200 },
    );
  }),

  http.post(`${API_BASE}/auth/resend-code`, () => {
    return HttpResponse.json(
      { message: "Código reenviado correctamente" },
      { status: 200 },
    );
  }),

  http.post(`${API_BASE}/auth/complete-profile`, async ({ request }) => {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      department?: string;
      district?: string;
      campus?: string;
    };

    if (
      !body.firstName ||
      !body.lastName ||
      !body.department ||
      !body.district ||
      !body.campus
    ) {
      return HttpResponse.json(
        { message: "Faltan datos obligatorios del perfil" },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        message: "Perfil completado correctamente",
        user: buildUser({
          name: `${body.firstName} ${body.lastName}`,
        }),
      },
      { status: 200 },
    );
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json(
      { message: "Sesión cerrada correctamente" },
      { status: 200 },
    );
  }),

  http.get(`${API_BASE}/rides`, () => {
    return HttpResponse.json({ data: MOCK_RIDES }, { status: 200 });
  }),

  http.post(`${API_BASE}/rides/:rideId/reserve`, ({ params }) => {
    const ride = MOCK_RIDES.find((item) => item.id === params.rideId);

    if (!ride) {
      return HttpResponse.json(
        { message: "Viaje no encontrado" },
        { status: 404 },
      );
    }

    return HttpResponse.json(
      { message: `Reserva confirmada con ${ride.driver.name}` },
      { status: 200 },
    );
  }),
];
