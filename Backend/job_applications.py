
from datetime import date

from flask import Blueprint, jsonify, request, session, current_app
from db import get_db_connection

job_applications_bp = Blueprint(
    "job_applications",
    __name__,
    url_prefix="/api/job-applications",
)

VALID_STATUSES = {
    "Applied",
    "Assessment",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
}


def require_user():
    user_id = session.get("user_id")
    if user_id is None:
        return None, (
            jsonify({
                "error": "Authentication required. Please log in."
            }),
            401,
        )
    return user_id, None


def close_db(connection, cursor):
    if cursor:
        cursor.close()
    if connection and connection.is_connected():
        connection.close()


@job_applications_bp.route("", methods=["GET"])
def list_applications():
    user_id, error_response = require_user()
    if error_response:
        return error_response

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, company_name, job_role, application_date,
                   application_source, status, job_url, notes,
                   created_at, updated_at
            FROM job_applications
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )

        applications = cursor.fetchall()

        for item in applications:
            for field in ("application_date", "created_at", "updated_at"):
                if item.get(field):
                    item[field] = item[field].isoformat()

        return jsonify({"applications": applications}), 200

    except Exception:
        current_app.logger.exception("Failed to list job applications")
        return jsonify({"error": "Unable to retrieve applications."}), 500

    finally:
        close_db(connection, cursor)



@job_applications_bp.route("", methods=["POST"])
def create_application():
    user_id, error_response = require_user()
    if error_response:
        return error_response

    data = request.get_json(silent=True) or {}

    company_name = data.get("company_name")
    job_role = data.get("job_role")
    application_date = data.get("application_date")
    application_source = data.get("application_source")
    status = data.get("status", "Applied")
    job_url = data.get("job_url")
    notes = data.get("notes")

    # Validate required fields
    if not isinstance(company_name, str) or not company_name.strip():
        return jsonify({"error": "Company name is required."}), 400

    if not isinstance(job_role, str) or not job_role.strip():
        return jsonify({"error": "Job role is required."}), 400

    if not isinstance(application_source, str) or not application_source.strip():
        return jsonify({"error": "Application source is required."}), 400

    company_name = company_name.strip()
    job_role = job_role.strip()
    application_source = application_source.strip()

    if len(company_name) > 150 or len(job_role) > 150:
        return jsonify({"error": "Company name or job role is too long."}), 400

    if len(application_source) > 100:
        return jsonify({"error": "Application source is too long."}), 400

    if status not in VALID_STATUSES:
        return jsonify({"error": "Invalid application status."}), 400

    if application_date:
        try:
            application_date = date.fromisoformat(application_date)
        except (TypeError, ValueError):
            return jsonify({
                "error": "Application date must use YYYY-MM-DD format."
            }), 400

    if job_url is not None:
        if not isinstance(job_url, str) or len(job_url) > 500:
            return jsonify({"error": "Invalid job URL."}), 400
        job_url = job_url.strip() or None

    if notes is not None:
        if not isinstance(notes, str):
            return jsonify({"error": "Notes must be text."}), 400
        if len(notes) > 2000:
            return jsonify({"error": "Notes cannot exceed 2000 characters."}), 400
        notes = notes.strip() or None

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO job_applications
            (
                user_id,
                company_name,
                job_role,
                application_date,
                application_source,
                status,
                job_url,
                notes
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                company_name,
                job_role,
                application_date,
                application_source,
                status,
                job_url,
                notes,
            ),
        )

        connection.commit()

        return jsonify({
            "message": "Application saved successfully.",
            "application_id": cursor.lastrowid,
        }), 201

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()

        current_app.logger.exception("Failed to create job application")

        return jsonify({
            "error": "Unable to save the application."
        }), 500

    finally:
        close_db(connection, cursor)






@job_applications_bp.route("/analytics", methods=["GET"])
def get_application_analytics():
    user_id, error_response = require_user()
    if error_response:
        return error_response

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # 1. Get application counts by status
        cursor.execute(
            """
            SELECT status, COUNT(*) AS count
            FROM job_applications
            WHERE user_id = %s
            GROUP BY status
            """,
            (user_id,),
        )

        status_rows = cursor.fetchall()

        status_breakdown = {
            status: 0 for status in VALID_STATUSES
        }

        for row in status_rows:
            status_breakdown[row["status"]] = row["count"]

        # 2. Calculate total applications
        total_applications = sum(status_breakdown.values())

        # 3. Calculate interview count and rate
        interview_count = status_breakdown.get("Interview", 0)

        interview_rate = (
            round((interview_count / total_applications) * 100, 2)
            if total_applications > 0
            else 0
        )

        # 4. Get monthly application activity
        cursor.execute(
            """
            SELECT
                DATE_FORMAT(application_date, '%Y-%m') AS month,
                COUNT(*) AS count
            FROM job_applications
            WHERE user_id = %s
            AND application_date >= DATE_FORMAT(
    DATE_SUB(CURDATE(), INTERVAL 5 MONTH),
    '%Y-%m-01'
)
            GROUP BY DATE_FORMAT(application_date, '%Y-%m')
            ORDER BY month ASC
            """,
            (user_id,),
        )

        monthly_activity = cursor.fetchall()

        return jsonify({
            "total_applications": total_applications,
            "interview_count": interview_count,
            "interview_rate": interview_rate,
            "offer_count": status_breakdown.get("Offer", 0),
            "status_breakdown": status_breakdown,
            "monthly_activity": monthly_activity,
        }), 200

    except Exception:
        current_app.logger.exception(
            "Failed to retrieve application analytics"
        )

        return jsonify({
            "error": "Unable to retrieve application analytics."
        }), 500

    finally:
        close_db(connection, cursor)







@job_applications_bp.route("/<int:application_id>", methods=["PUT"])
def update_application(application_id):
    user_id, error_response = require_user()
    if error_response:
        return error_response

    data = request.get_json(silent=True) or {}

    allowed_fields = {
        "company_name",
        "job_role",
        "application_date",
        "application_source",
        "status",
        "job_url",
        "notes",
    }

    updates = {
        key: value
        for key, value in data.items()
        if key in allowed_fields
    }

    if not updates:
        return jsonify({
            "error": "Provide at least one field to update."
        }), 400

    if "status" in updates and updates["status"] not in VALID_STATUSES:
        return jsonify({"error": "Invalid application status."}), 400

    for field in ("company_name", "job_role"):
        if field in updates:
            value = updates[field]

            if (
                not isinstance(value, str)
                or not value.strip()
                or len(value.strip()) > 150
            ):
                return jsonify({
                    "error": f"Invalid {field.replace('_', ' ')}."
                }), 400

            updates[field] = value.strip()

    if "application_date" in updates and updates["application_date"]:
        try:
            updates["application_date"] = date.fromisoformat(
                updates["application_date"]
            )
        except (TypeError, ValueError):
            return jsonify({
                "error": "Application date must use YYYY-MM-DD format."
            }), 400

    for field, limit in (
        ("application_source", 100),
        ("job_url", 500),
    ):
        if field in updates and updates[field] is not None:
            value = updates[field]

            if not isinstance(value, str) or len(value) > limit:
                return jsonify({
                    "error": f"Invalid {field.replace('_', ' ')}."
                }), 400

            updates[field] = value.strip() or None

    if "notes" in updates:
        notes = updates["notes"]

        if notes is not None and not isinstance(notes, str):
            return jsonify({"error": "Notes must be text."}), 400

        if isinstance(notes, str):
            updates["notes"] = notes.strip() or None

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Build the SET clause from the permitted fields.
        columns = ", ".join(
            f"{field} = %s" for field in updates
        )
        values = list(updates.values()) + [
            application_id,
            user_id,
        ]

        cursor.execute(
            f"""
            UPDATE job_applications
            SET {columns}
            WHERE id = %s AND user_id = %s
            """,
            tuple(values),
        )

        connection.commit()

        if cursor.rowcount == 0:
            # Check whether the application exists for this user.
            cursor.execute(
                """
                SELECT id
                FROM job_applications
                WHERE id = %s AND user_id = %s
                """,
                (application_id, user_id),
            )

            if cursor.fetchone() is None:
                return jsonify({
                    "error": "Application not found."
                }), 404

        return jsonify({
            "message": "Application updated successfully."
        }), 200

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()

        current_app.logger.exception(
            "Failed to update job application"
        )

        return jsonify({
            "error": "Unable to update the application."
        }), 500

    finally:
        close_db(connection, cursor)


@job_applications_bp.route("/<int:application_id>", methods=["DELETE"])
def delete_application(application_id):
    user_id, error_response = require_user()
    if error_response:
        return error_response

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM job_applications
            WHERE id = %s AND user_id = %s
            """,
            (application_id, user_id),
        )
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Application not found."}), 404

        return jsonify({"message": "Application deleted successfully."}), 200

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()
        current_app.logger.exception("Failed to delete job application")
        return jsonify({"error": "Unable to delete the application."}), 500

    finally:
        close_db(connection, cursor)
