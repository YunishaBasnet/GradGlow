import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CalendarDays, Check, CheckCircle2, Circle, Moon } from "lucide-react";
import StudentBottomNav from "../../components/StudentBottomNav";
import { useTheme } from "../../context/ThemeContext";
import { getDashboardStudentId } from "../../utils/authSession";
import "../../styles/actionplan.css";

const RISK_WEEK_STORAGE_KEY = "gradglow_risk_week";

const initialTasks = [
  {
    id: 1,
    baseStatus: "alert",
    completed: false,
    title: "Introdction to Programming ",
    description: "Submit the project",
    dueDate: "Due: Feb 15, 2026",
    tag: "Academic",
    priority: "high",
    priorityLabel: "High Priority",
  },
  {
    id: 2,
    baseStatus: "pending",
    completed: false,
    title: "Attend Office Hours - MATH201",
    description: "Meet with Prof. Williams to discuss Calculus integration techniques",
    dueDate: "Due: Feb 12, 2026",
    tag: "Support",
    priority: "medium",
    priorityLabel: "Medium Priority",
  },
  {
    id: 3,
    baseStatus: "pending",
    completed: false,
    title: "Schedule Advisor Meeting",
    description: "Discuss course selection for Fall 2026 semester",
    dueDate: "Due: Feb 20, 2026",
    tag: "Planning",
    priority: "medium",
    priorityLabel: "Medium Priority",
  },
  {
    id: 4,
    baseStatus: "done",
    completed: true,
    title: "Join Computer Science Study Group",
    description: "Participate in weekly CS250 study sessions",
    dueDate: "Due: Feb 14, 2026",
    tag: "Social",
    priority: "low",
    priorityLabel: "Low Priority",
  },
  {
    id: 5,
    baseStatus: "alert",
    completed: false,
    title: "Review discrete mathematics materials",
    description: "Prepare for upcoming midterm exam",
    dueDate: "Due: Feb 18, 2026",
    tag: "Academic",
    priority: "high",
    priorityLabel: "High Priority",
  },
];

function StatusIcon({ status }) {
  if (status === "alert") return <AlertCircle size={16} className="taskStatusIcon taskStatusIcon--alert" />;
  if (status === "done") return <CheckCircle2 size={16} className="taskStatusIcon taskStatusIcon--done" />;
  return <Circle size={16} className="taskStatusIcon taskStatusIcon--pending" />;
}

function normalizeRiskWeek(value, fallback = 4) {
  const parsed = Number(value);
  return [4, 8, 12].includes(parsed) ? parsed : fallback;
}

function actionFromFactorKey(key) {
  const k = String(key || "").trim();
  const mapping = {
    late_submission_rate: "Focus on submitting assignments on time.",
    avg_submission_delay_days: "Build a routine to start assignments earlier and avoid last‑minute submissions.",
    avg_assessment_score: "Focus on improving assignment and test performance.",
    weighted_assessment_score: "Prioritize the most important assessments—they have a bigger effect on your outcome.",
    total_vle_clicks: "Increase your weekly learning activity (readings, practice, and course materials).",
    avg_clicks_per_week: "Increase your weekly learning activity and keep it steady.",
    engagement_drop_ratio: "Your activity dropped recently—try to get back to a steady weekly routine.",
    engagement_consistency: "Build a more consistent study schedule across the week.",
    weeks_active_count: "Try to stay active across more weeks with a simple weekly plan.",
    active_days_count: "Aim for more active learning days each week (short sessions count).",
    assessments_submitted_count: "Submit more assessments to keep your progress visible.",
    assessments_submitted_first_4_weeks: "Submit early assessments as soon as they open to stay on track.",
  };
  return mapping[k] || null;
}

export default function StudentActionPlan() {
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [studentId] = useState(() => getDashboardStudentId());
  const [tasks, setTasks] = useState(initialTasks);
  const [riskLabel, setRiskLabel] = useState("");
  const [riskWeek] = useState(() => {
    if (typeof window === "undefined") return 4;
    return normalizeRiskWeek(window.localStorage.getItem(RISK_WEEK_STORAGE_KEY), 4);
  });
  const [recommendations, setRecommendations] = useState(null);

  const handleToggleTask = (taskId) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  };

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const timelineRes = await fetch(`/api/predict/timeline?student_id=${studentId}&week=${riskWeek}`, { method: "GET", signal: controller.signal });
        const timelinePayload = await timelineRes.json();
        const label = timelineRes.ok && typeof timelinePayload?.latest?.riskLabel === "string" ? timelinePayload.latest.riskLabel : "";
        if (isActive) setRiskLabel(label);

        const explainRes = await fetch(`/api/predict/explain?student_id=${studentId}&week=${riskWeek}`, { method: "GET", signal: controller.signal });
        const explainPayload = await explainRes.json();
        const factors = explainRes.ok && Array.isArray(explainPayload?.factors) ? explainPayload.factors : [];

        const increased = factors
          .map((f) => ({ key: String(f?.key ?? ""), impact: Number(f?.risk_impact ?? 0) }))
          .filter((f) => f.key && Number.isFinite(f.impact) && f.impact > 0)
          .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

        const nextActions = [];
        increased.forEach((factor) => {
          const suggestion = actionFromFactorKey(factor.key);
          if (suggestion && !nextActions.includes(suggestion)) nextActions.push(suggestion);
        });

        if (label === "High") {
          nextActions.unshift("Prioritize upcoming assignments and increase learning activity immediately.");
        }

        if (!nextActions.length) {
          nextActions.push("Keep a steady weekly routine—small consistent effort helps prevent risk from rising.");
        }

        if (isActive) setRecommendations(nextActions.slice(0, 5));
      } catch {
        if (isActive) setRecommendations([]);
      }
    };

    load();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [studentId, riskWeek]);

  const actionTitle = useMemo(() => {
    if (riskLabel === "Low") return "Recommended next steps (stay on track)";
    if (riskLabel === "Medium") return "Recommended next steps (lower your risk)";
    if (riskLabel === "High") return "Recommended next steps (priority)";
    return "Recommended next steps";
  }, [riskLabel]);

  return (
    <div className={dark ? "apPage apPage--dark" : "apPage"}>
      <header className="apHeader">
        <div>
          <h1>Personalized Action Plan</h1>
          <p>Your customized roadmap to academic success</p>
        </div>

        <div className="apHeaderActions">
          <button type="button" className="apBackBtn" onClick={() => navigate("/student/dashboard")}>
            Back to Dashboard
          </button>
          <button type="button" className="apThemeBtn" aria-label="Toggle theme" title="Toggle theme" onClick={toggleTheme}>
            <Moon size={18} />
          </button>
        </div>
      </header>

      <section className="apList" style={{ marginBottom: 18 }}>
        <article className="apTask" style={{ padding: 16 }}>
          <div className="taskBody" style={{ width: "100%" }}>
            <h3 className="taskTitle">
              {actionTitle}
            </h3>
            <p className="taskDescription" style={{ marginBottom: 10 }}>
              Based on your risk insights up to Week {riskWeek}
              {riskLabel ? ` (${riskLabel} Risk)` : ""}.
            </p>
            {recommendations === null ? (
              <p className="taskDescription">Loading recommendations…</p>
            ) : Array.isArray(recommendations) && recommendations.length ? (
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                {recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="taskDescription">No recommendations are available right now.</p>
            )}
          </div>
        </article>
      </section>

      <section className="apList">
        {tasks.map((task) => {
          const visualStatus = task.completed ? "done" : task.baseStatus;

          return (
            <article key={task.id} className="apTask">
              <div className="taskMain">
                <label className="taskCheckWrap">
                  <input
                    type="checkbox"
                    className="taskCheck"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                    aria-label={`Mark ${task.title} completed`}
                  />
                  <span className="taskCheckUi">
                    {task.completed ? <Check size={12} /> : <StatusIcon status={visualStatus} />}
                  </span>
                </label>

                <div className="taskBody">
                  <h3 className={task.completed ? "taskTitle taskTitle--done" : "taskTitle"}>{task.title}</h3>
                  <p className="taskDescription">{task.description}</p>

                  <div className="taskMeta">
                    <span className="taskDue">
                      <CalendarDays size={12} />
                      {task.dueDate}
                    </span>
                    <span className="taskTag">{task.tag}</span>
                  </div>
                </div>
              </div>

              <span className={`priorityPill priorityPill--${task.priority}`}>{task.priorityLabel}</span>
            </article>
          );
        })}
      </section>

      <StudentBottomNav />
    </div>
  );
}
