"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Paperclip, ArrowUp, RotateCcw, X,
  FileText, Image as ImageIcon, PanelRightClose, PanelRightOpen,
  ChevronRight, ChevronLeft, ClipboardList, BarChart2, BookOpen, Brain,
  AlertCircle, Copy, Check, Square, ChevronDown, History,
  PenSquare, PenLine, Trash2, Search, ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "tracy";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  attachments?: UploadedFile[];
  artifactId?: string;
  nextOptions?: ConfirmationOption[];
  widgetHtml?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  uploadState?: "pending" | "uploading" | "done" | "error";
  uploadedUrl?: string;
}

interface ConfirmationOption {
  label: string;
  value: string;
}

interface ConfirmationPayload {
  message: string;
  options: ConfirmationOption[];
}

type ArtifactType = "assessment" | "report" | "reteach_plan" | "results" | "audit" | "generic" | "form";

interface ArtifactPayload {
  id: string;
  type: ArtifactType;
  title: string;
  summary?: string;
  data: any;
}

interface ToolStatus {
  name: string;
  label: string;
  status: "running" | "done" | "failed";
}

interface StoredConversation {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  artifacts: Record<string, ArtifactPayload>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HISTORY_KEY = "tracy_history_v1";
const MAX_HISTORY = 50;

const STATIC_SUGGESTIONS = [
  { label: "How did my class perform on the last assessment?", icon: "📊" },
  { label: "Which students need intervention right now?", icon: "🎯" },
  { label: "Show audit result for my latest assessment", icon: "✅" },
  { label: "Generate a class progress report", icon: "📄" },
  { label: "What are the most common mistakes in my class?", icon: "🔍" },
  { label: "Predict national exam performance for my class", icon: "📈" },
];

const SUGGESTIONS_CACHE_KEY = "tracy_suggestions_v1";
const SUGGESTIONS_TTL = 30 * 60 * 1000; // 30 minutes

const ARTIFACT_ICONS: Record<ArtifactType, React.ReactNode> = {
  assessment:  <ClipboardList className="w-4 h-4" />,
  report:      <BarChart2     className="w-4 h-4" />,
  reteach_plan:<BookOpen      className="w-4 h-4" />,
  results:     <BarChart2     className="w-4 h-4" />,
  audit:       <ClipboardList className="w-4 h-4" />,
  generic:     <Brain         className="w-4 h-4" />,
  form:        <ClipboardList className="w-4 h-4" />,
};

// ── Regex patterns ────────────────────────────────────────────────────────────
// Markers are meant to be appended on their own line, but the model doesn't
// always emit the leading newline — it sometimes puts the marker right after
// trailing prose separated only by a space. Matching on `\s` (not just `\n`)
// as the leading boundary catches both cases so raw "__NEXT__:{...}" JSON
// never leaks into the rendered chat bubble.

const ARTIFACT_RE        = /(?:^|\s)(?:__)?ARTIFACT(?:__)?\s*:\s*(\{[\s\S]*)/;
const CONFIRM_RE         = /(?:^|\s)(?:__)?CONFIRM(?:__)?\s*:\s*(\{[\s\S]*)/;
const NEXT_RE            = /(?:^|\s)(?:__)?NEXT(?:__)?\s*:\s*(\{[\s\S]*)/;
const WIDGET_RE          = /(?:^|\s)(?:__)?WIDGET(?:__)?\s*:\s*([\s\S]+)/;
const NEXT_RE_IN_WIDGET  = /\s(?:__)?NEXT(?:__)?\s*:\s*(\{[\s\S]*)/;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstName(): string {
  try {
    const ca = document.cookie.split(";");
    for (const c of ca) {
      const trimmed = c.trim();
      for (const key of ["user=", "profile="]) {
        if (trimmed.startsWith(key)) {
          const obj = JSON.parse(decodeURIComponent(trimmed.slice(key.length)));
          const name = obj.first_name || obj.name || obj.fullName || obj.email || "";
          if (name) return name.split(" ")[0];
        }
      }
    }
  } catch { /* ignore */ }
  return "there";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  if (d < 7)  return `${d}d ago`;
  return new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  const data = await res.json();
  return data.url as string;
}

function extractJson(str: string): string | null {
  const start = str.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === "{") depth++;
    else if (str[i] === "}") {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadHistory(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(conversations: StoredConversation[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations));
  } catch { /* storage full — ignore */ }
}

function upsertConversation(
  conversations: StoredConversation[],
  entry: StoredConversation
): StoredConversation[] {
  const idx = conversations.findIndex((c) => c.id === entry.id);
  const updated = idx >= 0
    ? conversations.map((c, i) => (i === idx ? entry : c))
    : [entry, ...conversations];
  return updated.slice(0, MAX_HISTORY);
}

function serializeMessages(messages: Message[]): Message[] {
  return messages
    .filter((m) => !m.isLoading)
    .map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
    }));
}

// ── Small Components ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

function PendingFileCard({ file, onRemove }: { file: UploadedFile; onRemove?: () => void }) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  const StateOverlay = () => {
    if (file.uploadState === "uploading") return (
      <div className="absolute inset-0 bg-background/70 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
        <span className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
    if (file.uploadState === "done") return (
      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
        <span className="text-white text-[10px] font-bold">✓</span>
      </div>
    );
    if (file.uploadState === "error") return (
      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
        <span className="text-white text-[10px] font-bold">✕</span>
      </div>
    );
    return null;
  };

  return (
    <div className="relative flex-shrink-0 w-24 group">
      <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-border bg-muted/60 flex items-center justify-center">
        {isImage && file.previewUrl ? (
          <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : isPdf ? (
          <div className="flex flex-col items-center gap-1">
            <FileText className="w-7 h-7 text-muted-foreground/60" />
            <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wide">PDF</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Paperclip className="w-7 h-7 text-muted-foreground/60" />
            <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wide">
              {file.name.split(".").pop()?.toUpperCase() ?? "FILE"}
            </span>
          </div>
        )}
        <StateOverlay />
      </div>
      <p className="text-[10px] text-muted-foreground truncate mt-1 px-0.5">{file.name}</p>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label="Remove file"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function ChatFileCard({ file, inUserBubble = false }: { file: UploadedFile; inUserBubble?: boolean }) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (isImage && file.previewUrl) {
    return (
      <div className={`rounded-xl overflow-hidden border max-w-[220px] ${inUserBubble ? "border-white/20" : "border-border"}`}>
        <img src={file.previewUrl} alt={file.name} className="w-full object-cover max-h-40" />
        <div className={`px-2.5 py-1.5 flex items-center gap-1.5 ${inUserBubble ? "bg-black/20" : "bg-muted/60"}`}>
          <ImageIcon className={`w-3 h-3 flex-shrink-0 ${inUserBubble ? "text-white/70" : "text-muted-foreground"}`} />
          <span className={`text-[11px] truncate ${inUserBubble ? "text-white/80" : "text-muted-foreground"}`}>{file.name}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 max-w-[220px] border ${inUserBubble ? "bg-white/10 border-white/20" : "bg-muted/60 border-border"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${inUserBubble ? "bg-white/15" : "bg-muted"}`}>
        {isPdf
          ? <FileText className={`w-4 h-4 ${inUserBubble ? "text-white/80" : "text-muted-foreground"}`} />
          : <Paperclip className={`w-4 h-4 ${inUserBubble ? "text-white/80" : "text-muted-foreground"}`} />}
      </div>
      <div className="min-w-0">
        <p className={`text-[11px] font-medium truncate ${inUserBubble ? "text-white" : "text-foreground"}`}>{file.name}</p>
        <p className={`text-[10px] ${inUserBubble ? "text-white/60" : "text-muted-foreground"}`}>{formatFileSize(file.size)}</p>
      </div>
    </div>
  );
}

// ── Tool Status Display ───────────────────────────────────────────────────────

function ToolStatusPanel({ tools }: { tools: ToolStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  if (tools.length === 0) return null;

  const running = tools.find((t) => t.status === "running");
  const lastCompleted = [...tools].reverse().find((t) => t.status === "done" || t.status === "failed");
  const summaryLabel = running?.label ?? lastCompleted?.label ?? "Working…";
  // Strip trailing ellipsis for the summary line
  const summary = summaryLabel.replace(/…$/, "");

  return (
    <div className="mt-1.5 mb-0.5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 group text-left"
      >
        {running && (
          <span className="w-2.5 h-2.5 border border-[#c9a84c]/40 border-t-[#c9a84c] rounded-full animate-spin flex-shrink-0" />
        )}
        <span className="text-xs italic text-[#c9a84c]/75 group-hover:text-[#c9a84c] transition-colors">
          {summary}
        </span>
        <ChevronRight className={`w-3 h-3 text-[#c9a84c]/50 group-hover:text-[#c9a84c] transition-all flex-shrink-0 ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-2 pl-3 border-l border-[#c9a84c]/20 space-y-1.5">
          {tools.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex-shrink-0">
                {t.status === "running"
                  ? <span className="w-2 h-2 border border-[#c9a84c]/50 border-t-[#c9a84c] rounded-full animate-spin inline-block" />
                  : t.status === "done"
                  ? <span className="text-emerald-500 text-[10px]">✓</span>
                  : <span className="text-red-400 text-[10px]">✕</span>}
              </span>
              <span className={t.status === "running" ? "text-foreground/80" : ""}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Artifact Chip ─────────────────────────────────────────────────────────────

function ArtifactChip({ artifact, onClick, isActive }: {
  artifact: ArtifactPayload;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 mt-1.5 px-3 py-2 rounded-xl border transition-all group w-full max-w-xs text-left ${
        isActive
          ? "border-[#c9a84c]/60 bg-[#c9a84c]/10"
          : "border-[#c9a84c]/30 bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/50"
      }`}
    >
      <span className="text-[#c9a84c] flex-shrink-0">{ARTIFACT_ICONS[artifact.type]}</span>
      <span className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-[#c9a84c] uppercase tracking-wider block leading-none mb-0.5">
          {artifact.type.replace("_", " ")}
        </span>
        <span className="text-xs text-foreground truncate block">{artifact.title}</span>
      </span>
      <ChevronRight className={`w-3.5 h-3.5 text-[#c9a84c]/60 group-hover:text-[#c9a84c] group-hover:translate-x-0.5 transition-all flex-shrink-0 ${isActive ? "text-[#c9a84c]" : ""}`} />
    </button>
  );
}

// ── Artifact Panel ────────────────────────────────────────────────────────────

function ArtifactPanel({
  artifact,
  allArtifacts,
  onClose,
  onSendMessage,
  onSelectArtifact,
}: {
  artifact: ArtifactPayload;
  allArtifacts: ArtifactPayload[];
  onClose: () => void;
  onSendMessage: (msg: string) => void;
  onSelectArtifact: (a: ArtifactPayload) => void;
}) {
  const data = artifact.data ?? {};

  const renderContent = () => {
    switch (artifact.type) {
      case "assessment":   return <AssessmentView data={data} />;
      case "audit":        return <AuditView data={data} />;
      case "results":      return <ResultsView data={data} />;
      case "reteach_plan": return <ReteachView data={data} />;
      case "form":         return <FormView data={data} onSendMessage={onSendMessage} />;
      case "report":
      case "generic":
      default:
        return <ReportView data={data} />;
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ animation: "slideInRight 0.22s ease" }}>
      {/* Header with tab bar when multiple artifacts */}
      <div className="flex-shrink-0 border-b border-border bg-background">
        {allArtifacts.length > 1 ? (
          <>
            <div className="flex items-center gap-1 px-2 pt-2 overflow-x-auto scrollbar-hide">
              {allArtifacts.map((a) => {
                const isActive = a.id === artifact.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelectArtifact(a)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                      isActive
                        ? "bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                    }`}
                  >
                    <span className={isActive ? "text-[#c9a84c]" : "text-muted-foreground"}>
                      {ARTIFACT_ICONS[a.type]}
                    </span>
                    <span className="max-w-[120px] truncate">{a.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 px-4 py-2">
              <p className="text-[10px] font-semibold text-[#c9a84c] uppercase tracking-wider flex-1">
                {artifact.type.replace("_", " ")}
              </p>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-7 h-7 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c]">
              {ARTIFACT_ICONS[artifact.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-[#c9a84c] uppercase tracking-wider">
                {artifact.type.replace("_", " ")}
              </p>
              <p className="text-sm font-medium text-foreground truncate">{artifact.title}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}

// ── Form View (multi-step wizard) ────────────────────────────────────────────

function FormView({ data, onSendMessage }: { data: any; onSendMessage: (msg: string) => void }) {
  const allFields: any[] = data.fields ?? [];
  const hiddenFields  = allFields.filter((f: any) => f.type === "hidden");
  const selectFields  = allFields.filter((f: any) => f.type === "select");
  const detailFields  = allFields.filter((f: any) => f.type !== "hidden" && f.type !== "select");

  type WizardStep =
    | { kind: "select"; field: any }
    | { kind: "details"; fields: any[] };

  const steps: WizardStep[] = [
    ...selectFields.map((f: any) => ({ kind: "select" as const, field: f })),
    ...(detailFields.length > 0 ? [{ kind: "details" as const, fields: detailFields }] : []),
  ];
  const totalSteps = steps.length;

  const initialValues: Record<string, any> = {};
  hiddenFields.forEach((f: any) => { initialValues[f.id] = f.value ?? ""; });
  allFields.forEach((f: any) => {
    if (f.type === "multiselect") initialValues[f.id] = Array.isArray(f.default) ? f.default : [];
  });

  const [values, setValues]             = useState<Record<string, any>>(initialValues);
  const [currentStep, setCurrentStep]   = useState(0);
  const [direction, setDirection]       = useState<"fwd" | "bck">("fwd");
  const [animKey, setAnimKey]           = useState(0);
  const [otherActive, setOtherActive]   = useState<Record<string, boolean>>({});
  const [otherText, setOtherText]       = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const otherInputRef                   = useRef<HTMLInputElement>(null);

  const currentStepDef = steps[currentStep] as WizardStep | undefined;
  const isLastStep = currentStep === totalSteps - 1;

  useEffect(() => {
    if (currentStepDef?.kind === "select" && otherActive[currentStepDef.field.id]) {
      otherInputRef.current?.focus();
    }
  }, [otherActive, currentStep, currentStepDef]);

  const setField = (id: string, value: any) => {
    setValues((v) => ({ ...v, [id]: value }));
    if (errors[id]) setErrors((e) => { const n = { ...e }; delete n[id]; return n; });
  };

  const toggleMultiselect = (id: string, value: string) => {
    setValues((prev) => {
      const current: string[] = Array.isArray(prev[id]) ? prev[id] : [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [id]: next };
    });
    if (errors[id]) setErrors((e) => { const n = { ...e }; delete n[id]; return n; });
  };

  const advance = () => {
    setDirection("fwd");
    setAnimKey((k) => k + 1);
    setCurrentStep((s) => s + 1);
  };

  const handleSelectOption = (fieldId: string, value: string) => {
    setField(fieldId, value);
    setOtherActive((prev) => ({ ...prev, [fieldId]: false }));
    if (!isLastStep) setTimeout(advance, 160);
  };

  const handleOtherClick = (fieldId: string) => {
    const nowActive = !otherActive[fieldId];
    setOtherActive((prev) => ({ ...prev, [fieldId]: nowActive }));
    setField(fieldId, nowActive ? (otherText[fieldId] ?? "") : "");
  };

  const handleOtherInput = (fieldId: string, text: string) => {
    setOtherText((prev) => ({ ...prev, [fieldId]: text }));
    setField(fieldId, text);
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    allFields.forEach((f: any) => {
      if (f.type === "hidden") return;
      const v = values[f.id];
      const empty = Array.isArray(v) ? v.length === 0 : !v;
      if (f.required && empty) errs[f.id] = `${f.label} is required`;
    });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSubmitting(true);
    try {
      const allValues = { ...values };
      hiddenFields.forEach((f: any) => { allValues[f.id] = f.value ?? ""; });
      const formSummary = allFields.map((f: any) => {
        const v = allValues[f.id];
        const display = Array.isArray(v) ? v.join(", ") : (v ?? "not provided");
        return `${f.label}: ${display}`;
      }).join(", ");
      onSendMessage(`__FORM_SUBMIT__:{"action":"${data.action ?? "submit_form"}","values":${JSON.stringify(allValues)}}\n\n${formSummary}`);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // canAdvance: required field must be filled before Continue/Submit
  const canAdvance = (() => {
    if (!currentStepDef) return false;
    if (currentStepDef.kind === "select") {
      if (!currentStepDef.field.required) return true;
      const v = values[currentStepDef.field.id];
      return !!(v && String(v).trim() !== "");
    }
    return currentStepDef.fields.every((f: any) => {
      if (!f.required) return true;
      const v = values[f.id];
      return Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim() !== "");
    });
  })();

  const inputBase = "w-full bg-[hsl(var(--tracy-bg-surface))] border border-[hsl(var(--tracy-border))] rounded-[var(--tracy-radius)] px-3 py-2 text-sm text-[hsl(var(--tracy-text))] outline-none transition-all placeholder:text-[hsl(var(--tracy-text-muted))] hover:border-[hsl(var(--tracy-brand)/0.4)] focus:border-[hsl(var(--tracy-brand)/0.6)] focus:ring-2 focus:ring-[hsl(var(--tracy-ring)/0.2)]";

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
        <div className="w-14 h-14 rounded-full bg-[hsl(var(--tracy-brand)/0.1)] flex items-center justify-center text-2xl">✅</div>
        <p className="text-sm font-semibold text-[hsl(var(--tracy-text))]">Submitted!</p>
        <p className="text-xs text-[hsl(var(--tracy-text-muted))] text-center">Tracy is processing your request. Check the chat for updates.</p>
      </div>
    );
  }

  // Edge case: only hidden fields — no steps
  if (steps.length === 0) {
    return (
      <div className="px-5 py-5">
        <button type="button" onClick={handleSubmit} disabled={isSubmitting}
          className="w-full bg-[hsl(var(--tracy-brand))] text-white rounded-[var(--tracy-radius)] py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
          {isSubmitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</> : (data.submitLabel ?? "Submit")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header: title + step counter + progress bar */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4">
        {data.title && (
          <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--tracy-brand))] mb-2">
            {data.title}
          </p>
        )}
        {totalSteps > 1 && (
          <p className="text-[11px] text-[hsl(var(--tracy-text-muted))] mb-3" data-step-label>
            Step {currentStep + 1} of {totalSteps}
            {currentStepDef?.kind === "select" && (
              <> — <span className="text-[hsl(var(--tracy-text))]">{currentStepDef.field.label}</span></>
            )}
            {currentStepDef?.kind === "details" && (
              <> — <span className="text-[hsl(var(--tracy-text))]">Details</span></>
            )}
          </p>
        )}
        {totalSteps > 1 && (
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className="h-1 rounded-full flex-1 transition-all duration-300"
                style={{ background: i < currentStep ? "hsl(var(--tracy-brand))" : i === currentStep ? "hsl(var(--tracy-brand) / 0.45)" : "hsl(var(--tracy-border))" }} />
            ))}
          </div>
        )}
      </div>

      {/* Step content — keyed so animation replays on step change */}
      <div key={animKey} className={direction === "fwd" ? "wiz-fwd" : "wiz-bck"}
        style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

        {currentStepDef?.kind === "select" && (() => {
          const field = currentStepDef.field;
          const isOther = !!otherActive[field.id];
          return (
            <div className="px-5 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(field.options ?? []).map((opt: any) => {
                  const isSelected = values[field.id] === opt.value && !isOther;
                  return (
                    <button key={opt.value} type="button" onClick={() => handleSelectOption(field.id, opt.value)}
                      aria-pressed={isSelected}
                      className={`relative flex flex-col items-start gap-1 px-4 py-4 rounded-xl border text-left transition-all duration-150 cursor-pointer min-h-[64px] ${
                        isSelected
                          ? "bg-[hsl(var(--tracy-brand)/0.1)] border-[hsl(var(--tracy-brand)/0.5)] shadow-[0_0_0_1px_hsl(var(--tracy-brand)/0.2)]"
                          : "bg-[hsl(var(--tracy-bg-surface))] border-[hsl(var(--tracy-border))] hover:border-[hsl(var(--tracy-brand)/0.35)] hover:bg-[hsl(var(--tracy-brand)/0.04)]"
                      }`}>
                      <span className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected ? "border-[hsl(var(--tracy-brand))] bg-[hsl(var(--tracy-brand))]" : "border-[hsl(var(--tracy-border))]"
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className={`text-sm font-semibold leading-snug pr-6 ${isSelected ? "text-[hsl(var(--tracy-brand))]" : "text-[hsl(var(--tracy-text))]"}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}

                {/* Other card */}
                <button type="button" onClick={() => handleOtherClick(field.id)}
                  aria-pressed={isOther} data-other-card
                  className={`relative flex flex-col items-start gap-1 px-4 py-4 rounded-xl border text-left transition-all duration-150 cursor-pointer min-h-[64px] ${
                    isOther
                      ? "bg-[hsl(var(--tracy-brand)/0.1)] border-[hsl(var(--tracy-brand)/0.5)] shadow-[0_0_0_1px_hsl(var(--tracy-brand)/0.2)]"
                      : "bg-[hsl(var(--tracy-bg-surface))] border-[hsl(var(--tracy-border))] hover:border-[hsl(var(--tracy-brand)/0.35)] hover:bg-[hsl(var(--tracy-brand)/0.04)]"
                  }`}>
                  <span className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    isOther ? "border-[hsl(var(--tracy-brand))] bg-[hsl(var(--tracy-brand))]" : "border-[hsl(var(--tracy-border))]"
                  }`}>
                    {isOther && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className={`text-sm font-semibold leading-snug ${isOther ? "text-[hsl(var(--tracy-brand))]" : "text-[hsl(var(--tracy-text-muted))]"}`}>Other</span>
                  <span className="text-[11px] text-[hsl(var(--tracy-text-muted))] leading-tight pr-6">Type your own</span>
                </button>
              </div>

              {/* Other free-text input */}
              {isOther && (
                <div style={{ animation: "slideUp 0.18s ease" }}>
                  <input ref={otherInputRef} type="text"
                    value={otherText[field.id] ?? ""}
                    onChange={(e) => handleOtherInput(field.id, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}…`}
                    className={inputBase} />
                </div>
              )}
            </div>
          );
        })()}

        {currentStepDef?.kind === "details" && (
          <div className="px-5 pb-4 space-y-5">
            {currentStepDef.fields.map((field: any) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--tracy-text-muted))] flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-[hsl(var(--tracy-brand))]">*</span>}
                </label>

                {field.type === "text" && (
                  <input value={values[field.id] ?? ""} onChange={(e) => setField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`${inputBase} ${errors[field.id] ? "border-[hsl(var(--tracy-error))]" : ""}`} />
                )}

                {field.type === "textarea" && (
                  <textarea value={values[field.id] ?? ""} onChange={(e) => setField(field.id, e.target.value)}
                    placeholder={field.placeholder} rows={3}
                    className={`${inputBase} resize-none ${errors[field.id] ? "border-[hsl(var(--tracy-error))]" : ""}`} />
                )}

                {field.type === "multiselect" && (
                  <div className={`grid grid-cols-2 gap-1.5 ${errors[field.id] ? "ring-1 ring-[hsl(var(--tracy-error))] rounded-[var(--tracy-radius)]" : ""}`}>
                    {field.options?.map((opt: any) => {
                      const checked = (Array.isArray(values[field.id]) ? values[field.id] : []).includes(opt.value);
                      return (
                        <button key={opt.value} type="button" onClick={() => toggleMultiselect(field.id, opt.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-[var(--tracy-radius)] border text-sm text-left transition-all ${
                            checked
                              ? "bg-[hsl(var(--tracy-brand)/0.15)] border-[hsl(var(--tracy-brand)/0.4)] text-[hsl(var(--tracy-brand))]"
                              : "bg-[hsl(var(--tracy-bg-surface))] border-[hsl(var(--tracy-border))] text-[hsl(var(--tracy-text-muted))] hover:border-[hsl(var(--tracy-brand)/0.4)] hover:text-[hsl(var(--tracy-text))]"
                          }`}>
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all ${
                            checked ? "bg-[hsl(var(--tracy-brand))] border-[hsl(var(--tracy-brand))]" : "border-[hsl(var(--tracy-border))]"
                          }`}>
                            {checked && <Check className="w-2 h-2 text-white" />}
                          </div>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {field.type === "toggle" && (
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setField(field.id, !values[field.id])}
                      className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${
                        values[field.id] ? "bg-[hsl(var(--tracy-brand))]" : "bg-[hsl(var(--tracy-bg-hover))] border border-[hsl(var(--tracy-border))]"
                      }`}>
                      <span className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-150 ${values[field.id] ? "left-[calc(100%-20px)]" : "left-0.5"}`} />
                    </button>
                    <span className="text-xs text-[hsl(var(--tracy-text-muted))]">{values[field.id] ? "Enabled" : "Disabled"}</span>
                  </div>
                )}

                {errors[field.id] && <p className="text-[11px] text-[hsl(var(--tracy-error))] mt-0.5">{errors[field.id]}</p>}
                {field.hint && <p className="text-[11px] text-[hsl(var(--tracy-text-muted))]">{field.hint}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Back + Continue/Submit */}
      <div className="flex-shrink-0 px-5 pb-5 pt-3 flex items-center gap-3 border-t border-[hsl(var(--tracy-border)/0.4)]">
        {currentStep > 0 ? (
          <button type="button" data-testid="wizard-back"
            onClick={() => { setDirection("bck"); setAnimKey((k) => k + 1); setCurrentStep((s) => s - 1); }}
            className="flex items-center gap-1 px-4 py-2.5 rounded-[var(--tracy-radius)] border border-[hsl(var(--tracy-border))] text-sm text-[hsl(var(--tracy-text-muted))] hover:text-[hsl(var(--tracy-text))] hover:border-[hsl(var(--tracy-brand)/0.3)] transition-all">
            <ChevronLeft className="w-3.5 h-3.5" />Back
          </button>
        ) : (
          <div className="w-[72px] flex-shrink-0" />
        )}

        <button type="button" data-testid="wizard-advance"
          onClick={isLastStep ? handleSubmit : advance}
          disabled={!canAdvance || isSubmitting}
          className="flex-1 bg-[hsl(var(--tracy-brand))] text-white rounded-[var(--tracy-radius)] py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          {isSubmitting
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
            : isLastStep ? (data.submitLabel ?? "Submit")
            : <>Continue <ChevronRight className="w-3.5 h-3.5" /></>}
        </button>
      </div>
    </div>
  );
}

// ── Artifact content views ────────────────────────────────────────────────────

function AssessmentView({ data }: { data: any }) {
  const questions = data.questions ?? [];
  return (
    <div className="px-5 py-4 space-y-4">
      {data.title && (
        <div className="pb-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{data.title}</h2>
          {data.subject && <p className="text-xs text-muted-foreground mt-0.5">{data.subject} · {data.duration ?? ""}</p>}
        </div>
      )}
      {questions.length > 0 ? questions.map((q: any, i: number) => (
        <div key={i} className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">{q.question ?? q.text ?? q.content}</p>
              {q.marks && <p className="text-[11px] text-muted-foreground mt-1">{q.marks} mark{q.marks > 1 ? "s" : ""}</p>}
              {q.options && (
                <ul className="mt-2 space-y-1">
                  {q.options.map((opt: string, j: number) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-4 h-4 rounded border border-border flex items-center justify-center text-[10px] flex-shrink-0">{String.fromCharCode(65 + j)}</span>
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )) : (
        <p className="text-sm text-muted-foreground text-center py-8">No questions found in this assessment.</p>
      )}
    </div>
  );
}

function AuditView({ data }: { data: any }) {
  const passed = data.passed ?? data.pass;
  const score  = data.score ?? data.audit_score;
  const feedback    = Array.isArray(data.feedback) ? data.feedback : data.feedback ? [data.feedback] : [];
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : data.suggestions ? [data.suggestions] : [];
  const categories  = data.categories ?? data.criteria ?? [];

  return (
    <div className="px-5 py-4 space-y-4">
      <div className={`rounded-xl p-4 border ${passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${passed ? "bg-green-500/10" : "bg-red-500/10"}`}>
            {passed ? "✅" : "❌"}
          </div>
          <div className="flex-1">
            <p className={`text-base font-bold ${passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              Audit {passed ? "Passed" : "Failed"}
            </p>
            {score !== undefined && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${passed ? "bg-green-500" : "bg-red-400"}`} style={{ width: `${Math.min(score, 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground">{score}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Criteria</p>
          {categories.map((cat: any, i: number) => {
            const catPassed = cat.passed ?? cat.pass ?? cat.status === "pass";
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5 border border-border">
                <span className="text-sm flex-shrink-0">{catPassed ? "✅" : "⚠️"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{cat.name ?? cat.title ?? cat.category}</p>
                  {cat.score !== undefined && <p className="text-[11px] text-muted-foreground">{cat.score}%</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {feedback.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Feedback</p>
          {feedback.map((f: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80 bg-muted/30 rounded-lg px-3 py-2 border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/60 flex-shrink-0 mt-1.5" />
              {f}
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Suggestions</p>
          {suggestions.map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80 bg-blue-500/5 rounded-lg px-3 py-2 border border-blue-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 flex-shrink-0 mt-1.5" />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsView({ data }: { data: any }) {
  const students = data.students ?? data.results ?? [];
  const avg      = data.average ?? data.class_average;

  const getGradeColor = (grade: string) => {
    if (!grade) return "text-muted-foreground";
    const g = grade.toUpperCase();
    if (g === "A" || g === "A+") return "text-green-500";
    if (g === "B")               return "text-blue-500";
    if (g === "C")               return "text-yellow-500";
    if (g === "D" || g === "F") return "text-red-500";
    return "text-foreground";
  };

  return (
    <div className="px-5 py-4 space-y-4">
      {(avg !== undefined || data.highest !== undefined || data.lowest !== undefined) && (
        <div className="grid grid-cols-3 gap-3">
          {avg !== undefined && (
            <div className="rounded-xl bg-[#c9a84c]/5 border border-[#c9a84c]/20 p-3 text-center">
              <p className="text-xl font-bold text-[#c9a84c]">{avg}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Average</p>
            </div>
          )}
          {data.highest !== undefined && (
            <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 text-center">
              <p className="text-xl font-bold text-green-500">{data.highest}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Highest</p>
            </div>
          )}
          {data.lowest !== undefined && (
            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 text-center">
              <p className="text-xl font-bold text-red-400">{data.lowest}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Lowest</p>
            </div>
          )}
        </div>
      )}

      {students.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="min-w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-foreground">#</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Student</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">Score</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any, i: number) => (
                <tr key={i} className="border-t border-border even:bg-muted/10 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 text-foreground/80 font-medium">{s.name ?? s.student_name ?? `Student ${i + 1}`}</td>
                  <td className="px-3 py-2 text-right text-foreground/80">
                    <span className="font-semibold">{s.score ?? s.percentage ?? "-"}</span>
                    <span className="text-muted-foreground">%</span>
                  </td>
                  <td className={`px-3 py-2 text-right font-bold ${getGradeColor(s.grade)}`}>{s.grade ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReteachView({ data }: { data: any }) {
  const topics = data.topics ?? data.items ?? [];
  return (
    <div className="px-5 py-4 space-y-4">
      {data.student_name && (
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/10 flex items-center justify-center text-sm font-bold text-[#c9a84c]">
            {data.student_name[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{data.student_name}</p>
            {data.class_name && <p className="text-xs text-muted-foreground">{data.class_name}</p>}
          </div>
        </div>
      )}
      {topics.length > 0 ? topics.map((t: any, i: number) => (
        <div key={i} className="rounded-xl border border-border p-4 space-y-2 hover:border-[#c9a84c]/30 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <p className="text-sm font-semibold text-foreground">{t.topic ?? t.title}</p>
          </div>
          {t.description && <p className="text-xs text-muted-foreground pl-7 leading-relaxed">{t.description}</p>}
          {t.activities && (
            <ul className="pl-7 space-y-1">
              {(Array.isArray(t.activities) ? t.activities : [t.activities]).map((a: string, j: number) => (
                <li key={j} className="flex items-start gap-1.5 text-xs text-foreground/70">
                  <span className="w-1 h-1 rounded-full bg-[#c9a84c]/50 flex-shrink-0 mt-1.5" />
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )) : (
        <p className="text-sm text-muted-foreground text-center py-8">No reteach items found.</p>
      )}
    </div>
  );
}

function ReportView({ data }: { data: any }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No data available for this artifact.</p>
      </div>
    );
  }

  const url = data.url ?? data.download_url ?? data.file_url ?? data.reportUrl;

  return (
    <div className="px-5 py-4 space-y-4">
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/5 px-4 py-3 hover:bg-[#c9a84c]/10 transition-colors"
        >
          <FileText className="w-5 h-5 text-[#c9a84c] flex-shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1">Download Report</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#c9a84c]" />
        </a>
      )}
      <div className="space-y-2">
        {Object.entries(data)
          .filter(([k]) => k !== "url" && k !== "download_url" && k !== "file_url" && k !== "reportUrl")
          .map(([key, value]) => (
            <div key={key} className="flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-2.5 border border-border">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide min-w-[80px] flex-shrink-0 mt-0.5">
                {key.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-foreground/80 break-words">
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function TracyMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table:      ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-lg border border-border">
            <table className="min-w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        thead:      ({ children }) => <thead className="bg-[#c9a84c]/10">{children}</thead>,
        th:         ({ children }) => <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border whitespace-nowrap">{children}</th>,
        td:         ({ children }) => <td className="px-3 py-2 border-b border-border last:border-b-0 text-foreground/80">{children}</td>,
        tr:         ({ children }) => <tr className="even:bg-muted/20 hover:bg-muted/30 transition-colors">{children}</tr>,
        strong:     ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em:         ({ children }) => <em className="italic text-foreground/80">{children}</em>,
        ul:         ({ children }) => <ul className="list-none space-y-1 my-2 pl-1">{children}</ul>,
        ol:         ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
        li:         ({ children }) => (
          <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c9a84c]/60 flex-shrink-0" />
            <span>{children}</span>
          </li>
        ),
        h1:         ({ children }) => <h1 className="text-base font-bold text-foreground mt-4 mb-2 pb-1 border-b border-border">{children}</h1>,
        h2:         ({ children }) => <h2 className="text-sm font-bold text-foreground mt-3 mb-1.5">{children}</h2>,
        h3:         ({ children }) => <h3 className="text-sm font-semibold text-[#c9a84c] mt-2 mb-1">{children}</h3>,
        code:       ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock
            ? <pre className="bg-muted/80 rounded-lg p-3 my-2 overflow-x-auto"><code className="text-xs font-mono text-foreground/90">{children}</code></pre>
            : <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground/90">{children}</code>;
        },
        p:          ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm text-foreground/90">{children}</p>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-[#c9a84c] pl-3 my-2 text-muted-foreground italic text-sm">{children}</blockquote>,
        hr:         () => <hr className="border-border my-3" />,
        a:          ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] underline underline-offset-2 hover:opacity-80 transition-opacity">{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Widget Renderer ───────────────────────────────────────────────────────────

function WidgetRenderer({ html, messageId }: { html: string; messageId: string }) {
  const [height, setHeight]   = useState(200);
  const [srcDoc, setSrcDoc]   = useState("");
  const lastHeightRef         = useRef(0);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const cs   = getComputedStyle(document.documentElement);
    const vars = ["--background","--foreground","--muted","--muted-foreground","--border","--card","--radius"]
      .map((v) => { const val = cs.getPropertyValue(v).trim(); return val ? `${v}:${val}` : ""; })
      .filter(Boolean)
      .join(";");

    // Debounced resize — fires 80 ms after the last layout change settles
    const resizeScript =
      `(function(){var t,last=0;` +
      `function r(){clearTimeout(t);t=setTimeout(function(){` +
      `var h=document.body.scrollHeight;` +
      `if(Math.abs(h-last)>2){last=h;` +
      `window.parent.postMessage({type:"tracy-widget-resize",id:"${messageId}",height:h},"*");}` +
      `},80);}` +
      `window.addEventListener("load",r);` +
      `if(window.ResizeObserver){new ResizeObserver(r).observe(document.body);}` +
      `})();`;

    // Strip full-document wrapper tags Tracy may have included
    let clean = html
      .replace(/<\/body>\s*(<\/html>)?\s*$/i, "")
      .replace(/<\/html>\s*$/i, "")
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<html[^>]*>/gi, "")
      .replace(/<head>[\s\S]*?<\/head>/gi, "")
      .replace(/<body[^>]*>/gi, "")
      // Remove any Chart.js CDN Tracy included — we inject it ourselves below
      .replace(/<script[^>]*(?:cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)[^>]*chart[^>]*>\s*<\/script>/gi, "")
      .trim();

    // Palette: visually distinct, works on both light and dark backgrounds
    const palette = [
      "#6366f1","#10b981","#f59e0b","#ef4444",
      "#3b82f6","#a855f7","#14b8a6","#f97316",
    ];
    const paletteAlpha = palette.map((c) => c + "cc");

    // Plugin: assign per-bar colors when Tracy hasn't specified them explicitly
    const palettePlugin =
      `Chart.register({id:"tracyPalette",beforeRender:function(chart){` +
      `var P=${JSON.stringify(palette)},A=${JSON.stringify(paletteAlpha)};` +
      `chart.data.datasets.forEach(function(ds){` +
      `var isSingleColor=!Array.isArray(ds.backgroundColor)&&` +
      `(ds.backgroundColor==null||typeof ds.backgroundColor==="string");` +
      `if((chart.config.type==="bar"||chart.config.type==="horizontalBar")&&isSingleColor){` +
      `var n=ds.data.length;` +
      `ds.backgroundColor=Array.from({length:n},function(_,i){return A[i%A.length];});` +
      `ds.borderColor=Array.from({length:n},function(_,i){return P[i%P.length];});` +
      `ds.borderWidth=1;` +
      `}})}});`;

    // JS that fixes hardcoded light-mode inline colors after Tracy's HTML renders.
    // Uses raw getAttribute("style") for color checks because browsers normalize hex (#333)
    // to rgb(51,51,51) before el.style.color is readable, making hex-based regex unreliable.
    const darkModeFixer =
      `document.addEventListener("DOMContentLoaded",function(){` +
      `var LIGHT_BG=/^(#fff(fff)?|white|rgb\\(255,\\s*255,\\s*255\\)|rgba\\(255,\\s*255,\\s*255,\\s*1\\))$/i;` +
      `document.querySelectorAll("[style]").forEach(function(el){` +
      `var s=el.style;` +
      `var raw=el.getAttribute("style")||"";` +
      `var bg=(s.background||s.backgroundColor||"").trim();` +
      `if(LIGHT_BG.test(bg)){s.background="hsl(var(--card))";s.backgroundColor="";}` +
      `if(/(?:^|[;\\s])color\\s*:\\s*(#(?:0{3,6}|1{3,6}|2{3,6}|3{3,6})|black)\\b/i.test(raw)){` +
      `s.color="hsl(var(--foreground))";}` +
      `});` +
      `});`;

    setSrcDoc(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><style>` +
      `:root{${vars};--brand:#c9a84c;}` +
      `*{box-sizing:border-box;margin:0;padding:0;}` +
      `html,body{background:hsl(var(--card));color:hsl(var(--foreground));` +
      `font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;` +
      `font-size:13px;line-height:1.5;}` +
      // 16 px breathing room on all sides — prevents text running edge-to-edge
      `body{padding:16px;}` +
      // Typography resets so Tracy's prose looks clean
      `p{margin-bottom:8px;}p:last-child{margin-bottom:0;}` +
      `b,strong{font-weight:600;}` +
      `h1,h2,h3,h4{font-weight:600;line-height:1.3;margin-bottom:6px;}` +
      `canvas{max-width:100%;display:block;}` +
      `</style></head><body>` +
      `<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>` +
      `<script>if(window.Chart){` +
      `Chart.defaults.color="hsl(var(--muted-foreground))";` +
      `Chart.defaults.borderColor="hsl(var(--border))";` +
      `Chart.defaults.plugins.legend.labels.color="hsl(var(--foreground))";` +
      `Chart.defaults.scale.grid.color="hsl(var(--border))";` +
      `Chart.defaults.scale.ticks.color="hsl(var(--muted-foreground))";` +
      palettePlugin +
      `}</script>` +
      clean +
      `<scr` + `ipt>${darkModeFixer}${resizeScript}<\/scr` + `ipt>` +
      `</body></html>`
    );
  }, [html, messageId]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "tracy-widget-resize" && e.data?.id === messageId) {
        const h = Math.max(80, Math.min(600, (e.data.height as number) + 16));
        if (Math.abs(h - lastHeightRef.current) > 2) {
          lastHeightRef.current = h;
          setHeight(h);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [messageId]);

  if (!srcDoc) {
    return <div style={{ height: "200px" }} className="bg-muted/40 animate-pulse" />;
  }

  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{ width: "100%", height: `${height}px`, border: "none", display: "block" }}
      title="Tracy visualization"
    />
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  artifact,
  toolStatuses,
  onArtifactClick,
  isArtifactActive,
  onSend,
}: {
  message: Message;
  artifact?: ArtifactPayload;
  toolStatuses?: ToolStatus[];
  onArtifactClick?: (a: ArtifactPayload) => void;
  isArtifactActive?: boolean;
  onSend?: (text: string) => void;
}) {
  const isUser        = message.role === "user";
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasContent    = message.isLoading || !!message.content || !!message.widgetHtml;
  const [copied, setCopied] = useState(false);

  const FORM_SUBMIT_RE = /^__FORM_SUBMIT__:\{[\s\S]*?\}\n\n/;
  const visibleContent = isUser ? message.content.replace(FORM_SUBMIT_RE, "") : message.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(visibleContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const hasWidget = !isUser && !!message.widgetHtml && !message.isLoading;

  // ── User message ────────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="flex w-full justify-end" style={{ animation: "fadeUp 0.2s ease" }}>
        <div className="flex gap-3 items-end flex-row-reverse max-w-[80%] lg:max-w-[70%] group">
          <div className="flex flex-col gap-1.5 items-end">
            {(hasAttachments || hasContent) && (
              <div className="bg-[#c9a84c] text-white rounded-2xl rounded-br-sm shadow-sm px-4 py-2.5 flex flex-col gap-2">
                {hasAttachments && (
                  <div className="flex flex-wrap gap-2">
                    {message.attachments!.map((f) => <ChatFileCard key={f.id} file={f} inUserBubble />)}
                  </div>
                )}
                {hasContent && (
                  message.isLoading
                    ? <TypingDots />
                    : <p className="whitespace-pre-wrap break-words text-sm">{visibleContent}</p>
                )}
              </div>
            )}
            <span className="text-[10px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp))}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Tracy message with widget — full chat-column width ──────────────────────
  if (hasWidget) {
    return (
      <div className="flex flex-col w-full group" style={{ animation: "fadeUp 0.2s ease" }}>
        {/* Text bubble — normal constrained width, only if there's prose */}
        {message.content && (
          <div className="flex justify-start mb-3">
            <div className="max-w-[80%] lg:max-w-[70%]">
              {hasAttachments && (
                <div className="flex flex-wrap gap-2 mb-1.5">
                  {message.attachments!.map((f) => <ChatFileCard key={f.id} file={f} />)}
                </div>
              )}
              <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-muted/50 border border-border text-foreground rounded-bl-sm">
                <TracyMarkdown content={message.content} />
              </div>
            </div>
          </div>
        )}

        {/* Widget card — full width, clean card that inherits theme from iframe */}
        <div className="w-full rounded-2xl overflow-hidden border border-border shadow-sm">
          <WidgetRenderer html={message.widgetHtml!} messageId={message.id} />
        </div>

        {/* Actions row */}
        <div className="flex flex-col items-start gap-1.5 mt-2 pl-0.5">
          {(message.content || message.widgetHtml) && (
            <button
              onClick={handleCopy}
              aria-label="Copy message"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all opacity-0 group-hover:opacity-100"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
          {artifact && onArtifactClick && (
            <ArtifactChip artifact={artifact} onClick={() => onArtifactClick(artifact)} isActive={isArtifactActive} />
          )}
          {message.nextOptions && message.nextOptions.length > 0 && onSend && (
            <div className="flex flex-wrap gap-2">
              {message.nextOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSend(opt.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-[#c9a84c]/30 bg-[#c9a84c]/5 text-[#c9a84c] hover:bg-[#c9a84c]/15 hover:border-[#c9a84c]/50 transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <span className="text-[10px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp))}
          </span>
        </div>
      </div>
    );
  }

  // ── Tracy message — text only (original layout) ─────────────────────────────
  return (
    <div className="flex w-full justify-start" style={{ animation: "fadeUp 0.2s ease" }}>
      <div className="flex gap-3 items-end flex-row max-w-[80%] lg:max-w-[70%] group">
        <div className="flex flex-col gap-1.5 items-start">
          {hasAttachments && (
            <div className="flex flex-wrap gap-2">
              {message.attachments!.map((f) => <ChatFileCard key={f.id} file={f} />)}
            </div>
          )}
          {hasContent && (
            <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-muted/50 border border-border text-foreground rounded-bl-sm">
              {message.isLoading ? <TypingDots /> : <TracyMarkdown content={message.content} />}
              {message.isLoading && toolStatuses && toolStatuses.length > 0 && (
                <ToolStatusPanel tools={toolStatuses} />
              )}
            </div>
          )}
          {!message.isLoading && message.content && (
            <button
              onClick={handleCopy}
              aria-label="Copy message"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all opacity-0 group-hover:opacity-100"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
          {artifact && onArtifactClick && (
            <ArtifactChip artifact={artifact} onClick={() => onArtifactClick(artifact)} isActive={isArtifactActive} />
          )}
          {message.nextOptions && message.nextOptions.length > 0 && onSend && (
            <div className="flex flex-wrap gap-2 mt-1">
              {message.nextOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSend(opt.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-[#c9a84c]/30 bg-[#c9a84c]/5 text-[#c9a84c] hover:bg-[#c9a84c]/15 hover:border-[#c9a84c]/50 transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <span className="text-[10px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Confirmation Tray ─────────────────────────────────────────────────────────

function ConfirmationTray({ payload, onSelect }: { payload: ConfirmationPayload; onSelect: (v: string) => void }) {
  return (
    <div className="mb-2 bg-background border border-[#c9a84c]/30 rounded-2xl shadow-lg overflow-hidden" style={{ animation: "slideUp 0.18s ease" }}>
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-border/50">
        <span className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider">Tracy</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed mb-3">{payload.message}</p>
        <div className="flex flex-wrap gap-2">
          {payload.options.map((opt) => {
            const isCancel = opt.label.toLowerCase().includes("cancel") || opt.value.toLowerCase().startsWith("no");
            return (
              <button
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  isCancel
                    ? "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    : "bg-[#c9a84c] border-[#c9a84c] text-white hover:opacity-90"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Conversation Sidebar ──────────────────────────────────────────────────────

function ConversationSidebar({
  conversations,
  activeId,
  artifactCount,
  onSelect,
  onDelete,
  onNewChat,
  onOpenArtifacts,
  onRename,
}: {
  conversations: StoredConversation[];
  activeId: string;
  artifactCount: number;
  onSelect: (c: StoredConversation) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  onOpenArtifacts: () => void;
  onRename: (id: string, newTitle: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = query.trim()
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(query.toLowerCase())
      )
    : conversations;

  return (
    <div className="w-60 flex-shrink-0 flex flex-col h-full border-r border-border bg-background" style={{ animation: "slideInLeft 0.2s ease" }}>

      {/* New Chat button */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#c9a84c] hover:bg-[#b8963e] text-white font-medium text-sm transition-colors shadow-sm"
        >
          <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-base leading-none font-light">+</span>
          </span>
          New Chat
        </button>
      </div>

      {/* Artifacts button */}
      <div className="px-3 pb-2 flex-shrink-0">
        <button
          onClick={onOpenArtifacts}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ClipboardList className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Artifacts</span>
          {artifactCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#c9a84c]/15 text-[#c9a84c] text-[10px] font-semibold flex items-center justify-center">
              {artifactCount}
            </span>
          )}
        </button>
      </div>

      {/* Divider + History label */}
      <div className="px-3 pb-1 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">History</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-2.5 py-1.5">
          <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              {query ? "No matching conversations" : "No past conversations yet"}
            </p>
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => { if (editingId !== c.id) onSelect(c); }}
              className={`relative group px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/40 ${
                c.id === activeId ? "bg-[#c9a84c]/8 border-l-2 border-[#c9a84c]" : "border-l-2 border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-1 pr-12">
                {editingId === c.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      const trimmed = editValue.trim();
                      if (trimmed) onRename(c.id, trimmed);
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const trimmed = editValue.trim();
                        if (trimmed) onRename(c.id, trimmed);
                        setEditingId(null);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-xs font-medium bg-muted/60 border border-[#c9a84c]/40 rounded px-1.5 py-0.5 outline-none text-foreground"
                  />
                ) : (
                  <>
                    <p className="text-xs font-medium text-foreground truncate flex-1 leading-snug">{c.title}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5 group-hover:opacity-0 transition-opacity">{relativeTime(c.updatedAt)}</span>
                  </>
                )}
              </div>
              {editingId !== c.id && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{c.lastMessage}</p>
              )}
              {/* Hover actions */}
              {editingId !== c.id && (
                <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditValue(c.title); setEditingId(c.id); }}
                    aria-label="Rename conversation"
                    className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <PenLine className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                    aria-label="Delete conversation"
                    className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-border flex-shrink-0">
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">Stored locally on this device</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TracyPage() {
  const { user }                                      = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";
  const [messages,            setMessages]            = useState<Message[]>([]);
  const [input,               setInput]               = useState("");
  const [isLoading,           setIsLoading]           = useState(false);
  const [pendingFiles,        setPendingFiles]        = useState<UploadedFile[]>([]);
  const [pendingFileContents, setPendingFileContents] = useState<Record<string, string>>({});
  const [isDragging,          setIsDragging]          = useState(false);
  const [confirmation,        setConfirmation]        = useState<ConfirmationPayload | null>(null);
  const [toolStatuses,        setToolStatuses]        = useState<ToolStatus[]>([]);
  const [historyOpen,         setHistoryOpen]         = useState(false);
  const [conversations,       setConversations]       = useState<StoredConversation[]>([]);
  const [isRestoredChat,      setIsRestoredChat]      = useState(false);
  const [showScrollBtn,       setShowScrollBtn]       = useState(false);
  const [suggestions,         setSuggestions]         = useState(STATIC_SUGGESTIONS);

  const [artifacts,      setArtifacts]      = useState<Record<string, ArtifactPayload>>({});
  const [activeArtifact, setActiveArtifact] = useState<ArtifactPayload | null>(null);
  const [panelOpen,      setPanelOpen]      = useState(false);

  const panelGroupKey = panelOpen ? "split" : "full";

  const fileObjectsRef     = useRef<Record<string, File>>({});
  const bottomRef          = useRef<HTMLDivElement>(null);
  const inputRef           = useRef<HTMLTextAreaElement>(null);
  const fileInputRef       = useRef<HTMLInputElement>(null);
  const sessionId          = useRef(`session_${Date.now()}`);
  const readerRef          = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load history and bootstrap personalised suggestions
  useEffect(() => {
    setConversations(loadHistory());

    // Suggestions: serve from cache if fresh, otherwise fetch in background
    try {
      const raw = localStorage.getItem(SUGGESTIONS_CACHE_KEY);
      if (raw) {
        const { data, cachedAt } = JSON.parse(raw);
        if (Date.now() - cachedAt < SUGGESTIONS_TTL && Array.isArray(data) && data.length) {
          setSuggestions(data);
          return; // cache hit — skip network fetch
        }
      }
    } catch { /* ignore */ }

    fetch("/api/tracy/suggest", { method: "POST" })
      .then((r) => r.json())
      .then(({ suggestions: fresh }) => {
        if (Array.isArray(fresh) && fresh.length) {
          setSuggestions(fresh);
          localStorage.setItem(SUGGESTIONS_CACHE_KEY, JSON.stringify({ data: fresh, cachedAt: Date.now() }));
        }
      })
      .catch(() => { /* fail silently — static suggestions stay */ });
  }, []);

  // Scroll listener for scroll-to-bottom button
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handler = () => {
      const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(fromBottom > 200);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // Auto-scroll on new messages (only when near bottom)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (fromBottom < 300) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Textarea auto-resize
  useEffect(() => {
    const el = inputRef.current;
    if (!el || !input) { if (el) el.style.height = "auto"; return; }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const openArtifact = useCallback((artifact: ArtifactPayload) => {
    setActiveArtifact(artifact);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => setActiveArtifact(null), 250);
  }, []);

  const allArtifacts = Object.values(artifacts).sort((a, b) => a.id.localeCompare(b.id));
  const hasArtifacts = allArtifacts.length > 0;
  const lastArtifact = allArtifacts.at(-1);

  // Save conversation to localStorage after a complete response
  const saveConversation = useCallback((finalMessages: Message[], finalArtifacts: Record<string, ArtifactPayload>) => {
    const userMessages = finalMessages.filter((m) => m.role === "user");
    const tracyMessages = finalMessages.filter((m) => m.role === "tracy" && !m.isLoading && m.content);
    if (userMessages.length === 0) return;

    const GREETINGS = /^(hey|hi|hello|yo|sup|hiya|howdy|good\s+(morning|afternoon|evening))[\s!?.]*$/i;
    const substantive = userMessages.find((m) => !GREETINGS.test(m.content.trim())) ?? userMessages[0];
    const raw = substantive.content.trim().replace(/\s+/g, " ");
    const titleText = raw.charAt(0).toUpperCase() + raw.slice(1).replace(/[?!.]+$/, "");
    const title = titleText.length > 50 ? titleText.slice(0, 50) + "…" : titleText;
    const lastTracy = tracyMessages.at(-1);
    const lastMessage = lastTracy ? lastTracy.content.slice(0, 80) + (lastTracy.content.length > 80 ? "…" : "") : "";

    const entry: StoredConversation = {
      id: sessionId.current,
      title,
      lastMessage,
      createdAt: userMessages[0].timestamp instanceof Date ? userMessages[0].timestamp.getTime() : Date.now(),
      updatedAt: Date.now(),
      messages: serializeMessages(finalMessages),
      artifacts: finalArtifacts,
    };

    setConversations((prev) => {
      const updated = upsertConversation(prev, entry);
      saveHistory(updated);
      return updated;
    });
  }, []);

  // Add files with eager upload
  const addFiles = useCallback((files: FileList | File[]) => {
    const allowedTypes = [
      "application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp",
      "text/csv", "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type) && !file.name.endsWith(".csv")) {
        toast.error(`"${file.name}" is not a supported file type.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Maximum file size is 10MB.`);
        return;
      }

      const fileId     = `f_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      fileObjectsRef.current[fileId] = file;

      const newFile: UploadedFile = { id: fileId, name: file.name, size: file.size, type: file.type, previewUrl, uploadState: "pending" };
      setPendingFiles((prev) => [...prev, newFile]);

      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setPendingFileContents((prev) => ({ ...prev, [fileId]: content }));
        };
        reader.readAsText(file);
      }

      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setPendingFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, uploadState: "uploading" } : f));
        uploadFile(file)
          .then((url) => {
            setPendingFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, uploadState: "done", uploadedUrl: url } : f));
          })
          .catch(() => {
            setPendingFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, uploadState: "error" } : f));
            toast.error(`Failed to upload "${file.name}". Please try again.`);
          })
          .finally(() => {
            delete fileObjectsRef.current[fileId];
          });
      }
    });
  }, []);

  const revokeAndClearFiles = useCallback((files: UploadedFile[]) => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      delete fileObjectsRef.current[f.id];
    });
  }, []);

  const clearChat = useCallback(() => {
    // Cancel any in-flight stream
    readerRef.current?.cancel();
    revokeAndClearFiles(pendingFiles);
    setMessages([]);
    setPendingFiles([]);
    setPendingFileContents({});
    setConfirmation(null);
    setArtifacts({});
    setToolStatuses([]);
    setIsRestoredChat(false);
    closePanel();
    sessionId.current = `session_${Date.now()}`;
    // Invalidate suggestion cache so next empty state re-fetches fresh suggestions
    localStorage.removeItem(SUGGESTIONS_CACHE_KEY);
    setSuggestions(STATIC_SUGGESTIONS);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [pendingFiles, closePanel, revokeAndClearFiles]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    readerRef.current?.cancel();
    readerRef.current = null;
    setIsLoading(false);
    setToolStatuses([]);
    setMessages((prev) =>
      prev.map((m) =>
        m.isLoading
          ? { ...m, isLoading: false, content: m.content || "[stopped]" }
          : m
      )
    );
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if ((!content && pendingFiles.length === 0) || isLoading) return;

    const snapshotFiles    = [...pendingFiles];
    const snapshotContents = { ...pendingFileContents };

    let fileDataContext = "";
    Object.entries(snapshotContents).forEach(([id, textContent]) => {
      const fileMeta = snapshotFiles.find((f) => f.id === id);
      if (fileMeta) fileDataContext += `\n\n--- DATA FROM FILE: ${fileMeta.name} ---\n${textContent}\n-----------------`;
    });

    const userMsg: Message = {
      id:          `u_${Date.now()}`,
      role:        "user",
      content:     content || (snapshotFiles.length > 0 ? "Please process these files." : ""),
      timestamp:   new Date(),
      attachments: snapshotFiles.length > 0 ? snapshotFiles : undefined,
    };

    const loadingId = `l_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: loadingId, role: "tracy", content: "", timestamp: new Date(), isLoading: true },
    ]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    revokeAndClearFiles(snapshotFiles);
    setPendingFiles([]);
    setPendingFileContents({});
    setToolStatuses([]);
    setIsLoading(true);

    try {
      const uploadedParts: string[] = [];
      for (const f of snapshotFiles) {
        if (f.type === "application/pdf" || f.type.startsWith("image/")) {
          let url = f.uploadedUrl;
          if (!url) {
            const fileObj = fileObjectsRef.current[f.id];
            if (fileObj) {
              try { url = await uploadFile(fileObj); } catch { /* skip */ }
            }
          }
          if (url) uploadedParts.push(`${f.name} (${f.type}) ${url}`);
        }
      }

      const attachedFilesBlock  = uploadedParts.length > 0 ? `\n\n[ATTACHED FILES: ${uploadedParts.join(", ")}]` : "";
      const finalPayloadMessage = `${userMsg.content}${fileDataContext}${attachedFilesBlock}`;
      const attachmentsMeta     = snapshotFiles.map(({ name, type, size }) => ({ name, type, size }));

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch("/api/tracy", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  controller.signal,
        body:    JSON.stringify({
          message:     finalPayloadMessage,
          sessionId:   sessionId.current,
          attachments: attachmentsMeta.length > 0 ? attachmentsMeta : undefined,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";
      let fullReply = "";
      let finalArtifacts = { ...artifacts };

      const processEvent = (raw: string) => {
        let event: any;
        try { event = JSON.parse(raw); } catch { return; }

        switch (event.type) {
          case "tool_call": {
            setToolStatuses((prev) => {
              const existing = prev.find((t) => t.name === event.name && t.status === "running");
              if (existing) return prev;
              return [...prev, { name: event.name, label: event.label, status: "running" }];
            });
            break;
          }
          case "tool_result": {
            setToolStatuses((prev) =>
              prev.map((t) =>
                t.name === event.name && t.status === "running"
                  ? { ...t, status: event.success ? "done" : "failed" }
                  : t
              )
            );
            break;
          }
          case "text_delta": {
            fullReply += event.delta;
            setMessages((prev) =>
              prev.map((m) => m.isLoading ? { ...m, content: fullReply } : m)
            );
            break;
          }
          case "error": {
            const errorMsg = event.message === "__AUTH_PENDING__"
              ? "__AUTH_PENDING__"
              : "I hit a snag. Please try again.";
            setMessages((prev) =>
              prev.map((m) => m.isLoading ? { ...m, content: errorMsg, isLoading: false } : m)
            );
            break;
          }
          case "done": {
            const reply = fullReply || event.reply || "";
            const trimmed = reply.trim();

            // Parse __CONFIRM__
            const confirmMatch = trimmed.match(CONFIRM_RE);
            if (confirmMatch) {
              const json = extractJson(confirmMatch[1]);
              if (json) {
                try {
                  const parsed: ConfirmationPayload = JSON.parse(json);
                  setMessages((prev) => prev.filter((m) => !m.isLoading));
                  setConfirmation(parsed);
                  return;
                } catch { /* fall through */ }
              }
            }

            // Parse __ARTIFACT__
            const artifactMatch = trimmed.match(ARTIFACT_RE);
            if (artifactMatch) {
              const json = extractJson(artifactMatch[1]);
              if (json) {
                try {
                  const rawArtifact = JSON.parse(json);
                  const artifactId  = `art_${Date.now()}`;
                  const artifact: ArtifactPayload = { id: artifactId, ...rawArtifact };
                  const prefixStart = trimmed.search(ARTIFACT_RE);
                  const beforeTag   = prefixStart > 0 ? trimmed.slice(0, prefixStart).trim() : "";
                  const fallback    = rawArtifact.summary ?? `Here's the ${(rawArtifact.type as string)?.replace("_", " ") ?? "result"} — click to view.`;
                  const bubbleText  = beforeTag || fallback;

                  finalArtifacts = { ...finalArtifacts, [artifactId]: artifact };
                  setArtifacts(finalArtifacts);
                  setMessages((prev) =>
                    prev.map((m) => m.isLoading ? { ...m, content: bubbleText, isLoading: false, artifactId } : m)
                  );
                  openArtifact(artifact);

                  // Save to history
                  setMessages((current) => {
                    saveConversation(current.filter((m) => !m.isLoading).concat([{ id: loadingId, role: "tracy", content: bubbleText, timestamp: new Date(), artifactId }]), finalArtifacts);
                    return current;
                  });
                  return;
                } catch { /* fall through */ }
              }
            }

            // Parse __WIDGET__
            const widgetMatch = trimmed.match(WIDGET_RE);
            if (widgetMatch) {
              const widgetStart  = trimmed.search(WIDGET_RE);
              const beforeWidget = widgetStart > 0 ? trimmed.slice(0, widgetStart).trim() : "";

              let rawHtml = widgetMatch[1];
              let nextOptionsFromWidget: ConfirmationOption[] | undefined;
              const nextInWidget = rawHtml.match(NEXT_RE_IN_WIDGET);
              if (nextInWidget) {
                rawHtml = rawHtml.slice(0, rawHtml.search(NEXT_RE_IN_WIDGET)).trim();
                const nextJson = extractJson(nextInWidget[1]);
                if (nextJson) {
                  try {
                    const parsed: ConfirmationPayload = JSON.parse(nextJson);
                    nextOptionsFromWidget = parsed.options;
                  } catch { /* ignore */ }
                }
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.isLoading
                    ? {
                        ...m,
                        content:     beforeWidget,
                        isLoading:   false,
                        widgetHtml:  rawHtml,
                        nextOptions: nextOptionsFromWidget,
                      }
                    : m
                )
              );
              setMessages((current) => { saveConversation(current, finalArtifacts); return current; });
              return;
            }

            // Parse __NEXT__: extract preceding text + options
            const nextMatch = trimmed.match(NEXT_RE);
            if (nextMatch) {
              const json = extractJson(nextMatch[1]);
              if (json) {
                try {
                  const parsed: ConfirmationPayload = JSON.parse(json);
                  const prefixStart = trimmed.search(NEXT_RE);
                  const beforeTag   = prefixStart > 0 ? trimmed.slice(0, prefixStart).trim() : "";

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.isLoading
                        ? { ...m, content: beforeTag, isLoading: false, nextOptions: parsed.options }
                        : m
                    )
                  );
                  setMessages((current) => {
                    saveConversation(current, finalArtifacts);
                    return current;
                  });
                  return;
                } catch { /* fall through */ }
              }
            }

            // Plain text reply
            setMessages((prev) =>
              prev.map((m) => m.isLoading ? { ...m, content: reply, isLoading: false } : m)
            );
            setMessages((current) => {
              saveConversation(current, finalArtifacts);
              return current;
            });
            break;
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          processEvent(line.slice(6).trim());
        }
      }

    } catch (err: any) {
      // Ignore abort errors from stop button
      if (err?.name !== "AbortError" && err?.message !== "Cancelled") {
        setMessages((prev) =>
          prev.map((m) => m.isLoading ? { ...m, content: "Connection lost. Please try again.", isLoading: false } : m)
        );
      }
    } finally {
      readerRef.current = null;
      setIsLoading(false);
      setToolStatuses([]);
      inputRef.current?.focus();
    }
  }, [input, pendingFiles, pendingFileContents, isLoading, artifacts, openArtifact, revokeAndClearFiles, saveConversation]);

  const handleConfirmationSelect = useCallback((value: string) => {
    setConfirmation(null);
    send(value);
  }, [send]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const removeFile = useCallback((fileId: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      delete fileObjectsRef.current[fileId];
      return prev.filter((f) => f.id !== fileId);
    });
    setPendingFileContents((prev) => {
      const u = { ...prev }; delete u[fileId]; return u;
    });
  }, []);

  const handleRestoreConversation = useCallback((c: StoredConversation) => {
    // Cancel any in-flight stream
    readerRef.current?.cancel();
    setMessages(c.messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
      isLoading: false,
    })));
    setArtifacts(c.artifacts ?? {});
    setActiveArtifact(null);
    setPanelOpen(false);
    setConfirmation(null);
    setToolStatuses([]);
    setIsLoading(false);
    setIsRestoredChat(true);
    sessionId.current = c.id;
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveHistory(updated);
      if (updated.length === 0) setHistoryOpen(false);
      return updated;
    });
  }, []);

  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => c.id === id ? { ...c, title: newTitle } : c);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const isEmpty      = messages.length === 0;
  const controlsDisabled = isLoading || !!confirmation;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes wizFwd {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes wizBck {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .wiz-fwd { animation: wizFwd 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .wiz-bck { animation: wizBck 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <div
        className="flex bg-background relative flex-1 min-h-0 h-full overflow-hidden"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
      >
        {isDragging && (
          <div className="absolute inset-2 z-40 border-2 border-dashed border-[#c9a84c]/50 rounded-2xl pointer-events-none" />
        )}

        {/* History sidebar */}
        {historyOpen && (
          <ConversationSidebar
            conversations={conversations}
            activeId={sessionId.current}
            artifactCount={Object.keys(artifacts).length}
            onSelect={handleRestoreConversation}
            onDelete={handleDeleteConversation}
            onRename={handleRenameConversation}
            onNewChat={() => { clearChat(); }}
            onOpenArtifacts={() => {
              if (activeArtifact) setPanelOpen(true);
            }}
          />
        )}

        <ResizablePanelGroup key={panelGroupKey} direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={panelOpen ? 50 : 100} minSize={30} className="flex flex-col min-h-0">
            <div className="flex flex-col h-full min-h-0">

              {/* Top bar — history toggle + panel toggle */}
              <div className="flex items-center justify-between px-4 pt-2.5 pb-0 flex-shrink-0">
                {conversations.length > 0 ? (
                  <button
                    onClick={() => setHistoryOpen((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                      historyOpen
                        ? "bg-muted text-foreground border-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    History
                  </button>
                ) : (
                  <div />
                )}

                {hasArtifacts && (
                  <button
                    onClick={() => {
                      if (panelOpen) {
                        closePanel();
                      } else {
                        const target = activeArtifact ?? lastArtifact;
                        if (target) openArtifact(target);
                      }
                    }}
                    className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                  >
                    {panelOpen
                      ? <><PanelRightClose className="w-3.5 h-3.5" /> Hide panel</>
                      : <><PanelRightOpen  className="w-3.5 h-3.5" /> Show panel</>
                    }
                    {!panelOpen && allArtifacts.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#c9a84c] text-white text-[9px] font-bold flex items-center justify-center">
                        {allArtifacts.length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Message list */}
              <div className="flex-1 overflow-y-auto min-h-0 relative" ref={scrollContainerRef}>
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

                  {/* Restored conversation banner */}
                  {isRestoredChat && !isEmpty && (
                    <div className="mb-6 flex items-center justify-center">
                      <span className="text-[11px] text-muted-foreground/60 bg-muted/30 border border-border rounded-full px-3 py-1">
                        Past conversation · Tracy may not remember this context
                      </span>
                    </div>
                  )}

                  {isEmpty ? (
                    <div className="flex flex-col items-center text-center pt-8">
                      <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
                        {getGreeting()}, {firstName}
                      </h1>
                      <p className="text-muted-foreground text-sm mb-12 max-w-xs leading-relaxed">
                        I&apos;m Tracy. What are we doing today?
                      </p>
                      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                        {suggestions.slice(0, 4).map((s) => (
                          <button
                            key={s.label}
                            onClick={() => { setInput(s.label); setTimeout(() => inputRef.current?.focus(), 50); }}
                            className="flex items-start gap-3 text-left px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-[#c9a84c]/30 transition-all text-sm text-muted-foreground hover:text-foreground"
                          >
                            <span className="text-base flex-shrink-0">{s.icon}</span>
                            <span className="leading-snug">{s.label}</span>
                          </button>
                        ))}
                        {suggestions.slice(4, 6).map((s) => (
                          <button
                            key={s.label}
                            onClick={() => { setInput(s.label); setTimeout(() => inputRef.current?.focus(), 50); }}
                            className="hidden sm:flex items-start gap-3 text-left px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-[#c9a84c]/30 transition-all text-sm text-muted-foreground hover:text-foreground"
                          >
                            <span className="text-base flex-shrink-0">{s.icon}</span>
                            <span className="leading-snug">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {messages.map((m) => (
                        <MessageBubble
                          key={m.id}
                          message={m}
                          artifact={m.artifactId ? artifacts[m.artifactId] : undefined}
                          toolStatuses={m.isLoading ? toolStatuses : undefined}
                          onArtifactClick={openArtifact}
                          isArtifactActive={panelOpen && activeArtifact?.id === m.artifactId}
                          onSend={send}
                        />
                      ))}
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Scroll to bottom button */}
                {showScrollBtn && (
                  <button
                    onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border shadow-md text-xs text-muted-foreground hover:text-foreground hover:border-[#c9a84c]/30 transition-all"
                    style={{ animation: "fadeUp 0.15s ease" }}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Scroll to bottom
                  </button>
                )}
              </div>

              {/* Input bar */}
              <div className="flex-shrink-0 px-4 sm:px-6 pb-6 pt-2">
                <div className="max-w-2xl mx-auto">
                  {confirmation && (
                    <ConfirmationTray payload={confirmation} onSelect={handleConfirmationSelect} />
                  )}

                  {pendingFiles.length > 0 && (
                    <div className="flex gap-3 mb-3 px-1 overflow-x-auto pb-1">
                      {pendingFiles.map((f) => (
                        <PendingFileCard key={f.id} file={f} onRemove={() => removeFile(f.id)} />
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2 bg-muted/40 border border-border rounded-2xl px-3 py-3 focus-within:border-[#c9a84c]/40 focus-within:bg-background transition-all shadow-sm">
                    {/* New chat button */}
                    <button
                      type="button"
                      onClick={clearChat}
                      title="New chat"
                      disabled={controlsDisabled}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Tracy anything…"
                      rows={1}
                      disabled={controlsDisabled}
                      className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed min-h-[24px] max-h-[160px] py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Attach */}
                      <button
                        type="button"
                        onClick={() => !controlsDisabled && fileInputRef.current?.click()}
                        disabled={controlsDisabled}
                        title="Attach file (PDF, CSV, Image)"
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.csv,image/*,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && addFiles(e.target.files)}
                      />

                      {/* Stop / Send */}
                      {isLoading ? (
                        <button
                          type="button"
                          onClick={stopGeneration}
                          title="Stop generation"
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-foreground/10 text-foreground hover:bg-foreground/20 transition-all shadow-sm"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => send()}
                          disabled={!!confirmation || (!input.trim() && pendingFiles.length === 0)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                            !input.trim() && pendingFiles.length === 0
                              ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                              : "bg-[#c9a84c] text-white hover:opacity-90"
                          }`}
                        >
                          <ArrowUp className="w-4 h-4 stroke-[3px]" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground/40 text-center mt-3 uppercase tracking-widest font-medium">
                    Enter to send · drag &amp; drop files
                  </p>
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* Artifact panel */}
          {panelOpen && activeArtifact && (
            <>
              <ResizableHandle withHandle className="w-1 bg-border hover:bg-[#c9a84c]/30 transition-colors data-[resize-handle-active]:bg-[#c9a84c]/50" />
              <ResizablePanel
                defaultSize={50}
                minSize={25}
                maxSize={70}
                className="flex flex-col min-h-0 bg-background"
                style={{ animation: "slideInRight 0.22s ease" }}
              >
                <ArtifactPanel
                  artifact={activeArtifact}
                  allArtifacts={allArtifacts}
                  onClose={closePanel}
                  onSendMessage={(msg) => send(msg)}
                  onSelectArtifact={openArtifact}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </>
  );
}
