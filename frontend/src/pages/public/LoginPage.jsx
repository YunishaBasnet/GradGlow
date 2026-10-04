import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  GraduationCap,
  LoaderCircle,
  Mail,
  Moon,
  Sun,
} from "lucide-react";

import {
  getAuthSession,
  saveAuthSession,
} from "../../utils/authSession";

import "../../styles/login.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/* ======================================================
   DASHBOARD ROUTING
====================================================== */

function getDashboardPath(role) {
  switch (role) {
    case "student":
      return "/student/dashboard";

    case "advisor":
      return "/advisor/dashboard";

    case "university_admin":
      return "/admin/dashboard";

    case "super_admin":
      return "/super-admin/dashboard";

    default:
      return null;
  }
}

/* ======================================================
   ERROR HANDLING
====================================================== */

function getErrorMessage(data, status) {
  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const firstError = data.detail[0];

    const fieldName = firstError?.loc?.at(-1);
    const message = firstError?.msg;

    if (fieldName === "username") {
      return message
        ? `Student ID or university email: ${message}`
        : "Please enter your Student ID or university email.";
    }

    if (fieldName === "password") {
      return message
        ? `Password: ${message}`
        : "Please enter your password.";
    }

    return message || "Please check your login details.";
  }

  if (status === 401) {
    return "Invalid Student ID, university email, or password.";
  }

  if (status === 422) {
    return "Please check your login details and try again.";
  }

  return "Unable to sign in. Please try again.";
}

/* ======================================================
   LOGIN PAGE
====================================================== */

export default function LoginPage() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState("light");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ======================================================
     REDIRECT IF ALREADY LOGGED IN
  ====================================================== */

  useEffect(() => {
    const session = getAuthSession();

    const dashboardPath = getDashboardPath(session?.role);

    if (session?.accessToken && dashboardPath) {
      navigate(dashboardPath, {
        replace: true,
      });
    }
  }, [navigate]);

  /* ======================================================
     THEME
  ====================================================== */

  const pageClassName = useMemo(
    () =>
      theme === "dark"
        ? "loginPage dark"
        : "loginPage",
    [theme]
  );

  function handleThemeToggle() {
    setTheme((currentTheme) =>
      currentTheme === "light"
        ? "dark"
        : "light"
    );
  }

  function clearError() {
    if (error) {
      setError("");
    }
  }

  /* ======================================================
     LOGIN SUBMIT
  ====================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const loginIdentifier = username.trim();

    /* ---------- VALIDATION ---------- */

    if (!loginIdentifier) {
      setError(
        "Please enter your Student ID or university email."
      );
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (loginIdentifier.length < 3) {
      setError(
        "Please enter a valid Student ID or university email."
      );
      return;
    }

    if (loginIdentifier.length > 100) {
      setError(
        "Student ID or university email is too long."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password.length > 128) {
      setError(
        "Password must contain no more than 128 characters."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      /* ---------- SEND LOGIN REQUEST ---------- */

      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            // Backend expects "username".
            // Student sends Student ID.
            // Advisor/Admin sends university email.
            username: loginIdentifier,
            password,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      /* ---------- LOGIN FAILED ---------- */

      if (!response.ok) {
        setError(
          getErrorMessage(
            data,
            response.status
          )
        );

        return;
      }

      /* ---------- TOKEN CHECK ---------- */

      if (!data?.access_token) {
        setError(
          "The server did not return an authentication token."
        );
        return;
      }

      /* ---------- ROLE CHECK ---------- */

      const dashboardPath =
        getDashboardPath(data?.role);

      if (!dashboardPath) {
        setError(
          "Your account has an unsupported role."
        );
        return;
      }

      /* ---------- STUDENT PROFILE CHECK ---------- */

      if (
        data.role === "student" &&
        !data.student_id
      ) {
        setError(
          "This student account is not linked to a student profile."
        );
        return;
      }

      /* ---------- SAVE AUTH SESSION ---------- */

      saveAuthSession({
        accessToken: data.access_token,

        tokenType:
          data.token_type || "bearer",

        role:
          data.role,

        username:
          data.username || loginIdentifier,

        studentId:
          data.student_id ?? null,

        userId:
          data.student_id ??
          data.username ??
          loginIdentifier,

        name:
          data.username || loginIdentifier,
      });

      /* ---------- REDIRECT ---------- */

      navigate(
        dashboardPath,
        {
          replace: true,
        }
      );
    } catch (requestError) {
      console.error(
        "Login request failed:",
        requestError
      );

      setError(
        "Unable to connect to the GradGlow server. Make sure the backend is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ======================================================
     PAGE
  ====================================================== */

  return (
    <>
      {/* ==================================================
          STYLES SPECIFIC TO LOGIN ACCOUNT HELP
          Everything is kept inside this one file.
      ================================================== */}

      <style>{`
        .loginAccountHelp {
          display: flex;
          flex-direction: column;
          gap: 7px;

          margin-top: -2px;
          margin-bottom: 6px;

          padding: 11px 13px;

          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 10px;

          background: rgba(248, 250, 252, 0.75);

          font-size: 12px;
          line-height: 1.45;

          color: #64748b;
        }

        .loginAccountHelpItem {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .loginAccountHelpItem svg {
          flex-shrink: 0;
          color: #4f46e5;
        }

        .loginAccountHelpItem strong {
          color: #334155;
          font-weight: 600;
        }

        .loginPage.dark .loginAccountHelp {
          background: rgba(15, 23, 42, 0.55);
          border-color: rgba(148, 163, 184, 0.18);
          color: #94a3b8;
        }

        .loginPage.dark .loginAccountHelpItem strong {
          color: #e2e8f0;
        }

        .loginPage.dark .loginAccountHelpItem svg {
          color: #818cf8;
        }

        @media (max-width: 600px) {
          .loginAccountHelp {
            font-size: 11px;
            padding: 10px;
          }
        }
      `}</style>

      <div className={pageClassName}>

        {/* ==================================================
            THEME BUTTON
        ================================================== */}

        <button
          type="button"
          className="loginThemeBtn"
          onClick={handleThemeToggle}
          aria-label={`Switch to ${
            theme === "light"
              ? "dark"
              : "light"
          } mode`}
          title={`Switch to ${
            theme === "light"
              ? "dark"
              : "light"
          } mode`}
        >
          {theme === "light" ? (
            <Moon size={20} />
          ) : (
            <Sun size={20} />
          )}
        </button>

        {/* ==================================================
            BACKGROUND EFFECTS
        ================================================== */}

        <div
          className="loginAmbient loginAmbient--left"
          aria-hidden="true"
        />

        <div
          className="loginAmbient loginAmbient--right"
          aria-hidden="true"
        />

        {/* ==================================================
            LOGIN CARD
        ================================================== */}

        <main className="loginCard">

          {/* HEADER */}

          <header className="loginHeader">

            <div className="loginBadge">
              Welcome Back
            </div>

            <h1>
              Log In
            </h1>

            <p>
              Sign in to your GradGlow account
            </p>

          </header>

          {/* ==================================================
              FORM
          ================================================== */}

          <form
            className="loginForm"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* ================================================
                STUDENT ID / EMAIL
            ================================================ */}

            <label htmlFor="login-username">
              Student ID or University Email
            </label>

            <input
              id="login-username"
              className="loginInput"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(
                  event.target.value
                );

                clearError();
              }}
              placeholder="Enter Student ID or university email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              aria-invalid={Boolean(error)}
              aria-describedby={
                error
                  ? "login-account-help login-error"
                  : "login-account-help"
              }
              disabled={isSubmitting}
            />

            {/* ================================================
                LOGIN TYPE INFORMATION
            ================================================ */}

            <div
              id="login-account-help"
              className="loginAccountHelp"
            >

              <div className="loginAccountHelpItem">

                <GraduationCap
                  size={16}
                  aria-hidden="true"
                />

                <span>
                  <strong>
                    Students:
                  </strong>{" "}
                  use your Student ID
                </span>

              </div>

              <div className="loginAccountHelpItem">

                <Mail
                  size={16}
                  aria-hidden="true"
                />

                <span>
                  <strong>
                    Advisors &amp; Admins:
                  </strong>{" "}
                  use your university email
                </span>

              </div>

            </div>

            {/* ================================================
                PASSWORD
            ================================================ */}

            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              className="loginInput"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );

                clearError();
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              aria-describedby={
                error
                  ? "login-error"
                  : undefined
              }
              disabled={isSubmitting}
            />

            {/* ================================================
                ERROR MESSAGE
            ================================================ */}

            {error ? (
              <p
                id="login-error"
                className="loginError"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {/* ================================================
                SIGN IN BUTTON
            ================================================ */}

            <button
              className="loginSubmitBtn"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >

              {isSubmitting ? (
                <>
                  <LoaderCircle
                    size={16}
                    aria-hidden="true"
                    className="loginSpinner"
                  />

                  Signing In...
                </>
              ) : (
                <>
                  Sign In

                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                  />
                </>
              )}

            </button>

          </form>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <p className="loginFooterText">

            Institution not registered?{" "}

            <Link to="/get-started">
              Get Started
            </Link>

          </p>

        </main>

      </div>
    </>
  );
}