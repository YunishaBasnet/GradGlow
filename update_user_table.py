import sqlite3

conn = sqlite3.connect("student_risk.db")
cursor = conn.cursor()

try:
    cursor.execute(
        "ALTER TABLE users ADD COLUMN student_id TEXT"
    )
    print("student_id column added.")
except sqlite3.OperationalError as exc:
    print(exc)

cursor.execute(
    """
    UPDATE users
    SET student_id = ?
    WHERE username = ?
    """,
    ("100001", "student01"),
)

conn.commit()

cursor.execute(
    "SELECT username, role, student_id FROM users"
)

print(cursor.fetchall())

conn.close()