import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import StudentBottomNav from "../../components/StudentBottomNav";
import RiskInsightsView from "../../components/RiskInsightsView";
import { useTheme } from "../../context/ThemeContext";
import { getDashboardStudentId } from "../../utils/authSession";
import "../../styles/dashboard.css";

const WEEK_STORAGE_KEY = "gradglow_risk_week";
const WEEK_OPTIONS = [4, 8, 12];

function normalizeWeek(value, fallback = 4) {
  const parsed = Number(value);
  if (WEEK_OPTIONS.includes(parsed)) return parsed;
  return fallback;
}

export default function StudentInsights() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const studentId = getDashboardStudentId();
  const [searchParams, setSearchParams] = useSearchParams();

  const week = useMemo(() => {
    const fromQuery = normalizeWeek(searchParams.get("week"), NaN);
    if (Number.isFinite(fromQuery)) return fromQuery;

    if (typeof window === "undefined") return 4;
    const saved = normalizeWeek(window.localStorage.getItem(WEEK_STORAGE_KEY), 4);
    return saved;
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WEEK_STORAGE_KEY, String(week));
  }, [week]);

  const requestWeekFallback = useCallback(() => {
    const fallbackWeek = 4;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WEEK_STORAGE_KEY, String(fallbackWeek));
    }
    setSearchParams({ week: String(fallbackWeek) }, { replace: true });
  }, [setSearchParams]);

  return (
    <div className={dark ? "dash dash--dark" : "dash"}>
      <header className="insightsHeader">
        <button type="button" className="insightsBack" onClick={() => navigate("/student/dashboard")}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1 className="insightsTitle">Risk insights</h1>
      </header>

      <RiskInsightsView variant="full" studentId={studentId} week={week} onRequestWeekFallback={requestWeekFallback} />

      <StudentBottomNav />
    </div>
  );
}
