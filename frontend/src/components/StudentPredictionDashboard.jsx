import { useCallback, useEffect, useMemo, useState } from "react";

const DEFAULT_REFRESH_MS = 30000;

export default function StudentPredictionDashboard({ studentId = 1, refreshMs = DEFAULT_REFRESH_MS }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(async (signal) => {
    try {
      setError("");

      const [studentRes, timelineRes] = await Promise.all([
        fetch(`/api/students/${studentId}`, { signal }),
        fetch(`/api/predict/timeline?student_id=${studentId}`, { signal }),
      ]);

      const [studentPayload, timelinePayload] = await Promise.all([
        studentRes.json(),
        timelineRes.json(),
      ]);

      if (!studentRes.ok) {
        throw new Error(studentPayload?.detail || "Failed to load student profile.");
      }
      if (!timelineRes.ok) {
        throw new Error(timelinePayload?.detail || "Failed to load prediction timeline.");
      }

      setData({
        student: studentPayload,
        timeline: timelinePayload,
      });
      setLastUpdated(new Date());
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchDashboardData(controller.signal);

    const interval = window.setInterval(() => {
      fetchDashboardData(controller.signal);
    }, refreshMs);

    return () => {
      window.clearInterval(interval);
      controller.abort();
    };
  }, [fetchDashboardData, refreshMs]);

  const courses = useMemo(() => data?.student?.courses || [], [data]);
  const points = useMemo(() => data?.timeline?.points || [], [data]);
  const latest = data?.timeline?.latest || null;

  if (loading) {
    return (
      <section style={styles.card}>
        <h2 style={styles.title}>Student Dashboard</h2>
        <p>Loading dashboard data...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section style={styles.card}>
        <h2 style={styles.title}>Student Dashboard</h2>
        <p style={styles.error}>Error: {error}</p>
      </section>
    );
  }

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Student Dashboard</h2>
          <p style={styles.subtitle}>
            {data?.student?.name || "Unknown Student"} ({data?.student?.term || "N/A"})
          </p>
        </div>
        <div style={styles.meta}>
          <span>Student ID: {data?.student?.id ?? studentId}</span>
          <span>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "N/A"}</span>
        </div>
      </div>

      <div style={styles.grid}>
        <article style={styles.panel}>
          <h3 style={styles.panelTitle}>Courses</h3>
          {courses.length === 0 ? (
            <p>No courses found.</p>
          ) : (
            <ul style={styles.list}>
              {courses.map((course) => (
                <li key={course.id ?? course.course_code} style={styles.listItem}>
                  <strong>{course.course_code}</strong> - {course.course_name} ({course.status})
                </li>
              ))}
            </ul>
          )}
        </article>

        <article style={styles.panel}>
          <h3 style={styles.panelTitle}>Latest Prediction</h3>
          {latest ? (
            <div>
              <p><strong>Week:</strong> {latest.week}</p>
              <p><strong>Risk:</strong> {latest.riskLabel}</p>
              <p><strong>Probability:</strong> {Math.round((latest.riskProbability || 0) * 100)}%</p>
              <p><strong>Success Score:</strong> {latest.successScore}</p>
            </div>
          ) : (
            <p>No prediction available.</p>
          )}
        </article>
      </div>

      <article style={styles.panel}>
        <h3 style={styles.panelTitle}>Prediction Timeline</h3>
        {points.length === 0 ? (
          <p>No prediction points available.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Week</th>
                <th style={styles.th}>Cutoff Day</th>
                <th style={styles.th}>Risk Label</th>
                <th style={styles.th}>Risk %</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={`${point.week}-${point.cutoffDay}`}>
                  <td style={styles.td}>{point.week}</td>
                  <td style={styles.td}>{point.cutoffDay}</td>
                  <td style={styles.td}>{point.riskLabel}</td>
                  <td style={styles.td}>{Math.round((point.riskProbability || 0) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#4b5563",
  },
  meta: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#6b7280",
    fontSize: "13px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
    marginBottom: "14px",
  },
  panel: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "14px",
  },
  panelTitle: {
    margin: "0 0 10px 0",
    fontSize: "16px",
    color: "#1f2937",
  },
  list: {
    margin: 0,
    paddingLeft: "18px",
  },
  listItem: {
    marginBottom: "8px",
    color: "#374151",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    padding: "8px",
    color: "#111827",
    fontSize: "13px",
  },
  td: {
    borderBottom: "1px solid #f3f4f6",
    padding: "8px",
    color: "#374151",
    fontSize: "13px",
  },
  error: {
    color: "#b91c1c",
  },
};
