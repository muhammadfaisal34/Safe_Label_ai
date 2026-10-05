from collections.abc import Generator
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

from .config import settings


@contextmanager
def get_connection() -> Generator[psycopg.Connection, None, None]:
    """Open a short-lived PostgreSQL connection for one request."""
    with psycopg.connect(settings.database_url, row_factory=dict_row) as connection:
        yield connection


def find_user_by_email(email: str) -> dict | None:
    with get_connection() as connection:
        return connection.execute(
            "SELECT id, email, password_hash FROM users WHERE email = %s",
            (email,),
        ).fetchone()


def create_user(user_id: str, email: str, password_hash: str) -> dict:
    with get_connection() as connection:
        return connection.execute(
            """
            INSERT INTO users (id, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, email, password_hash
            """,
            (user_id, email, password_hash),
        ).fetchone()
