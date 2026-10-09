import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";
import {
  CAMPUSES,
  DEPARTMENTS,
  DISTRICTS,
  db,
  saveDb,
  type MockUser,
} from "@/mocks/db";
import {
  UTP_EMAIL,
  api,
  apiError,
  authenticate,
  checkPersonName,
  findOwnFile,
  invalidJson,
  isBlank,
  isObjectId,
  issueToken,
  readBody,
  validationError,
  type FieldError,
} from "@/mocks/http";

/** Código OTP de la API simulada. El backend real lo envía por correo. */
export const MOCK_OTP_CODE = "123456";

const OTP_TTL = 300;
const OTP_RESEND_AFTER = 45;
const OTP_MAX_ATTEMPTS = 3;
const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

const toSessionUser = (user: MockUser) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  photoUrl: user.photoUrl,
  roles: user.roles,
  activeMode: user.activeMode,
  status: user.status,
});

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

function checkEmail(email: string, errors: FieldError[]) {
  if (!email) {
    errors.push({ field: "email", message: "El correo es obligatorio" });
  } else if (email.length > 254 || !UTP_EMAIL.test(email)) {
    errors.push({
      field: "email",
      message: "El correo debe ser del dominio utp.edu.pe",
    });
  }
}

function sendOtp(userId: string) {
  db.otps[userId] = {
    code: MOCK_OTP_CODE,
    expiresAt: Date.now() + OTP_TTL * 1000,
    resendAt: Date.now() + OTP_RESEND_AFTER * 1000,
    attemptsLeft: OTP_MAX_ATTEMPTS,
  };
  saveDb();
  // Igual que el backend con MAIL_ENABLED=false: el código queda en el log.
  console.info(`[MSW] Código OTP: ${MOCK_OTP_CODE}`);
  return {
    expiresIn: OTP_TTL,
    resendAfter: OTP_RESEND_AFTER,
    attemptsLeft: OTP_MAX_ATTEMPTS,
  };
}

export const authHandlers = [
  http.post(api("/auth/register"), async ({ request }) => {
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }

    const email = normalizeEmail(body.email);
    const errors: FieldError[] = [];
    checkEmail(email, errors);
    if (typeof body.password !== "string" || !PASSWORD.test(body.password)) {
      errors.push({
        field: "password",
        message:
          "La contraseña debe tener entre 8 y 72 caracteres con letras, números y símbolos",
      });
    }
    if (body.acceptedTerms !== true) {
      errors.push({
        field: "acceptedTerms",
        message: "Debes aceptar los términos y condiciones",
      });
    }
    if (errors.length) {
      return validationError(errors);
    }

    if (db.users.some((user) => user.email === email)) {
      return apiError(409, "EMAIL_ALREADY_REGISTERED", "El correo ya está en uso");
    }

    const user: MockUser = {
      id: faker.database.mongodbObjectId(),
      email,
      password: body.password as string,
      firstName: null,
      lastName: null,
      phone: null,
      documentType: null,
      documentNumber: null,
      photoUrl: null,
      department: null,
      district: null,
      campus: null,
      homeAddress: null,
      roles: [],
      activeMode: null,
      status: "PROFILE_PENDING",
      vehicle: null,
      stats: { trips: 0, compliance: 0, co2SavedKg: 0 },
      rating: null,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb();

    return HttpResponse.json(
      { ...issueToken(user.id, "REGISTRATION"), user: toSessionUser(user) },
      { status: 201 },
    );
  }),

  http.post(api("/auth/complete-profile"), async ({ request }) => {
    const user = authenticate(request, ["REGISTRATION", "SESSION"]);
    if (user instanceof Response) {
      return user;
    }
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }

    const errors: FieldError[] = [];
    checkPersonName(body.firstName, "firstName", "Los nombres", errors);
    checkPersonName(body.lastName, "lastName", "Los apellidos", errors);
    const catalogFields = [
      ["departmentId", "El departamento es obligatorio", "El departamento no es válido"],
      ["districtId", "El distrito es obligatorio", "El distrito no es válido"],
      ["campusId", "La sede es obligatoria", "La sede no es válida"],
    ];
    for (const [field, required, invalid] of catalogFields) {
      if (body[field] == null) {
        errors.push({ field, message: required });
      } else if (!isObjectId(body[field])) {
        errors.push({ field, message: invalid });
      }
    }
    // La foto es opcional hasta que el backend implemente POST /files.
    if (body.photoFileId != null && !isObjectId(body.photoFileId)) {
      errors.push({ field: "photoFileId", message: "La foto de perfil no es válida" });
    }
    if (errors.length) {
      return validationError(errors);
    }

    const department = DEPARTMENTS.find((item) => item.id === body.departmentId);
    if (!department) {
      return apiError(400, "INVALID_CATALOG_REFERENCE", "El departamento no existe");
    }
    const district = DISTRICTS.find(
      (item) => item.id === body.districtId && item.departmentId === department.id,
    );
    if (!district) {
      return apiError(
        400,
        "INVALID_CATALOG_REFERENCE",
        "El distrito no pertenece al departamento",
      );
    }
    const campus = CAMPUSES.find(
      (item) => item.id === body.campusId && item.districtId === district.id,
    );
    if (!campus) {
      return apiError(
        400,
        "INVALID_CATALOG_REFERENCE",
        "La sede no pertenece al distrito",
      );
    }

    if (body.photoFileId != null) {
      const photo = findOwnFile(body.photoFileId as string, user, "PROFILE_PHOTO");
      if (!photo) {
        return apiError(
          400,
          "INVALID_FILE_REFERENCE",
          "La foto de perfil no existe o no te pertenece",
        );
      }
      user.photoUrl = photo.url;
    }

    user.firstName = (body.firstName as string).trim();
    user.lastName = (body.lastName as string).trim();
    user.department = { id: department.id, name: department.name };
    user.district = { id: district.id, name: district.name };
    user.campus = { id: campus.id, name: campus.name, address: campus.address };
    if (!user.roles.includes("PASSENGER")) {
      user.roles.push("PASSENGER");
    }
    user.activeMode ??= "PASSENGER";
    user.status = "ACTIVE";
    saveDb();

    return HttpResponse.json({ message: "Perfil completado correctamente" });
  }),

  http.post(api("/auth/login"), async ({ request }) => {
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }

    const email = normalizeEmail(body.email);
    const errors: FieldError[] = [];
    checkEmail(email, errors);
    if (isBlank(body.password)) {
      errors.push({ field: "password", message: "La contraseña es obligatoria" });
    }
    if (errors.length) {
      return validationError(errors);
    }

    const user = db.users.find((item) => item.email === email);
    if (!user || user.password !== body.password) {
      return apiError(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos");
    }
    if (user.status === "BLOCKED") {
      return apiError(
        403,
        "ACCOUNT_BLOCKED",
        "Tu cuenta está bloqueada. Comunícate con soporte.",
      );
    }

    return HttpResponse.json({
      ...issueToken(user.id, "PRE_AUTH"),
      otp: sendOtp(user.id),
    });
  }),

  http.post(api("/auth/verify-code"), async ({ request }) => {
    const user = authenticate(request, ["PRE_AUTH"]);
    if (user instanceof Response) {
      return user;
    }
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }
    if (typeof body.code !== "string" || !/^\d{6}$/.test(body.code)) {
      return validationError([
        { field: "code", message: "El código debe tener 6 dígitos" },
      ]);
    }

    const otp = db.otps[user.id];
    if (!otp || otp.expiresAt <= Date.now()) {
      return apiError(400, "OTP_EXPIRED", "El código expiró. Solicita uno nuevo.");
    }

    if (otp.attemptsLeft > 0 && otp.code === body.code) {
      delete db.otps[user.id];
      saveDb();
      return HttpResponse.json({
        ...issueToken(user.id, "SESSION"),
        user: toSessionUser(user),
      });
    }

    otp.attemptsLeft = Math.max(0, otp.attemptsLeft - 1);
    saveDb();
    if (otp.attemptsLeft === 0) {
      return apiError(
        429,
        "OTP_ATTEMPTS_EXCEEDED",
        "Agotaste los intentos. Solicita un nuevo código.",
      );
    }
    return apiError(
      400,
      "OTP_INVALID",
      otp.attemptsLeft === 1
        ? "Código inválido. Te queda 1 intento."
        : `Código inválido. Te quedan ${otp.attemptsLeft} intentos.`,
      { attemptsLeft: otp.attemptsLeft },
    );
  }),

  http.post(api("/auth/resend-code"), ({ request }) => {
    const user = authenticate(request, ["PRE_AUTH"]);
    if (user instanceof Response) {
      return user;
    }

    const otp = db.otps[user.id];
    if (otp && otp.resendAt > Date.now()) {
      const retryAfter = Math.ceil((otp.resendAt - Date.now()) / 1000);
      return apiError(
        429,
        "OTP_RESEND_TOO_SOON",
        `Podrás reenviar el código en ${retryAfter} ${retryAfter === 1 ? "segundo" : "segundos"}`,
        { retryAfter },
      );
    }

    return HttpResponse.json({
      message: "Código reenviado correctamente",
      otp: sendOtp(user.id),
    });
  }),

  http.post(api("/auth/logout"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    return HttpResponse.json({ message: "Sesión cerrada correctamente" });
  }),
];
