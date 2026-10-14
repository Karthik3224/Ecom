CREATE TABLE customer_profiles (
  id BINARY(16) NOT NULL, username VARCHAR(191) NOT NULL, name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL, email VARCHAR(254) NULL, gender VARCHAR(32) NULL,
  date_of_birth DATE NULL, photo MEDIUMTEXT NULL, created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL, PRIMARY KEY (id),
  CONSTRAINT uk_customer_profiles_username UNIQUE (username)
);
