export default function ReportsPage() {
  return (
    <section className="studentsAdminPage">
      <div className="studentsAdminHeader">
        <div>
          <h2>Reports</h2>
          <p>Review prediction results, risk distribution, and ETL/ML insights.</p>
        </div>

        <button className="primaryActionBtn" type="button">
          Export Report
        </button>
      </div>

      <div className="studentsSummaryGrid">
        <div className="studentSummaryCard">
          <span>Total Predictions</span>
          <strong>700</strong>
        </div>

        <div className="studentSummaryCard">
          <span>High Risk</span>
          <strong>30</strong>
        </div>

        <div className="studentSummaryCard">
          <span>Medium Risk</span>
          <strong>420</strong>
        </div>

        <div className="studentSummaryCard">
          <span>Low Risk</span>
          <strong>250</strong>
        </div>
      </div>

      <div className="adminTwoCol">
        <div className="adminPanel chartPanel">
          <div className="panelHeader">
            <div>
              <h3>Risk Distribution</h3>
              <p>Northbridge University student risk distribution analysis.</p>
            </div>
          </div>

          <div className="placeholderPanel">
            High Risk: 30 | Medium Risk: 420 | Low Risk: 250
          </div>
        </div>

        <div className="adminPanel chartPanel">
          <div className="panelHeader">
            <div>
              <h3>Prediction Trend</h3>
              <p>Prediction trends generated from Spring 2026 ETL pipeline.</p>
            </div>
          </div>

          <div className="placeholderPanel">
            Spring 2026 model run completed for 700 students.
          </div>
        </div>
      </div>

      <div className="adminPanel" style={{ marginTop: "18px" }}>
        <div className="panelHeader">
          <div>
            <h3>ETL & ML Report Status</h3>
            <p>Pipeline report summary.</p>
          </div>
        </div>

        <table className="studentsAdminTable">
          <thead>
            <tr>
              <th>REPORT ITEM</th>
              <th>VALUE</th>
              <th>STATUS</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>ETL Pipeline</td>
              <td>Connected</td>
              <td>
                <span className="studentBadge badgeLow">Completed</span>
              </td>
            </tr>

            <tr>
              <td>ML Prediction Output</td>
              <td>700 predictions generated</td>
              <td>
                <span className="studentBadge badgeLow">Completed</span>
              </td>
            </tr>

            <tr>
              <td>Last Model Run</td>
              <td>Spring 2026 Model v1.2</td>
              <td>
                <span className="studentBadge badgeLow">Ready</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}