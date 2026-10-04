import { useNavigate } from "react-router-dom";
import "../../styles/landing.css";

export default function LandingPage() {
  const navigate = useNavigate();

  function scrollToOverview() {
    const section = document.getElementById("platform-overview");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="landingShell">
      <div className="landingBlur landingBlurLeft"></div>
      <div className="landingBlur landingBlurRight"></div>

      <header className="landingTopbar">
        <div className="landingBrandWrap">
          <div className="landingBrandIcon">🎓</div>
          <h2 className="landingBrand">GradGlow</h2>
        </div>

        <button className="landingLoginBtn" onClick={() => navigate("/login")}>
          Login
        </button>
      </header>

      <main className="landingMain">
        <section className="landingHero">
          <div className="landingBadge">
            <span className="landingBadgeIcon">🎓</span>
            Student Success Platform
          </div>

          <div className="floatingIcon floatingIconLeftTop">📊</div>
          <div className="floatingIcon floatingIconLeftBottom">👩‍💻</div>
          <div className="floatingIcon floatingIconRightTop">👩‍🏫</div>
          <div className="floatingIcon floatingIconRightBottom">🛡️</div>

          <h1 className="landingHeading">
            Empowering universities.
            <br />
            Elevating <span>every student.</span>
          </h1>

          <p className="landingText">
            GradGlow streamlines advising, tracks student progress, and delivers
            meaningful insights that help institutions support students more effectively.
          </p>

          <div className="landingActions">
            <button className="landingPrimaryBtn" onClick={() => navigate("/get-started")}>
              Get Started
            </button>

            <button className="landingSecondaryBtn" onClick={scrollToOverview}>
              Explore Platform
            </button>
          </div>
        </section>

        <section className="landingFeatureGrid">
          <div className="landingFeatureCard">
            <div className="landingFeatureTop">
              <div className="landingFeatureCircle">🎓</div>
            </div>
            <h3>Students</h3>
            <p>
              Access support, advisor guidance, and a clearer path to academic
              success.
            </p>
          </div>

          <div className="landingFeatureCard">
            <div className="landingFeatureTop">
              <div className="landingFeatureCircle">👩‍🏫</div>
            </div>
            <h3>Advisors</h3>
            <p>
              Manage assigned students and provide focused, timely academic
              support.
            </p>
          </div>

          <div className="landingFeatureCard">
            <div className="landingFeatureTop">
              <div className="landingFeatureCircle">🏫</div>
            </div>
            <h3>Institutions</h3>
            <p>
              Coordinate advising workflows and manage student success data in
              one place.
            </p>
          </div>
        </section>

        <section id="platform-overview" className="platformOverview">
          <div className="overviewHeader">
            <div className="landingBadge small">
              <span className="landingBadgeIcon">✨</span>
              Explore Platform
            </div>
            <h2>What GradGlow is, Why it exists, and How it works</h2>
            <p>
              A single platform designed to help universities improve student
              support through structured advising, better visibility, and
              actionable insights.
            </p>
          </div>

          <div className="overviewGrid">
            <div className="overviewCard">
              <div className="overviewIcon">💡</div>
              <h3>What it is</h3>
              <p>
                GradGlow is a student success platform that connects students,
                advisors, and university administrators in one digital system.
              </p>
            </div>

            <div className="overviewCard">
              <div className="overviewIcon">🎯</div>
              <h3>Why it exists</h3>
              <p>
                Universities often manage advising, communication, and support
                data across disconnected tools. GradGlow brings those workflows
                together to improve coordination and student outcomes.
              </p>
            </div>

            <div className="overviewCard">
              <div className="overviewIcon">⚙️</div>
              <h3>How it works</h3>
              <p>
                Students log in to view support information, advisors see their
                assigned students, and university admins manage uploads,
                assignments, and progress operations.
              </p>
            </div>
          </div>

          <div className="howItWorksRow">
            <div className="stepCard">
              <span className="stepNumber">01</span>
              <h4>University sets up data</h4>
              <p>
                University admins upload student and advisor information into
                the system.
              </p>
            </div>

            <div className="stepCard">
              <span className="stepNumber">02</span>
              <h4>Advisors support students</h4>
              <p>
                Advisors access only their assigned students and monitor
                engagement, needs, and progress.
              </p>
            </div>

            <div className="stepCard">
              <span className="stepNumber">03</span>
              <h4>Students stay guided</h4>
              <p>
                Students can view support information, advising direction, and
                success-related insights in one place.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}