import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useNavBadges } from "@/features/dashboard/hooks/useNavBadges";
import CalendarIcon from "@/assets/images/icons/calendar.svg?react";
import HomeIcon from "@/assets/images/icons/home.svg?react";
import PlusIcon from "@/assets/images/icons/plus.svg?react";
import RideIcon from "@/assets/images/icons/ride.svg?react";
import WalletIcon from "@/assets/images/icons/wallet.svg?react";
import ProfileIcon from "@/assets/images/icons/profile.svg?react";

type NavItem = {
  id: string;
  label: string;
  to: string;
  icon: ReactNode;
  // Otras rutas que también marcan la pestaña como activa (p. ej., Historial dentro de Perfil).
  alsoActiveOn?: string[];
  badge?: { label: string } | null;
};

const iconClass = "h-6 w-6";

function NavTab({ item }: { item: NavItem }) {
  const { pathname } = useLocation();
  const activeByAlias = item.alsoActiveOn?.some((path) => pathname.startsWith(path)) ?? false;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `bottom-nav-item ${isActive || activeByAlias ? "bottom-nav-item-active" : ""}`
      }
      aria-label={item.badge ? `${item.label}, ${item.badge.label}` : undefined}
    >
      <span className="bottom-nav-icon">
        {item.icon}
        {item.badge ? <span className="bottom-nav-badge" aria-hidden="true" /> : null}
      </span>
      <span className="bottom-nav-label">{item.label}</span>
    </NavLink>
  );
}

/**
 * Menú inferior según el modo activo (RN-48).
 * - Pasajero: Viajes · Mis viajes · Billetera · Perfil.
 * - Conductor: Inicio · Mis viajes · [Publicar] · Billetera · Perfil.
 * El Historial (P19) se abre desde el Perfil.
 */
export function BottomNav() {
  const badges = useNavBadges();

  const myRidesBadge = badges.myRides
    ? { label: badges.isDriver ? "tienes viajes activos" : "tienes una reserva activa" }
    : null;
  const profileBadge = badges.profile
    ? {
        label:
          badges.pendingRatings > 0
            ? "tienes calificaciones pendientes"
            : "tu SOAT requiere atención",
      }
    : null;

  const home: NavItem = badges.isDriver
    ? { id: "home", label: "Inicio", to: "/dashboard", icon: <HomeIcon className={iconClass} /> }
    : { id: "home", label: "Viajes", to: "/dashboard", icon: <RideIcon className={iconClass} /> };
  const myRides: NavItem = {
    id: "my-rides",
    label: "Mis viajes",
    to: "/mis-viajes",
    icon: <CalendarIcon className={iconClass} />,
    badge: myRidesBadge,
  };
  const wallet: NavItem = {
    id: "wallet",
    label: "Billetera",
    to: "/billetera",
    icon: <WalletIcon className={iconClass} />,
  };
  const profile: NavItem = {
    id: "profile",
    label: "Perfil",
    to: "/perfil",
    icon: <ProfileIcon className={iconClass} />,
    alsoActiveOn: ["/historial"],
    badge: profileBadge,
  };

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <NavTab item={home} />
      <NavTab item={myRides} />
      {badges.isDriver ? (
        <Link to="/viajes/publicar" className="bottom-nav-publish" aria-label="Publicar viaje">
          <span className="bottom-nav-publish-button">
            <PlusIcon className="h-7 w-7" aria-hidden="true" />
          </span>
          <span className="bottom-nav-label">Publicar</span>
        </Link>
      ) : null}
      <NavTab item={wallet} />
      <NavTab item={profile} />
    </nav>
  );
}
