
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./Dashboard.css";

const API_URL = "https://careerpilot-ai-1-qq4i.onrender.com/api/job-applications";

const STATUS_COLORS = {
  Applied: "#6366f1",
  Assessment: "#f59e0b",
  Interview: "#0ea5e9",
  Offer: "#10b981",
  Rejected: "#ef4444",
  Withdrawn: "#94a3b8",
};

function getLastSixMonths(monthlyActivity = []) {
  const activityMap = new Map(
    monthlyActivity.map((item) => [item.month, Number(item.count)])
  );

  const today = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() - 5 + index,
      1
    );

    const year = monthDate.getFullYear();
    const monthNumber = String(monthDate.getMonth() + 1).padStart(2, "0");
    const key = `${year}-${monthNumber}`;

    return {
      month: monthDate.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      applications: activityMap.get(key) || 0,
    };
  });
}

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [analyticsResponse, applicationsResponse] =
          await Promise.all([
            fetch(`${API_URL}/analytics`, {
              credentials: "include",
            }),
            fetch(API_URL, {
              credentials: "include",
            }),
          ]);

        const analyticsData = await analyticsResponse.json();
        const applicationsData = await applicationsResponse.json();

        if (!analyticsResponse.ok) {
          throw new Error(
            analyticsData.error || "Unable to load analytics."
          );
        }

        if (!applicationsResponse.ok) {
          throw new Error(
            applicationsData.error || "Unable to load applications."
          );
        }

        setAnalytics(analyticsData);
        setApplications(applicationsData.applications || []);
      } catch (err) {
        console.error("Dashboard loading failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Preparing your career overview...</p>
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  if (!analytics) return null;

  const stats = [
    {
      title: "Total Applications",
      value: analytics.total_applications ?? 0,
      icon: "↗",
      color: "blue",
      description: "Applications tracked",
    },
    {
      title: "Interviews",
      value: analytics.interview_count ?? 0,
      icon: "♧",
      color: "purple",
      description: "Interview opportunities",
    },
    {
      title: "Interview Rate",
      value: `${analytics.interview_rate ?? 0}%`,
      icon: "%",
      color: "orange",
      description: "Of total applications",
    },
    {
      title: "Offers Received",
      value: analytics.offer_count ?? 0,
      icon: "★",
      color: "green",
      description: "Successful outcomes",
    },
  ];

  const statusData = Object.entries(analytics.status_breakdown || {})
    .map(([name, value]) => ({
      name,
      value: Number(value) || 0,
    }))
    .filter((item) => item.value > 0);

  // Always show six months, even if there were zero applications.
  const monthlyData = getLastSixMonths(
    analytics.monthly_activity || []
  );

  const recentApplications = [...applications]
    .sort((a, b) => {
      return (
        new Date(b.application_date || 0) -
        new Date(a.application_date || 0)
      );
    })
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">CAREER OVERVIEW</p>
          <h1>Your Career Dashboard</h1>
          <p>
            Track your applications, monitor your progress and
            stay focused on your next opportunity.
          </p>
        </div>

        <div className="dashboard-date">
          <span className="date-icon">▦</span>
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-stats">
        {stats.map((stat) => (
          <div className="dashboard-stat-card" key={stat.title}>
            <div className="stat-card-top">
              <div className={`dashboard-stat-icon ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="stat-indicator">●</span>
            </div>

            <p>{stat.title}</p>
            <h2>{stat.value}</h2>
            <span className="stat-description">
              {stat.description}
            </span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        <section className="dashboard-panel growth-panel">
          <div className="panel-heading">
            <div>
              <h2>Monthly Application Growth</h2>
              <p>
                Your application activity over the last six months.
              </p>
            </div>

            <span className="chart-period">Last 6 months</span>
          </div>

          <div className="growth-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="applicationGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#6366f1"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="#6366f1"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#edf0f6"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8490a5", fontSize: 12 }}
                  dy={10}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8490a5", fontSize: 12 }}
                  width={35}
                  domain={[0, "auto"]}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e8eaf2",
                    boxShadow: "0 6px 20px rgba(30, 41, 59, 0.08)",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [
                    `${value} application${value === 1 ? "" : "s"}`,
                    "Total",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#applicationGradient)"
                  activeDot={{
                    r: 6,
                    stroke: "#ffffff",
                    strokeWidth: 3,
                  }}
                  dot={{
                    r: 4,
                    fill: "#6366f1",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="growth-summary">
            <span className="growth-summary-dot" />
            Monthly applications
            <strong>
              {monthlyData.reduce(
                (total, item) => total + item.applications,
                0
              )}
            </strong>
            <span>in the displayed period</span>
          </div>
        </section>

        <section className="dashboard-panel status-panel">
          <div className="panel-heading">
            <div>
              <h2>Application Status</h2>
              <p>Distribution of your applications.</p>
            </div>
          </div>

          {statusData.length > 0 ? (
            <>
              <div className="status-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {statusData.map((item) => (
                        <Cell
                          key={item.name}
                          fill={
                            STATUS_COLORS[item.name] || "#94a3b8"
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="status-chart-center">
                  <strong>{analytics.total_applications}</strong>
                  <span>Total jobs</span>
                </div>
              </div>

              <div className="status-legend">
                {statusData.map((item) => (
                  <div key={item.name}>
                    <span>
                      <i
                        style={{
                          background:
                            STATUS_COLORS[item.name] || "#94a3b8",
                        }}
                      />
                      {item.name}
                    </span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="chart-empty">
              Add applications to see your status breakdown.
            </p>
          )}
        </section>
      </div>

      {/* Recent applications */}
      <section className="dashboard-panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent Applications</h2>
            <p>Your latest job application activity.</p>
          </div>

          <span className="total-label">
            {analytics.total_applications} total
          </span>
        </div>

        {recentApplications.length === 0 ? (
          <p className="chart-empty">
            No applications added yet. Start tracking your job search!
          </p>
        ) : (
          <div className="recent-table-wrapper">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Job Role</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentApplications.map((job) => (
                  <tr key={job.id}>
                    <td className="company-cell">
                      {job.company_name}
                    </td>

                    <td>{job.job_role}</td>

                    <td>
                      {job.application_date
                        ? new Date(
                            `${job.application_date}T00:00:00`
                          ).toLocaleDateString("en-GB")
                        : "—"}
                    </td>

                    <td>
                      <span
                        className={`recent-status ${
                          (job.status || "Applied")
                            .toLowerCase()
                            .replace(" ", "-")
                        }`}
                      >
                        {job.status || "Applied"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
