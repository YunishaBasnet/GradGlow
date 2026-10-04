export default function HelpCenterPage() {
  return (
    <section className="studentsAdminPage">
      <div className="studentsAdminHeader">
        <div>
          <h2>Help Center</h2>
          <p>Guidance for using the admin system, uploads, ETL, and predictions.</p>
        </div>

        <button className="primaryActionBtn" type="button">
          Contact Support
        </button>
      </div>

      <div className="adminTwoCol">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <h3>Getting Started</h3>
              <p>Basic admin workflow.</p>
            </div>
          </div>

          <div className="alertList">
            <div className="alertRow blueAlert">
              <div>1</div>
              <div>
                <h4>Upload student CSV</h4>
                <p>Go to Uploads and submit the student dataset.</p>
              </div>
              <span>Step</span>
            </div>

            <div className="alertRow yellowAlert">
              <div>2</div>
              <div>
                <h4>Run ETL and ML prediction</h4>
                <p>The system processes uploaded data and generates prediction results.</p>
              </div>
              <span>Step</span>
            </div>

            <div className="alertRow redAlert">
              <div>3</div>
              <div>
                <h4>Review students and advisors</h4>
                <p>Use dashboard pages to monitor risk, assignments, and follow-up actions.</p>
              </div>
              <span>Step</span>
            </div>
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <h3>Common Questions</h3>
              <p>Quick answers for admin users.</p>
            </div>
          </div>

          <table className="adminTable">
            <tbody>
              <tr>
                <td>Who uploads data?</td>
                <td>Only university admin.</td>
              </tr>
              <tr>
                <td>Who sees predictions?</td>
                <td>Admin, advisor, and related student.</td>
              </tr>
              <tr>
                <td>Where is ETL connected?</td>
                <td>Upload pipeline connects to backend later.</td>
              </tr>
              <tr>
                <td>Can admin view students?</td>
                <td>Yes, admin can open read-only student overview.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="adminPanel" style={{ marginTop: "18px" }}>
        <div className="panelHeader">
          <div>
            <h3>Support Topics</h3>
            <p>Frontend sections prepared for final backend connection.</p>
          </div>
        </div>

        <div className="studentsSummaryGrid">
          <div className="studentSummaryCard">
            <span>CSV Upload</span>
            <strong style={{ fontSize: "18px" }}>Ready</strong>
          </div>

          <div className="studentSummaryCard">
            <span>ETL Pipeline</span>
            <strong style={{ fontSize: "18px" }}>Pending</strong>
          </div>

          <div className="studentSummaryCard">
            <span>ML Prediction</span>
            <strong style={{ fontSize: "18px" }}>Pending</strong>
          </div>

          <div className="studentSummaryCard">
            <span>Role Login</span>
            <strong style={{ fontSize: "18px" }}>Ready</strong>
          </div>
        </div>
      </div>
    </section>
  );
}