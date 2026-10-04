import { useEffect, useMemo, useState } from "react";
import {
  LoaderCircle,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";

import { getAuthToken } from "../../utils/authSession";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const EMPTY_FORM = {
  email: "",
  password: "",
};

export default function AdvisorPage({
  setSelectedAdvisor,
  setActive,
}) {
  const [advisors, setAdvisors] = useState([]);
  const [students, setStudents] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showAddAdvisor, setShowAddAdvisor] =
    useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  /* ======================================================
     API REQUEST
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
     ADVISOR ID
     
     Your current User model does not have advisor_id.
     Therefore we use the database user id to create a
     display ID such as A003.
  ====================================================== */

  function makeAdvisorId(user) {
    if (user.advisor_id) {
      return String(user.advisor_id);
    }

    if (user.id !== undefined && user.id !== null) {
      return `A${String(user.id).padStart(3, "0")}`;
    }

    return "—";
  }

  /* ======================================================
     ADVISOR NAME

     At the moment /api/admin/users gives us email,
     username, role and id. Until the backend has an
     advisor profile/full_name field, make a readable
     name from the email.
  ====================================================== */

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
     NORMALIZE ADVISOR
  ====================================================== */

  function normalizeAdvisor(user) {
    const email =
      user.email ||
      user.username ||
      "";

    return {
      ...user,

      id: makeAdvisorId(user),

      userId:
        user.id ?? null,

      name: makeAdvisorName(user),

      email,

      department:
        user.department ||
        user.program ||
        "Not assigned",

      status:
        user.status ||
        "Active",

      students: 0,

      highRisk: 0,
    };
  }

  /* ======================================================
     NORMALIZE STUDENT
  ====================================================== */

  function normalizeStudent(student) {
    const riskValue =
      student.risk_label ??
      student.risk ??
      student.overall_risk ??
      "";

    const riskText =
      String(riskValue).toLowerCase();

    let risk = "Unknown";

    if (riskText.includes("high")) {
      risk = "High";
    } else if (
      riskText.includes("medium") ||
      riskText.includes("moderate")
    ) {
      risk = "Medium";
    } else if (riskText.includes("low")) {
      risk = "Low";
    }

    return {
      ...student,

      student_id:
        student.student_id ??
        student.id ??
        "",

      advisor_id:
        student.advisor_id ??
        "",

      risk,
    };
  }

  /* ======================================================
     LOAD ADVISORS + STUDENTS
  ====================================================== */

  async function loadData() {
    try {
      setLoading(true);
      setLoadError("");

      const [usersResponse, studentsResponse] =
        await Promise.all([
          apiRequest("/api/admin/users"),
          apiRequest("/api/admin/students"),
        ]);

      let usersData = null;
      let studentsData = null;

      try {
        usersData =
          await usersResponse.json();
      } catch {
        usersData = null;
      }

      try {
        studentsData =
          await studentsResponse.json();
      } catch {
        studentsData = null;
      }

      if (!usersResponse.ok) {
        throw new Error(
          usersData?.detail ||
            `Unable to load advisors (${usersResponse.status}).`
        );
      }

      if (!studentsResponse.ok) {
        throw new Error(
          studentsData?.detail ||
            `Unable to load students (${studentsResponse.status}).`
        );
      }

      /* ----------------------------------------------
         USERS
      ---------------------------------------------- */

      const rawUsers =
        Array.isArray(usersData)
          ? usersData
          : Array.isArray(usersData?.users)
          ? usersData.users
          : [];

      const advisorUsers =
        rawUsers.filter(
          (user) =>
            String(user.role)
              .trim()
              .toLowerCase() === "advisor"
        );

      /* ----------------------------------------------
         STUDENTS
      ---------------------------------------------- */

      const rawStudents =
        Array.isArray(studentsData)
          ? studentsData
          : Array.isArray(studentsData?.students)
          ? studentsData.students
          : [];

      const normalizedStudents =
        rawStudents.map(normalizeStudent);

      setStudents(normalizedStudents);

      /* ----------------------------------------------
         CALCULATE ADVISOR WORKLOAD
      ---------------------------------------------- */

      const normalizedAdvisors =
        advisorUsers.map((user) => {
          const advisor =
            normalizeAdvisor(user);

          const assigned =
            normalizedStudents.filter(
              (student) =>
                String(
                  student.advisor_id || ""
                ).trim() ===
                String(advisor.id).trim()
            );

          const highRisk =
            assigned.filter(
              (student) =>
                student.risk === "High"
            ).length;

          return {
            ...advisor,

            students: assigned.length,

            highRisk,

            assignedStudents: assigned,
          };
        });

      setAdvisors(normalizedAdvisors);
    } catch (error) {
      console.error(
        "Unable to load advisors:",
        error
      );

      setAdvisors([]);
      setStudents([]);

      setLoadError(
        error?.message ||
          "Unable to load advisors."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ======================================================
     SEARCH
  ====================================================== */

  const filteredAdvisors =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return advisors;
      }

      return advisors.filter(
        (advisor) => {
          const searchable = [
            advisor.id,
            advisor.name,
            advisor.email,
            advisor.department,
            advisor.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(query);
        }
      );
    }, [advisors, search]);

  /* ======================================================
     SUMMARY
  ====================================================== */

  const totalStudentsManaged =
    advisors.reduce(
      (sum, advisor) =>
        sum + advisor.students,
      0
    );

  const totalHighRisk =
    advisors.reduce(
      (sum, advisor) =>
        sum + advisor.highRisk,
      0
    );

  const activeAdvisors =
    advisors.filter(
      (advisor) =>
        advisor.status === "Active"
    ).length;

  /* ======================================================
     FORM
  ====================================================== */

  function openAddAdvisor() {
    setForm(EMPTY_FORM);
    setFormError("");
    setSuccessMessage("");
    setShowAddAdvisor(true);
  }

  function closeAddAdvisor() {
    if (creating) {
      return;
    }

    setShowAddAdvisor(false);
    setForm(EMPTY_FORM);
    setFormError("");
    setSuccessMessage("");
  }

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

  /* ======================================================
     CREATE ADVISOR
  ====================================================== */

  async function handleCreateAdvisor(event) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const email =
      form.email.trim().toLowerCase();

    const password =
      form.password;

    if (!email) {
      setFormError(
        "University email is required."
      );
      return;
    }

    if (
      !email.includes("@") ||
      !email.includes(".")
    ) {
      setFormError(
        "Please enter a valid university email."
      );
      return;
    }

    if (!password) {
      setFormError(
        "Password is required."
      );
      return;
    }

    if (password.length < 6) {
      setFormError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setCreating(true);

    try {
      /*
       * Your backend POST /api/admin/users
       * currently expects:
       *
       * {
       *   email,
       *   password,
       *   role
       * }
       */

      const response =
        await apiRequest(
          "/api/admin/users",
          {
            method: "POST",

            body: JSON.stringify({
              email,
              password,
              role: "advisor",
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
        let message =
          "Unable to create advisor.";

        if (
          typeof data?.detail ===
          "string"
        ) {
          message = data.detail;
        } else if (
          Array.isArray(data?.detail)
        ) {
          message =
            data.detail[0]?.msg ||
            message;
        }

        throw new Error(message);
      }

      setSuccessMessage(
        `Advisor account created successfully for ${
          data?.email || email
        }.`
      );

      setForm(EMPTY_FORM);

      await loadData();

      window.setTimeout(() => {
        setShowAddAdvisor(false);
        setSuccessMessage("");
      }, 1800);
    } catch (error) {
      console.error(
        "Unable to create advisor:",
        error
      );

      setFormError(
        error?.message ||
          "Unable to create advisor."
      );
    } finally {
      setCreating(false);
    }
  }

  /* ======================================================
     VIEW ADVISOR
  ====================================================== */

  function handleViewAdvisor(advisor) {
    if (
      typeof setSelectedAdvisor ===
      "function"
    ) {
      setSelectedAdvisor(advisor);
    }

    if (
      typeof setActive ===
      "function"
    ) {
      setActive("advisorOverview");
    }
  }

  /* ======================================================
     PAGE
  ====================================================== */

  return (
    <>
      <section className="studentsAdminPage">

        {/* HEADER */}

        <div className="studentsAdminHeader">
          <div>
            <h2>
              Advisors Management
            </h2>

            <p>
              Manage advisor accounts,
              workloads, assigned students,
              and intervention activity.
            </p>
          </div>

          <button
            className="primaryActionBtn"
            type="button"
            onClick={openAddAdvisor}
          >
            <UserPlus size={17} />

            Add Advisor
          </button>
        </div>

        {/* SUMMARY */}

        <div className="studentsSummaryGrid">

          <div className="studentSummaryCard">
            <span>
              Total Advisors
            </span>

            <strong>
              {advisors.length}
            </strong>
          </div>

          <div className="studentSummaryCard">
            <span>
              Students Managed
            </span>

            <strong>
              {totalStudentsManaged}
            </strong>
          </div>

          <div className="studentSummaryCard">
            <span>
              High Risk Assigned
            </span>

            <strong>
              {totalHighRisk}
            </strong>
          </div>

          <div className="studentSummaryCard">
            <span>
              Active Advisors
            </span>

            <strong>
              {activeAdvisors}
            </strong>
          </div>

        </div>

        {/* DIRECTORY */}

        <div className="studentsTablePanel">

          <div className="studentsTableTop">

            <div>
              <h3>
                Advisor Directory
              </h3>

              <p>
                {loading
                  ? "Loading advisors..."
                  : `${filteredAdvisors.length} of ${advisors.length} advisors shown`}
              </p>
            </div>

            <div className="advisorDirectoryActions">

              <div className="advisorSearchWrap">

                <Search
                  size={16}
                  className="advisorSearchIcon"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search advisors..."
                />

              </div>

              <button
                className="tableActionBtn"
                type="button"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw
                  size={15}
                  className={
                    loading
                      ? "advisorSpin"
                      : ""
                  }
                />

                Refresh
              </button>

            </div>

          </div>

          {/* ERROR */}

          {loadError ? (
            <div className="advisorError">
              {loadError}
            </div>
          ) : null}

          {/* LOADING */}

          {loading ? (
            <div className="advisorLoading">
              <LoaderCircle
                size={28}
                className="advisorSpin"
              />

              <p>
                Loading advisors...
              </p>
            </div>
          ) : null}

          {/* TABLE */}

          {!loading ? (
            <div className="advisorTableScroll">

              <table className="studentsAdminTable">

                <thead>
                  <tr>
                    <th>
                      ADVISOR
                    </th>

                    <th>
                      ADVISOR ID
                    </th>

                    <th>
                      EMAIL
                    </th>

                    <th>
                      DEPARTMENT
                    </th>

                    <th>
                      STUDENTS
                    </th>

                    <th>
                      HIGH RISK
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      ACTION
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredAdvisors.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="advisorEmpty"
                      >
                        {search
                          ? "No advisors match your search."
                          : "No advisor accounts have been created yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredAdvisors.map(
                      (advisor) => (
                        <tr
                          key={
                            advisor.userId ??
                            advisor.email
                          }
                        >

                          <td>
                            <div className="studentIdentity">

                              <div className="studentAvatar">
                                {advisor.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {advisor.name}
                                </strong>

                                <span>
                                  Advisor
                                </span>
                              </div>

                            </div>
                          </td>

                          <td>
                            {advisor.id}
                          </td>

                          <td>
                            {advisor.email}
                          </td>

                          <td>
                            {advisor.department}
                          </td>

                          <td>
                            <strong>
                              {advisor.students}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={
                                advisor.highRisk >
                                0
                                  ? "studentBadge badgeHigh"
                                  : "studentBadge badgeActive"
                              }
                            >
                              {
                                advisor.highRisk
                              }
                            </span>
                          </td>

                          <td>
                            <span className="studentBadge badgeActive">
                              {
                                advisor.status
                              }
                            </span>
                          </td>

                          <td>
                            <button
                              className="tableActionBtn"
                              type="button"
                              onClick={() =>
                                handleViewAdvisor(
                                  advisor
                                )
                              }
                            >
                              View Advisor
                            </button>
                          </td>

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

            </div>
          ) : null}

        </div>
      </section>

      {/* ==================================================
          ADD ADVISOR MODAL
      ================================================== */}

      {showAddAdvisor ? (
        <div
          className="advisorModalOverlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddAdvisor();
            }
          }}
        >

          <div
            className="advisorModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-advisor-title"
          >

            {/* HEADER */}

            <div className="advisorModalHeader">

              <div>
                <h2 id="add-advisor-title">
                  Add Advisor
                </h2>

                <p>
                  Create an advisor login
                  account using their university
                  email address.
                </p>
              </div>

              <button
                className="advisorModalClose"
                type="button"
                onClick={closeAddAdvisor}
                disabled={creating}
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              className="advisorAddForm"
              onSubmit={
                handleCreateAdvisor
              }
            >

              <div className="advisorFormField">

                <label htmlFor="advisor-email">
                  University Email *
                </label>

                <input
                  id="advisor-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={
                    handleFormChange
                  }
                  placeholder="advisor@university.edu"
                  autoComplete="email"
                  disabled={creating}
                  autoFocus
                />

                <small>
                  This email will also be
                  used as the advisor's
                  login username.
                </small>

              </div>

              <div className="advisorFormField">

                <label htmlFor="advisor-password">
                  Initial Password *
                </label>

                <input
                  id="advisor-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={
                    handleFormChange
                  }
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  disabled={creating}
                />

              </div>

              <div className="advisorAccountNotice">

                <strong>
                  Login:
                </strong>{" "}

                Advisor will sign in using
                their university email and
                password.

              </div>

              {formError ? (
                <div className="advisorFormError">
                  {formError}
                </div>
              ) : null}

              {successMessage ? (
                <div className="advisorFormSuccess">
                  {successMessage}
                </div>
              ) : null}

              <div className="advisorModalActions">

                <button
                  className="advisorCancelBtn"
                  type="button"
                  onClick={closeAddAdvisor}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  className="primaryActionBtn"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="advisorSpin"
                      />

                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus
                        size={16}
                      />

                      Create Advisor
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      ) : null}

      {/* ==================================================
          LOCAL CSS
      ================================================== */}

      <style>{`

        .advisorDirectoryActions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .advisorSearchWrap {
          position: relative;
        }

        .advisorSearchWrap input {
          min-width: 220px;
          padding-left: 36px;
        }

        .advisorSearchIcon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.55;
          pointer-events: none;
        }

        .advisorTableScroll {
          overflow-x: auto;
        }

        .advisorLoading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding: 42px 20px;

          color: #64748b;
        }

        .advisorError {
          margin: 16px 0;
          padding: 12px 14px;

          border-radius: 10px;

          background:
            rgba(239, 68, 68, 0.08);

          color: #b91c1c;

          font-size: 14px;
        }

        .advisorEmpty {
          text-align: center;
          color: #94a3b8;
          padding: 32px !important;
        }

        /* ================================================
           MODAL
        ================================================ */

        .advisorModalOverlay {
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

        .advisorModal {
          width: min(520px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;

          background: #ffffff;
          color: #0f172a;

          border:
            1px solid #e2e8f0;

          border-radius: 18px;

          box-shadow:
            0 25px 60px
            rgba(15, 23, 42, 0.22);
        }

        .dark .advisorModal {
          background: #0f172a;
          color: #e2e8f0;

          border-color: #263449;
        }

        /* ================================================
           MODAL HEADER
        ================================================ */

        .advisorModalHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          padding: 22px 24px 18px;

          border-bottom:
            1px solid #e2e8f0;
        }

        .dark .advisorModalHeader {
          border-color: #263449;
        }

        .advisorModalHeader h2 {
          margin: 0 0 5px;
          font-size: 22px;
        }

        .advisorModalHeader p {
          margin: 0;

          color: #64748b;

          font-size: 13px;
          line-height: 1.5;
        }

        .dark .advisorModalHeader p {
          color: #94a3b8;
        }

        .advisorModalClose {
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

        .advisorModalClose:hover {
          background:
            rgba(148, 163, 184, 0.14);
        }

        /* ================================================
           FORM
        ================================================ */

        .advisorAddForm {
          padding: 22px 24px 24px;
        }

        .advisorFormField {
          display: flex;
          flex-direction: column;
          gap: 7px;

          margin-bottom: 17px;
        }

        .advisorFormField label {
          font-size: 13px;
          font-weight: 700;
        }

        .advisorFormField input {
          width: 100%;
          box-sizing: border-box;

          min-height: 43px;

          padding: 10px 12px;

          border:
            1px solid #cbd5e1;

          border-radius: 9px;

          background: #ffffff;
          color: #0f172a;

          font: inherit;

          outline: none;
        }

        .advisorFormField input:focus {
          border-color: #6366f1;

          box-shadow:
            0 0 0 3px
            rgba(99, 102, 241, 0.12);
        }

        .dark .advisorFormField input {
          background: #111c2e;
          color: #e2e8f0;

          border-color: #334155;
        }

        .advisorFormField small {
          color: #64748b;

          font-size: 11px;
          line-height: 1.4;
        }

        .dark .advisorFormField small {
          color: #94a3b8;
        }

        /* ================================================
           INFO / ERROR / SUCCESS
        ================================================ */

        .advisorAccountNotice {
          margin-top: 4px;

          padding: 11px 13px;

          border-radius: 9px;

          background:
            rgba(99, 102, 241, 0.08);

          color: #4338ca;

          font-size: 13px;
        }

        .dark .advisorAccountNotice {
          background:
            rgba(129, 140, 248, 0.1);

          color: #a5b4fc;
        }

        .advisorFormError,
        .advisorFormSuccess {
          margin-top: 14px;

          padding: 11px 13px;

          border-radius: 9px;

          font-size: 13px;
          font-weight: 600;
        }

        .advisorFormError {
          background:
            rgba(239, 68, 68, 0.09);

          color: #b91c1c;
        }

        .advisorFormSuccess {
          background:
            rgba(34, 197, 94, 0.1);

          color: #15803d;
        }

        /* ================================================
           ACTIONS
        ================================================ */

        .advisorModalActions {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 10px;

          margin-top: 22px;
        }

        .advisorCancelBtn {
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

        .advisorCancelBtn:hover {
          background:
            rgba(148, 163, 184, 0.1);
        }

        .primaryActionBtn,
        .tableActionBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 7px;
        }

        /* ================================================
           SPINNER
        ================================================ */

        .advisorSpin {
          animation:
            advisorSpinAnimation
            0.8s linear infinite;
        }

        @keyframes advisorSpinAnimation {
          to {
            transform: rotate(360deg);
          }
        }

        /* ================================================
           MOBILE
        ================================================ */

        @media (max-width: 700px) {

          .advisorModalOverlay {
            padding: 12px;
          }

          .advisorDirectoryActions {
            width: 100%;
            align-items: stretch;
            flex-direction: column;
          }

          .advisorSearchWrap,
          .advisorSearchWrap input {
            width: 100%;
          }

          .advisorModalHeader,
          .advisorAddForm {
            padding-left: 18px;
            padding-right: 18px;
          }

        }

      `}</style>
    </>
  );
}