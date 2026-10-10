import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { SESSION_EXPIRED_EVENT, session } from "@/shared/auth/session";

/**
 * Vuelve al login cuando se pierde la sesión: si la API rechaza el token, o si al volver
 * a la pestaña la cookie de sesión ya venció. No dibuja nada.
 */
export function SessionExpiredRedirect() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const goToLogin = () => {
      // Los datos en caché son del usuario anterior.
      queryClient.clear();
      navigate("/auth/login", { replace: true, state: { sessionExpired: true } });
    };

    const checkSession = () => {
      const isPublicRoute = window.location.pathname.startsWith("/auth/");

      if (
        document.visibilityState === "visible" &&
        !isPublicRoute &&
        !session.isAuthenticated()
      ) {
        goToLogin();
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, goToLogin);
    document.addEventListener("visibilitychange", checkSession);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, goToLogin);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [navigate, queryClient]);

  return null;
}
