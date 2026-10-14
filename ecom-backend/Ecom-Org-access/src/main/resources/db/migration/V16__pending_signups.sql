-- Customer sign-up is deferred: nothing is written to users/customers until the
-- email OTP is verified. The pending signup (with a hashed password + hashed code)
-- lives here until then, and is deleted on success, expiry, or re-registration.
CREATE TABLE pending_signups (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  mobile VARCHAR(30) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP(6) NOT NULL,
  sent_at TIMESTAMP(6) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT uk_pending_signups_email UNIQUE (email)
);
