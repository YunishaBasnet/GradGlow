import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  User,
  MessageSquare,
  CalendarDays,
  Upload,
  Settings,
  CircleHelp,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutAndReload } from "../utils/logout";

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="headerMenu" ref={menuRef}>
      <button
        type="button"
        className="advisorIconBtn"
        aria-label="Open menu"
        title="Open menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="headerMenuDropdown">
          <button type="button" className="headerMenuItem" onClick={() => handleNavigate("/advisor/profile")}>
            <User size={16} />
            <span>Profile</span>
          </button>

          <button type="button" className="headerMenuItem" onClick={() => handleNavigate("/advisor/messages")}>
            <MessageSquare size={16} />
            <span>Messages</span>
          </button>

          <button type="button" className="headerMenuItem" onClick={() => handleNavigate("/advisor/appointments")}>
            <CalendarDays size={16} />
            <span>Appointments</span>
          </button>

          <button type="button" className="headerMenuItem" onClick={() => handleNavigate("/upload")}>
            <Upload size={16} />
            <span>Upload Dataset</span>
          </button>
           <button type="button" className="headerMenuItem" onClick={() => handleNavigate("/advisor/settings")}>
            <Settings size={16} />
            <span>Settings</span>
          </button>

          <button type="button" className="headerMenuItem" onClick={() => handleNavigate("/advisor/help")}>
            <CircleHelp size={16} />
            <span>Help</span>
          </button>
          
          <button type="button" className="headerMenuItem headerMenuItem--danger" onClick={logoutAndReload}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
