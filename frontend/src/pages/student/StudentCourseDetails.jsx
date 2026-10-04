import { useEffect, useState } from "react";
import { ChevronLeft, Moon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import StudentBottomNav from "../../components/StudentBottomNav";
import { useTheme } from "../../context/ThemeContext";
import { getDashboardStudentId } from "../../utils/authSession";
import "../../styles/courseDetails.css";

export default function StudentCourseDetails() {
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { code } = useParams();
  const studentId = getDashboardStudentId();
  const [course, setCourse] = useState({
    code: code ?? "COURSE",
    name: "Course Overview",
    instructor: "Instructor TBA",
    status: "In Review",
    summary: "Detailed course information will be available soon.",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;

    const controller = new AbortController();
    const loadCourse = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/students/${studentId}/courses/${code}`, {
          method: "GET",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.detail || "Unable to load course details.");
        }
        setCourse({
          code: String(payload?.course_code ?? code),
          name: String(payload?.course_name ?? "Course Overview"),
          instructor: String(payload?.instructor ?? "Instructor TBA"),
          status: String(payload?.status ?? "In Review"),
          summary: String(payload?.summary ?? "Detailed course information will be available soon."),
        });
      } catch (fetchError) {
        if (fetchError?.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load course details.");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
    return () => controller.abort();
  }, [code, studentId]);

  return (
    <div className={dark ? "coursePage coursePage--dark" : "coursePage"}>
      <header className="courseHeader">
        <button type="button" className="courseBackBtn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>

        <button type="button" className="courseThemeBtn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
          <Moon size={18} />
        </button>
      </header>

      <section className="courseCard">
        <p className="courseCode">{course.code}</p>
        <h1>{course.name}</h1>
        <p className="courseMeta">Instructor: {course.instructor}</p>
        <p className="courseMeta">Current Status: {course.status}</p>
        <p className="courseSummary">{loading ? "Loading course details..." : course.summary}</p>
        {error ? <p className="courseSummary">Course details are currently unavailable. Please try again.</p> : null}
      </section>

      <StudentBottomNav />
    </div>
  );
}
