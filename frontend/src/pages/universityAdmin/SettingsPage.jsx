import { useEffect, useState } from "react";
import { getAuthSession, saveAuthSession } from "../../utils/authSession";

export default function SettingsPage({ darkMode, setDarkMode }) {
  const session = getAuthSession();
  const [profile, setProfile] = useState ({ 
    name: session?.name || "Admin User",
    email: session?.userId || "admin@university.edu",
    role: "University Admin",
    image: "",
  });

  const [institution, setInstitution] = useState({
    name: "",
    activeTerm: "",
    academicYear: "",
  });

  const [prediction, setPrediction] = useState({
    highRisk: 70,
    mediumRisk: 40,
    lowRisk: 39,
  });

  const [notifications, setNotifications] = useState({
    uploadCompleted: true,
    highRiskDetected: true,
    pipelineFailure: true,
    advisorAssignment: false,
  });

  const [message, setMessage] = useState("");
  useEffect(() => {
  const saved = localStorage.getItem("adminSettings");

  if (saved) {
    try {
      const parsed = JSON.parse(saved);


      if (parsed.institution) setInstitution(parsed.institution);
      if (parsed.prediction) setPrediction(parsed.prediction);
      if (parsed.notifications) setNotifications(parsed.notifications);
    } catch (error) {
      console.error(error);
    }
  }
}, []);

  function handleProfileImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, image: imageUrl }));
  }

  function handleSave() {
    const payload = {
      profile,
      institution,
      prediction,
      notifications,
      darkMode,
    };
    saveAuthSession({
      ...session,
      name: profile.name,
      userId: profile.email,
    });

    localStorage.setItem("adminSettings", JSON.stringify(payload));
    setMessage("Settings saved locally. Backend save will connect later.");
  }

  return (
    <section className="studentsAdminPage">
      <div className="studentsAdminHeader">
        <div>
          <h2>Settings</h2>
          <p>Manage admin preferences, institution setup, and prediction options.</p>
        </div>

        <button className="primaryActionBtn" type="button" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      {message && (
        <div className="placeholderPanel" style={{ marginBottom: "18px" }}>
          {message}
        </div>
      )}

      <div className="adminTwoCol">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <h3>Admin Profile</h3>
              <p>Update admin account information.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "18px", alignItems: "center", marginBottom: "18px" }}>
            <div className="adminAvatar" style={{ width: "72px", height: "72px", overflow: "hidden" }}>
              {profile.image ? (
                <img
                  src={profile.image}
                  alt="Admin profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                profile.name.charAt(0)
              )}
            </div>

            <label className="primaryActionBtn" style={{ cursor: "pointer" }}>
              Upload Picture
              <input type="file" accept="image/*" hidden onChange={handleProfileImage} />
            </label>
          </div>

          <div className="settingsFormGrid">
            <label>
              <span>Name</span>
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Admin name"
              />
            </label>

            <label>
              <span>Email</span>
              <input
                value={profile.email}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Admin email"
              />
            </label>

            <label>
              <span>Role</span>
              <input value={profile.role} disabled />
            </label>
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <h3>Appearance</h3>
              <p>Customize your dashboard display.</p>
            </div>
          </div>

          <div className="placeholderPanel">
            <h3>{darkMode ? "Dark Theme Enabled" : "Light Theme Enabled"}</h3>
            <p>This theme applies across the app.</p>

            <button
              className="primaryActionBtn"
              type="button"
              onClick={() => setDarkMode(!darkMode)}
            >
              Switch to {darkMode ? "Light" : "Dark"} Mode
            </button>
          </div>
        </div>
      </div>

      <div className="adminTwoCol" style={{ marginTop: "18px" }}>
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <h3>Institution Settings</h3>
              <p>Basic university configuration.</p>
            </div>
          </div>

          <div className="settingsFormGrid">
            <label>
              <span>Institution Name</span>
              <input
                value={institution.name}
                onChange={(e) =>
                  setInstitution((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Example University"
              />
            </label>

            <label>
              <span>Active Term</span>
              <input
                value={institution.activeTerm}
                onChange={(e) =>
                  setInstitution((prev) => ({
                    ...prev,
                    activeTerm: e.target.value,
                  }))
                }
                placeholder="Spring 2026"
              />
            </label>

            <label>
              <span>Academic Year</span>
              <input
                value={institution.academicYear}
                onChange={(e) =>
                  setInstitution((prev) => ({
                    ...prev,
                    academicYear: e.target.value,
                  }))
                }
                placeholder="2025-2026"
              />
            </label>
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <h3>Prediction Settings</h3>
              <p>Configure AI risk prediction thresholds.</p>
            </div>
          </div>

          <div className="settingsFormGrid">
            <label>
              <span>High Risk Threshold (%)</span>
              <input
                type="number"
                value={prediction.highRisk}
                onChange={(e) =>
                  setPrediction((prev) => ({
                    ...prev,
                    highRisk: Number(e.target.value),
                  }))
                }
              />
            </label>

            <label>
              <span>Medium Risk Starts At (%)</span>
              <input
                type="number"
                value={prediction.mediumRisk}
                onChange={(e) =>
                  setPrediction((prev) => ({
                    ...prev,
                    mediumRisk: Number(e.target.value),
                  }))
                }
              />
            </label>

            <label>
              <span>Low Risk Max (%)</span>
              <input
                type="number"
                value={prediction.lowRisk}
                onChange={(e) =>
                  setPrediction((prev) => ({
                    ...prev,
                    lowRisk: Number(e.target.value),
                  }))
                }
              />
            </label>
          </div>
        </div>
      </div>

      <div className="adminPanel" style={{ marginTop: "18px" }}>
        <div className="panelHeader">
          <div>
            <h3>Notification Preferences</h3>
            <p>Choose what admin should be notified about.</p>
          </div>
        </div>

        <div className="settingsToggleGrid">
          {Object.entries(notifications).map(([key, value]) => (
            <label className="settingsToggleRow" key={key}>
              <div>
                <strong>
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (letter) => letter.toUpperCase())}
                </strong>
                <p>Enable or disable this notification.</p>
              </div>

              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}