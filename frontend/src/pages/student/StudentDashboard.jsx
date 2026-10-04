import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Calendar,
  GraduationCap,
  LineChart,
  MessageSquare,
  Moon,
  Phone,
  Sun,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import defaultAvatar from "../../assets/default-avatar.png";
import StudentBottomNav from "../../components/StudentBottomNav";
import { useTheme } from "../../context/ThemeContext";
import { getAuthSession } from "../../utils/authSession";
import "../../styles/dashboard.css";

const DEFAULT_STUDENT = {
  name: "Emma Wilson",
  id: "100001",
  term: "Spring 2026",
  role: "Computer Science Student",
  advisor: "Dr. Sarah Johnson",
  phone: "(555) 245-7788",
  riskLabel: "High",
  riskScore: 88,
  gpa: "2.1 / 4.0",
  attendance: "68%",
  eca: "2 hrs/week",
  completedAssignments: 61.4,
  overdueAssignments: 28.6,
  recommendation:
    "Immediate advisor outreach, weekly check-ins, tutoring support, and attendance monitoring.",
};

const COURSES = [
  {
    code: "CS101",
    name: "Introduction to Programming",
    risk: "High Risk",
  },
  {
    code: "CS201",
    name: "Database Systems",
    risk: "Medium Risk",
  },
  {
    code: "MATH210",
    name: "Discrete Mathematics",
    risk: "High Risk",
  },
  {
    code: "ENG110",
    name: "Academic Writing",
    risk: "On Track",
  },
];

const RISK_FACTORS = [
  "Low attendance percentage",
  "Frequent late submissions",
  "Reduced LMS engagement",
];

const QUICK_ACCESS_CONTENT = {
  "Course Materials": [
    "CS101 Programming Lab Guide",
    "CS201 Database Notes",
    "MATH210 Discrete Math Practice Set",
    "ENG110 Academic Writing Rubric",
  ],
  Credits: [
    "Completed Credits: 72",
    "Remaining Credits: 48",
    "Total Required: 120",
    "Progress: 60%",
  ],
  "Course Performance": [
    "CS101: High Risk - 89",
    "CS201: Medium Risk - 64",
    "MATH210: High Risk - 82",
    "ENG110: On Track - 22",
  ],
  "Study Groups": [
    "CS101 Lab Support Group - Friday 3 PM",
    "MATH210 Study Circle - Wednesday 5 PM",
    "CS201 Database Review - Monday 4 PM",
  ],
  Notifications: [
    "High Risk Alert: CS101 lab missing",
    "Advisor follow-up recommended",
    "MATH210 review session available",
    "Spring 2026 progress updated",
  ],
};

function clampPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, numericValue));
}

function getCourseRiskClass(risk) {
  if (risk.includes("High")) {
    return "pill pill--bad";
  }

  if (risk.includes("Medium")) {
    return "pill pill--warn";
  }

  return "pill pill--good";
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const themeContext = useTheme();

  const dark = themeContext.dark ?? themeContext.darkMode ?? false;
  const toggleTheme =
    themeContext.toggleTheme ??
    themeContext.toggleDarkMode ??
    (() => {});

  const [messageOpen, setMessageOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);

  const student = useMemo(() => {
    const session = getAuthSession();

    return {
      ...DEFAULT_STUDENT,
      name:
        session?.name ||
        session?.student?.name ||
        session?.profile?.name ||
        DEFAULT_STUDENT.name,
      id:
        session?.studentId ||
        session?.student_id ||
        session?.userId ||
        session?.student?.id ||
        session?.profile?.student_id ||
        DEFAULT_STUDENT.id,
    };
  }, []);

  const riskScore = clampPercentage(student.riskScore);

  return (
    <div className={dark ? "dash dash--dark" : "dash"}>
      <header className="dashTop">
        <div className="welcome">
          <h1 className="welcomeTitle">
            Welcome back,{" "}
            <span className="welcomeName">{student.name}</span>
          </h1>

          <p className="welcomeSub">
            Here&apos;s your academic overview for {student.term}
          </p>
        </div>

        <div className="termBox">
          <div className="termLabel">CURRENT TERM</div>
          <div className="termValue">{student.term}</div>
        </div>

        <button
          className="iconBtn"
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
          title={`Switch to ${dark ? "light" : "dark"} mode`}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <div className="dashDivider" />

      <div className="grid">
        <div className="colLeft">
          <Section title="Success Indicator">
            <div className="successRow">
              <div className="scoreBlock">
                <div className="scoreNum">{riskScore}</div>
                <div className="scoreSub">RISK SCORE</div>
              </div>

              <div className="riskPill">
                {student.riskLabel} Risk
              </div>
            </div>

            <div
              className="successBar"
              role="progressbar"
              aria-label="Academic risk score"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={riskScore}
            >
              <div
                className="successBarFill"
                style={{ width: `${riskScore}%` }}
              />
            </div>

            <div className="riskGuide">
              <div className="riskGuideTitle">
                AI Recommendation
              </div>

              <div className="riskGuideText">
                {student.recommendation}
              </div>
            </div>
          </Section>

          <Section title="Academic Performance">
            <div className="courseList">
              {COURSES.map((course) => (
                <button
                  key={course.code}
                  type="button"
                  className="courseCard"
                  onClick={() =>
                    navigate(`/student/course/${course.code}`)
                  }
                  aria-label={`Open ${course.code}: ${course.name}`}
                >
                  <div>
                    <div className="courseCode">{course.code}</div>
                    <div className="courseName">{course.name}</div>
                  </div>

                  <div className="courseRight">
                    <span className={getCourseRiskClass(course.risk)}>
                      {course.risk}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="colRight">
          <div className="profileCard">
            <img
              className="avatar"
              src={defaultAvatar}
              alt={`${student.name}'s profile`}
            />

            <div className="profileName">{student.name}</div>
            <div className="profileTerm">{student.term}</div>
            <div className="profileRole">{student.role}</div>
          </div>

          <Section title="Assignments" compact>
            <ProgressRow
              label="Completed"
              value={student.completedAssignments}
              tone="good"
            />

            <ProgressRow
              label="Overdue"
              value={student.overdueAssignments}
              tone="bad"
            />
          </Section>

          <Section compact>
            <div className="tipCard">
              <div className="tipTitle">
                <TrendingUp size={22} />
                <span>Why Am I At Risk?</span>
              </div>

              <ul className="tipList">
                {RISK_FACTORS.map((factor) => (
                  <li key={factor} className="tipItem">
                    <span className="tipBullet" aria-hidden="true">
                      ✓
                    </span>
                    <span className="tipText">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </div>
      </div>

      <div className="dashDivider" />

      <div className="rowAO">
        <div className="rowAO__left">
          <Section title="Academic Overview">
            <div className="overviewGauges">
              <MiniCard label="GPA" value={student.gpa} />
              <MiniCard
                label="Attendance"
                value={student.attendance}
              />
              <MiniCard
                label="Weekly ECA Hours"
                value={student.eca}
              />
            </div>
          </Section>
        </div>

        <div className="rowAO__right">
          <Section title="Advisor & Support" compact>
            <div className="advisorBox">
              <div className="advisorName">{student.advisor}</div>

              <div className="advisorPhone">
                <Phone size={18} />
                <span>{student.phone}</span>
              </div>
            </div>

            <button
              type="button"
              className="advisorBtn advisorBtn--ghost"
              onClick={() => setMessageOpen(true)}
            >
              <MessageSquare size={18} />
              <span>Send Message</span>
            </button>

            <button
              type="button"
              className="advisorBtn advisorBtn--primary"
              onClick={() => setAppointmentOpen(true)}
            >
              <Calendar size={18} />
              <span>Schedule Appointment</span>
            </button>
          </Section>
        </div>
      </div>

      <div className="dashDivider" />

      <section className="fullRow section">
        <div className="sectionTitle">Quick Access</div>

        <div className="quickGrid">
          <QuickCard
            icon={<BookOpen />}
            label="Course Materials"
          />

          <QuickCard
            icon={<GraduationCap />}
            label="Credits"
          />

          <QuickCard
            icon={<LineChart />}
            label="Course Performance"
          />

          <QuickCard
            icon={<Users />}
            label="Study Groups"
          />

          <QuickCard
            icon={<Bell />}
            label="Notifications"
          />
        </div>
      </section>

      <StudentBottomNav />

      {messageOpen ? (
        <Modal
          title={`Send Message to ${student.advisor}`}
          onClose={() => setMessageOpen(false)}
        >
          <p>
            Your message request has been prepared for your advisor.
          </p>

          <button
            className="advisorBtn advisorBtn--primary"
            type="button"
            onClick={() => setMessageOpen(false)}
          >
            Send Message
          </button>
        </Modal>
      ) : null}

      {appointmentOpen ? (
        <Modal
          title={`Schedule Appointment with ${student.advisor}`}
          onClose={() => setAppointmentOpen(false)}
        >
          <p>
            Advisor appointment request ready for a {student.term}
            support session.
          </p>

          <button
            className="advisorBtn advisorBtn--primary"
            type="button"
            onClick={() => setAppointmentOpen(false)}
          >
            Send Request
          </button>
        </Modal>
      ) : null}
    </div>
  );
}

function Section({ title, children, compact = false }) {
  return (
    <section
      className={compact ? "section section--compact" : "section"}
    >
      {title ? <div className="sectionTitle">{title}</div> : null}
      {children}
    </section>
  );
}

function ProgressRow({ label, value, tone }) {
  const percentage = clampPercentage(value);

  return (
    <div className="progRow">
      <div className="progTop">
        <div className="progLabel">{label}</div>
        <div className="progValue">{percentage}%</div>
      </div>

      <div
        className="progTrack"
        role="progressbar"
        aria-label={`${label} assignments`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={percentage}
      >
        <div
          className={`progFill progFill--${tone}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MiniCard({ label, value }) {
  return (
    <div className="miniGaugeCard">
      <div className="miniValue">{value}</div>
      <div className="miniLabel">{label}</div>
    </div>
  );
}

function QuickCard({ icon, label }) {
  const [open, setOpen] = useState(false);
  const items = QUICK_ACCESS_CONTENT[label] ?? [];

  return (
    <>
      <button
        type="button"
        className="quickCard"
        onClick={() => setOpen(true)}
        aria-label={`Open ${label}`}
      >
        {icon}
        <div className="quickLabel">{label}</div>
      </button>

      {open ? (
        <Modal title={label} onClose={() => setOpen(false)}>
          {items.length > 0 ? (
            <ul style={{ lineHeight: "2", paddingLeft: "20px" }}>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No information is currently available.</p>
          )}

          <button
            className="advisorBtn advisorBtn--primary"
            type="button"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </Modal>
      ) : null}
    </>
  );
}

function Modal({ title, children, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="modalOverlay"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modalHeader">
          <div
            id="dashboard-modal-title"
            className="modalTitle"
          >
            {title}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="iconBtn"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}