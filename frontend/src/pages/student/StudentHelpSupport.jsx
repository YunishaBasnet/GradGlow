import {
  BookOpen,
  CircleHelp,
  Mail,
  MessageCircle,
  MessageSquare,
  Moon,
  Phone,
  PhoneCall,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudentBottomNav from "../../components/StudentBottomNav";
import "../../styles/dashboard.css";
import "../../styles/helpsupport.css";
import { useTheme } from "../../context/ThemeContext";

const supportServices = [
  {
    id: "academic",
    title: "Academic Advising",
    description: "Get help with course selection, degree planning, and academic policies",
    email: "advising@university.edu",
    phone: "(555) 123-4567",
    icon: BookOpen,
    tone: "blue",
  },
  {
    id: "counseling",
    title: "Counseling Services",
    description: "Mental health support and wellness resources for students",
    email: "counseling@university.edu",
    phone: "(555) 234-5678",
    icon: CircleHelp,
    tone: "purple",
  },
  {
    id: "technical",
    title: "Technical Support",
    description: "Help with LMS, student portal, and technology issues",
    email: "techsupport@university.edu",
    phone: "(555) 345-6789",
    icon: MessageSquare,
    tone: "green",
  },
  {
    id: "financial",
    title: "Financial Aid",
    description: "Questions about scholarships, loans, and payment plans",
    email: "financialaid@university.edu",
    phone: "(555) 456-7890",
    icon: Wallet,
    tone: "yellow",
  },
];

const faqs = [
  {
    question: "How do I check my current GPA?",
    answer:
      "Your current GPA is displayed on your dashboard. For detailed breakdown, visit the Academic Performance section.",
  },
  {
    question: "What should I do if I'm at risk in a course?",
    answer:
      "Contact your course instructor and academic advisor immediately. Utilize tutoring services and office hours.",
  },
  {
    question: "How do I schedule an appointment with my advisor?",
    answer:
      "Use the 'Schedule Appointment' button on your dashboard or contact your advisor directly via email or phone.",
  },
  {
    question: "Where can I find course materials?",
    answer:
      "Course materials are available through the LMS. Click on 'Course Materials' in Quick Links to access them.",
  },
];

export default function StudentHelpSupport() {
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={dark ? "dash dash--dark help-support-page" : "dash help-support-page"}>
      <div className="help-support-header">
        <div>
          <h1>Help &amp; Support</h1>
          <p>We're here to help you succeed</p>
        </div>

        <div className="helpHeaderActions">
          <button type="button" className="helpBackBtn" onClick={() => navigate("/student/dashboard")}>
            Back to Dashboard
          </button>
          <button
            type="button"
            className="iconBtn help-theme-btn"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={toggleTheme}
          >
            <Moon size={18} />
          </button>
        </div>
      </div>

      <section className="help-section">
        <h2>Support Services</h2>

        <div className="services-grid">
          {supportServices.map((service) => {
            const ServiceIcon = service.icon;

            return (
              <article key={service.id} className="service-card">
                <div className={`service-icon service-icon--${service.tone}`}>
                  <ServiceIcon size={20} />
                </div>

                <div className="service-content">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>

                  <div className="service-contact">
                    <div>
                      <Mail size={15} />
                      <span>{service.email}</span>
                    </div>
                    <div>
                      <Phone size={15} />
                      <span>{service.phone}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="help-section">
        <h2>Frequently Asked Questions</h2>

        <div className="faq-list">
          {faqs.map((item) => (
            <article key={item.question} className="faq-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>

        <article className="urgent-help-card">
          <h3>Need Immediate Help?</h3>
          <p>
            If you're experiencing a crisis or emergency, please contact campus security or call the
            crisis hotline.
          </p>

          <div className="urgent-help-actions">
            <button type="button" className="urgent-btn urgent-btn--danger">
              <PhoneCall size={15} />
              <span>Emergency: (555) 911-1111</span>
            </button>

            <button type="button" className="urgent-btn urgent-btn--chat">
              <MessageCircle size={15} />
              <span>Live Chat Support</span>
            </button>
          </div>
        </article>
      </section>

      <StudentBottomNav />
    </div>
  );
}
