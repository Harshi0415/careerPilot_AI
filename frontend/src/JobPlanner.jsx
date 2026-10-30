import { useState, useEffect, useCallback } from "react";
import "./JobPlanner.css";

const API_URL = "http://localhost:5000/api/job-applications";

const STATUSES = [
  "Applied",
  "Assessment",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

const INITIAL_FORM = () => ({
  company: "",
  role: "",
  appliedDate: new Date().toISOString().slice(0, 10),
  status: "Applied",
  appliedOn: "LinkedIn",
  otherResource: "",
  notes: "",
});

function JobPlanner() {
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  // Inline notes editor state.
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Load applications from MySQL through Flask.
  const loadApplications = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        credentials: "include",
      });

      //const result = await response.json();

      //if (!response.ok) {
       // throw new Error(result.error || "Failed to load applications.");
      //}

      const responseText = await response.text();

let result;

try {
  result = JSON.parse(responseText);
} catch (error) {
  console.error("Backend returned HTML instead of JSON:", responseText);

  throw new Error(
    `Backend error! HTTP ${response.status}. Check your Flask terminal for details.`
  );
}

if (!response.ok) {
  throw new Error(result.error || "Failed to save application.");
}

      setApplications(
        (result.applications || []).map((job) => ({
          ...job,
          company: job.company_name,
          role: job.job_role,
          appliedDate: job.application_date,
          appliedOn: job.application_source,
          notes: job.notes || "",
        }))
      );
    } catch (error) {
      console.error("Loading applications failed:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Handle form changes.
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Save a new application in MySQL.
 async function handleSubmit(event) {
  event.preventDefault();
  if (saving) return;

  const source =
    form.appliedOn === "Other"
      ? form.otherResource.trim()
      : form.appliedOn;

  if (!source) {
    alert("Please enter the application source.");
    return;
  }

  const payload = {
    company_name: form.company.trim(),
    job_role: form.role.trim(),
    application_date: form.appliedDate || null,
    application_source: source,
    status: form.status,
    job_url: null,
    notes: form.notes.trim() || null,
  };

  setSaving(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("REQUEST URL:", API_URL);
    console.log("RESPONSE STATUS:", response.status);
    console.log(
      "CONTENT TYPE:",
      response.headers.get("content-type")
    );

    const responseText = await response.text();

    console.log("BACKEND RESPONSE:", responseText);

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Server returned HTML instead of JSON. HTTP ${response.status}. Check Flask terminal.`
      );
    }

    if (!response.ok) {
      throw new Error(result.error || "Failed to save application.");
    }

    await loadApplications();

    setForm(INITIAL_FORM());
    setShowForm(false);

    alert("Application saved successfully!");

  } catch (error) {
    console.error("Saving application failed:", error);
    alert(error.message);
  } finally {
    setSaving(false);
  }
}
 // Persist status changes in MySQL before updating the UI.
  async function handleStatusChange(applicationId, newStatus) {
    const previousApplication = applications.find(
      (job) => job.id === applicationId
    );
    if (!previousApplication) return;

    const previousStatus = previousApplication.status;
    if (previousStatus === newStatus) return;

    setApplications((previous) =>
      previous.map((job) =>
        job.id === applicationId ? { ...job, status: newStatus } : job
      )
    );

    try {
      const response = await fetch(`${API_URL}/${applicationId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update application status."
        );
      }
    } catch (error) {
      console.error("Status update failed:", error);
      setApplications((previous) =>
        previous.map((job) =>
          job.id === applicationId
            ? { ...job, status: previousStatus }
            : job
        )
      );
      alert(error.message);
    }
  }

  // Open the inline notes editor for the selected application.
  function handleEditNotes(job) {
    setEditingNotesId(job.id);
    setNotesDraft(job.notes || "");
  }

  // Save edited notes to Flask and MySQL.
  async function handleSaveNotes(job) {
    if (savingNotes) return;

    setSavingNotes(true);
    try {
      const response = await fetch(`${API_URL}/${job.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft.trim() || null }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update notes.");
      }

      setApplications((previous) =>
        previous.map((application) =>
          application.id === job.id
            ? { ...application, notes: notesDraft.trim() }
            : application
        )
      );
      setEditingNotesId(null);
      setNotesDraft("");
    } catch (error) {
      console.error("Updating notes failed:", error);
      alert(error.message);
    } finally {
      setSavingNotes(false);
    }
  }

  function handleCancelNotes() {
    setEditingNotesId(null);
    setNotesDraft("");
  }

  // Delete an application from MySQL.
  async function handleDelete(applicationId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${applicationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete application.");
      }

      setApplications((previous) =>
        previous.filter((job) => job.id !== applicationId)
      );
    } catch (error) {
      console.error("Delete application failed:", error);
      alert(error.message);
    }
  }

  const stats = [
    {
      title: "Jobs Applied",
      count: applications.length,
      icon: "📨",
      color: "blue",
    },
    {
      title: "Shortlisted",
      count: applications.filter(
        (job) => job.status === "Assessment" || job.status === "Interview"
      ).length,
      icon: "✅",
      color: "green",
    },
    {
      title: "Rejected",
      count: applications.filter((job) => job.status === "Rejected").length,
      icon: "❌",
      color: "orange",
    },
    {
      title: "Offers Received",
      count: applications.filter((job) => job.status === "Offer").length,
      icon: "🎉",
      color: "purple",
    },
  ];

return (
    <div className="job-planner">
      <div className="job-planner-heading">
        <p className="job-eyebrow">YOUR CAREER JOURNEY</p>
        <h1>Job Search Dashboard</h1>
        <p>Track your applications and move closer to your next opportunity.</p>
      </div>

      <div className="job-stats">
        {stats.map((stat) => (
          <div className="job-stat-card" key={stat.title}>
            <div className={`job-stat-icon ${stat.color}`}>{stat.icon}</div>
            <p>{stat.title}</p>
            <h2>{stat.count}</h2>
          </div>
        ))}
      </div>

      <section className="application-section">
        <div className="application-heading">
          <div>
            <h2>My Applications</h2>
            <p>Keep track of every opportunity you apply for.</p>
          </div>

          <button
            type="button"
            className="add-job-button"
            onClick={() => setShowForm((previous) => !previous)}
          >
            {showForm ? "Cancel" : "+ Add Application"}
          </button>
        </div>

        {showForm && (
          <form className="application-form" onSubmit={handleSubmit}>
            <label>
              Company name *
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g. TCS"
                maxLength={150}
                required
              />
            </label>

             <label>
              Job title *
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. Python Developer"
                maxLength={150}
                required
              />
            </label>

            <label>
              Application date *
              <input
                type="date"
                name="appliedDate"
                value={form.appliedDate}
                onChange={handleChange}
                required
              />
            </label>

             <label>
              Application status
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="full-width-field">
              Applied On Resource *
              <select
                name="appliedOn"
                value={form.appliedOn}
                onChange={handleChange}
                required
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Naukri">Naukri</option>
                <option value="Indeed">Indeed</option>
                <option value="Foundit">Foundit</option>
                <option value="Wellfound">Wellfound</option>
                <option value="Company Careers Page">Company Careers Page</option>
                <option value="Referral">Referral</option>
                <option value="Other">Other</option>
              </select>
            </label>

            {form.appliedOn === "Other" && (
              <label className="full-width-field">
                Enter resource name *
                <input
                  name="otherResource"
                  value={form.otherResource}
                  onChange={handleChange}
                  placeholder="e.g. Telegram, college placement cell"
                  maxLength={100}
                  required
                />
              </label>
            )}

             <label className="full-width-field">
              Notes (optional)
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Recruiter details, interview preparation, follow-up reminders..."
                maxLength={2000}
                rows={4}
              />
            </label>

            <button className="add-job-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Application"}
            </button>
          </form>
        )}

         {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <div className="empty-applications">
            <div className="empty-icon">💼</div>
            <h3>No applications yet</h3>
            <p>Add your first job application to start tracking progress.</p>
          </div>
        ) : (
          <div className="application-table-wrapper">
            <table className="application-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Applied Date</th>
                  <th>Company</th>
                  <th>Job Role</th>
                  <th>Applied On Resource</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((job, index) => (
                  <tr key={job.id}>
                    <td>{index + 1}</td>
                    <td>
                      {job.appliedDate
                        ? job.appliedDate.split("-").reverse().join("/")
                        : ""}
                    </td>
                    <td>{job.company}</td>
                    <td>{job.role}</td>
                    <td>{job.appliedOn || "—"}</td>
                    <td>
                      <select
                        className={`application-status status-select ${
                          job.status === "Interview"
                            ? "status-interview"
                            : job.status === "Rejected"
                              ? "status-rejected"
                              : job.status === "Offer"
                                ? "status-offer"
                                : job.status === "Assessment"
                                  ? "status-shortlisted"
                                  : "status-applied"
                        }`}
                        value={job.status}
                        onChange={(event) =>
                          handleStatusChange(job.id, event.target.value)
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <div className="job-notes-cell">
                        {editingNotesId === job.id ? (
                          <>
                            <textarea
                              className="notes-edit-textarea"
                              value={notesDraft}
                              onChange={(event) => setNotesDraft(event.target.value)}
                              placeholder="Enter notes..."
                              maxLength={2000}
                              rows={4}
                              autoFocus
                            />
                            <div className="notes-edit-actions">
                              <button
                                type="button"
                                className="edit-notes-button"
                                onClick={() => handleSaveNotes(job)}
                                disabled={savingNotes}
                              >
                                {savingNotes ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                className="cancel-notes-button"
                                onClick={handleCancelNotes}
                                disabled={savingNotes}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span>{job.notes || "No notes added"}</span>
                            <button
                              type="button"
                              className="edit-notes-button"
                              onClick={() => handleEditNotes(job)}
                            >
                              {job.notes ? "Edit Notes" : "Add Notes"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                     <td className="action-cell">
                      <button
                        type="button"
                        onClick={() => handleDelete(job.id)}
                        className="delete-job-button"
                      >
                        Delete
                      </button>
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

export default JobPlanner;
