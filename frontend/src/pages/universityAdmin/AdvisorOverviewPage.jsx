import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { getAuthToken } from "../../utils/authSession";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function AdvisorOverviewPage({
  selectedAdvisor,
  setActive,
}) {
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  /* ======================================================
     LOAD STUDENTS ASSIGNED TO THIS ADVISOR
  ====================================================== */

  async function loadAssignedStudents() {
    if (!selectedAdvisor?.id) {
      setAssignedStudents([]);
      setLoadingStudents(false);
      return;
    }

    try {
      setLoadingStudents(true);
      setStudentsError("");

      const token = getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/students`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
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
            `Unable to load students (${response.status}).`
        );
      }

      const students = Array.isArray(data)
        ? data
        : Array.isArray(data?.students)
        ? data.students
        : [];

      /*
       * Only keep students assigned to the selected advisor.
       *
       * Example:
       * selectedAdvisor.id = "A003"
       * student.advisor_id = "A003"
       */
      const matchingStudents = students.filter((student) => {
        const advisorId =
          student.advisor_id ??
          student.advisor?.id ??
          student.advisor ??
          "";

        return (
          String(advisorId).trim().toLowerCase() ===
          String(selectedAdvisor.id).trim().toLowerCase()
        );
      });

      setAssignedStudents(matchingStudents);
    } catch (error) {
      console.error(
        "Unable to load assigned students:",
        error
      );

      setAssignedStudents([]);

      setStudentsError(
        error?.message ||
          "Unable to load assigned students."
      );
    } finally {
      setLoadingStudents(false);
    }
  }

  useEffect(() => {
    loadAssignedStudents();
  }, [selectedAdvisor?.id]);

  /* ======================================================
     HELPERS
  ====================================================== */

  function getStudentId(student) {
    return student.student_id ?? student.id ?? "—";
  }

  function getStudentName(student) {
    return (
      student.full_name ??
      student.name ??
      `Student ${getStudentId(student)}`
    );
  }

  function getProgram(student) {
    return (
      student.program ??
      student.major ??
      "Not specified"
    );
  }

  function getRisk(student) {
    const value =
      student.risk_label ??
      student.risk ??
      student.overall_risk ??
      "Unknown";

    const text = String(value).toLowerCase();

    if (text.includes("high")) {
      return "High";
    }

    if (
      text.includes("medium") ||
      text.includes("moderate")
    ) {
      return "Medium";
    }

    if (text.includes("low")) {
      return "Low";
    }

    return "Unknown";
  }

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
     NO ADVISOR SELECTED
  ====================================================== */

  if (!selectedAdvisor) {
    return (
      <div className="placeholderPanel">
        <h3>No advisor selected</h3>

        <p>
          Please go back and choose an advisor.
        </p>

        <button
          className="primaryActionBtn"
          type="button"
          onClick={() => setActive("advisors")}
        >
          Back to Advisors
        </button>
      </div>
    );
  }

  /* ======================================================
     WORKLOAD
  ====================================================== */

  const studentCount = loadingStudents
    ? selectedAdvisor.students ?? 0
    : assignedStudents.length;

  const highRiskCount = loadingStudents
    ? selectedAdvisor.highRisk ?? 0
    : assignedStudents.filter(
        (student) => getRisk(student) === "High"
      ).length;

  const workload =
    studentCount > 100
      ? "High"
      : studentCount > 60
      ? "Medium"
      : "Normal";

  /* ======================================================
     PAGE
  ====================================================== */

  return (
    <section className="studentsAdminPage">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="studentsAdminHeader">
        <div>
          <h2>{selectedAdvisor.name}</h2>

          <p>
            Admin overview of advisor workload and student
            intervention activity.
          </p>
        </div>

        <button
          className="primaryActionBtn"
          type="button"
          onClick={() => setActive("advisors")}
        >
          ← Back to Advisors
        </button>
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="studentsSummaryGrid">

        <div className="studentSummaryCard">
          <span>Advisor ID</span>
          <strong>{selectedAdvisor.id}</strong>
        </div>

        <div className="studentSummaryCard">
          <span>Total Students</span>
          <strong>{studentCount}</strong>
        </div>

        <div className="studentSummaryCard">
          <span>High Risk Students</span>
          <strong>{highRiskCount}</strong>
        </div>

        <div className="studentSummaryCard">
          <span>Workload</span>
          <strong>{workload}</strong>
        </div>

      </div>

      {/* ==================================================
          ADVISOR INFORMATION + WORKLOAD
      ================================================== */}

      <div className="adminTwoCol">

        <div className="adminPanel">

          <div className="panelHeader">
            <div>
              <h3>Advisor Information</h3>

              <p>
                Basic advisor profile details
              </p>
            </div>
          </div>

          <table className="adminTable">
            <tbody>

              <tr>
                <td>Name</td>
                <td>{selectedAdvisor.name}</td>
              </tr>

              <tr>
                <td>Email</td>
                <td>{selectedAdvisor.email}</td>
              </tr>

              <tr>
                <td>Department</td>

                <td>
                  {selectedAdvisor.department ||
                    "Not assigned"}
                </td>
              </tr>

              <tr>
                <td>Status</td>

                <td>
                  <span
                    className={`studentBadge ${
                      selectedAdvisor.status === "Active"
                        ? "badgeActive"
                        : "badgeMedium"
                    }`}
                  >
                    {selectedAdvisor.status}
                  </span>
                </td>
              </tr>

            </tbody>
          </table>

        </div>

        <div className="adminPanel">

          <div className="panelHeader">
            <div>
              <h3>Workload Summary</h3>

              <p>
                Advisor load based on assigned students
              </p>
            </div>
          </div>

          <div className="placeholderPanel">

            <h3
              style={{
                color:
                  workload === "High"
                    ? "#f43f5e"
                    : workload === "Medium"
                    ? "#f59e0b"
                    : "#10b981",
              }}
            >
              {workload} Workload
            </h3>

            <p>
              This advisor currently manages{" "}
              {studentCount}{" "}
              {studentCount === 1
                ? "student"
                : "students"}
              , including {highRiskCount} high-risk{" "}
              {highRiskCount === 1
                ? "student"
                : "students"}
              .
            </p>

          </div>

        </div>

      </div>

      {/* ==================================================
          ASSIGNED STUDENTS
      ================================================== */}

      <div
        className="adminPanel"
        style={{ marginTop: "18px" }}
      >

        <div className="studentsTableHeader">

          <div>
            <h3>Assigned Students</h3>

            <p>
              Students currently assigned to{" "}
              {selectedAdvisor.name}.
            </p>
          </div>

          <button
            type="button"
            className="tableActionBtn"
            onClick={loadAssignedStudents}
            disabled={loadingStudents}
          >
            <RefreshCw
              size={15}
              className={
                loadingStudents
                  ? "loginSpinner"
                  : ""
              }
            />

            {loadingStudents
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>

        {studentsError ? (
          <div className="placeholderPanel">
            <p>{studentsError}</p>
          </div>
        ) : loadingStudents ? (
          <div className="placeholderPanel">
            <p>Loading assigned students...</p>
          </div>
        ) : assignedStudents.length === 0 ? (
          <div className="placeholderPanel">
            <h3>No Assigned Students</h3>

            <p>
              There are currently no students assigned
              to {selectedAdvisor.name}.
            </p>
          </div>
        ) : (
          <table className="studentsAdminTable">

            <thead>
              <tr>
                <th>STUDENT</th>
                <th>STUDENT ID</th>
                <th>EMAIL</th>
                <th>PROGRAM</th>
                <th>RISK</th>
              </tr>
            </thead>

            <tbody>

              {assignedStudents.map((student) => {
                const studentId =
                  getStudentId(student);

                const studentName =
                  getStudentName(student);

                const risk =
                  getRisk(student);

                return (
                  <tr key={studentId}>

                    <td>
                      <div className="studentIdentity">

                        <div className="studentAvatar">
                          {studentName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {studentName}
                          </strong>
                        </div>

                      </div>
                    </td>

                    <td>{studentId}</td>

                    <td>
                      {student.email || "—"}
                    </td>

                    <td>
                      {getProgram(student)}
                    </td>

                    <td>
                      <span
                        className={`studentBadge ${getRiskClass(
                          risk
                        )}`}
                      >
                        {risk}
                      </span>
                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>
        )}

      </div>

      {/* ==================================================
          ACTION OVERVIEW
      ================================================== */}

      <div
        className="adminPanel"
        style={{ marginTop: "18px" }}
      >

        <div className="panelHeader">
          <div>
            <h3>Advisor Action Overview</h3>

            <p>
              Admin can monitor advisor follow-up
              activity here.
            </p>
          </div>
        </div>

        <div className="alertList">

          <div className="alertRow blueAlert">

            <div>1</div>

            <div>
              <h4>
                Assigned student monitoring
              </h4>

              <p>
                {studentCount === 0
                  ? "No students are currently assigned to this advisor."
                  : `${studentCount} ${
                      studentCount === 1
                        ? "student is"
                        : "students are"
                    } currently assigned to this advisor.`}
              </p>
            </div>

            <span>
              {studentCount > 0
                ? "Active"
                : "Pending"}
            </span>

          </div>

          <div className="alertRow yellowAlert">

            <div>2</div>

            <div>
              <h4>
                High-risk student follow-up
              </h4>

              <p>
                {highRiskCount > 0
                  ? `${highRiskCount} high-risk ${
                      highRiskCount === 1
                        ? "student requires"
                        : "students require"
                    } advisor review.`
                  : "No high-risk students are currently assigned."}
              </p>
            </div>

            <span>
              {highRiskCount > 0
                ? "Review"
                : "Clear"}
            </span>

          </div>

          <div className="alertRow redAlert">

            <div>3</div>

            <div>
              <h4>
                Intervention tracking
              </h4>

              <p>
                Meeting notes and action plans can be
                connected to advisor interventions later.
              </p>
            </div>

            <span>ETL Ready</span>

          </div>

        </div>

      </div>

    </section>
  );
}