
from db import get_db_connection

connection = None

try:
    connection = get_db_connection()

    print("MySQL connection successful!")

    cursor = connection.cursor()
    cursor.execute("SHOW TABLES")

    print("Tables in careerpilot_ai:")
    for table in cursor.fetchall():
        print(table[0])

    cursor.close()

except Exception as error:
    print("Database connection failed:", error)

finally:
    if connection and connection.is_connected():
        connection.close()
