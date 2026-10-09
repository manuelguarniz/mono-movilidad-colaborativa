import { http, HttpResponse } from "msw";
import {
  saveDb,
  syncDriverRides,
  type DocumentType,
  type MockUser,
  type Role,
} from "@/mocks/db";
import {
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
const toUserProfile = ({ password, ...profile }: MockUser) => profile;

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

    if (body.activeMode == null) {
      errors.push({ field: "activeMode", message: "La modalidad es obligatoria" });
    } else if (body.activeMode !== "PASSENGER" && body.activeMode !== "DRIVER") {
      errors.push({ field: "activeMode", message: "La modalidad no es válida" });
    }

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
    if (body.activeMode === "DRIVER" && !user.vehicle) {
      return apiError(
        403,
        "VEHICLE_REQUIRED",
        "Registra un vehículo para usar la modalidad de conductor",
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
    user.phone = body.phone as string;
    user.activeMode = body.activeMode as Role;
    if (registersDocument) {
      user.documentType = body.documentType as DocumentType;
      user.documentNumber = body.documentNumber as string;
    }
    syncDriverRides(user);
    saveDb();

    return HttpResponse.json(toUserProfile(user));
  }),
];
