import { http, HttpResponse } from "msw";
import {
  db,
  saveDb,
  syncDriverRides,
  type DocumentType,
  type MockUser,
  type Role,
} from "@/mocks/db";
import {
  checkAssistance,
  DNI,
  api,
  apiError,
  authenticate,
  checkPersonName,
  findOwnFile,
  invalidJson,
  isBlank,
  isObjectId,
  readBody,
  validationError,
  type FieldError,
} from "@/mocks/http";

/** Perfil del contrato: el usuario sin la contraseña. */
// `cancellationBlock` (RN-30): el mock no registra cancelaciones, así que nunca hay bloqueo.
// El saldo no es parte del perfil: se consulta en `GET /wallet`.
const toUserProfile = (user: MockUser) => {
  const { password, credits, heldCredits, ...profile } = user;
  return {
    ...profile,
    mobilityAssistance: user.mobilityAssistance ?? null,
    cancellationBlock: null,
    tripInProgress: tripInProgress(user),
  };
};

/**
 * RN-48: el viaje `IN_PROGRESS` que conduce el usuario o, si no, aquel en el que viaja con
 * su reserva `IN_RIDE`. Mientras exista no puede cambiar de modo.
 */
function tripInProgress(user: MockUser) {
  let role: Role = "DRIVER";
  let ride = db.rides.find((r) => r.driver.id === user.id && r.status === "IN_PROGRESS");
  if (!ride) {
    const booking = db.reservations.find(
      (r) => r.passengerId === user.id && r.status === "IN_RIDE",
    );
    ride = booking ? db.rides.find((r) => r.id === booking.rideId) : undefined;
    role = "PASSENGER";
  }
  if (!ride) {
    return null;
  }
  return {
    rideId: ride.id,
    role,
    origin: ride.origin.label,
    destination: ride.destination.label,
    startedAt: ride.startedAt ?? ride.departureTime,
    driver: { name: ride.driver.name, photoUrl: ride.driver.photoUrl },
    vehicle: { brand: ride.vehicle.brand, model: ride.vehicle.model, color: ride.vehicle.color },
  };
}

/** Mismas reglas que `PerfilService.validarCambioDeModo`; `null` si el cambio procede. */
function modeChangeError(user: MockUser, mode: Role) {
  if (mode === "DRIVER" && (!user.vehicle || user.vehicle.status === "INACTIVE")) {
    return apiError(
      403,
      "VEHICLE_REQUIRED",
      "Registra un vehículo para usar la modalidad de conductor",
    );
  }
  if (mode !== user.activeMode && tripInProgress(user)) {
    return apiError(
      409,
      "TRIP_IN_PROGRESS",
      "No puedes cambiar de modo durante un viaje en curso",
    );
  }
  return null;
}

export const userHandlers = [
  http.get(api("/users/me"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    return HttpResponse.json(toUserProfile(user));
  }),

  http.put(api("/users/me"), async ({ request }) => {
    const user = authenticate(request);
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

    if (isBlank(body.phone)) {
      errors.push({ field: "phone", message: "El teléfono es obligatorio" });
    } else if (!/^\+51\d{9}$/.test(body.phone as string)) {
      errors.push({
        field: "phone",
        message: "El teléfono debe tener el formato +51 seguido de 9 dígitos",
      });
    }

    // La modalidad es opcional: P15 ya no la muestra (RN-48); si no llega, se conserva.
    if (body.activeMode != null && body.activeMode !== "PASSENGER" && body.activeMode !== "DRIVER") {
      errors.push({ field: "activeMode", message: "La modalidad no es válida" });
    }

    // RN-17: reemplaza la asistencia guardada; `null` la quita.
    const assistance = checkAssistance(body.mobilityAssistance, errors);

    if (body.photoFileId != null && !isObjectId(body.photoFileId)) {
      errors.push({ field: "photoFileId", message: "La foto de perfil no es válida" });
    }

    // El documento se registra una sola vez: solo se valida mientras el usuario no tenga
    // uno. Después se ignora, igual que el correo.
    const registersDocument = !user.documentNumber;
    if (registersDocument) {
      const isDni = body.documentType === "DNI";
      if (body.documentType == null) {
        errors.push({
          field: "documentType",
          message: "El tipo de documento es obligatorio",
        });
      } else if (!isDni && body.documentType !== "CE") {
        errors.push({
          field: "documentType",
          message: "El tipo de documento no es válido",
        });
      }

      if (isBlank(body.documentNumber)) {
        errors.push({
          field: "documentNumber",
          message: "El número de documento es obligatorio",
        });
      } else if (isDni && !DNI.test(body.documentNumber as string)) {
        errors.push({
          field: "documentNumber",
          message: "El DNI debe tener 8 dígitos",
        });
      } else if (
        body.documentType === "CE" &&
        !/^[A-Za-z0-9]{8,12}$/.test(body.documentNumber as string)
      ) {
        errors.push({
          field: "documentNumber",
          message: "El carné de extranjería debe tener entre 8 y 12 letras o números",
        });
      }
    }

    if (errors.length) {
      return validationError(errors);
    }

    if (user.status === "PROFILE_PENDING") {
      return apiError(
        409,
        "PROFILE_INCOMPLETE",
        "Completa tu perfil antes de actualizar tus datos",
      );
    }
    const activeMode = (body.activeMode as Role | undefined) ?? user.activeMode;
    const modeError = activeMode ? modeChangeError(user, activeMode) : null;
    if (modeError) {
      return modeError;
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
    user.phone = body.phone as string;
    user.activeMode = activeMode;
    user.mobilityAssistance = assistance;
    if (registersDocument) {
      user.documentType = body.documentType as DocumentType;
      user.documentNumber = body.documentNumber as string;
    }
    syncDriverRides(user);
    saveDb();

    return HttpResponse.json(toUserProfile(user));
  }),

  // Cambio de modo confirmado en el modal del perfil (RF-14, RN-48).
  http.patch(api("/users/me/mode"), async ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }
    if (body.activeMode == null) {
      return validationError([{ field: "activeMode", message: "La modalidad es obligatoria" }]);
    }
    if (body.activeMode !== "PASSENGER" && body.activeMode !== "DRIVER") {
      return validationError([{ field: "activeMode", message: "La modalidad no es válida" }]);
    }
    if (user.status === "PROFILE_PENDING") {
      return apiError(
        409,
        "PROFILE_INCOMPLETE",
        "Completa tu perfil antes de actualizar tus datos",
      );
    }
    if (body.activeMode !== user.activeMode) {
      const modeError = modeChangeError(user, body.activeMode);
      if (modeError) {
        return modeError;
      }
      user.activeMode = body.activeMode;
      saveDb();
    }
    return HttpResponse.json(toUserProfile(user));
  }),
];
