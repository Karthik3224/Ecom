CREATE TABLE app_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(190) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  oauth_subject VARCHAR(255) UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  locked BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE roles (id BIGINT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(80) NOT NULL UNIQUE);
CREATE TABLE permissions (id BIGINT PRIMARY KEY AUTO_INCREMENT, code VARCHAR(120) NOT NULL UNIQUE);
CREATE TABLE role_permissions (role_id BIGINT NOT NULL, permission_id BIGINT NOT NULL, PRIMARY KEY (role_id, permission_id), FOREIGN KEY (role_id) REFERENCES roles(id), FOREIGN KEY (permission_id) REFERENCES permissions(id));
CREATE TABLE user_roles (user_id BIGINT NOT NULL, role_id BIGINT NOT NULL, PRIMARY KEY (user_id, role_id), FOREIGN KEY (user_id) REFERENCES app_users(id), FOREIGN KEY (role_id) REFERENCES roles(id));
CREATE TABLE memberships (id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, role_id BIGINT NOT NULL, organization_id VARCHAR(100), location_id VARCHAR(100), store_id VARCHAR(100), FOREIGN KEY (user_id) REFERENCES app_users(id), FOREIGN KEY (role_id) REFERENCES roles(id));
CREATE TABLE audit_logs (id BIGINT PRIMARY KEY AUTO_INCREMENT, actor VARCHAR(190) NOT NULL, action VARCHAR(80) NOT NULL, target VARCHAR(255) NOT NULL, created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6));

INSERT INTO roles(name) VALUES ('SUPER_ADMIN'),('GLOBAL_ADMIN'),('LOCATION_ADMIN'),('STORE_MANAGER'),('DELIVERY_PARTNER'),('CUSTOMER');
INSERT INTO permissions(code) VALUES ('USER_READ'),('USER_WRITE'),('ROLE_READ'),('ROLE_WRITE'),('ORDER_READ'),('ORDER_WRITE'),('DELIVERY_UPDATE');
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('SUPER_ADMIN','GLOBAL_ADMIN');
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'LOCATION_ADMIN' AND p.code IN ('USER_READ','ORDER_READ','ORDER_WRITE');
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'STORE_MANAGER' AND p.code IN ('ORDER_READ','ORDER_WRITE');
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'DELIVERY_PARTNER' AND p.code IN ('ORDER_READ','DELIVERY_UPDATE');
INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'CUSTOMER' AND p.code IN ('ORDER_READ','ORDER_WRITE');
INSERT INTO app_users(username, email, password_hash) VALUES ('admin', 'admin@metaarch.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5uWQ5vJ8yFjJ5m1a1m9Xv8W9X1a1m9K');
INSERT INTO user_roles(user_id, role_id) SELECT u.id, r.id FROM app_users u CROSS JOIN roles r WHERE u.username='admin' AND r.name='SUPER_ADMIN';
