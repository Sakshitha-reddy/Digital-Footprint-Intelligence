import os
import sqlite3
import uuid
from datetime import timedelta
from typing import Any, Dict, Optional

from app.core.config import settings
from app.core.security import generate_token, token_digest, utc_now


class Database:
    """SQLite persistence for users and opaque, revocable browser sessions."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.DATABASE_PATH
        directory = os.path.dirname(self.db_path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    password_hash TEXT,
                    password_salt TEXT,
                    google_id TEXT UNIQUE,
                    avatar_url TEXT,
                    organization TEXT,
                    email_verified INTEGER NOT NULL DEFAULT 0,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    role TEXT NOT NULL DEFAULT 'Senior Intelligence Analyst',
                    clearance TEXT NOT NULL DEFAULT 'LEVEL 3 - OSINT/PUBLIC',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    last_login_at TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    token_hash TEXT NOT NULL UNIQUE,
                    expires_at TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    last_seen_at TEXT NOT NULL,
                    revoked_at TEXT,
                    user_agent TEXT,
                    ip_address TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    token_hash TEXT NOT NULL UNIQUE,
                    expires_at TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    used_at TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON password_reset_tokens(token_hash);

                CREATE TABLE IF NOT EXISTS oauth_states (
                    state_hash TEXT PRIMARY KEY,
                    provider TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    used_at TEXT
                );
            """)
            self._migrate_legacy_columns(conn)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)")
            # The previous application generated this demo account in source. It must not survive migration.
            conn.execute("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)", ("analyst@aporia-trace.ai",))
            conn.execute("DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email = ?)", ("analyst@aporia-trace.ai",))
            try:
                conn.execute("DELETE FROM password_resets WHERE user_id IN (SELECT id FROM users WHERE email = ?)", ("analyst@aporia-trace.ai",))
            except sqlite3.OperationalError:
                pass
            conn.execute("DELETE FROM users WHERE email = ?", ("analyst@aporia-trace.ai",))

    @staticmethod
    def _migrate_legacy_columns(conn: sqlite3.Connection) -> None:
        columns = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
        additions = {
            "password_hash": "TEXT",
            "password_salt": "TEXT",
            "google_id": "TEXT",
            "avatar_url": "TEXT",
            "organization": "TEXT",
            "email_verified": "INTEGER NOT NULL DEFAULT 0",
            "updated_at": "TEXT",
            "last_login_at": "TEXT",
        }
        for name, definition in additions.items():
            if name not in columns:
                conn.execute(f"ALTER TABLE users ADD COLUMN {name} {definition}")

        # Sync data from legacy column names into the canonical ones.
        legacy = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
        if "hashed_password" in legacy:
            conn.execute("UPDATE users SET password_hash = COALESCE(password_hash, hashed_password)")
        if "salt" in legacy:
            conn.execute("UPDATE users SET password_salt = COALESCE(password_salt, salt)")
        if "last_login" in legacy:
            conn.execute("UPDATE users SET last_login_at = COALESCE(last_login_at, last_login)")
        conn.execute("UPDATE users SET updated_at = COALESCE(updated_at, created_at)")

        # ── Fix legacy NOT NULL constraints on hashed_password / salt ──
        # SQLite doesn't support ALTER COLUMN, so we must recreate the table
        # if the legacy columns still carry NOT NULL constraints that block new inserts.
        if "hashed_password" in legacy:
            col_info = {row[1]: row[3] for row in conn.execute("PRAGMA table_info(users)")}
            if col_info.get("hashed_password") or col_info.get("salt"):
                # At least one legacy column has NOT NULL — rebuild to relax it.
                Database._rebuild_users_table_relaxed(conn)

    @staticmethod
    def _public_user(row: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": row["id"], "full_name": row["full_name"], "email": row["email"],
            "organization": row.get("organization"), "avatar_url": row.get("avatar_url"),
            "email_verified": bool(row.get("email_verified")), "role": row.get("role") or "Senior Intelligence Analyst",
            "clearance": row.get("clearance") or "LEVEL 3 - OSINT/PUBLIC",
            "last_login_at": row.get("last_login_at"), "is_active": bool(row.get("is_active")),
        }

    @staticmethod
    def _rebuild_users_table_relaxed(conn: sqlite3.Connection) -> None:
        """Recreate the users table so that legacy columns (hashed_password, salt)
        become nullable, preventing NOT NULL failures on new inserts."""
        cur_cols = [row[1] for row in conn.execute("PRAGMA table_info(users)")]
        col_list = ", ".join(cur_cols)
        conn.executescript(f"""
            ALTER TABLE users RENAME TO _users_old;
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                full_name TEXT NOT NULL,
                hashed_password TEXT,
                salt TEXT,
                role TEXT NOT NULL DEFAULT 'Senior Intelligence Analyst',
                clearance TEXT NOT NULL DEFAULT 'LEVEL 3 - OSINT/PUBLIC',
                created_at TEXT NOT NULL,
                last_login TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                password_hash TEXT,
                password_salt TEXT,
                google_id TEXT UNIQUE,
                avatar_url TEXT,
                organization TEXT,
                email_verified INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT,
                last_login_at TEXT
            );
            INSERT INTO users ({col_list}) SELECT {col_list} FROM _users_old;
            DROP TABLE _users_old;
        """)

    def create_user(self, *, email: str, full_name: str, password_hash: Optional[str], password_salt: Optional[str],
                    organization: Optional[str] = None, google_id: Optional[str] = None,
                    avatar_url: Optional[str] = None, email_verified: bool = False) -> Dict[str, Any]:
        now = utc_now().isoformat()
        user_id = str(uuid.uuid4())
        with self._get_connection() as conn:
            # Detect whether legacy columns exist so we can populate them too.
            col_names = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
            has_legacy = "hashed_password" in col_names

            if has_legacy:
                conn.execute("""
                    INSERT INTO users (id, full_name, email, password_hash, password_salt,
                        hashed_password, salt, google_id, avatar_url,
                        organization, email_verified, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                """, (user_id, full_name.strip(), email.strip().lower(),
                      password_hash, password_salt,
                      password_hash or "", password_salt or "",  # legacy columns
                      google_id, avatar_url,
                      organization.strip() if organization else None,
                      int(email_verified), now, now))
            else:
                conn.execute("""
                    INSERT INTO users (id, full_name, email, password_hash, password_salt, google_id, avatar_url,
                        organization, email_verified, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                """, (user_id, full_name.strip(), email.strip().lower(), password_hash, password_salt, google_id,
                      avatar_url, organization.strip() if organization else None, int(email_verified), now, now))
        return self.get_user_by_id(user_id)  # type: ignore[return-value]

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
        return dict(row) if row else None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None

    def get_user_by_google_id(self, google_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM users WHERE google_id = ?", (google_id,)).fetchone()
        return dict(row) if row else None

    def link_google_identity(self, user_id: str, google_id: str, avatar_url: Optional[str], email_verified: bool = True) -> None:
        now = utc_now().isoformat()
        with self._get_connection() as conn:
            conn.execute("UPDATE users SET google_id = ?, avatar_url = COALESCE(?, avatar_url), email_verified = ?, updated_at = ? WHERE id = ?",
                         (google_id, avatar_url, int(email_verified), now, user_id))

    def update_last_login(self, user_id: str) -> None:
        now = utc_now().isoformat()
        with self._get_connection() as conn:
            conn.execute("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?", (now, now, user_id))

    def create_session(self, user_id: str, user_agent: Optional[str], ip_address: Optional[str], ttl_hours: int) -> str:
        raw_token = generate_token(32)
        now = utc_now()
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at, user_agent, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), user_id, token_digest(raw_token), (now + timedelta(hours=ttl_hours)).isoformat(),
                  now.isoformat(), now.isoformat(), user_agent, ip_address))
        return raw_token

    def get_session_user(self, raw_token: Optional[str]) -> Optional[Dict[str, Any]]:
        if not raw_token:
            return None
        now = utc_now().isoformat()
        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND u.is_active = 1
            """, (token_digest(raw_token), now)).fetchone()
            if row:
                conn.execute("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?", (now, token_digest(raw_token)))
        return dict(row) if row else None

    def revoke_session(self, raw_token: Optional[str]) -> None:
        if raw_token:
            with self._get_connection() as conn:
                conn.execute("UPDATE sessions SET revoked_at = COALESCE(revoked_at, ?) WHERE token_hash = ?", (utc_now().isoformat(), token_digest(raw_token)))

    def revoke_user_sessions(self, user_id: str) -> None:
        with self._get_connection() as conn:
            conn.execute("UPDATE sessions SET revoked_at = COALESCE(revoked_at, ?) WHERE user_id = ?", (utc_now().isoformat(), user_id))

    def create_password_reset(self, email: str, ttl_minutes: int = 30) -> Optional[str]:
        user = self.get_user_by_email(email)
        if not user or not user.get("is_active"):
            return None
        raw_token, now = generate_token(32), utc_now()
        with self._get_connection() as conn:
            conn.execute("UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL", (now.isoformat(), user["id"]))
            conn.execute("""
                INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), user["id"], token_digest(raw_token), (now + timedelta(minutes=ttl_minutes)).isoformat(), now.isoformat()))
        return raw_token

    def consume_password_reset(self, raw_token: str) -> Optional[str]:
        now = utc_now().isoformat()
        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT id, user_id FROM password_reset_tokens
                WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
            """, (token_digest(raw_token), now)).fetchone()
            if not row:
                return None
            cursor = conn.execute("UPDATE password_reset_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL", (now, row["id"]))
            return row["user_id"] if cursor.rowcount == 1 else None

    def update_password(self, user_id: str, password_hash: str, password_salt: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.execute("UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?",
                                  (password_hash, password_salt, utc_now().isoformat(), user_id))
        return cursor.rowcount == 1

    def create_oauth_state(self, provider: str, ttl_minutes: int = 10) -> str:
        state, now = generate_token(32), utc_now()
        with self._get_connection() as conn:
            conn.execute("INSERT INTO oauth_states (state_hash, provider, expires_at, created_at) VALUES (?, ?, ?, ?)",
                         (token_digest(state), provider, (now + timedelta(minutes=ttl_minutes)).isoformat(), now.isoformat()))
        return state

    def consume_oauth_state(self, raw_state: str, provider: str) -> bool:
        now = utc_now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.execute("""
                UPDATE oauth_states SET used_at = ?
                WHERE state_hash = ? AND provider = ? AND used_at IS NULL AND expires_at > ?
            """, (now, token_digest(raw_state), provider, now))
        return cursor.rowcount == 1

    def public_user(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return self._public_user(user)


db = Database()
