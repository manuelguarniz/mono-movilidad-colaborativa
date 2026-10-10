import { http, HttpResponse } from "msw";
import { CAMPUSES, DEPARTMENTS, DISTRICTS } from "@/mocks/db";
import { api, isObjectId, validationError } from "@/mocks/http";

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, "es");

/** Parámetro de consulta obligatorio con forma de ObjectId, o su error de validación. */
function requireIdParam(request: Request, name: string) {
  const value = new URL(request.url).searchParams.get(name);
  if (value === null) {
    return validationError([
      { field: name, message: `El parámetro ${name} es obligatorio` },
    ]);
  }
  if (!isObjectId(value)) {
    return validationError([
      { field: name, message: `El parámetro ${name} no es válido` },
    ]);
  }
  return value;
}

// Los catálogos son públicos: no piden token.
export const catalogHandlers = [
  http.get(api("/catalogs/departments"), () =>
    HttpResponse.json({ data: [...DEPARTMENTS].sort(byName) }),
  ),

  http.get(api("/catalogs/districts"), ({ request }) => {
    const departmentId = requireIdParam(request, "departmentId");
    if (departmentId instanceof Response) {
      return departmentId;
    }
    return HttpResponse.json({
      data: DISTRICTS.filter((item) => item.departmentId === departmentId)
        .map(({ id, code, name }) => ({ id, code, name }))
        .sort(byName),
    });
  }),

  http.get(api("/catalogs/campuses"), ({ request }) => {
    const districtId = requireIdParam(request, "districtId");
    if (districtId instanceof Response) {
      return districtId;
    }
    return HttpResponse.json({
      data: CAMPUSES.filter((item) => item.districtId === districtId)
        .map(({ id, name, address, location }) => ({ id, name, address, location }))
        .sort(byName),
    });
  }),
];
