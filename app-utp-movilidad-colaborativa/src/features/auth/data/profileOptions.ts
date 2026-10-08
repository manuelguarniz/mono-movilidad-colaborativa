export const DEPARTMENTS = [
  { value: "lima", label: "Lima" },
  { value: "arequipa", label: "Arequipa" },
  { value: "cusco", label: "Cusco" },
];

export const DISTRICTS: Record<string, Array<{ value: string; label: string }>> = {
  lima: [
    { value: "miraflores", label: "Miraflores" },
    { value: "san-isidro", label: "San Isidro" },
    { value: "surco", label: "Santiago de Surco" },
  ],
  arequipa: [
    { value: "cercado", label: "Cercado" },
    { value: "cayma", label: "Cayma" },
  ],
  cusco: [
    { value: "cusco", label: "Cusco" },
    { value: "wanchaq", label: "Wanchaq" },
  ],
};

export const CAMPUSES = [
  { value: "utp-lima-centro", label: "UTP Lima Centro" },
  { value: "utp-lima-norte", label: "UTP Lima Norte" },
  { value: "utp-arequipa", label: "UTP Arequipa" },
  { value: "utp-trujillo", label: "UTP Trujillo" },
];
