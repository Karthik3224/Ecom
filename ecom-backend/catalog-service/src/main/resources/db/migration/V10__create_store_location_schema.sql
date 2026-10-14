CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  location VARCHAR(160) NOT NULL,
  address VARCHAR(700) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'OPENSTREETMAP',
  provider_place_id VARCHAR(120),
  provider_osm_type VARCHAR(20),
  provider_osm_id VARCHAR(40),
  location_accuracy_meters DECIMAL(10,2),
  phone VARCHAR(30),
  email VARCHAR(180),
  admin_name VARCHAR(180),
  delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_stores_name UNIQUE (name),
  INDEX idx_stores_location (location),
  INDEX idx_stores_lat_lng (latitude, longitude)
);

ALTER TABLE stores
  MODIFY COLUMN delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  MODIFY COLUMN pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  MODIFY COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

INSERT INTO stores(id, name, location, address, latitude, longitude, provider, active, created_at, updated_at)
SELECT 'store-gachibowli', 'Gachibowli Fresh Hub', 'Gachibowli', 'Gachibowli, Hyderabad, Telangana, India', 17.4401000, 78.3489000, 'OPENSTREETMAP', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 'store-gachibowli');

INSERT INTO stores(id, name, location, address, latitude, longitude, provider, active, created_at, updated_at)
SELECT 'store-banjara', 'Banjara Hills Pickle House', 'Banjara Hills', 'Banjara Hills, Hyderabad, Telangana, India', 17.4126000, 78.4483000, 'OPENSTREETMAP', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 'store-banjara');

INSERT INTO stores(id, name, location, address, latitude, longitude, provider, active, created_at, updated_at)
SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'Secunderabad', 'Secunderabad, Hyderabad, Telangana, India', 17.4399000, 78.4983000, 'OPENSTREETMAP', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 'store-secunderabad');

INSERT INTO stores(id, name, location, address, latitude, longitude, provider, active, created_at, updated_at)
SELECT 'store-koramangala', 'Koramangala Gourmet Mart', 'Koramangala', 'Koramangala, Bengaluru, Karnataka, India', 12.9352000, 77.6245000, 'OPENSTREETMAP', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 'store-koramangala');

INSERT INTO stores(id, name, location, address, latitude, longitude, provider, active, created_at, updated_at)
SELECT 'store-indiranagar', 'Indiranagar Organic Foods', 'Indiranagar', 'Indiranagar, Bengaluru, Karnataka, India', 12.9784000, 77.6408000, 'OPENSTREETMAP', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 'store-indiranagar');

INSERT INTO stores(id, name, location, address, latitude, longitude, provider, active, created_at, updated_at)
SELECT 'store-tnagar', 'T Nagar Family Foods', 'T Nagar', 'T Nagar, Chennai, Tamil Nadu, India', 13.0418000, 80.2341000, 'OPENSTREETMAP', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 'store-tnagar');

INSERT INTO stores(id, name, location, address, latitude, longitude, provider, active, created_at, updated_at)
SELECT 'store-benzcircle', 'Benz Circle Fresh Basket', 'Benz Circle', 'Benz Circle, Vijayawada, Andhra Pradesh, India', 16.5088000, 80.6480000, 'OPENSTREETMAP', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 'store-benzcircle');
