import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import RideIcon from "@/assets/images/icons/ride.svg?react";
import HistoryIcon from "@/assets/images/icons/history.svg?react";
import WalletIcon from "@/assets/images/icons/wallet.svg?react";
import ProfileIcon from "@/assets/images/icons/profile.svg?react";

type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  // Sin ruta: la sección queda para un próximo alcance (historial y billetera).
  to?: string;
};

const navItems: NavItem[] = [
  {
    id: "ride",
    label: "Viaje",
    to: "/dashboard",
    icon: <RideIcon className="h-6 w-6" />,
  },
  {
    id: "history",
    label: "Historial",
    icon: <HistoryIcon className="h-6 w-6" />,
  },
  {
    id: "wallet",
    label: "Billetera",
    icon: <WalletIcon className="h-6 w-6" />,
  },
  {
    id: "profile",
    label: "Perfil",
    to: "/perfil",
    icon: <ProfileIcon className="h-6 w-6" />,
  },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {navItems.map((item) =>
        item.to ? (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? "bottom-nav-item-active" : ""}`
            }
          >
            {item.icon}
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ) : (
          <button
            key={item.id}
            type="button"
            className="bottom-nav-item opacity-50"
            disabled
            aria-label={`${item.label} (próximamente)`}
          >
            {item.icon}
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ),
      )}
    </nav>
  );
}
