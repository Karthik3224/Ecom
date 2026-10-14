CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor VARCHAR(190) NOT NULL,
  action VARCHAR(80) NOT NULL,
  target VARCHAR(255) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

INSERT IGNORE INTO permissions(code)
VALUES
  ('USER_READ'),
  ('USER_WRITE'),
  ('ROLE_READ'),
  ('ROLE_WRITE'),
  ('ORDER_READ'),
  ('ORDER_WRITE'),
  ('DELIVERY_UPDATE');

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('SUPER_ADMIN', 'GLOBAL_ADMIN');

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('USER_READ', 'ORDER_READ', 'ORDER_WRITE')
WHERE r.name = 'LOCATION_ADMIN';

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('ORDER_READ', 'ORDER_WRITE')
WHERE r.name = 'STORE_MANAGER';

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('ORDER_READ', 'DELIVERY_UPDATE')
WHERE r.name = 'DELIVERY_PARTNER';

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('ORDER_READ', 'ORDER_WRITE')
WHERE r.name = 'CUSTOMER';
