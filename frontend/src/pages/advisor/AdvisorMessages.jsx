import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, LogOut, MailPlus, Moon, Send, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { logoutAndReload } from "../../utils/logout";
import "../../styles/messages.css";

function initials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getApiError(payload, fallback) {
  if (typeof payload?.detail === "string" && payload.detail.trim()) return payload.detail;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  return fallback;
}

function toThread(item) {
  return {
    id: `thread-${item.id}`,
    messageId: Number(item.id),
    studentId: Number(item.student_id),
    studentName: `Student ${item.student_id}`,
    studentEmail: `student${item.student_id}@university.edu`,
    subject: item.subject,
    updatedAt: formatUpdatedAt(item.updated_at || item.created_at),
    unread: String(item.status).toLowerCase() === "sent",
    status: String(item.status || "sent").toLowerCase(),
    statusLabel: String(item.status_label || item.status || "sent"),
    messages: [
      {
        id: `student-${item.id}`,
        sender: "student",
        text: item.body,
        time: formatUpdatedAt(item.created_at),
      },
    ],
  };
}

export default function AdvisorMessages() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeStudent, setComposeStudent] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/advisor/messages", { method: "GET" });
      const payload = await response.json();
      if (!response.ok) throw new Error(getApiError(payload, "Unable to load advisor messages right now."));
      const mapped = Array.isArray(payload) ? payload.map(toThread) : [];
      setThreads(mapped);
      setActiveThreadId((current) => current || mapped[0]?.id || "");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load advisor messages right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeThreadId) || null, [threads, activeThreadId]);
  const unreadCount = useMemo(() => threads.filter((thread) => thread.unread).length, [threads]);

  const updateMessageStatus = async (messageId, status) => {
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/advisor/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(getApiError(payload, "Unable to update the message status."));
      setThreads((prev) =>
        prev.map((thread) =>
          thread.messageId === messageId
            ? {
                ...thread,
                status: String(payload.status || status).toLowerCase(),
                statusLabel: String(payload.status_label || payload.status || status),
                unread: String(payload.status || status).toLowerCase() === "sent",
              }
            : thread
        )
      );
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : "Unable to update the message status.");
    } finally {
      setActionLoading(false);
    }
  };

  const submitReply = async () => {
    if (!activeThread || !replyText.trim()) return;

    const newEntry = {
      id: `reply-${Date.now()}`,
      sender: "advisor",
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              messages: [...thread.messages, newEntry],
              unread: false,
              status: "replied",
            }
          : thread
      )
    );
    setReplyText("");
    await updateMessageStatus(activeThread.messageId, "replied");
  };

  const submitNewMessage = async () => {
    if (!composeStudent.trim() || !composeSubject.trim() || !composeMessage.trim()) return;
    const studentId = Number(composeStudent);
    if (!Number.isFinite(studentId) || studentId <= 0) {
      setError("Enter a valid numeric student ID.");
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          advisor_name: "Advisor Team",
          subject: composeSubject.trim(),
          body: composeMessage.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(getApiError(payload, "Unable to send the message right now."));

      const createdThread = toThread(payload);
      createdThread.unread = false;
      createdThread.status = "replied";
      createdThread.messages = [
        {
          id: `advisor-${payload.id}`,
          sender: "advisor",
          text: composeMessage.trim(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ];

      setThreads((prev) => [createdThread, ...prev]);
      setActiveThreadId(createdThread.id);
      setComposeOpen(false);
      setComposeStudent("");
      setComposeSubject("");
      setComposeMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send the message right now.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectThread = async (thread) => {
    setActiveThreadId(thread.id);
    if (thread.unread) {
      await updateMessageStatus(thread.messageId, "read");
    }
  };

  return (
<div className={darkMode ? "advisorMessagesPage advisorMessagesPage--dark" : "advisorMessagesPage"}>
  <div className="advisorPageContainer">

    <header className="advisorMessagesHeader">
      <div>
        <h1>Messages</h1>
        <p>Read and reply to student conversations</p>
      </div>

      <div className="advisorMessagesHeaderActions">
        <button
          type="button"
          className="messagesBackBtn"
          onClick={() => navigate("/advisor/dashboard")}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <button
          type="button"
          className="messagesBackBtn"
          onClick={logoutAndReload}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>

        <button
          type="button"
          className="messagesComposeBtn"
          onClick={() => setComposeOpen((prev) => !prev)}
        >
          <MailPlus size={16} />
          <span>New Message</span>
        </button>

        <button
          type="button"
          className="messagesThemeBtn"
          aria-label="Toggle theme"
          title="Toggle theme"
          onClick={toggleTheme}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>

      {composeOpen ? (
        <section className="composePanel">
          <div className="composeGrid">
            <input
              type="text"
              placeholder="Student ID"
              value={composeStudent}
              onChange={(event) => setComposeStudent(event.target.value)}
              className="composeInput"
            />
            <input
              type="text"
              placeholder="Subject"
              value={composeSubject}
              onChange={(event) => setComposeSubject(event.target.value)}
              className="composeInput"
            />
          </div>
          <textarea
            placeholder="Write your message..."
            value={composeMessage}
            onChange={(event) => setComposeMessage(event.target.value)}
            className="composeTextarea"
          />
          <div className="composeActions">
            <button type="button" className="messagesSecondaryBtn" onClick={() => setComposeOpen(false)}>
              Cancel
            </button>
            <button type="button" className="messagesPrimaryBtn" onClick={submitNewMessage} disabled={actionLoading}>
              {actionLoading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </section>
      ) : null}

      {error ? <div className="messageEmpty">{error}</div> : null}

      <main className="messagesLayout">
        <aside className="threadSidebar">
          <div className="threadSidebarHead">
            <span>Inbox</span>
            <span className="unreadPill">{unreadCount} unread</span>
          </div>

          <div className="threadList">
            {loading ? <div className="messageEmpty">Loading advisor inbox...</div> : null}
            {!loading && threads.length === 0 ? <div className="messageEmpty">No student messages yet.</div> : null}
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={thread.id === activeThreadId ? "threadItem threadItem--active" : "threadItem"}
                onClick={() => handleSelectThread(thread)}
              >
                <div className="threadTop">
                  <div className="threadAvatar">{initials(thread.studentName)}</div>
                  <div className="threadHeadText">
                    <div className="threadName">{thread.studentName}</div>
                    <div className="threadSubject">{thread.subject}</div>
                  </div>
                </div>
                <div className="threadMeta">
                  <span>{thread.updatedAt}</span>
                  {thread.unread ? <span className="threadUnreadDot" /> : null}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="messageView">
          {activeThread ? (
            <>
              <div className="messageViewHead">
                <h2>{activeThread.subject}</h2>
                <p>
                  {activeThread.studentName} - {activeThread.studentEmail}
                </p>
                <p>Status: {activeThread.statusLabel}</p>
              </div>

              <div className="messageBodyList">
                {activeThread.messages.map((item) => (
                  <article key={item.id} className={item.sender === "advisor" ? "messageBubble messageBubble--advisor" : "messageBubble"}>
                    <div className="messageBubbleSender">{item.sender === "advisor" ? "You" : activeThread.studentName}</div>
                    <div className="messageBubbleText">{item.text}</div>
                    <div className="messageBubbleTime">{item.time}</div>
                  </article>
                ))}
              </div>

              <div className="replyBar">
                <textarea
                  className="replyInput"
                  placeholder="Write your reply..."
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                />
                <button type="button" className="messagesSecondaryBtn" onClick={() => updateMessageStatus(activeThread.messageId, "closed")}>
                  Close
                </button>
                <button type="button" className="messagesPrimaryBtn" onClick={submitReply} disabled={!replyText.trim() || actionLoading}>
                  <Send size={14} />
                  <span>{actionLoading ? "Saving..." : "Reply"}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="messageEmpty">Select a conversation to review and respond.</div>
          )}
        </section>
      </main>
    </div>
  </div>
  );
}
