"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Award,
  TrendingUp,
  Brain,
  Target,
  BookOpen,
  Download,
  Share2,
  CheckCircle,
  Clock,
  BarChart2,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreHistoryItem {
  assessmentTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  gradedAt: string;
}

interface ErrorDistributionItem {
  error_code: string;
  error_name: string;
  count?: number;
  percentage?: number;
}

interface BloomDistributionItem {
  level_code: string;
  level_name: string;
  count: number;
  percentage: number;
}

interface RecordData {
  student: {
    id?: string;
    user_id?: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    createdAt?: string;
    created_at?: string;
  } | null;
  analytics: {
    studentId?: string;
    averageScore?: number;
    averagePercentage?: number;
    totalSubmissions?: number;
    totalAssessments?: number;
    trend?: "improving" | "declining" | "stable";
    subjectBreakdown?: Array<{ subject: string; average: number }>;
    growthDelta?: number;
    scoreHistory?: ScoreHistoryItem[];
    bloomDistribution?: BloomDistributionItem[];
    errorDistribution?: ErrorDistributionItem[];
  } | null;
  cognitiveProfile?: {
    dominantStyle?: string;
    strengths?: string[];
    areasForGrowth?: string[];
    bloomsDistribution?: Record<string, number>;
  } | null;
  reteachImpact?: {
    data?: {
      student_name?: string;
      totalSessions?: number;
      averageImprovement?: number;
      topicsAddressed?: string[];
    };
    totalSessions?: number;
    averageImprovement?: number;
  } | null;
  submissions?: Array<{
    submission_id?: string;
    id?: string;
    assessmentTitle?: string;
    score?: number;
    maxScore?: number;
    totalMarks?: number;
    percentage?: number;
    gradedAt?: string;
    createdAt?: string;
    status?: string;
  }> | null;
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(pct: number) {
  if (pct >= 75) return "#1d9e75";
  if (pct >= 50) return "#ba7517";
  return "#d85a30";
}

function scoreLabel(pct: number) {
  if (pct >= 75) return "Strong";
  if (pct >= 50) return "Developing";
  return "Needs support";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function computeGrowthDelta(scoreHistory: ScoreHistoryItem[]): number | null {
  if (!scoreHistory || scoreHistory.length < 2) return null;
  const sorted = [...scoreHistory].sort(
    (a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime()
  );
  const first = sorted[0].percentage;
  const last = sorted[sorted.length - 1].percentage;
  return Math.round(last - first);
}

function inferTrend(
  scoreHistory: ScoreHistoryItem[]
): "improving" | "declining" | "stable" | null {
  const delta = computeGrowthDelta(scoreHistory);
  if (delta === null) return null;
  if (delta > 5) return "improving";
  if (delta < -5) return "declining";
  return "stable";
}

function RadialScore({
  value,
  max = 100,
  size = 120,
}: {
  value: number;
  max?: number;
  size?: number;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = scoreColor(pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-border-tertiary)"
        strokeWidth="8"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        fontSize="22"
        fontWeight="600"
        fill="var(--color-text-primary)"
      >
        {pct}%
      </text>
      <text
        x={size / 2}
        y={size / 2 + 14}
        textAnchor="middle"
        fontSize="10"
        fill="var(--color-text-tertiary)"
      >
        {scoreLabel(pct)}
      </text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProofOfLearningRecord({
  isPublic = false,
}: {
  isPublic?: boolean;
}) {
  const params = useParams();
  const studentId = (params.studentId ?? params.id) as string;
  const [data, setData] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const endpoint = isPublic
      ? `/api/record/public/${studentId}`
      : `/api/record/${studentId}`;
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => {
        setData(d as RecordData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  const handleShare = async () => {
    const url = `${window.location.origin}/record/${studentId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            Building proof of learning...
          </p>
        </div>
      </div>
    );
  }

  if (!data?.student) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Record not found.</p>
      </div>
    );
  }

  const { student, analytics, cognitiveProfile, reteachImpact } = data;

  // ── Name resolution ──────────────────────────────────────────────────────
  const firstName = student.firstName ?? student.first_name ?? "";
  const lastName = student.lastName ?? student.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  // ── Score: prefer averagePercentage, fall back to averageScore ───────────
  const avgPct = Math.round(
    analytics?.averagePercentage ?? analytics?.averageScore ?? 0
  );

  // ── Assessment count ─────────────────────────────────────────────────────
  const totalAssessments =
    analytics?.totalSubmissions ?? analytics?.totalAssessments ?? 0;

  // ── Score history (from analytics.scoreHistory, sorted newest first) ─────
  const scoreHistory = analytics?.scoreHistory ?? [];
  const sortedHistory = [...scoreHistory].sort(
    (a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
  );

  // ── Growth delta ─────────────────────────────────────────────────────────
  const growthDelta =
    analytics?.growthDelta ?? computeGrowthDelta(scoreHistory);

  // ── Trend ────────────────────────────────────────────────────────────────
  const trend = analytics?.trend ?? inferTrend(scoreHistory);

  // ── Reteach impact — handles both { data: {...} } and flat shapes ─────────
  const reteachData = reteachImpact?.data ?? reteachImpact;
  const totalSessions = reteachData?.totalSessions ?? 0;
  const avgImprovement = reteachData?.averageImprovement ?? 0;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .fade-up-1 { animation-delay: 0.05s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.1s;  opacity: 0; }
        .fade-up-3 { animation-delay: 0.15s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.2s;  opacity: 0; }
        .fade-up-5 { animation-delay: 0.25s; opacity: 0; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-8" ref={printRef}>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Proof of Learning
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generated {formatDate(data.generatedAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Share link"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Header card */}
        <div className="fade-up fade-up-1 rounded-2xl border border-border bg-card p-6 mb-4 print-page">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary">
                  {firstName[0]}
                  {lastName[0]}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">
                  {fullName}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Mirror learner since{" "}
                  {formatDate(
                    student.createdAt ??
                      student.created_at ??
                      new Date().toISOString()
                  )}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Mirror verified · audit-quality assessments
                  </span>
                </div>
              </div>
            </div>
            <RadialScore value={avgPct} />
          </div>
        </div>

        {/* Stats row */}
        <div className="fade-up fade-up-2 grid grid-cols-3 gap-3 mb-4">
          {[
            {
              icon: BookOpen,
              label: "Assessments",
              value: totalAssessments,
              sub: "completed",
            },
            {
              icon: TrendingUp,
              label: "Growth delta",
              value:
                growthDelta != null
                  ? `${growthDelta >= 0 ? "+" : ""}${growthDelta}%`
                  : "—",
              sub: "since first assessment",
            },
            {
              icon: Zap,
              label: "Interventions",
              value: totalSessions,
              sub: `avg +${avgImprovement}% improvement`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-4 print-page"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Performance trend */}
        {(trend || (analytics?.subjectBreakdown ?? []).length > 0) && (
          <div className="fade-up fade-up-3 rounded-xl border border-border bg-card p-5 mb-4 print-page">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Performance trend
              </h3>
              {trend && (
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                    trend === "improving"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : trend === "declining"
                      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {trend === "improving"
                    ? "↑ Improving"
                    : trend === "declining"
                    ? "↓ Declining"
                    : "→ Stable"}
                </span>
              )}
            </div>
            {(analytics?.subjectBreakdown ?? []).length > 0 && (
              <div className="space-y-2.5">
                {analytics!.subjectBreakdown!.map((s) => {
                  const pct = Math.round(s.average);
                  return (
                    <div key={s.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground">
                          {s.subject}
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: scoreColor(pct) }}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: scoreColor(pct),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Cognitive profile */}
        {cognitiveProfile && (
          <div className="fade-up fade-up-4 rounded-xl border border-border bg-card p-5 mb-4 print-page">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Cognitive profile
              </h3>
              {cognitiveProfile.dominantStyle && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {cognitiveProfile.dominantStyle}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(cognitiveProfile.strengths ?? []).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                    Strengths
                  </p>
                  <ul className="space-y-1.5">
                    {cognitiveProfile.strengths!.slice(0, 4).map((s) => (
                      <li
                        key={s}
                        className="flex items-start gap-1.5 text-xs text-foreground"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(cognitiveProfile.areasForGrowth ?? []).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                    Areas for growth
                  </p>
                  <ul className="space-y-1.5">
                    {cognitiveProfile.areasForGrowth!.slice(0, 4).map((s) => (
                      <li
                        key={s}
                        className="flex items-start gap-1.5 text-xs text-foreground"
                      >
                        <Target className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assessment history — sourced from analytics.scoreHistory */}
        {sortedHistory.length > 0 && (
          <div className="fade-up fade-up-5 rounded-xl border border-border bg-card p-5 mb-4 print-page">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Assessment history
              </h3>
              <span className="ml-auto text-xs text-muted-foreground">
                {sortedHistory.length} completed
              </span>
            </div>
            <div className="space-y-2">
              {sortedHistory.slice(0, 8).map((item, idx) => {
                const pct = Math.round(item.percentage);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {item.assessmentTitle ?? "Assessment"}
                      </p>
                      {item.gradedAt && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.gradedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: scoreColor(pct),
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-medium w-8 text-right"
                        style={{ color: scoreColor(pct) }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Verified by Mirror Learning Intelligence ·{" "}
            {formatDate(data.generatedAt)}
          </div>
        </div>
      </div>
    </>
  );
}