import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  FileText,
  GraduationCap,
  Mail,
  Moon,
  PauseCircle,
  Plus,
  ShieldAlert,
  Sun,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import StudentBottomNav from "../../components/StudentBottomNav";
import { useTheme } from "../../context/ThemeContext";
import {
  getAuthSession,
  getDashboardStudentId,
} from "../../utils/authSession";

import "../../styles/requests.css";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";


const REQUEST_TYPE_OPTIONS = [
  {
    key: "transcript",
    title: "Official Transcript",
    description: "Request an official academic transcript",
    icon: FileText,
  },
  {
    key: "enrollment",
    title: "Enrollment Verification",
    description: "Request proof of enrollment letter",
    icon: CheckCircle2,
  },
  {
    key: "course_override",
    title: "Course Override",
    description:
      "Request permission to enroll in a restricted course",
    icon: GraduationCap,
  },
  {
    key: "grade_appeal",
    title: "Grade Appeal",
    description: "Appeal a course grade decision",
    icon: ShieldAlert,
  },
  {
    key: "academic_leave",
    title: "Academic Leave",
    description: "Request leave of absence from studies",
    icon: PauseCircle,
  },
  {
    key: "recommendation",
    title: "Letter of Recommendation",
    description: "Request a letter of recommendation",
    icon: Mail,
  },
];


function normalizeStatus(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized === "approved" ||
    normalized === "rejected" ||
    normalized === "pending"
  ) {
    return normalized;
  }

  return "pending";
}


function formatStatusLabel(value) {
  const normalized = normalizeStatus(value);

  return (
    normalized.charAt(0).toUpperCase() +
    normalized.slice(1)
  );
}


function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


function normalizeRequest(item, index = 0) {
  return {
    id: item?.id ?? `request-${index}`,
    title: String(item?.title ?? "Student Request"),
    type: String(item?.type ?? "general"),
    status: normalizeStatus(item?.status),
    submittedAt:
      item?.submitted_at ??
      item?.submittedAt ??
      item?.created_at ??
      new Date().toISOString(),
    notes:
      typeof item?.notes === "string"
        ? item.notes
        : "",
  };
}


async function readResponsePayload(response) {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text ? { detail: text } : {};
}


function getApiError(payload, fallback) {
  if (
    typeof payload?.detail === "string" &&
    payload.detail.trim()
  ) {
    return payload.detail;
  }

  if (Array.isArray(payload?.detail)) {
    return payload.detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(" ");
  }

  if (
    typeof payload?.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  return fallback;
}


export default function StudentRequests() {
  const navigate = useNavigate();
  const themeContext = useTheme();

  const dark =
    themeContext.dark ??
    themeContext.darkMode ??
    false;

  const toggleTheme =
    themeContext.toggleTheme ??
    themeContext.toggleDarkMode ??
    (() => {});

  const studentId = getDashboardStudentId();
  const authSession = getAuthSession();

  const accessToken =
    authSession?.accessToken ??
    authSession?.access_token ??
    "";

  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] =
    useState("all");

  const [loadingRequests, setLoadingRequests] =
    useState(true);

  const [requestsError, setRequestsError] =
    useState("");

  const [createOpen, setCreateOpen] =
    useState(false);

  const [selectedType, setSelectedType] =
    useState("");

  const [notes, setNotes] = useState("");

  const [submitLoading, setSubmitLoading] =
    useState(false);

  const [submitFeedback, setSubmitFeedback] =
    useState("");

  const [submitError, setSubmitError] =
    useState("");


  useEffect(() => {
    if (!studentId) {
      setLoadingRequests(false);
      setRequestsError(
        "Your student ID is missing from the login session."
      );
      return undefined;
    }

    const controller = new AbortController();

    async function loadRequests() {
      setLoadingRequests(true);
      setRequestsError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/student/${encodeURIComponent(
            studentId
          )}/requests`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              ...(accessToken
                ? {
                    Authorization: `Bearer ${accessToken}`,
                  }
                : {}),
            },
            signal: controller.signal,
          }
        );

        const payload =
          await readResponsePayload(response);

        if (!response.ok) {
          throw new Error(
            getApiError(
              payload,
              "Unable to load request history."
            )
          );
        }

        const records = Array.isArray(payload?.requests)
          ? payload.requests
          : [];

        setRequests(
          records.map((item, index) =>
            normalizeRequest(item, index)
          )
        );
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setRequests([]);
        setRequestsError(
          error instanceof Error
            ? error.message
            : "Unable to load request history."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRequests(false);
        }
      }
    }

    loadRequests();

    return () => {
      controller.abort();
    };
  }, [accessToken, studentId]);


  useEffect(() => {
    if (!createOpen) {
      return undefined;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (
        event.key === "Escape" &&
        !submitLoading
      ) {
        closeCreateModal();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        originalOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [createOpen, submitLoading]);


  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter(
        (item) => item.status === "pending"
      ).length,
      approved: requests.filter(
        (item) => item.status === "approved"
      ).length,
      rejected: requests.filter(
        (item) => item.status === "rejected"
      ).length,
    }),
    [requests]
  );


  const filteredRequests = useMemo(() => {
    if (activeFilter === "all") {
      return requests;
    }

    return requests.filter(
      (item) => item.status === activeFilter
    );
  }, [activeFilter, requests]);


  const filterTabs = [
    {
      key: "all",
      label: `All Requests (${counts.all})`,
    },
    {
      key: "pending",
      label: `Pending (${counts.pending})`,
    },
    {
      key: "approved",
      label: `Approved (${counts.approved})`,
    },
    {
      key: "rejected",
      label: `Rejected (${counts.rejected})`,
    },
  ];


  function openCreateModal() {
    setSelectedType("");
    setNotes("");
    setSubmitFeedback("");
    setSubmitError("");
    setCreateOpen(true);
  }


  function closeCreateModal() {
    if (submitLoading) {
      return;
    }

    setCreateOpen(false);
    setSelectedType("");
    setNotes("");
    setSubmitFeedback("");
    setSubmitError("");
  }


  async function handleSubmitRequest() {
    const selectedOption =
      REQUEST_TYPE_OPTIONS.find(
        (item) => item.key === selectedType
      );

    if (!selectedOption || !studentId) {
      return;
    }

    setSubmitLoading(true);
    setSubmitFeedback("");
    setSubmitError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/student/${encodeURIComponent(
          studentId
        )}/requests`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(accessToken
              ? {
                  Authorization: `Bearer ${accessToken}`,
                }
              : {}),
          },
          body: JSON.stringify({
            type: selectedOption.key,
            title: selectedOption.title,
            notes: notes.trim() || null,
          }),
        }
      );

      const payload =
        await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(
          getApiError(
            payload,
            "Unable to submit your request."
          )
        );
      }

      const createdRequest =
        normalizeRequest(payload);

      setRequests((current) => [
        createdRequest,
        ...current,
      ]);

      setActiveFilter("all");
      setSubmitFeedback(
        "Request submitted successfully."
      );

      window.setTimeout(() => {
        setCreateOpen(false);
        setSelectedType("");
        setNotes("");
        setSubmitFeedback("");
      }, 700);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your request."
      );
    } finally {
      setSubmitLoading(false);
    }
  }


  return (
    <div
      className={
        dark
          ? "requestsPage requestsPage--dark"
          : "requestsPage"
      }
    >
      <header className="requestsHeader">
        <div className="requestsHeadText">
          <h1>My Requests</h1>
          <p>
            Track and manage your academic requests
          </p>
        </div>

        <div className="requestsHeadActions">
          <button
            type="button"
            className="requestsBackBtn"
            onClick={() =>
              navigate("/student/dashboard")
            }
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            className="newRequestBtn"
            onClick={openCreateModal}
            disabled={!studentId}
          >
            <Plus size={18} />
            <span>New Request</span>
          </button>

          <button
            type="button"
            className="requestsThemeBtn"
            aria-label={`Switch to ${
              dark ? "light" : "dark"
            } mode`}
            title={`Switch to ${
              dark ? "light" : "dark"
            } mode`}
            onClick={toggleTheme}
          >
            {dark ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
        </div>
      </header>

      <main className="requestsMain">
        <section className="requestsCard">
          <div
            className="requestsTabs"
            role="tablist"
            aria-label="Request filters"
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={
                  activeFilter === tab.key
                    ? "requestsTab requestsTab--active"
                    : "requestsTab"
                }
                onClick={() =>
                  setActiveFilter(tab.key)
                }
                role="tab"
                aria-selected={
                  activeFilter === tab.key
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="requestsDivider" />

          {loadingRequests ? (
            <div className="requestsEmpty">
              <FileText
                size={46}
                className="requestsEmptyIcon"
              />
              <h2>Loading requests</h2>
              <p>
                Retrieving your request history…
              </p>
            </div>
          ) : null}

          {!loadingRequests && requestsError ? (
            <div
              className="requestsEmpty"
              role="alert"
            >
              <ShieldAlert
                size={46}
                className="requestsEmptyIcon"
              />
              <h2>Unable to load requests</h2>
              <p>{requestsError}</p>
            </div>
          ) : null}

          {!loadingRequests &&
          !requestsError &&
          filteredRequests.length === 0 ? (
            <div className="requestsEmpty">
              <FileText
                size={54}
                className="requestsEmptyIcon"
              />

              <h2>
                {activeFilter === "all"
                  ? "No requests yet"
                  : `No ${activeFilter} requests`}
              </h2>

              {activeFilter === "all" ? (
                <button
                  type="button"
                  className="submitFirstBtn"
                  onClick={openCreateModal}
                  disabled={!studentId}
                >
                  <Plus size={18} />
                  <span>
                    Create Your First Request
                  </span>
                </button>
              ) : null}
            </div>
          ) : null}

          {!loadingRequests &&
          !requestsError &&
          filteredRequests.length > 0 ? (
            <div className="requestsList">
              {filteredRequests.map((item) => (
                <article
                  key={item.id}
                  className="requestItem"
                >
                  <div className="requestItemTitle">
                    {item.title}
                  </div>

                  <div className="requestItemMeta">
                    Submitted on{" "}
                    {formatDate(item.submittedAt)}
                  </div>

                  {item.notes ? (
                    <div className="requestItemMeta">
                      {item.notes}
                    </div>
                  ) : null}

                  <span
                    className={`requestPill requestPill--${item.status}`}
                  >
                    {formatStatusLabel(
                      item.status
                    )}
                  </span>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <StudentBottomNav />

      {createOpen ? (
        <div
          className="requestModalOverlay"
          onMouseDown={closeCreateModal}
          role="presentation"
        >
          <div
            className="requestModalCard"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="requestModalHeader">
              <div>
                <h3 id="request-modal-title">
                  Submit a New Request
                </h3>

                <p>
                  Select a request type to
                  continue
                </p>
              </div>

              <button
                type="button"
                className="requestModalClose"
                aria-label="Close request form"
                onClick={closeCreateModal}
                disabled={submitLoading}
              >
                <X size={22} />
              </button>
            </div>

            <div className="requestTypeTitle">
              Request Type
            </div>

            <div className="requestTypeGrid">
              {REQUEST_TYPE_OPTIONS.map(
                (option) => {
                  const OptionIcon =
                    option.icon;

                  const isActive =
                    selectedType === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={
                        isActive
                          ? "requestTypeCard requestTypeCard--active"
                          : "requestTypeCard"
                      }
                      onClick={() =>
                        setSelectedType(
                          option.key
                        )
                      }
                      aria-pressed={isActive}
                      disabled={submitLoading}
                    >
                      <span className="requestTypeIconWrap">
                        <OptionIcon size={22} />
                      </span>

                      <span className="requestTypeText">
                        <span className="requestTypeName">
                          {option.title}
                        </span>

                        <span className="requestTypeDesc">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            <label
              htmlFor="request-notes"
              className="requestTypeTitle"
              style={{
                display: "block",
                marginTop: 20,
              }}
            >
              Additional Notes (Optional)
            </label>

            <textarea
              id="request-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              maxLength={2000}
              rows={4}
              disabled={submitLoading}
              placeholder="Include any information that may help process your request."
              style={{
                width: "100%",
                resize: "vertical",
                boxSizing: "border-box",
                marginTop: 8,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                font: "inherit",
              }}
            />

            <div className="requestModalActions">
              <button
                type="button"
                className="requestBtn requestBtn--cancel"
                onClick={closeCreateModal}
                disabled={submitLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="requestBtn requestBtn--submit"
                onClick={handleSubmitRequest}
                disabled={
                  !selectedType ||
                  submitLoading ||
                  !studentId
                }
              >
                {submitLoading
                  ? "Submitting..."
                  : "Submit Request"}
              </button>
            </div>

            {submitFeedback ? (
              <p
                role="status"
                style={{
                  marginTop: 10,
                  color: "#047857",
                  fontSize: 13,
                }}
              >
                {submitFeedback}
              </p>
            ) : null}

            {submitError ? (
              <p
                role="alert"
                style={{
                  marginTop: 10,
                  color: "#b91c1c",
                  fontSize: 13,
                }}
              >
                {submitError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}