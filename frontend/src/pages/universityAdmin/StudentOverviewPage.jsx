import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  UserRoundCheck,
  X,
} from "lucide-react";

import { getAuthToken } from "../../utils/authSession";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function StudentOverviewPage({
  selectedStudent,
  setSelectedStudent,
  setActive,
}) {
  const [student, setStudent] = useState(selectedStudent);

  const [advisors, setAdvisors] = useState([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);

  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");

  const [savingAdvisor, setSavingAdvisor] = useState(false);
  const [advisorError, setAdvisorError] = useState("");
  const [advisorSuccess, setAdvisorSuccess] = useState("");

  useEffect(() => {
    setStudent(selectedStudent);
  }, [selectedStudent]);

  /* ======================================================
     AUTHENTICATED API REQUEST
  ====================================================== */

  async function apiRequest(path, options = {}) {
    const token = getAuthToken();

    const headers = {
      Accept: "application/json",

      ...(options.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    };

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  }

  /* ======================================================
     ADVISOR HELPERS
  ====================================================== */

  function makeAdvisorId(user) {
    if (user.advisor_id) {
      return String(user.advisor_id);
    }

    if (user.id !== undefined && user.id !== null) {
      return `A${String(user.id).padStart(3, "0")}`;
    }

    return "";
  }

  function makeAdvisorName(user) {
    if (user.full_name) {
      return user.full_name;
    }

    if (user.name) {
      return user.name;
    }

    const email =
      user.email ||
      user.username ||
      "Advisor";

    const emailName =
      email.split("@")[0] || "Advisor";

    return emailName
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  /* ======================================================
     LOAD REAL ADVISORS
  ====================================================== */

  async function loadAdvisors() {
    try {
      setLoadingAdvisors(true);
      setAdvisorError("");

      const response = await apiRequest(
        "/api/admin/users"
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Unable to load advisors (${response.status}).`
        );
      }

      const users = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
        ? data.users
        : [];

      const advisorAccounts = users
        .filter(
          (user) =>
            String(user.role || "")
              .trim()
              .toLowerCase() === "advisor"
        )
        .map((user) => {
          const email =
            user.email ||
            user.username ||
            "";

          return {
            ...user,
            advisor_id: makeAdvisorId(user),
            name: makeAdvisorName(user),
            email,
          };
        });

      setAdvisors(advisorAccounts);
    } catch (error) {
      console.error(
        "Unable to load advisors:",
        error
      );

      setAdvisors([]);

      setAdvisorError(
        error?.message ||
          "Unable to load advisors."
      );
    } finally {
      setLoadingAdvisors(false);
    }
  }

  /* ======================================================
     CURRENT ADVISOR
  ====================================================== */

  const currentAdvisorId =
    student?.advisor_id ||
    (
      student?.advisor &&
      student.advisor !== "Unassigned"
        ? student.advisor
        : ""
    ) ||
    "";

  const currentAdvisor = useMemo(() => {
    if (!currentAdvisorId) {
      return null;
    }

    return (
      advisors.find(
        (advisor) =>
          String(advisor.advisor_id) ===
          String(currentAdvisorId)
      ) || null
    );
  }, [advisors, currentAdvisorId]);

  /* ======================================================
     OPEN ASSIGNMENT MODAL
  ====================================================== */

  async function openAdvisorModal() {
    setAdvisorError("");
    setAdvisorSuccess("");

    setSelectedAdvisorId(
      currentAdvisorId || ""
    );

    setShowAdvisorModal(true);

    await loadAdvisors();
  }

  function closeAdvisorModal() {
    if (savingAdvisor) {
      return;
    }

    setShowAdvisorModal(false);
    setAdvisorError("");
    setAdvisorSuccess("");
  }

  /* ======================================================
     SAVE ADVISOR ASSIGNMENT
  ====================================================== */

  async function handleSaveAdvisor() {
    if (!selectedAdvisorId) {
      setAdvisorError(
        "Please select an advisor."
      );
      return;
    }

    const studentId =
      student?.student_id ||
      student?.id;

    if (!studentId) {
      setAdvisorError(
        "Student ID is missing."
      );
      return;
    }

    setSavingAdvisor(true);
    setAdvisorError("");
    setAdvisorSuccess("");

    try {
      const response = await apiRequest(
        `/api/admin/students/${encodeURIComponent(
          studentId
        )}/advisor`,
        {
          method: "PATCH",

          body: JSON.stringify({
            advisor_id: selectedAdvisorId,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Unable to assign advisor (${response.status}).`
        );
      }

      const advisor = advisors.find(
        (item) =>
          item.advisor_id ===
          selectedAdvisorId
      );

      const updatedStudent = {
        ...student,

        advisor_id: selectedAdvisorId,

        advisor:
          advisor?.name ||
          advisor?.email ||
          selectedAdvisorId,

        advisor_name:
          advisor?.name ||
          advisor?.email ||
          selectedAdvisorId,
      };

      setStudent(updatedStudent);

      /*
       * Keep AdminDashboard's selected student synchronized
       * if the parent passed setSelectedStudent.
       */

      if (
        typeof setSelectedStudent ===
        "function"
      ) {
        setSelectedStudent(updatedStudent);
      }

      setAdvisorSuccess(
        advisor
          ? `${advisor.name} (${selectedAdvisorId}) is now assigned to this student.`
          : `Advisor ${selectedAdvisorId} assigned successfully.`
      );

      window.setTimeout(() => {
        setShowAdvisorModal(false);
        setAdvisorSuccess("");
      }, 1500);
    } catch (error) {
      console.error(
        "Unable to assign advisor:",
        error
      );

      setAdvisorError(
        error?.message ||
          "Unable to assign advisor."
      );
    } finally {
      setSavingAdvisor(false);
    }
  }

  /* ======================================================
     NO STUDENT SELECTED
  ====================================================== */

  if (!student) {
    return (
      <div className="placeholderPanel">
        <h3>No Student Selected</h3>

        <p>
          Select a student from the Students page.
        </p>

        <button
          className="primaryActionBtn"
          type="button"
          onClick={() =>
            setActive("students")
          }
        >
          <ArrowLeft size={16} />
          Back to Students
        </button>
      </div>
    );
  }

  const studentId =
    student.student_id ||
    student.id ||
    "—";

  const displayAdvisor =
    currentAdvisor?.name ||
    student.advisor_name ||
    student.advisor ||
    student.advisor_id ||
    "Unassigned";

  const hasAdvisor =
    Boolean(currentAdvisorId);

  /* ======================================================
     PAGE
  ====================================================== */

  return (
    <>
      <section className="studentsAdminPage">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="studentsAdminHeader">

          <div>
            <h2>
              {student.name ||
                student.full_name ||
                "Student"}
            </h2>

            <p>
              Student prediction and academic
              overview
            </p>
          </div>

          <button
            className="primaryActionBtn"
            type="button"
            onClick={() =>
              setActive("students")
            }
          >
            <ArrowLeft size={16} />
            Back to Students
          </button>

        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="studentsSummaryGrid">

          <div className="studentSummaryCard">
            <span>
              Student ID
            </span>

            <strong>
              {studentId}
            </strong>
          </div>

          <div className="studentSummaryCard">
            <span>
              Program
            </span>

            <strong
              style={{
                fontSize: "18px",
              }}
            >
              {student.program ||
                "Not specified"}
            </strong>
          </div>

          <div className="studentSummaryCard">
            <span>
              Risk Level
            </span>

            <strong>
              {student.risk ||
                "Unknown"}
            </strong>
          </div>

          <div className="studentSummaryCard">
            <span>
              Status
            </span>

            <strong>
              {student.status ||
                "Active"}
            </strong>
          </div>

        </div>

        {/* =================================================
            INFORMATION + AI
        ================================================= */}

        <div className="adminTwoCol">

          {/* STUDENT INFORMATION */}

          <div className="adminPanel">

            <div className="panelHeader">

              <div>
                <h3>
                  Student Information
                </h3>

                <p>
                  Basic profile details
                </p>
              </div>

            </div>

            <table className="adminTable">

              <tbody>

                <tr>
                  <td>
                    Name
                  </td>

                  <td>
                    {student.name ||
                      student.full_name ||
                      "—"}
                  </td>
                </tr>

                <tr>
                  <td>
                    Email
                  </td>

                  <td>
                    {student.email ||
                      "—"}
                  </td>
                </tr>

                <tr>
                  <td>
                    Program
                  </td>

                  <td>
                    {student.program ||
                      "—"}
                  </td>
                </tr>

                <tr>
                  <td>
                    Advisor
                  </td>

                  <td>

                    <div className="studentAdvisorCell">

                      <div>
                        <strong>
                          {displayAdvisor}
                        </strong>

                        {hasAdvisor ? (
                          <span>
                            {currentAdvisorId}
                          </span>
                        ) : (
                          <span>
                            No advisor assigned
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="studentAdvisorBtn"
                        onClick={
                          openAdvisorModal
                        }
                      >
                        <UserRoundCheck
                          size={15}
                        />

                        {hasAdvisor
                          ? "Change Advisor"
                          : "Assign Advisor"}
                      </button>

                    </div>

                  </td>
                </tr>

                {student.current_module ? (
                  <tr>
                    <td>
                      Current Module
                    </td>

                    <td>
                      {
                        student.current_module
                      }
                    </td>
                  </tr>
                ) : null}

                {student.current_presentation ? (
                  <tr>
                    <td>
                      Presentation
                    </td>

                    <td>
                      {
                        student.current_presentation
                      }
                    </td>
                  </tr>
                ) : null}

              </tbody>

            </table>

          </div>

          {/* AI PREDICTION */}

          <div className="adminPanel">

            <div className="panelHeader">

              <div>
                <h3>
                  AI Prediction Result
                </h3>

                <p>
                  Generated after ETL + ML
                  process
                </p>
              </div>

            </div>

            <div className="placeholderPanel">

              <h3
                style={{
                  color:
                    student.risk === "High"
                      ? "#f43f5e"
                      : student.risk ===
                        "Medium"
                      ? "#f59e0b"
                      : student.risk === "Low"
                      ? "#10b981"
                      : "#64748b",
                }}
              >
                {student.risk ||
                  "Unknown"}{" "}
                Risk Student
              </h3>

              <p>
                Prediction analysis will
                appear here after model
                processing.
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            RECOMMENDED ACTIONS
        ================================================= */}

        <div
          className="adminPanel"
          style={{
            marginTop: "18px",
          }}
        >

          <div className="panelHeader">

            <div>
              <h3>
                Recommended Actions
              </h3>

              <p>
                AI-generated recommendations
                for intervention
              </p>
            </div>

          </div>

          <div className="alertList">

            <div className="alertRow blueAlert">

              <div>
                1
              </div>

              <div>
                <h4>
                  Monitor academic performance
                </h4>

                <p>
                  Review grades and attendance
                  records.
                </p>
              </div>

              <span>
                Pending
              </span>

            </div>

            <div className="alertRow yellowAlert">

              <div>
                2
              </div>

              <div>
                <h4>
                  Advisor follow-up
                </h4>

                <p>
                  Schedule advisor meeting
                  with student.
                </p>
              </div>

              <span>
                Suggested
              </span>

            </div>

            <div className="alertRow redAlert">

              <div>
                3
              </div>

              <div>
                <h4>
                  Risk intervention
                </h4>

                <p>
                  Provide additional support
                  resources.
                </p>
              </div>

              <span>
                AI Based
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          ASSIGN / CHANGE ADVISOR MODAL
      ================================================== */}

      {showAdvisorModal ? (
        <div
          className="studentAdvisorModalOverlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAdvisorModal();
            }
          }}
        >

          <div
            className="studentAdvisorModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="advisor-modal-title"
          >

            {/* HEADER */}

            <div className="studentAdvisorModalHeader">

              <div>
                <h2 id="advisor-modal-title">
                  {hasAdvisor
                    ? "Change Advisor"
                    : "Assign Advisor"}
                </h2>

                <p>
                  Assign an advisor to{" "}
                  <strong>
                    {student.name ||
                      student.full_name}
                  </strong>{" "}
                  ({studentId})
                </p>
              </div>

              <button
                type="button"
                className="studentAdvisorModalClose"
                onClick={
                  closeAdvisorModal
                }
                disabled={
                  savingAdvisor
                }
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>

            {/* BODY */}

            <div className="studentAdvisorModalBody">

              {loadingAdvisors ? (
                <div className="studentAdvisorLoading">

                  <LoaderCircle
                    size={25}
                    className="studentAdvisorSpin"
                  />

                  <span>
                    Loading advisors...
                  </span>

                </div>
              ) : (
                <>
                  <label
                    htmlFor="student-advisor-select"
                    className="studentAdvisorLabel"
                  >
                    Advisor
                  </label>

                  <select
                    id="student-advisor-select"
                    value={
                      selectedAdvisorId
                    }
                    onChange={(event) => {
                      setSelectedAdvisorId(
                        event.target.value
                      );

                      setAdvisorError("");
                    }}
                    className="studentAdvisorSelect"
                    disabled={
                      savingAdvisor
                    }
                  >

                    <option value="">
                      Select an advisor
                    </option>

                    {advisors.map(
                      (advisor) => (
                        <option
                          key={
                            advisor.advisor_id
                          }
                          value={
                            advisor.advisor_id
                          }
                        >
                          {
                            advisor.advisor_id
                          }{" "}
                          — {advisor.name} —{" "}
                          {advisor.email}
                        </option>
                      )
                    )}

                  </select>

                  {advisors.length ===
                  0 ? (
                    <div className="studentAdvisorWarning">
                      No advisor accounts are
                      available. Create an
                      advisor from Advisors
                      Management first.
                    </div>
                  ) : null}

                  {currentAdvisorId ? (
                    <div className="studentCurrentAdvisor">

                      <strong>
                        Current assignment:
                      </strong>{" "}

                      {displayAdvisor} (
                      {currentAdvisorId})

                    </div>
                  ) : null}

                </>
              )}

              {/* ERROR */}

              {advisorError ? (
                <div className="studentAdvisorError">
                  {advisorError}
                </div>
              ) : null}

              {/* SUCCESS */}

              {advisorSuccess ? (
                <div className="studentAdvisorSuccess">

                  <CheckCircle2
                    size={17}
                  />

                  {advisorSuccess}

                </div>
              ) : null}

            </div>

            {/* ACTIONS */}

            <div className="studentAdvisorModalActions">

              <button
                type="button"
                className="studentAdvisorCancelBtn"
                onClick={
                  closeAdvisorModal
                }
                disabled={
                  savingAdvisor
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="primaryActionBtn"
                onClick={
                  handleSaveAdvisor
                }
                disabled={
                  savingAdvisor ||
                  loadingAdvisors ||
                  advisors.length === 0
                }
              >

                {savingAdvisor ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="studentAdvisorSpin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <UserRoundCheck
                      size={16}
                    />

                    Save Assignment
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      ) : null}

      {/* ==================================================
          LOCAL CSS
      ================================================== */}

      <style>{`

        /* ================================================
           ADVISOR CELL
        ================================================ */

        .studentAdvisorCell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .studentAdvisorCell > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .studentAdvisorCell span {
          color: #64748b;
          font-size: 12px;
        }

        .dark .studentAdvisorCell span {
          color: #94a3b8;
        }

        .studentAdvisorBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          white-space: nowrap;

          padding: 7px 10px;

          border: 1px solid #cbd5e1;
          border-radius: 8px;

          background: transparent;
          color: inherit;

          font-size: 12px;
          font-weight: 700;

          cursor: pointer;
        }

        .studentAdvisorBtn:hover {
          border-color: #6366f1;

          background:
            rgba(99, 102, 241, 0.07);

          color: #4f46e5;
        }

        /* ================================================
           MODAL OVERLAY
        ================================================ */

        .studentAdvisorModalOverlay {
          position: fixed;
          inset: 0;

          z-index: 9999;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 24px;

          background:
            rgba(15, 23, 42, 0.55);

          backdrop-filter: blur(4px);
        }

        /* ================================================
           MODAL
        ================================================ */

        .studentAdvisorModal {
          width: min(560px, 100%);

          background: #ffffff;
          color: #0f172a;

          border:
            1px solid #e2e8f0;

          border-radius: 18px;

          box-shadow:
            0 25px 60px
            rgba(15, 23, 42, 0.22);

          overflow: hidden;
        }

        .dark .studentAdvisorModal {
          background: #0f172a;
          color: #e2e8f0;

          border-color: #263449;
        }

        /* ================================================
           HEADER
        ================================================ */

        .studentAdvisorModalHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 18px;

          padding: 22px 24px 18px;

          border-bottom:
            1px solid #e2e8f0;
        }

        .dark .studentAdvisorModalHeader {
          border-color: #263449;
        }

        .studentAdvisorModalHeader h2 {
          margin: 0 0 5px;

          font-size: 21px;
        }

        .studentAdvisorModalHeader p {
          margin: 0;

          color: #64748b;

          font-size: 13px;
          line-height: 1.5;
        }

        .dark .studentAdvisorModalHeader p {
          color: #94a3b8;
        }

        .studentAdvisorModalClose {
          width: 36px;
          height: 36px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 0;
          border-radius: 9px;

          background: transparent;
          color: inherit;

          cursor: pointer;
        }

        .studentAdvisorModalClose:hover {
          background:
            rgba(148, 163, 184, 0.14);
        }

        /* ================================================
           BODY
        ================================================ */

        .studentAdvisorModalBody {
          padding: 22px 24px;
        }

        .studentAdvisorLabel {
          display: block;

          margin-bottom: 7px;

          font-size: 13px;
          font-weight: 700;
        }

        .studentAdvisorSelect {
          width: 100%;
          box-sizing: border-box;

          min-height: 44px;

          padding: 10px 12px;

          border:
            1px solid #cbd5e1;

          border-radius: 9px;

          background: #ffffff;
          color: #0f172a;

          font: inherit;

          outline: none;
        }

        .studentAdvisorSelect:focus {
          border-color: #6366f1;

          box-shadow:
            0 0 0 3px
            rgba(99, 102, 241, 0.12);
        }

        .dark .studentAdvisorSelect {
          background: #111c2e;
          color: #e2e8f0;

          border-color: #334155;
        }

        .studentCurrentAdvisor {
          margin-top: 14px;

          padding: 11px 13px;

          border-radius: 9px;

          background:
            rgba(99, 102, 241, 0.08);

          color: #4338ca;

          font-size: 13px;
        }

        .dark .studentCurrentAdvisor {
          background:
            rgba(129, 140, 248, 0.1);

          color: #a5b4fc;
        }

        .studentAdvisorWarning {
          margin-top: 14px;

          padding: 11px 13px;

          border-radius: 9px;

          background:
            rgba(245, 158, 11, 0.1);

          color: #b45309;

          font-size: 13px;
        }

        .studentAdvisorError {
          margin-top: 14px;

          padding: 11px 13px;

          border-radius: 9px;

          background:
            rgba(239, 68, 68, 0.09);

          color: #b91c1c;

          font-size: 13px;
          font-weight: 600;
        }

        .studentAdvisorSuccess {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-top: 14px;

          padding: 11px 13px;

          border-radius: 9px;

          background:
            rgba(34, 197, 94, 0.1);

          color: #15803d;

          font-size: 13px;
          font-weight: 600;
        }

        .studentAdvisorLoading {
          min-height: 90px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 10px;

          color: #64748b;

          font-size: 13px;
        }

        /* ================================================
           ACTIONS
        ================================================ */

        .studentAdvisorModalActions {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 10px;

          padding: 16px 24px 22px;

          border-top:
            1px solid #e2e8f0;
        }

        .dark .studentAdvisorModalActions {
          border-color: #263449;
        }

        .studentAdvisorCancelBtn {
          min-height: 40px;

          padding: 9px 16px;

          border:
            1px solid #cbd5e1;

          border-radius: 9px;

          background: transparent;
          color: inherit;

          font-weight: 600;

          cursor: pointer;
        }

        .studentAdvisorCancelBtn:hover {
          background:
            rgba(148, 163, 184, 0.1);
        }

        .primaryActionBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        /* ================================================
           SPINNER
        ================================================ */

        .studentAdvisorSpin {
          animation:
            studentAdvisorSpinAnimation
            0.8s linear infinite;
        }

        @keyframes studentAdvisorSpinAnimation {
          to {
            transform: rotate(360deg);
          }
        }

        /* ================================================
           MOBILE
        ================================================ */

        @media (max-width: 700px) {

          .studentAdvisorModalOverlay {
            padding: 12px;
          }

          .studentAdvisorCell {
            align-items: flex-start;
            flex-direction: column;
          }

          .studentAdvisorModalHeader,
          .studentAdvisorModalBody,
          .studentAdvisorModalActions {
            padding-left: 18px;
            padding-right: 18px;
          }

        }

      `}</style>
    </>
  );
}