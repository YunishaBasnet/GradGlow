import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  Filter,
  HelpCircle,
  LogOut,
  MailOpen,
  Moon,
  MoreVertical,
  Search,
  Settings,
  Sun,
  TrendingUp,
  User,
  Users,
  Activity,
  Brain,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTheme } from "../../context/ThemeContext";
import { clearAuthSession } from "../../utils/authSession";
import defaultAvatar from "../../assets/default-avatar.png";
import "../../styles/advisor.css";

const RISK_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

const DEMO_STUDENTS = [
  {
    id: "100001",
    name: "Emma Wilson",
    email: "emma.wilson100001@northbridge.edu",
    enrollment: "CS101 Spring 2026",
    program: "Computer Science",
    course: "CS101",
    risk: "High Risk",
    riskScore: 88,
    updated: "Latest prediction",
    topFactors: "Low attendance, late submissions, reduced LMS engagement",
    gpa: 2.1,
  },
  {
    id: "100002",
    name: "Michael Brown",
    email: "michael.brown100002@northbridge.edu",
    enrollment: "CS201 Spring 2026",
    program: "Computer Science",
    course: "CS201",
    risk: "Medium Risk",
    riskScore: 64,
    updated: "Latest prediction",
    topFactors: "Database assignment delay",
    gpa: 2.8,
  },
  {
    id: "100003",
    name: "Sophia Davis",
    email: "sophia.davis100003@northbridge.edu",
    enrollment: "MATH210 Spring 2026",
    program: "Computer Science",
    course: "MATH210",
    risk: "Low Risk",
    riskScore: 24,
    updated: "Latest prediction",
    topFactors: "Stable performance",
    gpa: 3.6,
  },
  {
    id: "100004",
    name: "Daniel Moore",
    email: "daniel.moore100004@northbridge.edu",
    enrollment: "CS101 Spring 2026",
    program: "Computer Science",
    course: "CS101",
    risk: "High Risk",
    riskScore: 82,
    updated: "Latest prediction",
    topFactors: "Attendance drop, missing lab",
    gpa: 2.2,
  },
  {
    id: "100005",
    name: "Olivia Johnson",
    email: "olivia.johnson100005@northbridge.edu",
    enrollment: "ENG110 Spring 2026",
    program: "Computer Science",
    course: "ENG110",
    risk: "Low Risk",
    riskScore: 18,
    updated: "Latest prediction",
    topFactors: "On track",
    gpa: 3.8,
  },
];

const DEMO_ENGAGEMENT = [
  { week: "Week 4", meetings: 6, resolved: 3 },
  { week: "Week 8", meetings: 10, resolved: 7 },
  { week: "Week 12", meetings: 12, resolved: 9 },
];

const DEMO_COURSE_RISK = [
  { course: "CS101", highRiskPercent: 28 },
  { course: "CS201", highRiskPercent: 16 },
  { course: "MATH210", highRiskPercent: 12 },
  { course: "ENG110", highRiskPercent: 4 },
];

export default function AdvisorDashboard() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All Students");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [visibleCount, setVisibleCount] = useState(8);

  const advisorPhoto = defaultAvatar;
  const students = DEMO_STUDENTS;
  const appointments = [{ status: "pending" }, { status: "pending" }, { status: "completed" }];
  const engagementData = DEMO_ENGAGEMENT;
  const courseRiskData = DEMO_COURSE_RISK;

  const courses = useMemo(() => {
    return ["All Courses", ...new Set(students.map((student) => student.course))];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const risk = String(student.risk || "").toLowerCase();

      const searchable = `
        ${student.name}
        ${student.email}
        ${student.enrollment}
        ${student.program}
        ${student.course}
        ${student.id}
      `.toLowerCase();

      const matchesSearch = searchable.includes(searchTerm.toLowerCase().trim());

      const matchesRisk =
        riskFilter === "All Students" ||
        (riskFilter === "High Risk" && risk.includes("high")) ||
        (riskFilter === "Needs Attention" && risk.includes("medium")) ||
        (riskFilter === "On Track" && risk.includes("low"));

      const matchesCourse = courseFilter === "All Courses" || student.course === courseFilter;

      return matchesSearch && matchesRisk && matchesCourse;
    });
  }, [students, searchTerm, riskFilter, courseFilter]);

  const visibleStudents = filteredStudents.slice(0, visibleCount);

  const totalStudents = 70;
  const atRiskStudents = 8;
  const pendingAppointments = appointments.filter((a) => a.status === "pending").length;
  const avgGpa = "2.92";

  const riskOverviewData = [
    { name: "High Risk", value: 8, key: "high" },
    { name: "Medium Risk", value: 42, key: "medium" },
    { name: "Low Risk", value: 20, key: "low" },
  ];

  const priorityQueue = [...students]
    .filter((student) => String(student.risk).toLowerCase().includes("high"))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const highRiskPercent = Math.round((atRiskStudents / totalStudents) * 100);

  const totalMeetings = engagementData.reduce((total, item) => total + item.meetings, 0);
  const resolvedCases = engagementData.reduce((total, item) => total + item.resolved, 0);
  const resolutionRate = `${Math.round((resolvedCases / totalMeetings) * 100)}%`;

  function getInitials(name = "") {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "ST"
    );
  }

  function getRiskClass(risk) {
    const value = String(risk || "").toLowerCase();

    if (value.includes("high")) return "riskBadge riskBadge--high";
    if (value.includes("medium")) return "riskBadge riskBadge--attention";
    return "riskBadge riskBadge--track";
  }

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`advisorPage ${darkMode ? "advisorPage--dark" : ""}`}>
      <div className="advisorShell">
        <header className="advisorHeader">
          <div className="advisorHeaderLeft">
            <span className="advisorEyebrow">🎓 Northbridge University</span>
            <h1>Advisor Dashboard</h1>
            <p>Dr. Sarah Johnson · Computer Science Advising</p>
          </div>

          <div className="advisorHeaderActions">
            <select
              className="filterSelect"
              value={selectedWeek}
              onChange={(event) => setSelectedWeek(Number(event.target.value))}
            >
              <option value={4}>Week 4</option>
              <option value={8}>Week 8</option>
              <option value={12}>Week 12</option>
            </select>

            <button className="advisorThemeBtn" type="button" onClick={toggleTheme}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="advisorAvatarBtn" type="button" onClick={() => navigate("/advisor/profile")}>
              <img className="advisorAvatar" src={advisorPhoto} alt="Advisor profile" />
            </button>

            <div className="headerMenu">
              <button
                className="advisorIconBtn"
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
              >
                <MoreVertical size={20} />
              </button>

              {menuOpen && (
                <div className="headerMenuDropdown">
                  <button className="headerMenuItem" onClick={() => navigate("/advisor/profile")}>
                    <User size={17} /> Profile
                  </button>
                  <button className="headerMenuItem" onClick={() => navigate("/advisor/messages")}>
                    <Settings size={17} /> Messages
                  </button>
                  <button className="headerMenuItem" onClick={() => navigate("/advisor/appointments")}>
                    <MailOpen size={17} /> Appointments
                  </button>
                  <button className="headerMenuItem" onClick={() => navigate("/advisor/help")}>
                    <HelpCircle size={17} /> Get Help
                  </button>
                  <button className="headerMenuItem headerMenuItem--danger" onClick={handleLogout}>
                    <LogOut size={17} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="advisorMetrics">
          <MetricCard icon={<Users className="metricIcon metricIcon--blue" />} trend="Live" label="Assigned Students" value={totalStudents} sub="Current advising portfolio" />
          <MetricCard icon={<AlertTriangle className="metricIcon metricIcon--red" />} trend="Priority" danger label="High Risk" value={atRiskStudents} sub="Students needing outreach" />
          <MetricCard icon={<CalendarDays className="metricIcon metricIcon--green" />} trend="Pending" label="Appointments" value={pendingAppointments} sub="Awaiting response" />
          <MetricCard icon={<TrendingUp className="metricIcon metricIcon--purple" />} trend="Average" label="Avg GPA" value={avgGpa} sub="Academic standing" />
        </section>

        <section className="advisorChartsGrid">
          <div className="advisorChartCard">
            <div className="sectionHeader sectionHeader--tight">
              <div>
                <h3>Model Status</h3>
                <p>Prediction workflow health summary.</p>
              </div>
              <Brain size={22} />
            </div>

            <div className="trendStats">
              <div className="trendStatBox">
                <div className="trendStatLabel">Status</div>
                <div className="trendStatValue">Active</div>
              </div>
              <div className="trendStatBox">
                <div className="trendStatLabel">Prediction Week</div>
                <div className="trendStatValue">W{selectedWeek}</div>
              </div>
              <div className="trendStatBox">
                <div className="trendStatLabel">High Risk</div>
                <div className="trendStatValue">{highRiskPercent}%</div>
              </div>
            </div>
          </div>

          <div className="advisorChartCard">
            <div className="sectionHeader sectionHeader--tight">
              <div>
                <h3>Priority Outreach Queue</h3>
                <p>Highest-risk students to contact first.</p>
              </div>
              <Target size={22} />
            </div>

            <div className="priorityList">
              {priorityQueue.map((student) => (
                <div className="priorityItem" key={student.id}>
                  <div className="studentCell">
                    <div className="studentAvatar">{getInitials(student.name)}</div>
                    <div>
                      <div className="studentName">{student.name}</div>
                      <div className="studentSub">{student.course}</div>
                    </div>
                  </div>
                  <span className={getRiskClass(student.risk)}>{student.risk}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="advisorPanel">
          <div className="sectionHeader">
            <div>
              <h3>Student Risk Monitor</h3>
              <p>Search, filter, and review assigned Computer Science students.</p>
            </div>
          </div>

          <div className="advisorControls">
            <button className="filterBtn" type="button">
              <Filter size={18} /> Filters
            </button>

            <select className="filterSelect" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option>All Students</option>
              <option>High Risk</option>
              <option>Needs Attention</option>
              <option>On Track</option>
            </select>

            <select className="filterSelect" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
              {courses.map((course) => (
                <option key={course}>{course}</option>
              ))}
            </select>

            <div className="searchWrap">
              <Search className="searchIcon" size={18} />
              <input
                className="searchInput"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
              />
            </div>
          </div>

          <div className="advisorTableWrap">
            <table className="advisorTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Enrollment</th>
                  <th>Risk</th>
                  <th>Last Updated</th>
                  <th>Indicators</th>
                </tr>
              </thead>

              <tbody>
                {visibleStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="studentCell">
                        <div className="studentAvatar">{getInitials(student.name)}</div>
                        <div>
                          <div className="studentName">{student.name}</div>
                          <div className="studentSub">{student.id}</div>
                        </div>
                      </div>
                    </td>

                    <td>{student.email}</td>

                    <td>
                      <span className="enrollmentPill">{student.enrollment}</span>
                    </td>

                    <td>
                      <span className={getRiskClass(student.risk)}>{student.risk}</span>
                    </td>

                    <td>
                      <div className="updatedCell">
                        <div>{student.updated}</div>
                        <div>Data sync</div>
                      </div>
                    </td>

                    <td>{student.topFactors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length > visibleCount && (
            <button
              className="filterBtn"
              type="button"
              onClick={() => setVisibleCount((count) => count + 8)}
            >
              Show More Students
            </button>
          )}
        </section>

        <section className="advisorQuickActions">
          <button className="advisorNavCard" type="button" onClick={() => navigate("/advisor/messages")}>
            <div className="advisorNavCardIconWrap">
              <MailOpen size={22} />
            </div>
            <div className="advisorNavCardBody">
              <div className="advisorNavCardTitle">Messages</div>
              <div className="advisorNavCardSub">Open inbox and reply to students.</div>
            </div>
            <span className="advisorNavCardArrow">→</span>
          </button>

          <button className="advisorNavCard" type="button" onClick={() => navigate("/advisor/appointments")}>
            <div className="advisorNavCardIconWrap advisorNavCardIconWrap--green">
              <CalendarDays size={22} />
            </div>
            <div className="advisorNavCardBody">
              <div className="advisorNavCardTitle">Appointment Requests</div>
              <div className="advisorNavCardSub">Review and manage appointment requests.</div>
            </div>
            <span className="advisorNavCardArrow">→</span>
          </button>
        </section>

        <section className="advisorChartsGrid">
          <div className="advisorChartCard">
            <div className="sectionHeader sectionHeader--tight">
              <div>
                <h3>Student Risk Overview</h3>
                <p>Distribution of current risk levels.</p>
              </div>
            </div>

            <div className="riskChartWrap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={riskOverviewData} cx="50%" cy="50%" innerRadius={72} outerRadius={110} paddingAngle={2} dataKey="value">
                    {riskOverviewData.map((entry) => (
                      <Cell key={entry.key} fill={RISK_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="riskCenterValueWrap">
                <div className="riskCenterValue">{highRiskPercent}%</div>
                <div className="riskCenterLabel">High Risk Share</div>
              </div>
            </div>
          </div>

          <div className="advisorChartCard">
            <div className="sectionHeader sectionHeader--tight">
              <div>
                <h3>Advising Engagement Trend</h3>
                <p>Meetings and resolved cases over time.</p>
              </div>
              <Activity size={22} />
            </div>

            <div className="trendStats">
              <div className="trendStatBox">
                <div className="trendStatLabel">Total Meetings</div>
                <div className="trendStatValue">{totalMeetings}</div>
              </div>
              <div className="trendStatBox">
                <div className="trendStatLabel">Resolved Cases</div>
                <div className="trendStatValue">{resolvedCases}</div>
              </div>
              <div className="trendStatBox">
                <div className="trendStatLabel">Resolution Rate</div>
                <div className="trendStatValue">{resolutionRate}</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={engagementData}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="week" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="meetings" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.16} strokeWidth={3} />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.12} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="advisorChartCard">
          <div className="sectionHeader sectionHeader--tight">
            <div>
              <h3>Course Comparison Analytics</h3>
              <p>High-risk share by course.</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={courseRiskData}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="course" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="highRiskPercent" fill="#ef4444" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon, trend, label, value, sub, danger = false }) {
  return (
    <div className="metricCard">
      <div className="metricCardTop">
        {icon}
        <span className={`metricTrend ${danger ? "metricTrend--danger" : ""}`}>
          {trend}
        </span>
      </div>

      <div className="metricLabel">{label}</div>
      <div className="metricValue">{value}</div>
      <div className="metricSub">{sub}</div>
    </div>
  );
}