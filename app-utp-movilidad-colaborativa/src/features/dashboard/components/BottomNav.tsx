import type { ReactNode } from "react";
import RideIcon from "@/assets/images/icons/ride.svg?react";
import HistoryIcon from "@/assets/images/icons/history.svg?react";
import WalletIcon from "@/assets/images/icons/wallet.svg?react";
import ProfileIcon from "@/assets/images/icons/profile.svg?react";

type NavItem = {
  id: string;
  label: string;
  active?: boolean;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    id: "ride",
    label: "Viaje",
    active: true,
    icon: (
      <RideIcon className="h-6 w-6" />
    ),
  },
  {
    id: "history",
    label: "Historial",
    icon: (
      <HistoryIcon className="h-6 w-6" />
    ),
  },
  {
    id: "wallet",
    label: "Billetera",
    icon: (
      <WalletIcon className="h-6 w-6" />
    ),
  },
  {
    id: "profile",
    label: "Perfil",
    icon: (
      <ProfileIcon className="h-6 w-6" />
    ),
  },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`bottom-nav-item ${item.active ? "bottom-nav-item-active" : ""}`}
          aria-current={item.active ? "page" : undefined}
        >
          {item.icon}
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
