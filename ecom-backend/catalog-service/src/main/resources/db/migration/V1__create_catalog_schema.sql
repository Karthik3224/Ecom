CREATE TABLE categories (
  id BINARY(16) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL,
  description VARCHAR(1000),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_categories_slug UNIQUE (slug)
);

CREATE TABLE products (
  id BINARY(16) NOT NULL PRIMARY KEY,
  category_id BINARY(16) NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  description TEXT,
  brand VARCHAR(120),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_products_slug UNIQUE (slug),
  CONSTRAINT uk_products_sku UNIQUE (sku),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_products_category_status (category_id, status)
);

CREATE TABLE product_variants (
  id BINARY(16) NOT NULL PRIMARY KEY,
  product_id BINARY(16) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(180) NOT NULL,
  attributes JSON,
  price DECIMAL(19,2) NOT NULL,
  compare_at_price DECIMAL(19,2),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_product_variants_sku UNIQUE (sku),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_variants_product (product_id)
);

CREATE TABLE product_images (
  id BINARY(16) NOT NULL PRIMARY KEY,
  product_id BINARY(16) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  alt_text VARCHAR(255),
  display_order INT NOT NULL DEFAULT 0,
  primary_image BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_images_product_order (product_id, display_order)
);

CREATE TABLE store_products (
  id BINARY(16) NOT NULL PRIMARY KEY,
  store_id VARCHAR(100) NOT NULL,
  product_id BINARY(16) NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  price_override DECIMAL(19,2),
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_store_products_store_product UNIQUE (store_id, product_id),
  CONSTRAINT fk_store_products_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_store_products_product (product_id)
);
