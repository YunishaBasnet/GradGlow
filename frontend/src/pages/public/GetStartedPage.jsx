import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/getStarted.css";

export default function GetStartedPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    universityName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (
      !form.universityName.trim() ||
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.confirmPassword.trim()
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // temporary frontend flow
    navigate("/login");
  }

  return (
    <div className="getStartedPage">
      <div className="getStartedBlur getStartedBlurLeft"></div>
      <div className="getStartedBlur getStartedBlurRight"></div>

      <div className="getStartedCard">
        <div className="getStartedHeader">
          <div className="getStartedBadge">Institution Signup</div>
          <h1>Get Started with GradGlow</h1>
          <p>
            Create your university admin account to onboard your institution,
            upload data, and activate student and advisor access.
          </p>
        </div>

        <form className="getStartedForm" onSubmit={handleSubmit}>
          <div className="getStartedField">
            <label>University Name</label>
            <input
              type="text"
              name="universityName"
              value={form.universityName}
              onChange={handleChange}
              placeholder="Enter university name"
            />
          </div>

          <div className="getStartedField">
            <label>Admin Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
            />
          </div>

          <div className="getStartedField">
            <label>Work Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter official email"
            />
          </div>

          <div className="getStartedField">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create password"
            />
          </div>

          <div className="getStartedField">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
            />
          </div>

          {error ? <p className="getStartedError">{error}</p> : null}

          <button type="submit" className="getStartedBtn">
            Create Institution Account
          </button>
        </form>

        <div className="getStartedFooter">
          Already onboarded?{" "}
          <button type="button" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}