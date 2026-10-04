import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CloudUpload,
  FileText,
  HelpCircle,
  Home,
  Link2,
  LogOut,
  Settings,
  Shield,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";

import { clearAuthSession, getAuthSession } from "../../utils/authSession";
import { useTheme } from "../../context/ThemeContext";

import StudentsPage from "./StudentsPage";
import StudentOverviewPage from "./StudentOverviewPage";
import AdvisorPage from "./AdvisorPage";
import AdvisorOverviewPage from "./AdvisorOverviewPage";
import UploadPrediction from "./UploadPrediction";
import ReportsPage from "./ReportsPage";
import SettingsPage from "./SettingsPage";
import HelpCenterPage from "./HelpCenterPage";
import SystemLogsPage from "./SystemLogsPage";

import "../../styles/admin.css";
import "../../styles/uploadPrediction.css";

const advisorsData = [];
const uploadsData = [];
const alertsData = [];

function getDefaultActiveTerm() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month <= 4) return `Spring ${year}`;
  if (month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [active, setActive] = useState("dashboard");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);

  const [studentsData, setStudentsData] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [activeTerm, setActiveTerm] = useState(getDefaultActiveTerm);

  const { darkMode, setDarkMode } = useTheme();
  const session = getAuthSession();
const adminName = session?.name || session?.userId || "Admin User";
const adminEmail = session?.userId || "admin@university.edu";
const adminInitial = adminName.charAt(0).toUpperCase();

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoadingStudents(true);
        setStudentsError("");

        const response = await fetch("/api/admin/students");

        if (!response.ok) throw new Error("Failed to load students");

        const data = await response.json();
        setStudentsData(data);
      } catch (error) {
        console.error(error);
        setStudentsData(
          data.map((s) => ({
            id: s.student_id,
            name: s.name,
            email: s.email,
            program: s.program || s.major,
            advisor: s.advisor_name || "Assigned",
            status: "Active",
            risk:
            s.overall_risk === "High Risk"
            ? "High"
            : s.overall_risk === "Moderate Risk"
            ? "Medium"
            : "Low",
            riskScore: s.risk_score,
            recommendation: s.recommendation,
            courses: s.courses || [],
          }))
        );
        setStudentsError("Students will appear after ETL/backend is connected.");
      } finally {
        setLoadingStudents(false);
      }
    }

    fetchStudents();
  }, []);

  useEffect(() => {
    async function fetchAdminSummary() {
      try {
        const response = await fetch("/api/admin/dashboard");

        if (!response.ok) throw new Error("Failed to load admin summary");

        const payload = await response.json();
        const nextActiveTerm =
          payload?.active_term ||
          payload?.activeTerm ||
          payload?.term ||
          payload?.current_term;

        if (nextActiveTerm) {
          setActiveTerm(String(nextActiveTerm));
        }
      } catch (error) {
        console.error(error);
      }
    }

    fetchAdminSummary();
  }, []);

  const filteredStudents = useMemo(() => {
    const term = studentSearch.toLowerCase().trim();

    if (!term) return studentsData;

    return studentsData.filter((student) =>
      `${student.id} ${student.name} ${student.email} ${student.program} ${student.advisor} ${student.status} ${student.risk}`
        .toLowerCase()
        .includes(term)
    );
  }, [studentSearch, studentsData]);
  const advisorsData = [
  { id: "A001", name: "Dr. Sarah Johnson", email: "sarah.johnson@northbridge.edu", program: "Computer Science", students: 70, highRisk: 3 },
  { id: "A002", name: "Prof. Michael Chen", email: "michael.chen@northbridge.edu", program: "Business Administration", students: 70, highRisk: 3 },
  { id: "A003", name: "Dr. Emily Carter", email: "emily.carter@northbridge.edu", program: "Cybersecurity", students: 70, highRisk: 3 },
  { id: "A004", name: "Dr. James Wilson", email: "james.wilson@northbridge.edu", program: "Data Science", students: 70, highRisk: 3 },
  { id: "A005", name: "Prof. Priya Patel", email: "priya.patel@northbridge.edu", program: "Software Engineering", students: 70, highRisk: 3 },
  { id: "A006", name: "Dr. David Miller", email: "david.miller@northbridge.edu", program: "Information Technology", students: 70, highRisk: 3 },
  { id: "A007", name: "Dr. Hannah Lee", email: "hannah.lee@northbridge.edu", program: "AI & Machine Learning", students: 70, highRisk: 3 },
  { id: "A008", name: "Prof. Robert Garcia", email: "robert.garcia@northbridge.edu", program: "Finance", students: 70, highRisk: 3 },
  { id: "A009", name: "Dr. Amanda Brown", email: "amanda.brown@northbridge.edu", program: "Marketing", students: 70, highRisk: 3 },
  { id: "A010", name: "Dr. Kevin Thomas", email: "kevin.thomas@northbridge.edu", program: "Psychology", students: 70, highRisk: 3 },
];
   const totalStudents = 700;
   const totalAdvisors = 10;
   const pendingUploads = 0;
   const atRiskStudents = 30;
  const assignedStudents = 700;
  const unassignedStudents = 0;

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  function getPageTitle() {
    if (active === "dashboard") return "Dashboard Overview";
    if (active === "students") return "Students Management";
    if (active === "studentOverview") return "Student Dashboard";
    if (active === "advisors") return "Advisors Management";
    if (active === "advisorOverview") return "Advisor Dashboard";
    if (active === "uploads") return "Upload Data";
    if (active === "reports") return "Reports";
    if (active === "settings") return "Settings";
    if (active === "helpCenter") return "Help Center";
    if (active === "systemLogs") return "System Logs";
    return active.charAt(0).toUpperCase() + active.slice(1);
  }

  function getPageSubtitle() {
    if (active === "dashboard") return "Monitor and manage your university system";
    if (active === "students") return "Manage student access, advisor assignments, and risk status";
    if (active === "studentOverview") return "Admin read-only view of student prediction dashboard";
    if (active === "advisors") return "Monitor advisor workload and assigned students";
    if (active === "advisorOverview") return "Admin read-only view of advisor workload and activity";
    if (active === "uploads") return "Upload CSV files for ETL and ML prediction";
    if (active === "reports") return "Review prediction reports and ML insights";
    if (active === "settings") return "Manage personalization, institution, and prediction settings";
    if (active === "helpCenter") return "System guidance and support information";
    if (active === "systemLogs") return "Monitor uploads, ETL processing, and ML system activity";
    return "This section will be available soon";
  }

  function renderDashboard() {
    return (
      <>
        <section className="statsGrid">
          <div className="statCard">
            <div className="statIcon blue">
              <Users size={32} />
            </div>
            <div>
              <p>Total Students</p>
              <h3>{totalStudents}</h3>
              <span className="positive">Loaded from ETL/backend</span>
            </div>
            <div className="miniSpark blueSpark" />
          </div>

          <div className="statCard">
            <div className="statIcon purple">
              <UserPlus size={32} />
            </div>
            <div>
              <p>Total Advisors</p>
              <h3>{totalAdvisors}</h3>
              <span className="positive">Waiting for advisor data</span>
            </div>
            <div className="miniSpark purpleSpark" />
          </div>

          <div className="statCard">
            <div className="statIcon orange">
              <CloudUpload size={32} />
            </div>
            <div>
              <p>Pending Uploads</p>
              <h3>{pendingUploads}</h3>
              <span className="warningText">No pending files</span>
            </div>
            <div className="miniSpark orangeSpark" />
          </div>

          <div className="statCard">
            <div className="statIcon red">
              <TriangleAlert size={32} />
            </div>
            <div>
              <p>At-Risk Students</p>
              <h3>{atRiskStudents}</h3>
              <span className="negative">Based on ML prediction</span>
            </div>
            <div className="miniSpark redSpark" />
          </div>
        </section>

        <section className="adminTwoCol">
          <div className="adminPanel">
            <div className="panelHeader">
              <div>
                <h3>Quick Actions</h3>
                <p>Start by uploading institution data or adding records.</p>
              </div>
            </div>

            <div className="quickGrid">
              <button className="quickCard" type="button" onClick={() => setActive("students")}>
                <div className="quickIcon blue">
                  <UserPlus size={28} />
                </div>
                <h4>Add Student</h4>
                <p>Create a new student account and profile</p>
                <span>→</span>
              </button>

              <button className="quickCard" type="button" onClick={() => setActive("advisors")}>
                <div className="quickIcon purple">
                  <UserPlus size={28} />
                </div>
                <h4>Add Advisor</h4>
                <p>Create a new advisor account and profile</p>
                <span>→</span>
              </button>

              <button className="quickCard" type="button" onClick={() => setActive("uploads")}>
                <div className="quickIcon green">
                  <CloudUpload size={28} />
                </div>
                <h4>Upload Data</h4>
                <p>Upload CSV files for ETL and ML prediction</p>
                <span>→</span>
              </button>

              <button className="quickCard" type="button" onClick={() => setActive("students")}>
                <div className="quickIcon amber">
                  <Link2 size={28} />
                </div>
                <h4>Assign Advisor</h4>
                <p>Assign students to advisors</p>
                <span>→</span>
              </button>
            </div>
          </div>

          <div className="adminPanel">
            <div className="panelHeader">
              <div>
                <h3>System Alerts</h3>
                <p>Important notifications that need attention</p>
              </div>
              <button type="button">View All</button>
            </div>

            <div className="placeholderPanel">
              No alerts yet. Alerts will appear after data upload.
            </div>
          </div>
        </section>

        <section className="adminTwoCol lower">
          <div className="adminPanel">
            <div className="panelHeader">
              <div>
                <h3>Recent Uploads</h3>
                <p>Latest uploaded files and their status</p>
              </div>
              <button type="button" onClick={() => setActive("uploads")}>
                View All
              </button>
            </div>

            <div className="placeholderPanel">
              No uploads yet. Upload student and advisor data to begin.
            </div>
          </div>

          <div className="adminPanel">
            <div className="panelHeader">
              <div>
                <h3>Advisor Workload</h3>
                <p>Student distribution across advisors</p>
              </div>
              <button type="button" onClick={() => setActive("advisors")}>
                View All
              </button>
            </div>

            <div className="placeholderPanel">
              10 advisors assigned across Northbridge University programs.
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className={`adminPage ${darkMode ? "adminPage--dark" : "adminPage--light"}`}>
      <aside className="adminSidebar">
        <div>
          <div className="adminBrand">
            <div className="adminShield">
              <Shield size={30} />
            </div>

            <div>
              <h1>
                Grad<span>Glow</span>
              </h1>
              <p>Admin Panel</p>
            </div>
          </div>

          <p className="adminMenuLabel">MAIN MENU</p>

          <nav className="adminNav">
            <button className={active === "dashboard" ? "active" : ""} onClick={() => setActive("dashboard")} type="button">
              <Home size={20} /> Dashboard
            </button>

            <button className={active === "students" || active === "studentOverview" ? "active" : ""} onClick={() => setActive("students")} type="button">
              <Users size={20} /> Students
            </button>

            <button className={active === "advisors" || active === "advisorOverview" ? "active" : ""} onClick={() => setActive("advisors")} type="button">
              <UserPlus size={20} /> Advisors
            </button>

            <button className={active === "uploads" ? "active" : ""} onClick={() => setActive("uploads")} type="button">
              <CloudUpload size={20} /> Uploads
            </button>

            <button className={active === "reports" ? "active" : ""} onClick={() => setActive("reports")} type="button">
              <BarChart3 size={20} /> Reports
            </button>

            <button className={active === "settings" ? "active" : ""} onClick={() => setActive("settings")} type="button">
              <Settings size={20} /> Settings
            </button>
          </nav>

          <div className="adminDivider" />

          <p className="adminMenuLabel">SUPPORT</p>

          <nav className="adminNav">
            <button className={active === "helpCenter" ? "active" : ""} onClick={() => setActive("helpCenter")} type="button">
              <HelpCircle size={20} /> Help Center
            </button>

            <button className={active === "systemLogs" ? "active" : ""} onClick={() => setActive("systemLogs")} type="button">
              <FileText size={20} /> System Logs
            </button>
          </nav>
        </div>

        <div className="adminUserArea">
          <div className="adminUserCard">
            <div className="adminAvatar">{adminInitial}</div>
            <div>
              <h4>{adminName}</h4>
              <p>{adminEmail}</p>
            </div>
          </div>

          <button className="adminLogout" onClick={handleLogout} type="button">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="adminMain">
        <header className="adminHeader">
          <div>
            <h2>{getPageTitle()}</h2>
            <p>{getPageSubtitle()}</p>
          </div>

          <div className="adminHeaderRight">
            <div className="adminTopCard">
              <span>Active Term</span>
              <strong>{activeTerm}</strong>
              <CalendarDays size={18} />
            </div>

            <div className="adminTopCard">
              <span>System Status</span>
              <strong className="greenDot">Ready</strong>
            </div>

            <button className="adminBell" type="button">
              <Bell size={22} />
              <span>{alertsData.length}</span>
            </button>
          </div>
        </header>

        {studentsError && active === "students" && (
          <div className="placeholderPanel" style={{ marginBottom: "18px" }}>
            {studentsError}
          </div>
        )}

        {loadingStudents && active === "students" && (
          <div className="placeholderPanel" style={{ marginBottom: "18px" }}>
            Loading students...
          </div>
        )}

        {active === "dashboard" && renderDashboard()}

        {active === "students" && (
          <StudentsPage
            filteredStudents={filteredStudents}
            totalStudents={totalStudents}
            assignedStudents={assignedStudents}
            unassignedStudents={unassignedStudents}
            atRiskStudents={atRiskStudents}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            setSelectedStudent={setSelectedStudent}
            setActive={setActive}
          />
        )}

        {active === "studentOverview" && (
          <StudentOverviewPage selectedStudent={selectedStudent} setActive={setActive} setSelectedStudent={setSelectedStudent} />
        )}

        {active === "advisors" && (
          <AdvisorPage
            advisors={advisorsData}
            loadingAdvisors={false}
            advisorsError=""
            setSelectedAdvisor={setSelectedAdvisor}
            setActive={setActive}
          />
        )}

        {active === "advisorOverview" && (
          <AdvisorOverviewPage selectedAdvisor={selectedAdvisor} setActive={setActive} />
        )}

        {active === "uploads" && <UploadPrediction />}
        {active === "reports" && <ReportsPage />}
        {active === "settings" && <SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} />}
        {active === "helpCenter" && <HelpCenterPage />}
        {active === "systemLogs" && <SystemLogsPage />}
      </main>
    </div>
  );
}
