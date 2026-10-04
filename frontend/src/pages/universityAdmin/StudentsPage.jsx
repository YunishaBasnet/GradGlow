import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  X,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { getAuthToken } from "../../utils/authSession";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  password: "",
  program: "",
  year_of_study: "1",
  advisor_id: "",
  current_module: "",
  current_presentation: "",
};

export default function StudentsPage({
  setSelectedStudent,
  setActive,
}) {
  const [students, setStudents] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [showAddStudent, setShowAddStudent] =
    useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [creating, setCreating] = useState(false);

  const [formError, setFormError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

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
     NORMALIZE STUDENT DATA

     This allows the page to work with slightly different
     backend response field names.
  ====================================================== */

  function normalizeStudent(student) {
    const riskValue =
      student.risk_label ??
      student.risk ??
      student.overall_risk ??
      "Unknown";

    let normalizedRisk = "Unknown";

    const riskText = String(riskValue).toLowerCase();

    if (riskText.includes("high")) {
      normalizedRisk = "High";
    } else if (
      riskText.includes("medium") ||
      riskText.includes("moderate")
    ) {
      normalizedRisk = "Medium";
    } else if (riskText.includes("low")) {
      normalizedRisk = "Low";
    }

    return {
      ...student,

      id:
        student.student_id ??
        student.id ??
        "",

      student_id:
        student.student_id ??
        student.id ??
        "",

      name:
        student.full_name ??
        student.name ??
        "Unnamed Student",

      full_name:
        student.full_name ??
        student.name ??
        "Unnamed Student",

      email:
        student.email ??
        "",

      program:
        student.program ??
        student.major ??
        "Not specified",

      advisor:
        student.advisor_name ??
        student.advisor ??
        student.advisor_id ??
        "Unassigned",

      advisor_id:
        student.advisor_id ??
        "",

      status:
        student.status ??
        student.contact_status ??
        "Active",

      risk:
        normalizedRisk,

      risk_score:
        student.risk_score ??
        student.final_overall_risk ??
        student.overall_risk_score ??
        null,
    };
  }

  /* ======================================================
     LOAD STUDENTS
  ====================================================== */

  async function loadStudents() {
    try {
      setLoading(true);
      setLoadError("");

      const response = await apiRequest(
        "/api/admin/students"
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
            `Unable to load students (${response.status}).`
        );
      }

      const rawStudents = Array.isArray(data)
        ? data
        : Array.isArray(data?.students)
        ? data.students
        : [];

      setStudents(
        rawStudents.map(normalizeStudent)
      );
    } catch (error) {
      console.error(
        "Unable to load students:",
        error
      );

      setStudents([]);

      setLoadError(
        error?.message ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  /* ======================================================
     SEARCH
  ====================================================== */

  const filteredStudents = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const searchable = [
        student.student_id,
        student.name,
        student.email,
        student.program,
        student.advisor,
        student.status,
        student.risk,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [students, search]);

  /* ======================================================
     SUMMARY COUNTS
  ====================================================== */

  const totalStudents =
    students.length;

  const assignedStudents =
    students.filter((student) => {
      const advisor =
        String(
          student.advisor_id ||
            student.advisor ||
            ""
        )
          .trim()
          .toLowerCase();

      return (
        advisor &&
        advisor !== "unassigned" &&
        advisor !== "none" &&
        advisor !== "null"
      );
    }).length;

  const unassignedStudents =
    totalStudents - assignedStudents;

  const atRiskStudents =
    students.filter(
      (student) =>
        student.risk === "High"
    ).length;

  /* ======================================================
     FORM
  ====================================================== */

  function handleFormChange(event) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  }

  function openAddStudent() {
    setForm(EMPTY_FORM);
    setFormError("");
    setSuccessMessage("");
    setShowAddStudent(true);
  }

  function closeAddStudent() {
    if (creating) {
      return;
    }

    setShowAddStudent(false);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  /* ======================================================
     CREATE STUDENT
  ====================================================== */

  async function handleCreateStudent(event) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const fullName =
      form.full_name.trim();

    const email =
      form.email.trim();

    const password =
      form.password;

    const program =
      form.program.trim();

    const advisorId =
      form.advisor_id.trim();

    const currentModule =
      form.current_module.trim();

    const currentPresentation =
      form.current_presentation.trim();

    /* ---------- VALIDATION ---------- */

    if (!fullName) {
      setFormError(
        "Student full name is required."
      );
      return;
    }

    if (!email) {
      setFormError(
        "Student email is required."
      );
      return;
    }

    if (
      !email.includes("@") ||
      !email.includes(".")
    ) {
      setFormError(
        "Please enter a valid student email."
      );
      return;
    }

    if (!password) {
      setFormError(
        "Student password is required."
      );
      return;
    }

    if (password.length < 6) {
      setFormError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (!program) {
      setFormError(
        "Program is required."
      );
      return;
    }

    const yearOfStudy =
      Number(form.year_of_study);

    if (
      !Number.isInteger(yearOfStudy) ||
      yearOfStudy < 1 ||
      yearOfStudy > 10
    ) {
      setFormError(
        "Please enter a valid year of study."
      );
      return;
    }

    setCreating(true);

    try {
      /*
       * IMPORTANT:
       * We do NOT send student_id.
       *
       * Your backend generates the Student ID
       * automatically.
       */

      const payload = {
        full_name: fullName,
        email,
        password,
        program,
        year_of_study: yearOfStudy,

        advisor_id:
          advisorId || null,

        current_module:
          currentModule || null,

        current_presentation:
          currentPresentation || null,
      };

      const response = await apiRequest(
        "/api/admin/students",
        {
          method: "POST",
          body: JSON.stringify(payload),
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
            `Unable to create student (${response.status}).`
        );
      }

      const generatedStudentId =
        data?.student?.student_id ??
        data?.student_id ??
        data?.account?.username ??
        "";

      setSuccessMessage(
        generatedStudentId
          ? `Student created successfully. Student ID: ${generatedStudentId}`
          : "Student created successfully."
      );

      setForm(EMPTY_FORM);

      /*
       * Reload the directory so the newly-created
       * student appears immediately.
       */

      await loadStudents();

      /*
       * Keep the success message visible briefly,
       * then close the modal.
       */

      window.setTimeout(() => {
        setShowAddStudent(false);
        setSuccessMessage("");
      }, 1800);
    } catch (error) {
      console.error(
        "Unable to create student:",
        error
      );

      setFormError(
        error?.message ||
          "Unable to create student."
      );
    } finally {
      setCreating(false);
    }
  }

  /* ======================================================
     VIEW STUDENT
  ====================================================== */

  function handleViewStudent(student) {
    if (typeof setSelectedStudent === "function") {
      setSelectedStudent(student);
    }

    if (typeof setActive === "function") {
      setActive("studentOverview");
    }
  }

  /* ======================================================
     RISK BADGE
  ====================================================== */

  function getRiskClass(risk) {
    if (risk === "High") {
      return "badgeHigh";
    }

    if (risk === "Medium") {
      return "badgePending";
    }

    if (risk === "Low") {
      return "badgeLow";
    }

    return "";
  }

  /* ======================================================
     PAGE
  ====================================================== */

  return (
    <>
      <section className="studentsAdminPage">

        {/* ================================================
            HEADER
        ================================================ */}

        <div className="studentsAdminHeader">
          <div>
            <h2>
              Students Management
            </h2>

            <p>
              View, create, search, and manage
              student access across the institution.
            </p>
          </div>

          <button
            className="primaryActionBtn"
            type="button"
            onClick={openAddStudent}
          >
            <UserPlus size={17} />

            Add Student
          </button>
        </div>

        {/* ================================================
            SUMMARY
        ================================================ */}

        <div className="studentsSummaryGrid">

          <div className="studentSummaryCard">
            <span>
              Total Students
            </span>

            <strong>
              {totalStudents}
            </strong>
          </div>

          <div className="studentSummaryCard">
            <span>
              Assigned Advisors
            </span>

            <strong>
              {assignedStudents}
            </strong>
          </div>

          <div className="studentSummaryCard">
            <span>
              Unassigned
            </span>

            <strong>
              {unassignedStudents}
            </strong>
          </div>

          <div className="studentSummaryCard">
            <span>
              High Risk
            </span>

            <strong>
              {atRiskStudents}
            </strong>
          </div>

        </div>

        {/* ================================================
            DIRECTORY
        ================================================ */}

        <div className="adminPanel">

          <div className="studentsTableHeader">

            <div>
              <h3>
                Student Directory
              </h3>

              <p>
                {loading
                  ? "Loading students..."
                  : `${filteredStudents.length} of ${totalStudents} students shown`}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >

              <div
                style={{
                  position: "relative",
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    opacity: 0.55,
                    pointerEvents: "none",
                  }}
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search students..."
                  style={{
                    paddingLeft: "36px",
                  }}
                />
              </div>

              <button
                type="button"
                className="tableActionBtn"
                onClick={loadStudents}
                disabled={loading}
                title="Refresh students"
              >
                <RefreshCw
                  size={15}
                  className={
                    loading
                      ? "studentsRefreshSpin"
                      : ""
                  }
                />

                Refresh
              </button>

            </div>

          </div>

          {/* ================================================
              LOAD ERROR
          ================================================ */}

          {loadError ? (
            <div
              style={{
                margin: "16px 0",
                padding: "12px 14px",
                borderRadius: "10px",
                background:
                  "rgba(239, 68, 68, 0.08)",
                color: "#b91c1c",
                fontSize: "14px",
              }}
            >
              {loadError}
            </div>
          ) : null}

          {/* ================================================
              LOADING
          ================================================ */}

          {loading ? (
            <div
              style={{
                padding: "42px 20px",
                textAlign: "center",
                opacity: 0.7,
              }}
            >
              <LoaderCircle
                size={28}
                className="studentsRefreshSpin"
              />

              <p>
                Loading students...
              </p>
            </div>
          ) : null}

          {/* ================================================
              EMPTY STATE
          ================================================ */}

          {!loading &&
          !loadError &&
          filteredStudents.length === 0 ? (
            <div
              style={{
                padding: "42px 20px",
                textAlign: "center",
              }}
            >
              <UsersEmptyIcon />

              <h3>
                {search
                  ? "No matching students"
                  : "No students yet"}
              </h3>

              <p
                style={{
                  opacity: 0.65,
                }}
              >
                {search
                  ? "Try another search term."
                  : "Create the first student account using Add Student."}
              </p>
            </div>
          ) : null}

          {/* ================================================
              STUDENT TABLE
          ================================================ */}

          {!loading &&
          filteredStudents.length > 0 ? (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table className="studentsAdminTable">

                <thead>
                  <tr>
                    <th>
                      STUDENT
                    </th>

                    <th>
                      STUDENT ID
                    </th>

                    <th>
                      EMAIL
                    </th>

                    <th>
                      PROGRAM
                    </th>

                    <th>
                      ADVISOR
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      RISK
                    </th>

                    <th>
                      ACTION
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={
                          student.student_id ||
                          student.id
                        }
                      >

                        <td>
                          <strong>
                            {student.name}
                          </strong>
                        </td>

                        <td>
                          {student.student_id ||
                            "—"}
                        </td>

                        <td>
                          {student.email ||
                            "—"}
                        </td>

                        <td>
                          {student.program ||
                            "—"}
                        </td>

                        <td>
                          {student.advisor ||
                            "Unassigned"}
                        </td>

                        <td>
                          <span className="studentBadge badgeActive">
                            {student.status ||
                              "Active"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`studentBadge ${getRiskClass(
                              student.risk
                            )}`}
                          >
                            {student.risk ||
                              "Unknown"}
                          </span>
                        </td>

                        <td>
                          <button
                            className="tableActionBtn"
                            type="button"
                            onClick={() =>
                              handleViewStudent(
                                student
                              )
                            }
                          >
                            View
                          </button>
                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>
          ) : null}

        </div>
      </section>

      {/* ==================================================
          ADD STUDENT MODAL
      ================================================== */}

      {showAddStudent ? (
        <div
          className="studentsModalOverlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddStudent();
            }
          }}
        >

          <div
            className="studentsModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-student-title"
          >

            {/* MODAL HEADER */}

            <div className="studentsModalHeader">

              <div>
                <h2 id="add-student-title">
                  Add Student
                </h2>

                <p>
                  Create a new student account.
                  GradGlow will generate the
                  Student ID automatically.
                </p>
              </div>

              <button
                type="button"
                className="studentsModalClose"
                onClick={closeAddStudent}
                disabled={creating}
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleCreateStudent}
              className="studentsAddForm"
            >

              <div className="studentsFormGrid">

                {/* FULL NAME */}

                <div className="studentsFormField">
                  <label htmlFor="student-full-name">
                    Full Name *
                  </label>

                  <input
                    id="student-full-name"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleFormChange}
                    placeholder="e.g. Emma Wilson"
                    disabled={creating}
                    autoFocus
                  />
                </div>

                {/* EMAIL */}

                <div className="studentsFormField">
                  <label htmlFor="student-email">
                    Email *
                  </label>

                  <input
                    id="student-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="student@university.edu"
                    disabled={creating}
                  />
                </div>

                {/* PASSWORD */}

                <div className="studentsFormField">
                  <label htmlFor="student-password">
                    Initial Password *
                  </label>

                  <input
                    id="student-password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder="Minimum 6 characters"
                    disabled={creating}
                  />
                </div>

                {/* PROGRAM */}

                <div className="studentsFormField">
                  <label htmlFor="student-program">
                    Program *
                  </label>

                  <input
                    id="student-program"
                    name="program"
                    value={form.program}
                    onChange={handleFormChange}
                    placeholder="e.g. Computer Science"
                    disabled={creating}
                  />
                </div>

                {/* YEAR */}

                <div className="studentsFormField">
                  <label htmlFor="student-year">
                    Year of Study *
                  </label>

                  <select
                    id="student-year"
                    name="year_of_study"
                    value={form.year_of_study}
                    onChange={handleFormChange}
                    disabled={creating}
                  >
                    <option value="1">
                      Year 1
                    </option>

                    <option value="2">
                      Year 2
                    </option>

                    <option value="3">
                      Year 3
                    </option>

                    <option value="4">
                      Year 4
                    </option>

                    <option value="5">
                      Year 5
                    </option>
                  </select>
                </div>

                {/* ADVISOR */}

                <div className="studentsFormField">
                  <label htmlFor="student-advisor">
                    Advisor ID
                  </label>

                  <input
                    id="student-advisor"
                    name="advisor_id"
                    value={form.advisor_id}
                    onChange={handleFormChange}
                    placeholder="e.g. A001"
                    disabled={creating}
                  />

                  <small>
                    Optional. Leave empty if the
                    student has not been assigned.
                  </small>
                </div>

                {/* MODULE */}

                <div className="studentsFormField">
                  <label htmlFor="student-module">
                    Current Module
                  </label>

                  <input
                    id="student-module"
                    name="current_module"
                    value={form.current_module}
                    onChange={handleFormChange}
                    placeholder="e.g. CS101"
                    disabled={creating}
                  />
                </div>

                {/* PRESENTATION */}

                <div className="studentsFormField">
                  <label htmlFor="student-presentation">
                    Current Presentation
                  </label>

                  <input
                    id="student-presentation"
                    name="current_presentation"
                    value={
                      form.current_presentation
                    }
                    onChange={handleFormChange}
                    placeholder="e.g. 2026J"
                    disabled={creating}
                  />
                </div>

              </div>

              {/* INFO */}

              <div className="studentsGeneratedIdNotice">
                <strong>
                  Student ID:
                </strong>{" "}
                generated automatically after
                account creation.
              </div>

              {/* ERROR */}

              {formError ? (
                <div className="studentsFormError">
                  {formError}
                </div>
              ) : null}

              {/* SUCCESS */}

              {successMessage ? (
                <div className="studentsFormSuccess">
                  {successMessage}
                </div>
              ) : null}

              {/* ACTIONS */}

              <div className="studentsModalActions">

                <button
                  type="button"
                  className="studentsCancelBtn"
                  onClick={closeAddStudent}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primaryActionBtn"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="studentsRefreshSpin"
                      />

                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />

                      Create Student
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      ) : null}

      {/* ==================================================
          LOCAL STYLES
          Kept here so this is ONE COMPLETE FILE.
      ================================================== */}

      <style>{`

        /* ================================================
           BUTTON ALIGNMENT
        ================================================ */

        .primaryActionBtn,
        .tableActionBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        /* ================================================
           MODAL BACKGROUND
        ================================================ */

        .studentsModalOverlay {
          position: fixed;
          inset: 0;

          z-index: 9999;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 24px;

          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
        }

        /* ================================================
           MODAL
        ================================================ */

        .studentsModal {
          width: min(760px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;

          background: #ffffff;
          color: #0f172a;

          border: 1px solid #e2e8f0;
          border-radius: 18px;

          box-shadow:
            0 25px 60px rgba(15, 23, 42, 0.22);
        }

        .dark .studentsModal {
          background: #0f172a;
          color: #e2e8f0;

          border-color: #263449;
        }

        /* ================================================
           MODAL HEADER
        ================================================ */

        .studentsModalHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;

          padding: 22px 24px 18px;

          border-bottom: 1px solid #e2e8f0;
        }

        .dark .studentsModalHeader {
          border-color: #263449;
        }

        .studentsModalHeader h2 {
          margin: 0 0 5px;

          font-size: 22px;
        }

        .studentsModalHeader p {
          margin: 0;

          color: #64748b;
          font-size: 13px;
        }

        .dark .studentsModalHeader p {
          color: #94a3b8;
        }

        .studentsModalClose {
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

        .studentsModalClose:hover {
          background: rgba(148, 163, 184, 0.14);
        }

        /* ================================================
           FORM
        ================================================ */

        .studentsAddForm {
          padding: 22px 24px 24px;
        }

        .studentsFormGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 17px;
        }

        .studentsFormField {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .studentsFormField label {
          font-size: 13px;
          font-weight: 700;
        }

        .studentsFormField input,
        .studentsFormField select {
          width: 100%;
          box-sizing: border-box;

          min-height: 43px;

          padding: 10px 12px;

          border: 1px solid #cbd5e1;
          border-radius: 9px;

          background: #ffffff;
          color: #0f172a;

          font: inherit;

          outline: none;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .studentsFormField input:focus,
        .studentsFormField select:focus {
          border-color: #6366f1;

          box-shadow:
            0 0 0 3px
            rgba(99, 102, 241, 0.12);
        }

        .dark .studentsFormField input,
        .dark .studentsFormField select {
          background: #111c2e;
          color: #e2e8f0;

          border-color: #334155;
        }

        .studentsFormField small {
          color: #64748b;
          font-size: 11px;
          line-height: 1.4;
        }

        .dark .studentsFormField small {
          color: #94a3b8;
        }

        /* ================================================
           GENERATED ID NOTICE
        ================================================ */

        .studentsGeneratedIdNotice {
          margin-top: 18px;

          padding: 11px 13px;

          border-radius: 9px;

          background:
            rgba(99, 102, 241, 0.08);

          color: #4338ca;

          font-size: 13px;
        }

        .dark .studentsGeneratedIdNotice {
          background:
            rgba(129, 140, 248, 0.1);

          color: #a5b4fc;
        }

        /* ================================================
           FORM MESSAGES
        ================================================ */

        .studentsFormError,
        .studentsFormSuccess {
          margin-top: 14px;

          padding: 11px 13px;

          border-radius: 9px;

          font-size: 13px;
          font-weight: 600;
        }

        .studentsFormError {
          background:
            rgba(239, 68, 68, 0.09);

          color: #b91c1c;
        }

        .studentsFormSuccess {
          background:
            rgba(34, 197, 94, 0.1);

          color: #15803d;
        }

        /* ================================================
           MODAL ACTIONS
        ================================================ */

        .studentsModalActions {
          display: flex;
          justify-content: flex-end;
          align-items: center;

          gap: 10px;

          margin-top: 22px;
        }

        .studentsCancelBtn {
          min-height: 40px;

          padding: 9px 16px;

          border: 1px solid #cbd5e1;
          border-radius: 9px;

          background: transparent;
          color: inherit;

          font-weight: 600;

          cursor: pointer;
        }

        .studentsCancelBtn:hover {
          background:
            rgba(148, 163, 184, 0.1);
        }

        /* ================================================
           REFRESH SPINNER
        ================================================ */

        .studentsRefreshSpin {
          animation:
            studentsSpin 0.8s linear infinite;
        }

        @keyframes studentsSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ================================================
           RESPONSIVE
        ================================================ */

        @media (max-width: 700px) {

          .studentsModalOverlay {
            padding: 12px;
          }

          .studentsFormGrid {
            grid-template-columns: 1fr;
          }

          .studentsModalHeader,
          .studentsAddForm {
            padding-left: 18px;
            padding-right: 18px;
          }

          .studentsTableHeader {
            align-items: stretch;
            flex-direction: column;
          }

        }

      `}</style>
    </>
  );
}

/* ======================================================
   SIMPLE EMPTY-STATE ICON
====================================================== */

function UsersEmptyIcon() {
  return (
    <div
      style={{
        width: "52px",
        height: "52px",
        margin: "0 auto 12px",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "rgba(99, 102, 241, 0.09)",
        fontSize: "22px",
      }}
      aria-hidden="true"
    >
      👤
    </div>
  );
}