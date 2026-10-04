import { NavLink } from "react-router-dom";
import {
  UserRound,
  FileText,
  LifeBuoy,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { logoutAndReload } from "../utils/logout";
import "../styles/studentBottomNav.css";

const items = [
  {
    to: "/student/personal-info",
    label: "Personal Info",
    Icon: UserRound,
  },
  {
    to: "/student/action-plan",
    label: "Personalized Action Plan",
    Icon: ClipboardList,
  },
  {
    to: "/student/requests",
    label: "My Requests",
    Icon: FileText,
  },
  {
    to: "/student/help-support",
    label: "Help/Support",
    Icon: LifeBuoy,
  },
];

export default function StudentBottomNav() {
  return (
    <nav className="studentBottomNav">
      {items.map((item) => {
        const ItemIcon = item.Icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `studentNavItem ${isActive ? "active" : ""}`
            }
          >
            <ItemIcon size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <button
        type="button"
        className="studentNavItem studentNavItemButton"
        onClick={logoutAndReload}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </nav>
  );
}