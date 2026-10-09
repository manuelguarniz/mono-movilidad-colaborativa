import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";
import { db, saveDb, type FilePurpose } from "@/mocks/db";
import { api, apiError, authenticate, validationError, type FieldError } from "@/mocks/http";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const FOLDERS: Record<FilePurpose, string> = {
  PROFILE_PHOTO: "perfiles",
  VEHICLE_PHOTO: "vehiculos",
};
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

// El backend todavía no implementa POST /files; el mock sigue el contrato para que el
// frontend pueda construir la carga de fotos. La imagen no se guarda: la `url` que se
// devuelve tiene el formato del contrato, pero no sirve ningún archivo.
export const fileHandlers = [
  http.post(api("/files"), async ({ request }) => {
    const user = authenticate(request, ["REGISTRATION", "SESSION"]);
    if (user instanceof Response) {
      return user;
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return validationError([{ field: "file", message: "La imagen es obligatoria" }]);
    }

    const file = form.get("file");
    const purpose = form.get("purpose");
    const errors: FieldError[] = [];
    if (!(file instanceof File)) {
      errors.push({ field: "file", message: "La imagen es obligatoria" });
    }
    if (typeof purpose !== "string" || !(purpose in FOLDERS)) {
      errors.push({ field: "purpose", message: "El propósito no es válido" });
    }
    if (errors.length || !(file instanceof File)) {
      return validationError(errors);
    }

    if (file.size > MAX_SIZE_BYTES) {
      return apiError(413, "FILE_TOO_LARGE", "La imagen no puede superar los 5 MB");
    }
    const extension = EXTENSIONS[file.type];
    if (!extension) {
      return apiError(
        415,
        "UNSUPPORTED_FILE_TYPE",
        "Solo se admiten imágenes JPG o PNG",
      );
    }

    const id = faker.database.mongodbObjectId();
    const uploaded = {
      id,
      url: `/uploads/${FOLDERS[purpose as FilePurpose]}/${id}.${extension}`,
      purpose: purpose as FilePurpose,
      mimeType: file.type,
      sizeBytes: file.size,
    };
    db.files.push({ ...uploaded, ownerId: user.id });
    saveDb();

    return HttpResponse.json(uploaded, { status: 201 });
  }),
];
