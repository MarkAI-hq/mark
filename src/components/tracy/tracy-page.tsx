"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Paperclip, ArrowUp, RotateCcw, Sparkles, Plus, X,
  FileText, Image as ImageIcon, PanelRightClose, PanelRightOpen,
  ChevronRight, ExternalLink, ClipboardList, BarChart2, BookOpen, Brain
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "tracy";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  attachments?: UploadedFile[];
  artifactId?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

interface ConfirmationOption {
  label: string;
  value: string;
}

interface ConfirmationPayload {
  message: string;
  options: ConfirmationOption[];
}

type ArtifactType = "assessment" | "report" | "reteach_plan" | "results" | "audit" | "generic";

interface ArtifactPayload {
  id: string;
  type: ArtifactType;
  title: string;
  data: any;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstName(cookieStr: string): string {
  try {
    const ca = cookieStr.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf("user=") === 0) {
        const jsonStr = decodeURIComponent(c.substring("user=".length));
        const userData = JSON.parse(jsonStr);
        const fullName = userData.first_name || userData.name || userData.fullName || userData.displayName || userData.email || "";
        if (fullName) return fullName.split(" ")[0];
      }
      if (c.indexOf("profile=") === 0) {
        const jsonStr = decodeURIComponent(c.substring("profile=".length));
        const userData = JSON.parse(jsonStr);
        const fullName = userData.first_name || userData.name || "";
        if (fullName) return fullName.split(" ")[0];
      }
    }
    return "there";
  } catch { return "there"; }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const SUGGESTIONS = [
  { label: "How did my class perform on the last assessment?", icon: "📊" },
  { label: "Which students need intervention right now?", icon: "🎯" },
  { label: "Show audit result for my latest assessment", icon: "✅" },
  { label: "Generate a class progress report", icon: "📄" },
  { label: "What are the most common mistakes in my class?", icon: "🔍" },
  { label: "Predict national exam performance for my class", icon: "📈" },
];

const ARTIFACT_ICONS: Record<ArtifactType, React.ReactNode> = {
  assessment: <ClipboardList className="w-4 h-4" />,
  report: <BarChart2 className="w-4 h-4" />,
  reteach_plan: <BookOpen className="w-4 h-4" />,
  results: <BarChart2 className="w-4 h-4" />,
  audit: <ClipboardList className="w-4 h-4" />,
  generic: <Brain className="w-4 h-4" />,
};

// ── Small Components ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
      ))}
    </span>
  );
}

function PendingFileCard({ file, onRemove }: { file: UploadedFile; onRemove?: () => void }) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  return (
    <div className="relative flex-shrink-0 w-24 group">
      <div className="w-24 h-20 rounded-xl overflow-hidden border border-border bg-muted/60 flex items-center justify-center">
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
      </div>
      <p className="text-[10px] text-muted-foreground truncate mt-1 px-0.5">{file.name}</p>
      {onRemove && (
        <button onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
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

// ── Artifact chip — shown in the message bubble ───────────────────────────────

function ArtifactChip({ artifact, onClick }: { artifact: ArtifactPayload; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/50 transition-all group w-full max-w-xs text-left"
    >
      <span className="text-[#c9a84c] flex-shrink-0">{ARTIFACT_ICONS[artifact.type]}</span>
      <span className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-[#c9a84c] uppercase tracking-wider block leading-none mb-0.5">
          {artifact.type.replace("_", " ")}
        </span>
        <span className="text-xs text-foreground truncate block">{artifact.title}</span>
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-[#c9a84c]/60 group-hover:text-[#c9a84c] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
}

// ── Artifact Panel ────────────────────────────────────────────────────────────

function ArtifactPanel({
  artifact,
  onClose,
}: {
  artifact: ArtifactPayload;
  onClose: () => void;
}) {
  const data = artifact.data ?? {};

  const renderContent = () => {
    switch (artifact.type) {
      case "assessment":
        return <AssessmentView data={data} />;
      case "audit":
        return <AuditView data={data} />;
      case "results":
        return <ResultsView data={data} />;
      case "reteach_plan":
        return <ReteachView data={data} />;
      case "report":
      case "generic":
      default:
        return (
          <div className="prose prose-sm max-w-none px-6 py-4">
            <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
              {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ animation: "slideInRight 0.22s ease" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border flex-shrink-0 bg-background">
        <div className="w-7 h-7 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c]">
          {ARTIFACT_ICONS[artifact.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[#c9a84c] uppercase tracking-wider">
            {artifact.type.replace("_", " ")}
          </p>
          <p className="text-sm font-medium text-foreground truncate">{artifact.title}</p>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}

// ── Artifact content renderers ────────────────────────────────────────────────

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
            <span className="w-6 h-6 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">{q.question ?? q.text ?? q.content}</p>
              {q.marks && <p className="text-[11px] text-muted-foreground mt-1">{q.marks} mark{q.marks > 1 ? "s" : ""}</p>}
              {q.options && (
                <ul className="mt-2 space-y-1">
                  {q.options.map((opt: string, j: number) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-4 h-4 rounded border border-border flex items-center justify-center text-[10px] flex-shrink-0">
                        {String.fromCharCode(65 + j)}
                      </span>
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
  const score = data.score ?? data.audit_score;
  const feedback = data.feedback ?? [];
  return (
    <div className="px-5 py-4 space-y-4">
      <div className={`rounded-xl p-4 border ${passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${passed ? "bg-green-500/10" : "bg-red-500/10"}`}>
            {passed ? "✅" : "❌"}
          </div>
          <div>
            <p className={`text-sm font-semibold ${passed ? "text-green-600" : "text-red-600"}`}>
              Audit {passed ? "Passed" : "Failed"}
            </p>
            {score !== undefined && (
              <p className="text-xs text-muted-foreground">Score: {score}%</p>
            )}
          </div>
        </div>
      </div>
      {feedback.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Feedback</p>
          {feedback.map((f: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80 bg-muted/30 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]/60 flex-shrink-0 mt-1.5" />
              {f}
            </div>
          ))}
        </div>
      )}
      {data.suggestions && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Suggestions</p>
          <div className="text-sm text-foreground/80 leading-relaxed">{data.suggestions}</div>
        </div>
      )}
    </div>
  );
}

function ResultsView({ data }: { data: any }) {
  const students = data.students ?? data.results ?? [];
  const avg = data.average ?? data.class_average;
  return (
    <div className="px-5 py-4 space-y-4">
      {avg !== undefined && (
        <div className="rounded-xl bg-[#c9a84c]/5 border border-[#c9a84c]/20 p-4 flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#c9a84c]">{avg}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Class Average</p>
          </div>
          {data.highest !== undefined && (
            <div className="text-center border-l border-border pl-4">
              <p className="text-lg font-semibold text-foreground">{data.highest}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Highest</p>
            </div>
          )}
          {data.lowest !== undefined && (
            <div className="text-center border-l border-border pl-4">
              <p className="text-lg font-semibold text-foreground">{data.lowest}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lowest</p>
            </div>
          )}
        </div>
      )}
      {students.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="min-w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-foreground">Student</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">Score</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any, i: number) => (
                <tr key={i} className="border-t border-border even:bg-muted/10">
                  <td className="px-3 py-2 text-foreground/80">{s.name ?? s.student_name ?? `Student ${i + 1}`}</td>
                  <td className="px-3 py-2 text-right text-foreground/80">{s.score ?? s.percentage ?? "-"}%</td>
                  <td className="px-3 py-2 text-right font-medium text-foreground">{s.grade ?? "-"}</td>
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
        <div key={i} className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
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

// ── Markdown renderer ─────────────────────────────────────────────────────────

function TracyMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      table: ({ children }) => (
        <div className="overflow-x-auto my-3 rounded-lg border border-border">
          <table className="min-w-full text-xs border-collapse">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-[#c9a84c]/10">{children}</thead>,
      th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border whitespace-nowrap">{children}</th>,
      td: ({ children }) => <td className="px-3 py-2 border-b border-border last:border-b-0 text-foreground/80">{children}</td>,
      tr: ({ children }) => <tr className="even:bg-muted/20 hover:bg-muted/30 transition-colors">{children}</tr>,
      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
      ul: ({ children }) => <ul className="list-none space-y-1 my-2 pl-1">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
      li: ({ children }) => (
        <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c9a84c]/60 flex-shrink-0" />
          <span>{children}</span>
        </li>
      ),
      h1: ({ children }) => <h1 className="text-base font-bold text-foreground mt-4 mb-2 pb-1 border-b border-border">{children}</h1>,
      h2: ({ children }) => <h2 className="text-sm font-bold text-foreground mt-3 mb-1.5">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-semibold text-[#c9a84c] mt-2 mb-1">{children}</h3>,
      code: ({ children, className }) => {
        const isBlock = className?.includes("language-");
        if (isBlock) return (
          <pre className="bg-muted/80 rounded-lg p-3 my-2 overflow-x-auto">
            <code className="text-xs font-mono text-foreground/90">{children}</code>
          </pre>
        );
        return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground/90">{children}</code>;
      },
      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm text-foreground/90">{children}</p>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-[#c9a84c] pl-3 my-2 text-muted-foreground italic text-sm">{children}</blockquote>,
      hr: () => <hr className="border-border my-3" />,
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="text-[#c9a84c] underline underline-offset-2 hover:opacity-80 transition-opacity">{children}</a>
      ),
    }}>
      {content}
    </ReactMarkdown>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  artifact,
  onArtifactClick,
}: {
  message: Message;
  artifact?: ArtifactPayload;
  onArtifactClick?: (a: ArtifactPayload) => void;
}) {
  const isUser = message.role === "user";
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasContent = message.isLoading || !!message.content;

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 items-end ${isUser ? "flex-row-reverse" : "flex-row"} max-w-[80%] lg:max-w-[65%]`}
        style={{ animation: "fadeUp 0.2s ease" }}>
        {!isUser && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        <div className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
          {isUser ? (
            (hasAttachments || hasContent) && (
              <div className="bg-[#c9a84c] text-white rounded-2xl rounded-br-sm shadow-sm px-4 py-2.5 flex flex-col gap-2">
                {hasAttachments && (
                  <div className="flex flex-wrap gap-2">
                    {message.attachments!.map((f) => <ChatFileCard key={f.id} file={f} inUserBubble={true} />)}
                  </div>
                )}
                {hasContent && (
                  message.isLoading
                    ? <TypingDots />
                    : <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                )}
              </div>
            )
          ) : (
            <>
              {hasAttachments && (
                <div className="flex flex-wrap gap-2">
                  {message.attachments!.map((f) => <ChatFileCard key={f.id} file={f} inUserBubble={false} />)}
                </div>
              )}
              {hasContent && (
                <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-muted/50 border border-border text-foreground rounded-bl-sm">
                  {message.isLoading ? <TypingDots /> : <TracyMarkdown content={message.content} />}
                </div>
              )}
              {/* Artifact chip — only on Tracy messages */}
              {artifact && onArtifactClick && (
                <ArtifactChip artifact={artifact} onClick={() => onArtifactClick(artifact)} />
              )}
            </>
          )}
          <span className="text-[10px] text-muted-foreground px-1">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Confirmation Tray ─────────────────────────────────────────────────────────

function ConfirmationTray({ payload, onSelect }: { payload: ConfirmationPayload; onSelect: (v: string) => void }) {
  return (
    <div className="mb-2 bg-background border border-[#c9a84c]/30 rounded-2xl shadow-lg overflow-hidden"
      style={{ animation: "slideUp 0.18s ease" }}>
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-border/50">
        <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
        <span className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider">Tracy</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed mb-3">{payload.message}</p>
        <div className="flex flex-wrap gap-2">
          {payload.options.map((opt) => {
            const isCancel = opt.label.toLowerCase().includes("cancel") || opt.value.toLowerCase().startsWith("no");
            return (
              <button key={opt.value} onClick={() => onSelect(opt.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  isCancel
                    ? "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    : "bg-[#c9a84c] border-[#c9a84c] text-white hover:opacity-90"
                }`}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TracyPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [pendingFileContents, setPendingFileContents] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState("there");
  const [authReady, setAuthReady] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationPayload | null>(null);

  // ── Artifact panel state ──────────────────────────────────────────────────
  const [artifacts, setArtifacts] = useState<Record<string, ArtifactPayload>>({});
  const [activeArtifact, setActiveArtifact] = useState<ArtifactPayload | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const fileObjectsRef = useRef<Record<string, File>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session_${Date.now()}`);
  const retryCount = useRef(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;
    const checkAuth = () => {
      const name = getFirstName(document.cookie);
      const hasAuth = name !== "there" || !!(window as any).__mirrorUser ||
        document.cookie.includes("token=") || document.cookie.includes("auth=") ||
        document.cookie.includes("session=") || document.cookie.includes("user=");
      if (name !== "there") setFirstName(name);
      if (hasAuth || attempts >= maxAttempts) { setAuthReady(true); return; }
      attempts++;
      setTimeout(checkAuth, 500);
    };
    checkAuth();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
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

  const addFiles = useCallback((files: FileList | File[]) => {
    const allowedTypes = [
      "application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp",
      "text/csv", "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type) && !file.name.endsWith(".csv")) return;
      if (file.size > 10 * 1024 * 1024) return;
      const fileId = `f_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      fileObjectsRef.current[fileId] = file;
      setPendingFiles((prev) => [...prev, { id: fileId, name: file.name, size: file.size, type: file.type, previewUrl }]);
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setPendingFileContents((prev) => ({ ...prev, [fileId]: content }));
        };
        reader.readAsText(file);
      }
    });
  }, []);

  const clearChat = () => {
    setMessages([]);
    setPendingFiles([]);
    setPendingFileContents({});
    setConfirmation(null);
    setArtifacts({});
    closePanel();
    setIsMenuOpen(false);
    retryCount.current = 0;
    sessionId.current = `session_${Date.now()}`;
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const send = useCallback(async (text?: string, isRetry = false) => {
    const content = (text ?? input).trim();
    if ((!content && pendingFiles.length === 0) || isLoading) return;

    const snapshotFiles = [...pendingFiles];
    const snapshotContents = { ...pendingFileContents };

    let fileDataContext = "";
    Object.entries(snapshotContents).forEach(([id, textContent]) => {
      const fileMeta = snapshotFiles.find((f) => f.id === id);
      if (fileMeta) fileDataContext += `\n\n--- DATA FROM FILE: ${fileMeta.name} ---\n${textContent}\n-----------------`;
    });

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: "user",
      content: content || (snapshotFiles.length > 0 ? "Please process these files." : ""),
      timestamp: new Date(),
      attachments: snapshotFiles.length > 0 ? snapshotFiles : undefined,
    };

    const loadingId = `l_${Date.now()}`;

    if (!isRetry) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: loadingId, role: "tracy", content: "", timestamp: new Date(), isLoading: true },
      ]);
      setInput("");
      setPendingFiles([]);
      setPendingFileContents({});
    }

    setIsLoading(true);

    try {
      const finalPayloadMessage = fileDataContext ? `${userMsg.content}${fileDataContext}` : userMsg.content;
      const attachmentsMeta = snapshotFiles.map(({ name, type, size }) => ({ name, type, size }));

      const res = await fetch("/api/tracy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalPayloadMessage,
          sessionId: sessionId.current,
          attachments: attachmentsMeta.length > 0 ? attachmentsMeta : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401 && retryCount.current < 3) {
        retryCount.current++;
        setTimeout(() => send(content, true), 1000);
        return;
      }

      retryCount.current = 0;
      const reply: string = data.reply || data.error || "I hit a snag. Please try again.";

      // ── __CONFIRM__ ─────────────────────────────────────────
      if (reply.startsWith("__CONFIRM__:")) {
        try {
          const parsed: ConfirmationPayload = JSON.parse(reply.slice("__CONFIRM__:".length));
          setMessages((prev) => prev.filter((m) => !m.isLoading));
          setConfirmation(parsed);
          return;
        } catch { console.warn("[Tracy UI] Failed to parse confirmation payload"); }
      }

      // ── __ARTIFACT__ ─────────────────────────────────────────
      if (reply.startsWith("__ARTIFACT__:")) {
        try {
          const rawArtifact = JSON.parse(reply.slice("__ARTIFACT__:".length));
          const artifactId = `art_${Date.now()}`;
          const artifact: ArtifactPayload = { id: artifactId, ...rawArtifact };

          setArtifacts((prev) => ({ ...prev, [artifactId]: artifact }));
          setMessages((prev) =>
            prev.map((m) =>
              m.isLoading
                ? { ...m, content: rawArtifact.summary ?? `Here's the ${rawArtifact.type?.replace("_", " ") ?? "result"} — click to view.`, isLoading: false, artifactId }
                : m
            )
          );
          // Auto-open panel
          openArtifact(artifact);
          return;
        } catch { console.warn("[Tracy UI] Failed to parse artifact payload"); }
      }

      setMessages((prev) =>
        prev.map((m) => m.isLoading ? { ...m, content: reply, isLoading: false } : m)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.isLoading ? { ...m, content: "Connection lost. Please try again.", isLoading: false } : m)
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, pendingFiles, pendingFileContents, isLoading, openArtifact]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirmationSelect = useCallback((value: string) => {
    setConfirmation(null);
    send(value);
  }, [send]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isEmpty = messages.length === 0;

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
      `}</style>

      <div
        className="flex bg-background relative flex-1 min-h-0 h-full overflow-hidden"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
      >
        {isDragging && (
          <div className="absolute inset-2 z-40 border-2 border-dashed border-[#c9a84c]/50 rounded-2xl pointer-events-none transition-all" />
        )}

        {/* ── Left: Chat ── */}
        <div className={`flex flex-col min-h-0 transition-all duration-300 ease-in-out ${panelOpen ? "w-[44%] border-r border-border" : "w-full"}`}>

          {/* Panel toggle button — visible when panel is closed and there are artifacts */}
          {!panelOpen && Object.keys(artifacts).length > 0 && (
            <div className="flex justify-end px-4 pt-3 flex-shrink-0">
              <button onClick={() => activeArtifact && setPanelOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all">
                <PanelRightOpen className="w-3.5 h-3.5" />
                Show panel
              </button>
            </div>
          )}

          {/* Chat scroll area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
              {isEmpty ? (
                <div className="flex flex-col items-center text-center pt-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mb-6 shadow-sm">
                    <Sparkles className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
                    {getGreeting()},{" "}
                    {authReady ? firstName : <span className="inline-block w-16 h-5 bg-muted animate-pulse rounded" />}
                  </h1>
                  <p className="text-muted-foreground text-sm mb-12 max-w-xs leading-relaxed">
                    I'm Tracy. What are we doing today?
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                    {SUGGESTIONS.slice(0, 6).map((s, i) => (
                      <button key={s.label} onClick={() => setInput(s.label)}
                        className={`flex items-start gap-3 text-left px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-[#c9a84c]/30 transition-all text-sm text-muted-foreground hover:text-foreground ${i >= 4 ? "hidden sm:flex" : "flex"}`}>
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
                      onArtifactClick={openArtifact}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-4 sm:px-6 pb-6 pt-2">
            <div className="max-w-2xl mx-auto">
              {confirmation && <ConfirmationTray payload={confirmation} onSelect={handleConfirmationSelect} />}

              {pendingFiles.length > 0 && (
                <div className="flex gap-3 mb-3 px-1 overflow-x-auto pb-1">
                  {pendingFiles.map((f) => (
                    <PendingFileCard key={f.id} file={f} onRemove={() => {
                      setPendingFiles((prev) => prev.filter((p) => p.id !== f.id));
                      setPendingFileContents((prev) => { const u = { ...prev }; delete u[f.id]; return u; });
                    }} />
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2 bg-muted/40 border border-border rounded-2xl px-3 py-3 focus-within:border-[#c9a84c]/40 focus-within:bg-background transition-all shadow-sm">
                <div className="relative" ref={menuRef}>
                  <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isMenuOpen ? "bg-[#c9a84c] text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                    <Plus className={`w-5 h-5 transition-transform duration-200 ${isMenuOpen ? "rotate-45" : ""}`} />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-40 bg-background border border-border rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-bottom-2 z-50">
                      <button onClick={clearChat}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-[#c9a84c] hover:bg-[#c9a84c]/5 rounded-lg transition-colors">
                        <RotateCcw className="w-4 h-4" />
                        New chat
                      </button>
                    </div>
                  )}
                </div>

                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="Ask Tracy anything..." rows={1} disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed min-h-[24px] max-h-[160px] py-1.5 disabled:opacity-50" />

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    title="Attach file (PDF, CSV, Image)"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input ref={fileInputRef} type="file"
                    accept=".pdf,.csv,image/*,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
                  <button type="button" onClick={() => send()}
                    disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${!input.trim() && pendingFiles.length === 0 ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed" : "bg-[#c9a84c] text-white hover:opacity-90"}`}>
                    <ArrowUp className="w-4 h-4 stroke-[3px]" />
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground/40 text-center mt-3 uppercase tracking-widest font-medium">
                Enter to send · drag & drop files
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Artifact Panel ── */}
        {panelOpen && activeArtifact && (
          <div className="flex-1 min-h-0 flex flex-col bg-background overflow-hidden">
            <ArtifactPanel artifact={activeArtifact} onClose={closePanel} />
          </div>
        )}
      </div>
    </>
  );
}