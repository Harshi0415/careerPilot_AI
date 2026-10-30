
import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

# Load database settings from Backend/.env
load_dotenv(Path(__file__).with_name(".env"))


def get_db_connection():
    """Create and return a MySQL database connection."""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "careerpilot_ai"),
        connection_timeout=5,
    )
