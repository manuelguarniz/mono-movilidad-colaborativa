/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  // "false" desactiva MSW y apunta al backend real (http://localhost:8080/api).
  readonly VITE_USE_MOCKS?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_COOKIE_NAME?: string;
  readonly VITE_AUTH_VERIFIED_COOKIE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
