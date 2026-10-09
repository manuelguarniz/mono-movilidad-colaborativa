import { apiClient } from "@/shared/api/apiClient";

export type CatalogItem = {
  id: string;
  name: string;
};

type CatalogList = { data: CatalogItem[] };

// Los catálogos son públicos. El interceptor de `apiClient` ya devuelve el cuerpo.
const getCatalog = async (path: string, params?: Record<string, string>) => {
  const response = await apiClient.get<unknown, CatalogList>(path, { params });
  return response.data;
};

export const catalogService = {
  getDepartments: () => getCatalog("/catalogs/departments"),
  getDistricts: (departmentId: string) =>
    getCatalog("/catalogs/districts", { departmentId }),
  getCampuses: (districtId: string) =>
    getCatalog("/catalogs/campuses", { districtId }),
};
