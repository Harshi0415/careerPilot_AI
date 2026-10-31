
import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

# Load database settings from Backend/.env
load_dotenv(Path(__file__).with_name(".env"))


def get_db_connection():
    """Create and return a MySQL database connection."""

    db_config = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "careerpilot_ai"),
        "connection_timeout": 10,
    }

    # Enable verified SSL when a CA certificate is configured.
    ssl_ca = os.getenv("DB_SSL_CA")
    if ssl_ca and not os.path.isabs(ssl_ca):
        ssl_ca = str(Path(__file__).with_name(ssl_ca))

    if ssl_ca:
        db_config.update({
            "ssl_ca": ssl_ca,
            "ssl_verify_cert": True,
            "ssl_verify_identity": True,
        })

    return mysql.connector.connect(**db_config)

import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

# Load database settings from Backend/.env
load_dotenv(Path(__file__).with_name(".env"))


def get_db_connection():
    """Create and return a MySQL database connection."""

    db_config = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "careerpilot_ai"),
        "connection_timeout": 10,
    }

    # Enable verified SSL when a CA certificate is configured.
    ssl_ca = os.getenv("DB_SSL_CA")

    if ssl_ca:
        db_config.update({
            "ssl_ca": ssl_ca,
            "ssl_verify_cert": True,
            "ssl_verify_identity": True,
        })

    return mysql.connector.connect(**db_config)
