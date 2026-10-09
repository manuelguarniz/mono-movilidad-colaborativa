import { http, HttpResponse } from "msw";
import {
  db,
  saveDb,
  syncDriverRides,
  toLima,
  type MockUser,
  type Vehicle,
  type VehicleType,
} from "@/mocks/db";
import {
  DNI,
  api,
  apiError,
  authenticate,
  findOwnFile,
  invalidJson,
  isBlank,
  isObjectId,
  readBody,
  validationError,
  type FieldError,
} from "@/mocks/http";

const VEHICLE_TYPES = ["SEDAN", "HATCHBACK", "SUV", "VAN", "MOTORCYCLE"];
const PLATE = /^[A-Z0-9]{3}-?[A-Z0-9]{3,4}$/;

/** La placa se guarda en mayúsculas y con guion (`abc123` queda `ABC-123`). */
function normalizePlate(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  const plate = value.trim().toUpperCase();
  return PLATE.test(plate) && plate[3] !== "-"
    ? `${plate.slice(0, 3)}-${plate.slice(3)}`
    : plate;
}

function checkText(
  value: unknown,
  field: string,
  max: number,
  required: string,
  tooLong: string,
  errors: FieldError[],
) {
  if (isBlank(value)) {
    errors.push({ field, message: required });
  } else if ((value as string).trim().length > max) {
    errors.push({ field, message: tooLong });
  }
}

/** Validación de formato compartida por `POST /vehicles` y `PUT /vehicles/me`. */
function validateVehicle(
  body: Record<string, unknown>,
  plate: string,
  ownerDniRequired: boolean,
) {
  const errors: FieldError[] = [];

  if (!plate) {
    errors.push({ field: "plate", message: "La placa es obligatoria" });
  } else if (!PLATE.test(plate)) {
    errors.push({ field: "plate", message: "La placa debe tener el formato ABC-123" });
  }

  if (body.type == null) {
    errors.push({ field: "type", message: "El tipo de vehículo es obligatorio" });
  } else if (!VEHICLE_TYPES.includes(body.type as string)) {
    errors.push({ field: "type", message: "El tipo de vehículo no es válido" });
  }

  checkText(
    body.brand,
    "brand",
    40,
    "La marca es obligatoria",
    "La marca debe tener como máximo 40 caracteres",
    errors,
  );
  checkText(
    body.model,
    "model",
    40,
    "El modelo es obligatorio",
    "El modelo debe tener como máximo 40 caracteres",
    errors,
  );
  checkText(
    body.color,
    "color",
    30,
    "El color es obligatorio",
    "El color debe tener como máximo 30 caracteres",
    errors,
  );

  const currentYear = toLima(new Date()).getUTCFullYear();
  if (body.year == null) {
    errors.push({ field: "year", message: "El año de fabricación es obligatorio" });
  } else if (
    !Number.isInteger(body.year) ||
    (body.year as number) < 2000 ||
    (body.year as number) > currentYear
  ) {
    errors.push({
      field: "year",
      message: "El año de fabricación debe estar entre 2000 y el año actual",
    });
  }

  if (body.seats == null) {
    errors.push({ field: "seats", message: "Las plazas son obligatorias" });
  } else if (
    !Number.isInteger(body.seats) ||
    (body.seats as number) < 1 ||
    (body.seats as number) > 10
  ) {
    errors.push({ field: "seats", message: "Las plazas deben estar entre 1 y 10" });
  }

  if (body.ownerDni == null || body.ownerDni === "") {
    if (ownerDniRequired) {
      errors.push({
        field: "ownerDni",
        message: "El DNI del propietario es obligatorio",
      });
    }
  } else if (typeof body.ownerDni !== "string" || !DNI.test(body.ownerDni)) {
    errors.push({ field: "ownerDni", message: "El DNI debe tener 8 dígitos" });
  }

  if (body.acceptedTerms !== true) {
    errors.push({
      field: "acceptedTerms",
      message: "Debes aceptar los términos y condiciones",
    });
  }

  if (body.photoFileId != null && !isObjectId(body.photoFileId)) {
    errors.push({ field: "photoFileId", message: "La foto del vehículo no es válida" });
  }

  return errors;
}

const plateTaken = (plate: string, user: MockUser) =>
  db.users.some((item) => item.id !== user.id && item.vehicle?.plate === plate);

/** Guarda el vehículo dentro del usuario y le agrega el rol de conductor. */
function registerVehicle(
  user: MockUser,
  body: Record<string, unknown>,
  plate: string,
  ownerDni: string | null,
  photoUrl: string | null,
) {
  user.vehicle = {
    plate,
    type: body.type as VehicleType,
    brand: (body.brand as string).trim(),
    model: (body.model as string).trim(),
    color: (body.color as string).trim(),
    year: body.year as number,
    seats: body.seats as number,
    ownerDni,
    isOwner: body.isOwner === true,
    status: "ACTIVE",
    photoUrl,
    registeredAt: new Date().toISOString(),
  };
  if (!user.roles.includes("DRIVER")) {
    user.roles.push("DRIVER");
  }
  saveDb();
  return user.vehicle;
}

/** URL de la foto enviada, `null` si no se envió, o el error si no es del usuario. */
function resolvePhoto(body: Record<string, unknown>, user: MockUser) {
  if (body.photoFileId == null) {
    return null;
  }
  const photo = findOwnFile(body.photoFileId as string, user, "VEHICLE_PHOTO");
  return photo
    ? photo.url
    : apiError(
        400,
        "INVALID_FILE_REFERENCE",
        "La foto del vehículo no existe o no te pertenece",
      );
}

const profileIncomplete = () =>
  apiError(
    409,
    "PROFILE_INCOMPLETE",
    "Completa tu perfil antes de registrar tu vehículo",
  );

const plateAlreadyRegistered = () =>
  apiError(409, "PLATE_ALREADY_REGISTERED", "La placa ya está registrada");

export const vehicleHandlers = [
  http.post(api("/vehicles"), async ({ request }) => {
    const user = authenticate(request, ["REGISTRATION", "SESSION"]);
    if (user instanceof Response) {
      return user;
    }
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }

    const plate = normalizePlate(body.plate);
    const errors = validateVehicle(body, plate, true);
    if (errors.length) {
      return validationError(errors);
    }

    if (user.status === "PROFILE_PENDING") {
      return profileIncomplete();
    }
    if (user.vehicle) {
      return apiError(
        409,
        "VEHICLE_ALREADY_REGISTERED",
        "Ya tienes un vehículo registrado",
      );
    }
    if (plateTaken(plate, user)) {
      return plateAlreadyRegistered();
    }
    const photoUrl = resolvePhoto(body, user);
    if (photoUrl instanceof Response) {
      return photoUrl;
    }

    const vehicle = registerVehicle(user, body, plate, body.ownerDni as string, photoUrl);
    return HttpResponse.json(vehicle, { status: 201 });
  }),

  http.get(api("/vehicles/me"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    if (!user.vehicle) {
      return apiError(404, "VEHICLE_NOT_FOUND", "No tienes un vehículo registrado");
    }
    return HttpResponse.json(user.vehicle);
  }),

  http.put(api("/vehicles/me"), async ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const body = await readBody(request);
    if (!body) {
      return invalidJson();
    }

    const plate = normalizePlate(body.plate);
    const errors = validateVehicle(body, plate, false);
    if (errors.length) {
      return validationError(errors);
    }

    if (!user.vehicle && user.status === "PROFILE_PENDING") {
      return profileIncomplete();
    }
    if (plateTaken(plate, user)) {
      return plateAlreadyRegistered();
    }
    const photoUrl = resolvePhoto(body, user);
    if (photoUrl instanceof Response) {
      return photoUrl;
    }

    // Sin vehículo, la actualización lo registra. «Actualizar vehículo» no pide el DNI del
    // propietario: si no llega, se usa el DNI del usuario, si ya lo registró.
    if (!user.vehicle) {
      const ownDni = user.documentType === "DNI" ? user.documentNumber : null;
      const ownerDni = (body.ownerDni as string | undefined) || ownDni;
      return HttpResponse.json(registerVehicle(user, body, plate, ownerDni, photoUrl));
    }

    const updated: Vehicle = {
      ...user.vehicle,
      plate,
      type: body.type as VehicleType,
      brand: (body.brand as string).trim(),
      model: (body.model as string).trim(),
      color: (body.color as string).trim(),
      year: body.year as number,
      seats: body.seats as number,
      isOwner:
        typeof body.isOwner === "boolean" ? body.isOwner : user.vehicle.isOwner,
      photoUrl: photoUrl ?? user.vehicle.photoUrl,
    };
    user.vehicle = updated;
    syncDriverRides(user);
    saveDb();

    return HttpResponse.json(updated);
  }),
];
