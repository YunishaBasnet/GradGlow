export default function SystemLogsPage() {
  return (
    <section className="studentsAdminPage">
      <div className="studentsAdminHeader">
        <div>
          <h2>System Logs</h2>
          <p>Monitor uploads, ETL processing, ML predictions, and admin activity.</p>
        </div>

        <button className="primaryActionBtn" type="button">
          Refresh Logs
        </button>
      </div>

      <div className="studentsSummaryGrid">
        <div className="studentSummaryCard">
          <span>Total Logs</span>
          <strong>18</strong>
        </div>

        <div className="studentSummaryCard">
          <span>ETL Events</span>
          <strong>6</strong>
        </div>

        <div className="studentSummaryCard">
          <span>ML Predictions</span>
          <strong>700</strong>
        </div>

        <div className="studentSummaryCard">
          <span>System Errors</span>
          <strong>0</strong>
        </div>
      </div>

      <div className="adminPanel">
        <div className="panelHeader">
          <div>
            <h3>Recent Activity Logs</h3>
            <p>Northbridge University ETL and ML pipeline activity.</p>
          </div>
        </div>

        <div className="alertList">
          <div className="alertRow blueAlert">
            <div>1</div>

            <div>
              <h4>CSV upload activity</h4>
              <p>Student engagement and assessment datasets uploaded successfully.</p>
            </div>

            <span>Completed</span>
          </div>

          <div className="alertRow yellowAlert">
            <div>2</div>

            <div>
              <h4>ETL pipeline logs</h4>
              <p>Data transformation and preprocessing completed successfully.</p>
            </div>

            <span>Completed</span>
          </div>

          <div className="alertRow redAlert">
            <div>3</div>

            <div>
              <h4>ML prediction logs</h4>
              <p>700 student risk predictions generated for Spring 2026.</p>
            </div>

            <span>Completed</span>
          </div>
        </div>
      </div>

      <div className="adminTwoCol" style={{ marginTop: "18px" }}>
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <h3>System Status</h3>
              <p>Backend services and processing pipeline.</p>
            </div>
          </div>

          <table className="adminTable">
            <tbody>
              <tr>
                <td>Frontend</td>
                <td>
                  <span className="studentBadge badgeActive">Running</span>
                </td>
              </tr>

              <tr>
                <td>Backend API</td>
                <td>
                  <span className="studentBadge badgeLow">Running</span>
                </td>
              </tr>

              <tr>
                <td>ETL Pipeline</td>
                <td>
                  <span className="studentBadge badgeLow">Completed</span>
                </td>
              </tr>

              <tr>
                <td>ML Prediction Service</td>
                <td>
                  <span className="studentBadge badgeLow">Ready</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <h3>Security Logs</h3>
              <p>Authentication and role-based activity.</p>
            </div>
          </div>

          <div className="placeholderPanel">
            Admin, advisor, and student role-based authentication active.
          </div>
        </div>
      </div>
    </section>
  );
}