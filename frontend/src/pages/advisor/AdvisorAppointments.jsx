import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, LogOut, Moon, Sun, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { logoutAndReload } from "../../utils/logout";
import "../../styles/appointments.css";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function formatStatusLabel(status) {
  const normalized = normalizeStatus(status).replace(/_/g, " ");
  if (!normalized) return "Pending";
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRequestType(type) {
  const normalized = String(type || "").trim().toLowerCase().replace(/_/g, " ");
  if (!normalized) return "General Request";
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

const DEMO_APPOINTMENTS = [
  {
    id: 1,
    student_id: "100001",
    student_name: "Emma Wilson",
    appointment_date: "2026-02-12",
    appointment_time: "10:00 AM",
    reason: "Discuss CS101 missing lab and attendance concerns.",
    status: "pending",
    created_at: "2026-02-10",
  },
  {
    id: 2,
    student_id: "100004",
    student_name: "Daniel Moore",
    appointment_date: "2026-02-14",
    appointment_time: "2:00 PM",
    reason: "Review high-risk prediction and intervention plan.",
    status: "pending",
    created_at: "2026-02-11",
  },
];

const DEMO_REQUESTS = [
  {
    id: 1,
    student_id: "100001",
    student_name: "Emma Wilson",
    title: "Course Support Request",
    type: "academic",
    status: "pending",
    submitted_at: "2026-02-09",
  },
  {
    id: 2,
    student_id: "100004",
    student_name: "Daniel Moore",
    title: "Graduation Audit Review",
    type: "planning",
    status: "approved",
    submitted_at: "2026-02-08",
  },
];

export default function AdvisorAppointments() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("all");
  const [appointments, setAppointments] = useState(DEMO_APPOINTMENTS);
  const [studentRequests, setStudentRequests] = useState(DEMO_REQUESTS);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const appointmentCounts = useMemo(
    () => ({
      all: appointments.length,
      pending: appointments.filter((item) => normalizeStatus(item.status) === "pending").length,
      approved: appointments.filter((item) => normalizeStatus(item.status) === "approved").length,
      rejected: appointments.filter((item) => normalizeStatus(item.status) === "rejected").length,
      rescheduled: appointments.filter((item) => normalizeStatus(item.status) === "rescheduled").length,
    }),
    [appointments]
  );

  const visibleAppointments = useMemo(() => {
    if (activeTab === "all") return appointments;
    return appointments.filter((item) => normalizeStatus(item.status) === activeTab);
  }, [activeTab, appointments]);

  const requestCounts = useMemo(
    () => ({
      all: studentRequests.length,
      pending: studentRequests.filter((item) => normalizeStatus(item.status) === "pending").length,
      approved: studentRequests.filter((item) => normalizeStatus(item.status) === "approved").length,
      rejected: studentRequests.filter((item) => normalizeStatus(item.status) === "rejected").length,
      completed: studentRequests.filter((item) => normalizeStatus(item.status) === "completed").length,
    }),
    [studentRequests]
  );

  function patchAppointmentStatus(appointmentId, status) {
    const key = `appt-${appointmentId}`;
    setActionLoadingId(key);

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appointmentId ? { ...item, status } : item
      )
    );

    setTimeout(() => setActionLoadingId(""), 300);
  }

  function patchRequestStatus(requestId, status) {
    const key = `req-${requestId}`;
    setActionLoadingId(key);

    setStudentRequests((prev) =>
      prev.map((item) =>
        item.id === requestId ? { ...item, status } : item
      )
    );

    setTimeout(() => setActionLoadingId(""), 300);
  }

  return (
    <div className={darkMode ? "advisorAppointmentsPage advisorAppointmentsPage--dark" : "advisorAppointmentsPage"}>
      <div className="advisorPageContainer">
        <header className="advisorAppointmentsHeader">
          <div>
            <h1>Appointment Requests</h1>
            <p>Confirm or reject student appointment requests</p>
          </div>

          <div className="advisorAppointmentsHeaderActions">
            <button
              type="button"
              className="appointmentsBackBtn"
              onClick={() => navigate("/advisor/dashboard")}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            <button
              type="button"
              className="appointmentsBackBtn"
              onClick={logoutAndReload}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>

            <button
              type="button"
              className="appointmentsThemeBtn"
              aria-label="Toggle theme"
              title="Toggle theme"
              onClick={toggleTheme}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <section className="appointmentsStats">
          <article className="appointmentsStatCard">
            <div className="appointmentsStatLabel">All Requests</div>
            <div className="appointmentsStatValue">{appointmentCounts.all}</div>
          </article>

          <article className="appointmentsStatCard">
            <div className="appointmentsStatLabel">Pending</div>
            <div className="appointmentsStatValue">{appointmentCounts.pending}</div>
          </article>

          <article className="appointmentsStatCard">
            <div className="appointmentsStatLabel">Approved</div>
            <div className="appointmentsStatValue">{appointmentCounts.approved}</div>
          </article>

          <article className="appointmentsStatCard">
            <div className="appointmentsStatLabel">Rejected</div>
            <div className="appointmentsStatValue">{appointmentCounts.rejected}</div>
          </article>
        </section>

        <section className="appointmentsMainCard">
          <div className="appointmentsTabs" role="tablist" aria-label="Appointment request filters">
            <button
              type="button"
              className={activeTab === "all" ? "appointmentsTab appointmentsTab--active" : "appointmentsTab"}
              onClick={() => setActiveTab("all")}
            >
              All ({appointmentCounts.all})
            </button>

            <button
              type="button"
              className={activeTab === "pending" ? "appointmentsTab appointmentsTab--active" : "appointmentsTab"}
              onClick={() => setActiveTab("pending")}
            >
              Pending ({appointmentCounts.pending})
            </button>

            <button
              type="button"
              className={activeTab === "approved" ? "appointmentsTab appointmentsTab--active" : "appointmentsTab"}
              onClick={() => setActiveTab("approved")}
            >
              Approved ({appointmentCounts.approved})
            </button>

            <button
              type="button"
              className={activeTab === "rejected" ? "appointmentsTab appointmentsTab--active" : "appointmentsTab"}
              onClick={() => setActiveTab("rejected")}
            >
              Rejected ({appointmentCounts.rejected})
            </button>

            <button
              type="button"
              className={activeTab === "rescheduled" ? "appointmentsTab appointmentsTab--active" : "appointmentsTab"}
              onClick={() => setActiveTab("rescheduled")}
            >
              Rescheduled ({appointmentCounts.rescheduled})
            </button>
          </div>

          <div className="appointmentsDivider" />

          {visibleAppointments.length === 0 ? (
            <div className="appointmentsEmpty">
              <CalendarDays size={34} />
              <span>No appointment requests match this filter.</span>
            </div>
          ) : (
            <div className="appointmentsList">
              {visibleAppointments.map((request) => (
                <article key={request.id} className="appointmentCard">
                  <div className="appointmentCardHead">
                    <h2>{request.student_name}</h2>
                    <span className={`appointmentStatus appointmentStatus--${normalizeStatus(request.status)}`}>
                      {formatStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className="appointmentCardMeta">
                    <span>Student ID: {request.student_id}</span>
                    <span>Date: {formatDate(request.appointment_date)}</span>
                    <span>Time: {request.appointment_time}</span>
                    <span>Submitted: {formatDate(request.created_at)}</span>
                  </div>

                  <p className="appointmentCardReason">{request.reason}</p>

                  {normalizeStatus(request.status) === "pending" ? (
                    <div className="appointmentCardActions">
                      <button
                        type="button"
                        className="appointmentActionBtn appointmentActionBtn--approve"
                        onClick={() => patchAppointmentStatus(request.id, "approved")}
                        disabled={actionLoadingId === `appt-${request.id}`}
                      >
                        <Check size={14} />
                        <span>Confirm</span>
                      </button>

                      <button
                        type="button"
                        className="appointmentActionBtn appointmentActionBtn--reject"
                        onClick={() => patchAppointmentStatus(request.id, "rejected")}
                        disabled={actionLoadingId === `appt-${request.id}`}
                      >
                        <X size={14} />
                        <span>Cancel</span>
                      </button>

                      <button
                        type="button"
                        className="appointmentActionBtn"
                        onClick={() => patchAppointmentStatus(request.id, "rescheduled")}
                        disabled={actionLoadingId === `appt-${request.id}`}
                      >
                        <span>Reschedule</span>
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="appointmentsMainCard" style={{ marginTop: 20 }}>
          <div className="appointmentsTabs" role="tablist" aria-label="Student request summary">
            <button type="button" className="appointmentsTab appointmentsTab--active">
              Student Requests ({requestCounts.all})
            </button>

            <button type="button" className="appointmentsTab">
              Pending ({requestCounts.pending})
            </button>

            <button type="button" className="appointmentsTab">
              Approved ({requestCounts.approved})
            </button>

            <button type="button" className="appointmentsTab">
              Rejected ({requestCounts.rejected})
            </button>

            <button type="button" className="appointmentsTab">
              Completed ({requestCounts.completed})
            </button>
          </div>

          <div className="appointmentsDivider" />

          <div className="appointmentsList">
            {studentRequests.map((request) => (
              <article key={request.id} className="appointmentCard">
                <div className="appointmentCardHead">
                  <h2>{request.title}</h2>
                  <span className={`appointmentStatus appointmentStatus--${normalizeStatus(request.status)}`}>
                    {formatStatusLabel(request.status)}
                  </span>
                </div>

                <div className="appointmentCardMeta">
                  <span>Student: {request.student_name}</span>
                  <span>Student ID: {request.student_id}</span>
                  <span>Type: {formatRequestType(request.type)}</span>
                  <span>Submitted: {formatDate(request.submitted_at)}</span>
                </div>

                {normalizeStatus(request.status) === "pending" ? (
                  <div className="appointmentCardActions">
                    <button
                      type="button"
                      className="appointmentActionBtn appointmentActionBtn--approve"
                      onClick={() => patchRequestStatus(request.id, "approved")}
                      disabled={actionLoadingId === `req-${request.id}`}
                    >
                      <Check size={14} />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      className="appointmentActionBtn appointmentActionBtn--reject"
                      onClick={() => patchRequestStatus(request.id, "rejected")}
                      disabled={actionLoadingId === `req-${request.id}`}
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      className="appointmentActionBtn"
                      onClick={() => patchRequestStatus(request.id, "completed")}
                      disabled={actionLoadingId === `req-${request.id}`}
                    >
                      <span>Complete</span>
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}