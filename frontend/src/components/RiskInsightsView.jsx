import { useEffect, useMemo, useState } from "react";
import { BarChart3, LineChart as LineChartIcon, ShieldAlert } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTheme } from "../context/ThemeContext";
import "../styles/insights.css";

function clampNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPct(value, digits = 0) {
  const n = clampNumber(value, 0);
  return `${(n * 100).toFixed(digits)}%`;
}

function formatPctPoints(value, digits = 0) {
  const n = Math.abs(clampNumber(value, 0) * 100);
  if (digits === 0) return `${Math.round(n)}%`;
  return `${n.toFixed(digits)}%`;
}

function toPrettyLabel(key) {
  const k = String(key || "").trim();
  const mapping = {
    total_vle_clicks: "Learning activity (clicks)",
    avg_clicks_per_week: "Weekly learning activity",
    clicks_first_4_weeks: "Early learning activity",
    engagement_drop_ratio: "Learning activity drop",
    engagement_consistency: "Consistency of learning activity",
    active_days_count: "Active learning days",
    weeks_active_count: "Weeks you stayed active",
    late_submission_rate: "Late submissions",
    avg_submission_delay_days: "Submission delays",
    assessments_submitted_count: "Assessments submitted",
    assessments_submitted_first_4_weeks: "Early assessment submissions",
    avg_assessment_score: "Assignment/test performance",
    weighted_assessment_score: "Important assessments",
    studied_credits: "Progress (credits studied)",
    num_of_prev_attempts: "Previous attempts",
  };
  if (k in mapping) return mapping[k];
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toStudentSentence(key) {
  const k = String(key || "").trim();
  const mapping = {
    total_vle_clicks: "Your learning activity level",
    avg_clicks_per_week: "Your average weekly learning activity",
    clicks_first_4_weeks: "Your early learning activity",
    engagement_drop_ratio: "Your learning activity dropped recently",
    engagement_consistency: "How steady your learning activity was",
    active_days_count: "How many days you were active",
    weeks_active_count: "Your study consistency across weeks",
    late_submission_rate: "Your on-time submission habits",
    avg_submission_delay_days: "How promptly you submit work",
    assessments_submitted_count: "How many assessments you submitted",
    assessments_submitted_first_4_weeks: "How many assessments you submitted early",
    avg_assessment_score: "Your recent assignment/test performance",
    weighted_assessment_score: "Results on important assessments",
    studied_credits: "Your study progress (credits)",
  };
  return mapping[k] || toPrettyLabel(k);
}

function buildDailyRiskSeries(checkpoints, maxDay) {
  const cps = Array.isArray(checkpoints)
    ? checkpoints
        .map((p) => ({ day: clampNumber(p.cutoffDay, 0), risk: clampNumber(p.riskProbability, null) }))
        .filter((p) => p.day > 0 && p.day <= maxDay && Number.isFinite(p.risk))
        .sort((a, b) => a.day - b.day)
    : [];

  if (cps.length === 0) {
    return Array.from({ length: maxDay }, (_, idx) => ({ day: idx + 1, riskPct: null }));
  }

  const out = [];
  let leftIdx = 0;
  let rightIdx = cps.length > 1 ? 1 : 0;
  const firstDay = cps[0].day;

  for (let day = 1; day <= maxDay; day += 1) {
    if (day < firstDay) {
      out.push({ day, riskPct: null });
      continue;
    }

    while (rightIdx < cps.length && cps[rightIdx].day < day) {
      leftIdx = rightIdx;
      rightIdx = Math.min(cps.length - 1, rightIdx + 1);
    }

    const left = cps[leftIdx];
    const right = cps[rightIdx];

    let risk = left.risk;
    if (right && right.day !== left.day && day > left.day && day < right.day) {
      const t = (day - left.day) / (right.day - left.day);
      risk = left.risk + t * (right.risk - left.risk);
    } else if (right && day >= right.day) {
      risk = right.risk;
    }

    out.push({ day, riskPct: risk !== null ? Math.max(0, Math.min(100, risk * 100)) : null });
  }

  return out;
}

function buildWeekEngagement(points, weekMax) {
  const rows = Array.isArray(points) ? points : [];
  const byWeek = new Map(rows.map((row) => [clampNumber(row.week, 0), clampNumber(row.learningClicks, 0)]));
  const out = [];
  for (let week = 1; week <= weekMax; week += 1) {
    out.push({ week: `W${week}`, clicks: byWeek.get(week) ?? 0 });
  }
  return out;
}

function pickTopReasons(reasons, limit) {
  const list = Array.isArray(reasons) ? reasons : [];
  const cleaned = list.map((r) => String(r || "").trim()).filter(Boolean);
  return cleaned.length ? cleaned.slice(0, limit) : ["No strong risk signals"];
}

function rewriteReason(reason) {
  const text = String(reason || "").trim();
  const mapping = {
    "Low LMS engagement": "Low learning activity",
    "Low early LMS activity": "Low learning activity early in the term",
    "Low weighted assessment score": "Lower results on important assessments",
    "Low assessment score": "Lower assignment/test performance",
    "Many late submissions": "More late submissions",
    "High submission delays": "Longer delays in turning work in",
    "Missed assessments": "Missed or incomplete assessments",
    "No assessments submitted": "No assessments submitted yet",
    "Inconsistent engagement": "Learning activity was less steady",
    "Engagement drop ratio": "Learning activity dropped recently",
  };
  return mapping[text] || text;
}

function splitWhyChanged(factors) {
  const list = Array.isArray(factors) ? factors : [];
  const normalized = list
    .map((f) => {
      const amount = clampNumber(f?.risk_impact, 0);
      const logit = clampNumber(f?.logit_contribution, null);
      const directionSignal = logit !== null && logit !== 0 ? logit : amount;
      return {
        key: String(f?.key || ""),
        label: toPrettyLabel(f?.key),
        amount,
        directionSignal,
        value: clampNumber(f?.feature_value, null),
      };
    })
    .filter((f) => f.key);

  const increased = normalized
    .filter((f) => clampNumber(f.directionSignal, 0) > 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  const lowered = normalized
    .filter((f) => clampNumber(f.directionSignal, 0) < 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  return { increased, lowered };
}

function factorSentence(key, direction) {
  const k = String(key || "").trim();
  const dir = direction === "down" ? "down" : "up";

  const up = {
    late_submission_rate: "Late submissions increased your risk",
    avg_submission_delay_days: "Submission delays increased your risk",
    avg_assessment_score: "Lower recent assignment/test performance increased your risk",
    weighted_assessment_score: "Lower performance on important assessments increased your risk",
    weeks_active_count: "Lower consistency across study weeks increased your risk",
    active_days_count: "Fewer active study days increased your risk",
    avg_clicks_per_week: "Reduced weekly learning activity increased your risk",
    total_vle_clicks: "Reduced learning activity increased your risk",
    clicks_first_4_weeks: "Lower early learning activity increased your risk",
    engagement_drop_ratio: "A recent drop in learning activity increased your risk",
    engagement_consistency: "Less steady learning activity increased your risk",
    assessments_submitted_count: "Fewer assessments submitted increased your risk",
    assessments_submitted_first_4_weeks: "Fewer early assessment submissions increased your risk",
    studied_credits: "Lower overall progress increased your risk",
  };

  const down = {
    late_submission_rate: "Submitting work on time helped lower your risk",
    avg_submission_delay_days: "Submitting work promptly helped lower your risk",
    avg_assessment_score: "Strong recent assignment/test performance helped lower your risk",
    weighted_assessment_score: "Strong performance on important assessments helped lower your risk",
    weeks_active_count: "Staying active across multiple weeks helped lower your risk",
    active_days_count: "Being active on more days helped lower your risk",
    avg_clicks_per_week: "Steady weekly learning activity helped lower your risk",
    total_vle_clicks: "Strong learning activity helped lower your risk",
    clicks_first_4_weeks: "Strong early learning activity helped lower your risk",
    engagement_drop_ratio: "Keeping your learning activity steady helped lower your risk",
    engagement_consistency: "Steady learning activity helped lower your risk",
    assessments_submitted_count: "Submitting more assessments helped lower your risk",
    assessments_submitted_first_4_weeks: "Submitting early assessments helped lower your risk",
    studied_credits: "Steady progress helped lower your risk",
  };

  const mapped = dir === "up" ? up[k] : down[k];
  if (mapped) return mapped;
  return dir === "up" ? `${toStudentSentence(k)} increased your risk` : `${toStudentSentence(k)} helped lower your risk`;
}

export default function RiskInsightsView({
  variant = "full",
  studentId,
  week,
  onRequestWeekFallback,
  showHeaderNote = true,
}) {
  const { dark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeline, setTimeline] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [explain, setExplain] = useState(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const timelineRes = await fetch(`/api/predict/timeline?student_id=${studentId}&week=${week}`, {
          method: "GET",
          signal: controller.signal,
        });
        const timelinePayload = await timelineRes.json();
        if (!timelineRes.ok) {
          const detail = timelinePayload?.detail || "Unable to load risk details.";
          const message = typeof detail === "string" ? detail : "Unable to load risk details.";
          const isWeekMissing = timelineRes.status === 404 && String(message).toLowerCase().includes("week");
          if (isWeekMissing && typeof onRequestWeekFallback === "function") {
            onRequestWeekFallback();
          }
          throw new Error(message);
        }
        if (!isActive) return;
        setTimeline(timelinePayload);

        const [explainRes, engagementRes] = await Promise.all([
          fetch(`/api/predict/explain?student_id=${studentId}&week=${week}`, { method: "GET", signal: controller.signal }),
          fetch(`/api/analytics/engagement-trend?student_id=${studentId}&week_max=${week}&granularity=day`, { method: "GET", signal: controller.signal }),
        ]);

        const [explainPayload, engagementPayload] = await Promise.all([
          explainRes.json().catch(() => null),
          engagementRes.json().catch(() => null),
        ]);

        if (!isActive) return;
        setExplain(explainRes.ok ? explainPayload : null);
        setEngagement(engagementRes.ok ? engagementPayload : null);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Unable to load risk details.");
        setTimeline(null);
        setEngagement(null);
        setExplain(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [studentId, week, onRequestWeekFallback]);

  const latest = timeline?.latest || null;
  const module = String(timeline?.module || "");
  const presentation = String(timeline?.presentation || "");
  const reasons = pickTopReasons(latest?.topFactors, variant === "compact" ? 3 : 5).map(rewriteReason);

  const riskProbability = clampNumber(latest?.riskProbability, null);
  const riskPct = riskProbability !== null ? Math.round(riskProbability * 100) : null;
  const riskLevel = typeof latest?.riskLabel === "string" ? latest.riskLabel : "";
  const startRisk = clampNumber(explain?.base_risk_probability, null);
  const thresholds = explain?.thresholds || latest?.thresholds || null;
  const mediumPct = typeof thresholds?.medium === "number" ? Math.round(thresholds.medium * 100) : null;
  const highPct = typeof thresholds?.high === "number" ? Math.round(thresholds.high * 100) : null;

  const dailyClicks = useMemo(() => {
    const points = Array.isArray(engagement?.daily_points) ? engagement.daily_points : null;
    if (!points) return null;
    return points.map((p) => ({ day: clampNumber(p.day, 0), clicks: clampNumber(p.learningClicks, 0) }));
  }, [engagement]);
  const engagementBars = useMemo(() => buildWeekEngagement(engagement?.points, week), [engagement, week]);

  const dailyRisk = useMemo(() => buildDailyRiskSeries(timeline?.points, week * 7), [timeline, week]);
  const combinedDailySeries = useMemo(() => {
    if (!dailyClicks) return null;
    const byDayClicks = new Map(dailyClicks.map((row) => [row.day, row.clicks]));
    return dailyRisk.map((row) => ({
      day: row.day,
      clicks: byDayClicks.get(row.day) ?? 0,
      riskPct: row.riskPct,
    }));
  }, [dailyClicks, dailyRisk]);

  const why = useMemo(() => splitWhyChanged(explain?.factors), [explain]);
  const maxWhyItems = variant === "compact" ? 3 : 6;

  if (loading) {
    return <div className="insightsCard">Loading risk insights...</div>;
  }

  if (error) {
    return (
      <div className="insightsCard insightsCard--error">
        {error}
        {typeof onRequestWeekFallback === "function" ? (
          <div style={{ marginTop: 12 }}>
            <button type="button" className="insightsBack" onClick={onRequestWeekFallback}>
              Use Week 4
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="insightsGrid" data-variant={variant}>
        <div className="insightsTopGrid">
          <section className="insightsCard insightsStatCard">
            <div className="insightsExplainLabel">Current risk %</div>
            <div className="insightsExplainValue">{riskPct !== null ? `${riskPct}%` : "-"}</div>
            {showHeaderNote ? (
              <div className="insightsMuted" style={{ marginTop: 6 }}>
                Up to Week {week} {module && presentation ? `- ${module} ${presentation}` : ""}
              </div>
            ) : null}
          </section>

          <section className="insightsCard insightsStatCard">
            <div className="insightsExplainLabel">Risk level</div>
            <div className="insightsExplainValue">{riskLevel || "-"}</div>
          </section>

          <section className="insightsCard insightsStatCard">
            <div className="insightsExplainLabel">Starting estimate</div>
            <div className="insightsExplainValue">{startRisk !== null ? formatPct(startRisk, 0) : "-"}</div>
          </section>

          <section className="insightsCard insightsStatCard">
            <div className="insightsExplainLabel">Risk level guide</div>
            <div className="insightsExplainValue">
              {mediumPct !== null && highPct !== null
                ? `Low < ${mediumPct}% | Medium ${mediumPct}-${highPct}% | High >= ${highPct}%`
                : "-"}
            </div>
          </section>
        </div>

        <section className="insightsCard insightsCard--wide">
          <div className="insightsCardTitle">
            <ShieldAlert size={18} />
            <span>Top reasons right now</span>
          </div>
          <ul className="insightsBulletList">
            {reasons.map((r) => (
              <li key={r} className="insightsBulletItem">
                {r}
              </li>
            ))}
          </ul>
        </section>

        <section className="insightsCard insightsCard--wide">
          <div className="insightsCardTitle">
            <LineChartIcon size={18} />
            <span>Trend over time</span>
          </div>
          <div className="insightsMuted">Day-by-day learning activity and your risk trend for this week range.</div>

          <div className="insightsChart">
            <ResponsiveContainer width="100%" height={320}>
              {combinedDailySeries ? (
                <ComposedChart data={combinedDailySeries} margin={{ top: 12, right: 18, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="dailyClicksGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(148,163,184,0.22)" : "#cbd5e1"} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} tickFormatter={(d) => `D${d}`} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  {mediumPct !== null ? (
                    <ReferenceLine yAxisId="right" y={mediumPct} stroke="#f59e0b" strokeDasharray="5 5" />
                  ) : null}
                  {highPct !== null ? (
                    <ReferenceLine yAxisId="right" y={highPct} stroke="#ef4444" strokeDasharray="5 5" />
                  ) : null}
                  <Line yAxisId="left" type="monotone" dataKey="clicks" name="Learning activity (clicks)" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="riskPct" name="Risk %" stroke="#f472b6" strokeWidth={2} dot={false} />
                </ComposedChart>
              ) : (
                <BarChart data={engagementBars} margin={{ top: 12, right: 10, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="engagementTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.45} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(148,163,184,0.28)" : "#cbd5e1"} />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="clicks" name="Learning clicks (weekly)" fill="url(#engagementTrendGrad)" radius={[8, 8, 8, 8]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        <section className="insightsCard insightsCard--wide">
          <div className="insightsCardTitle">
            <ShieldAlert size={18} />
            <span>Why your risk changed</span>
          </div>

          {explain ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div className="insightsExplainLabel">Increased your risk</div>
                {why.increased.length ? (
                  <ul className="insightsBulletList" style={{ marginTop: 10 }}>
                    {why.increased.slice(0, 6).map((item) => (
                      <li key={`up-${item.key}`} className="insightsBulletItem">
                        {factorSentence(item.key, "up")} by about <strong>{formatPctPoints(item.amount, 0)}</strong>.
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="insightsMuted" style={{ marginTop: 10 }}>
                    No strong signals increased your risk in this time window.
                  </div>
                )}
              </div>

              <div>
                <div className="insightsExplainLabel">Helped lower your risk</div>
                {why.lowered.length ? (
                  <ul className="insightsBulletList" style={{ marginTop: 10 }}>
                    {why.lowered.slice(0, 6).map((item) => (
                      <li key={`down-${item.key}`} className="insightsBulletItem">
                        {factorSentence(item.key, "down")} by about <strong>{formatPctPoints(item.amount, 0)}</strong>.
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="insightsMuted" style={{ marginTop: 10 }}>
                    No strong signals lowered your risk in this time window.
                  </div>
                )}
              </div>

              <div className="insightsMuted" style={{ gridColumn: "1 / -1", marginTop: 6 }}>
                These estimates show which patterns mattered most for this time window. They are not grades.
              </div>
            </div>
          ) : (
            <div className="insightsMuted">We couldn't generate a detailed breakdown for this time window.</div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="insightsGrid" data-variant={variant}>
      <section className="insightsCard insightsCard--wide">
        <div className="insightsCardTitle">
          <ShieldAlert size={18} />
          <span>Risk summary</span>
        </div>

        {showHeaderNote ? (
          <div className="insightsMuted" style={{ marginTop: 2 }}>
            Up to Week <strong>{week}</strong> {module && presentation ? `- ${module} ${presentation}` : ""}
          </div>
        ) : null}

        <div className="insightsExplainTop" style={{ marginTop: 12 }}>
          <div className="insightsExplainStat">
            <div className="insightsExplainLabel">Current risk %</div>
            <div className="insightsExplainValue">{riskPct !== null ? `${riskPct}%` : "-"}</div>
          </div>
          <div className="insightsExplainStat">
            <div className="insightsExplainLabel">Risk level</div>
            <div className="insightsExplainValue">{riskLevel || "-"}</div>
          </div>
          <div className="insightsExplainStat">
            <div className="insightsExplainLabel">Starting estimate</div>
            <div className="insightsExplainValue">{startRisk !== null ? formatPct(startRisk, 0) : "-"}</div>
          </div>
          <div className="insightsExplainStat">
            <div className="insightsExplainLabel">Risk level guide</div>
            <div className="insightsExplainValue">
              {mediumPct !== null && highPct !== null
                ? `Low < ${mediumPct}% | Medium ${mediumPct}-${highPct}% | High >= ${highPct}%`
                : "-"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="insightsExplainLabel" style={{ marginBottom: 8 }}>
            Top reasons right now
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="insightsCard insightsCard--wide">
        <div className="insightsCardTitle">
          <ShieldAlert size={18} />
          <span>Why your risk changed</span>
        </div>

        {explain ? (
          <div style={{ display: "grid", gridTemplateColumns: variant === "compact" ? "1fr" : "1fr 1fr", gap: 14 }}>
            <div>
              <div className="insightsExplainLabel">Increased your risk</div>
              {why.increased.length ? (
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 8 }}>
                  {why.increased.slice(0, maxWhyItems).map((item) => (
                    <li key={`up-${item.key}`}>
                      {factorSentence(item.key, "up")} by about <strong>{formatPctPoints(item.amount, 0)}</strong>.
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="insightsMuted" style={{ marginTop: 10 }}>
                  No strong signals increased your risk in this time window.
                </div>
              )}
            </div>

            <div>
              <div className="insightsExplainLabel">Helped lower your risk</div>
              {why.lowered.length ? (
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 8 }}>
                  {why.lowered.slice(0, maxWhyItems).map((item) => (
                    <li key={`down-${item.key}`}>
                      {factorSentence(item.key, "down")} by about <strong>{formatPctPoints(item.amount, 0)}</strong>.
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="insightsMuted" style={{ marginTop: 10 }}>
                  No strong signals lowered your risk in this time window.
                </div>
              )}
            </div>

            {variant === "full" ? (
              <div className="insightsMuted" style={{ gridColumn: "1 / -1", marginTop: 6 }}>
                These estimates show which patterns mattered most for this time window. They are not grades.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="insightsMuted">We couldn't generate a detailed breakdown for this time window.</div>
        )}
      </section>
    </div>
  );
}
