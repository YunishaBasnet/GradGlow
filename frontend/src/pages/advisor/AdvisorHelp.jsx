import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle,
  HelpCircle,
  Mail,
  MessageCircle,
  Search,
  Send,
  Upload,
  User,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import "../../styles/advisorHelp.css";

const HELP_TOPICS = [
  {
    icon: <BookOpen />,
    title: "Dashboard Overview",
    text: "Understand metrics, risk summaries, student rows, and analytics cards.",
    action: "/advisor/dashboard",
  },
  {
    icon: <MessageCircle />,
    title: "Messages",
    text: "Learn how to read, reply, and manage student communication.",
    action: "/advisor/messages",
  },
  {
    icon: <CalendarDays />,
    title: "Appointments",
    text: "Review appointment requests and manage advising meetings.",
    action: "/advisor/appointments",
  },
  {
    icon: <User />,
    title: "Profile",
    text: "Update your profile details, contact info, links, and photo.",
    action: "/advisor/profile",
  },
];

const FAQS = [
  {
    q: "Why do I see no students?",
    a: "Students appear after the university admin uploads student data and assigns those students to your advisor account.",
  },
  {
    q: "Why is risk analytics empty?",
    a: "Risk analytics appears after ETL and prediction data are processed. If no prediction data exists yet, the dashboard will show an empty state.",
  },
  {
    q: "Can I update my profile photo?",
    a: "Yes. Open Profile, click Change Photo, upload an image, and save it. Your dashboard avatar will update after saving.",
  },
  {
    q: "Where do appointment requests appear?",
    a: "Appointment requests appear in the Appointments page. You can open it from the dashboard quick card or the top-right menu.",
  },
  {
    q: "Who should I contact for data issues?",
    a: "Contact your university admin if student records, course data, or prediction results are missing or incorrect.",
  },
];

export default function AdvisorHelp() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [query, setQuery] = useState("");
  const [issueType, setIssueType] = useState("Dashboard issue");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const filteredFaqs = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return FAQS;

    return FAQS.filter(
      (faq) =>
        faq.q.toLowerCase().includes(search) ||
        faq.a.toLowerCase().includes(search)
    );
  }, [query]);

  function handleSubmitIssue(e) {
    e.preventDefault();

    if (!message.trim()) return;

    setSent(true);
    setMessage("");

    setTimeout(() => setSent(false), 2500);
  }

  return (
    <div className={`advisorHelpPage ${darkMode ? "advisorHelpPage--dark" : ""}`}>
      <div className="advisorHelpShell advisorPageContainer">
        <header className="advisorHelpHeader">
          <div>
            <div className="advisorHelpEyebrow">Advisor Support Center</div>
            <h1>Get Help</h1>
            <p>
              Find guidance for student data, risk insights, communication,
              appointments, and account support.
            </p>
          </div>

          <button
            type="button"
            className="advisorHelpBackBtn"
            onClick={() => navigate("/advisor/dashboard")}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </header>

        <section className="advisorHelpSearchCard">
          <Search size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles, questions, or dashboard issues..."
          />
        </section>

        <section className="advisorHelpGrid">
          {HELP_TOPICS.map((topic) => (
            <button
              key={topic.title}
              type="button"
              className="advisorHelpCard"
              onClick={() => navigate(topic.action)}
            >
              <div className="advisorHelpIcon">{topic.icon}</div>
              <h2>{topic.title}</h2>
              <p>{topic.text}</p>
            </button>
          ))}
        </section>

        <section className="advisorHelpLayout">
          <div className="advisorHelpPanel">
            <div className="advisorHelpPanelHeader">
              <HelpCircle size={22} />
              <h2>Common Questions</h2>
            </div>

            <div className="advisorHelpFaq">
              {filteredFaqs.length === 0 ? (
                <div className="advisorHelpEmpty">
                  No matching help topics found.
                </div>
              ) : (
                filteredFaqs.map((faq) => (
                  <div key={faq.q} className="advisorHelpFaqItem">
                    <h3>{faq.q}</h3>
                    <p>{faq.a}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="advisorHelpSide">
            <section className="advisorHelpSideCard">
              <div className="advisorHelpSideHeader">
                <AlertCircle size={20} />
                <h2>Report an Issue</h2>
              </div>

              <form onSubmit={handleSubmitIssue} className="advisorHelpForm">
                <label>
                  Issue type
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                  >
                    <option>Dashboard issue</option>
                    <option>Student data missing</option>
                    <option>Risk analytics issue</option>
                    <option>Messages issue</option>
                    <option>Appointments issue</option>
                    <option>Profile/account issue</option>
                  </select>
                </label>

                <label>
                  Details
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe what happened..."
                  />
                </label>

                <button
                  type="submit"
                  className="advisorHelpSubmitBtn"
                  disabled={!message.trim()}
                >
                  <Send size={16} />
                  Send Request
                </button>

                {sent ? (
                  <div className="advisorHelpSuccess">
                    <CheckCircle size={16} />
                    Support request saved locally.
                  </div>
                ) : null}
              </form>
            </section>

            <section className="advisorHelpSideCard">
              <div className="advisorHelpSideHeader">
                <Mail size={20} />
                <h2>Contact Support</h2>
              </div>

              <p>
                For account access, missing records, or system issues, contact
                your university admin or support team.
              </p>

              <a className="advisorHelpEmailBtn" href="mailto:support@university.edu">
                support@university.edu
              </a>
            </section>

            <section className="advisorHelpSideCard">
              <div className="advisorHelpSideHeader">
                <Upload size={20} />
                <h2>Data Reminder</h2>
              </div>

              <p>
                Advisors can view records after admin upload. If student data is
                missing, ask the admin to confirm upload and assignment.
              </p>
              <div className="advisorHelpActions">
                <a
                href="mailto:admin@university.edu"
                className="advisorHelpEmailBtn"
                >
                    Contact Admin
                    </a>
                </div>
              </section>
            </aside>
          </section>
      </div>
    </div>
  );
}