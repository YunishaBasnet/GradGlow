import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Moon,
  Phone,
  Sun,
  User,
} from "lucide-react";

import StudentBottomNav from "../../components/StudentBottomNav";
import { useTheme } from "../../context/ThemeContext";
import { getAuthSession } from "../../utils/authSession";
import "../../styles/personalinfo.css";

const DEFAULT_STUDENT = {
  fullName: "Emma Wilson",
  id: "100001",
  email: "ewilli1262@northbridgeuniversity.edu",
  phone: "(555) 123-4567",
  address: "123 Campus Drive, University City, ST 12345",
  major: "Computer Science",
  minor: "Mathematics",
  dob: "01/15/2003",
  enrollmentDate: "09/01/2022",
  expectedGrad: "05/15/2026",
};

export default function StudentPersonalInfo() {
  const navigate = useNavigate();
  const themeContext = useTheme();

  const dark = themeContext.dark ?? themeContext.darkMode ?? false;
  const toggleTheme =
    themeContext.toggleTheme ??
    themeContext.toggleDarkMode ??
    (() => {});

  const student = useMemo(() => {
    const session = getAuthSession();

    return {
      ...DEFAULT_STUDENT,
      fullName:
        session?.name ||
        session?.student?.name ||
        session?.profile?.name ||
        DEFAULT_STUDENT.fullName,
      id:
        session?.studentId ||
        session?.student_id ||
        session?.userId ||
        session?.student?.id ||
        session?.profile?.student_id ||
        DEFAULT_STUDENT.id,
      email:
        session?.email ||
        session?.student?.email ||
        session?.profile?.email ||
        DEFAULT_STUDENT.email,
    };
  }, []);

  return (
    <div className={dark ? "piPage piPage--dark" : "piPage"}>
      <header className="piHeader">
        <div>
          <h1>Personal Information</h1>
          <p>View your personal and academic details</p>
        </div>

        <div className="piHeaderActions">
          <button
            type="button"
            className="piBackBtn"
            onClick={() => navigate("/student/dashboard")}
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            className="piThemeBtn"
            aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
            title={`Switch to ${dark ? "light" : "dark"} mode`}
            onClick={toggleTheme}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="piGrid">
        <InfoCard
          title="Contact Information"
          icon={<User size={16} />}
          items={[
            {
              label: "Full Name",
              value: student.fullName,
              icon: <User size={16} />,
            },
            {
              label: "Email",
              value: student.email,
              icon: <Mail size={16} />,
            },
            {
              label: "Phone",
              value: student.phone,
              icon: <Phone size={16} />,
            },
            {
              label: "Address",
              value: student.address,
              icon: <MapPin size={16} />,
            },
          ]}
        />

        <InfoCard
          title="Academic Information"
          icon={<GraduationCap size={16} />}
          items={[
            {
              label: "Student ID",
              value: student.id,
              icon: <IdCard size={16} />,
            },
            {
              label: "Major",
              value: student.major,
              icon: <BookOpen size={16} />,
            },
            {
              label: "Minor",
              value: student.minor,
              icon: <BookOpen size={16} />,
            },
            {
              label: "Date of Birth",
              value: student.dob,
              icon: <CalendarDays size={16} />,
            },
            {
              label: "Enrollment Date",
              value: student.enrollmentDate,
              icon: <CalendarDays size={16} />,
            },
            {
              label: "Expected Graduation",
              value: student.expectedGrad,
              icon: <CalendarDays size={16} />,
            },
          ]}
        />
      </main>

      <StudentBottomNav />
    </div>
  );
}

function InfoCard({ title, icon, items }) {
  return (
    <section className="piCard">
      <div className="piCardTitle">
        <span className="piTitleIcon" aria-hidden="true">
          {icon}
        </span>
        <h2>{title}</h2>
      </div>

      {items.map((item) => (
        <InfoItem
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
        />
      ))}
    </section>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <div className="piItem">
      <div className="piLabelRow">
        <span className="piItemIcon" aria-hidden="true">
          {icon}
        </span>
        <span>{label}</span>
      </div>

      <div className="piValue">{value || "Not available"}</div>
    </div>
  );
}