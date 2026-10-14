CREATE TABLE IF NOT EXISTS banners (
  id               BINARY(16)    NOT NULL PRIMARY KEY,
  title            VARCHAR(180)  NOT NULL,
  description      VARCHAR(1000),
  image_url        MEDIUMTEXT    NOT NULL,
  mobile_image_url MEDIUMTEXT,
  target_url       VARCHAR(2048),
  scope            VARCHAR(20)   NOT NULL DEFAULT 'GLOBAL',
  location_id      VARCHAR(100),
  store_id         VARCHAR(100),
  sort_order       INT           NOT NULL DEFAULT 0,
  status           VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  starts_on        DATE,
  ends_on          DATE,
  created_at       TIMESTAMP(6)  NOT NULL,
  updated_at       TIMESTAMP(6)  NOT NULL,
  INDEX idx_banners_status_scope (status, scope),
  INDEX idx_banners_sort (sort_order)
);
