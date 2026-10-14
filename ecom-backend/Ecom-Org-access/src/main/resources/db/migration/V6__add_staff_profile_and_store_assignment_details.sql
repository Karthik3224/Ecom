CREATE TABLE IF NOT EXISTS memberships (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  organization_id VARCHAR(100),
  location_id VARCHAR(100),
  store_id VARCHAR(100),
  store_name VARCHAR(180),
  store_location VARCHAR(160),
  store_address VARCHAR(700),
  latitude DOUBLE,
  longitude DOUBLE,
  provider VARCHAR(40),
  provider_place_id VARCHAR(120),
  provider_osm_type VARCHAR(20),
  provider_osm_id VARCHAR(40),
  location_accuracy_meters DOUBLE,
  assigned_by VARCHAR(190),
  FOREIGN KEY (user_id) REFERENCES app_users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

SET @schema_name = DATABASE();

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE app_users ADD COLUMN oauth_subject VARCHAR(255) NULL UNIQUE AFTER password_hash', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'app_users' AND column_name = 'oauth_subject'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE app_users ADD COLUMN display_name VARCHAR(180) NULL AFTER oauth_subject', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'app_users' AND column_name = 'display_name'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE app_users ADD COLUMN mobile VARCHAR(30) NULL AFTER display_name', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'app_users' AND column_name = 'mobile'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE app_users ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT ''Active'' AFTER mobile', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'app_users' AND column_name = 'status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN store_name VARCHAR(180) NULL AFTER store_id', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'store_name'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN store_location VARCHAR(160) NULL AFTER store_name', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'store_location'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN store_address VARCHAR(700) NULL AFTER store_location', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'store_address'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN latitude DOUBLE NULL AFTER store_address', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'latitude'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN longitude DOUBLE NULL AFTER latitude', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'longitude'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN provider VARCHAR(40) NULL AFTER longitude', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'provider'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN provider_place_id VARCHAR(120) NULL AFTER provider', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'provider_place_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN provider_osm_type VARCHAR(20) NULL AFTER provider_place_id', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'provider_osm_type'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN provider_osm_id VARCHAR(40) NULL AFTER provider_osm_type', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'provider_osm_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN location_accuracy_meters DOUBLE NULL AFTER provider_osm_id', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'location_accuracy_meters'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE memberships ADD COLUMN assigned_by VARCHAR(190) NULL AFTER location_accuracy_meters', 'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'memberships' AND column_name = 'assigned_by'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE app_users
SET
  display_name = CASE username
    WHEN 'globaladmin' THEN 'Global Admin'
    WHEN 'locationadmin' THEN 'Hyderabad Location Admin'
    WHEN 'locationadminhyd2' THEN 'Hyderabad Deputy Admin'
    WHEN 'locationadminvja' THEN 'Vijayawada Location Admin'
    WHEN 'locationadminvja2' THEN 'Vijayawada Deputy Admin'
    WHEN 'locationadminchn' THEN 'Chennai Location Admin'
    WHEN 'locationadminchn2' THEN 'Chennai Deputy Admin'
    WHEN 'locationadminblr' THEN 'Bengaluru Location Admin'
    WHEN 'locationadminblr2' THEN 'Bengaluru Deputy Admin'
    WHEN 'storemanager' THEN 'Sravani Gachibowli'
    WHEN 'storemanagerhydmain' THEN 'Ramesh HYD Main'
    WHEN 'storemanagerbanjara' THEN 'Mahesh Banjara'
    WHEN 'storemanagersecunderabad' THEN 'Anil Secunderabad'
    WHEN 'storemanagerbenzcircle' THEN 'Lakshmi Benz Circle'
    WHEN 'storemanagergovernorpet' THEN 'Ravi Governorpet'
    WHEN 'storemanagerporanki' THEN 'Sneha Poranki'
    WHEN 'storemanagertnagar' THEN 'Arun T Nagar'
    WHEN 'storemanageradyar' THEN 'Divya Adyar'
    WHEN 'storemanagervelachery' THEN 'Karthik Velachery'
    WHEN 'storemanagerblr' THEN 'Kiran Koramangala'
    WHEN 'storemanagerindiranagar' THEN 'Neha Indiranagar'
    WHEN 'storemanagerwhitefield' THEN 'Manoj Whitefield'
    WHEN 'deliverypartner' THEN 'Delivery Partner'
    ELSE display_name
  END,
  mobile = CASE username
    WHEN 'storemanager' THEN '+91 90000 30003'
    WHEN 'storemanagerhydmain' THEN '+91 90000 30019'
    WHEN 'storemanagerbanjara' THEN '+91 90000 30020'
    WHEN 'storemanagersecunderabad' THEN '+91 90000 30021'
    WHEN 'storemanagerbenzcircle' THEN '+91 90000 30022'
    WHEN 'storemanagergovernorpet' THEN '+91 90000 30023'
    WHEN 'storemanagerporanki' THEN '+91 90000 30024'
    WHEN 'storemanagertnagar' THEN '+91 90000 30025'
    WHEN 'storemanageradyar' THEN '+91 90000 30026'
    WHEN 'storemanagervelachery' THEN '+91 90000 30027'
    WHEN 'storemanagerblr' THEN '+91 90000 30005'
    WHEN 'storemanagerindiranagar' THEN '+91 90000 30028'
    WHEN 'storemanagerwhitefield' THEN '+91 90000 30029'
    ELSE mobile
  END
WHERE username IN (
  'globaladmin', 'locationadmin', 'locationadminhyd2', 'locationadminvja', 'locationadminvja2',
  'locationadminchn', 'locationadminchn2', 'locationadminblr', 'locationadminblr2', 'storemanager',
  'storemanagerhydmain', 'storemanagerbanjara', 'storemanagersecunderabad', 'storemanagerbenzcircle',
  'storemanagergovernorpet', 'storemanagerporanki', 'storemanagertnagar', 'storemanageradyar',
  'storemanagervelachery', 'storemanagerblr', 'storemanagerindiranagar', 'storemanagerwhitefield',
  'deliverypartner'
);

UPDATE memberships
SET
  store_name = CASE store_id
    WHEN 'india-store-1-1' THEN 'Hyderabad Main Store'
    WHEN 'store-gachibowli' THEN 'Gachibowli Fresh Hub'
    WHEN 'store-banjara' THEN 'Banjara Hills Pickle House'
    WHEN 'store-secunderabad' THEN 'Secunderabad Daily Foods'
    WHEN 'store-benzcircle' THEN 'Benz Circle Fresh Basket'
    WHEN 'store-governorpet' THEN 'Governorpet Spice Store'
    WHEN 'store-poranki' THEN 'Poranki Fresh Mart'
    WHEN 'store-tnagar' THEN 'T Nagar Family Foods'
    WHEN 'store-adyar' THEN 'Adyar Organic Basket'
    WHEN 'store-velachery' THEN 'Velachery Daily Foods'
    WHEN 'store-koramangala' THEN 'Koramangala Gourmet Mart'
    WHEN 'store-indiranagar' THEN 'Indiranagar Organic Foods'
    WHEN 'store-whitefield' THEN 'Whitefield Fresh Basket'
    ELSE store_name
  END,
  store_location = CASE store_id
    WHEN 'india-store-1-1' THEN 'Hyderabad'
    WHEN 'store-gachibowli' THEN 'Hyderabad'
    WHEN 'store-banjara' THEN 'Hyderabad'
    WHEN 'store-secunderabad' THEN 'Hyderabad'
    WHEN 'store-benzcircle' THEN 'Vijayawada'
    WHEN 'store-governorpet' THEN 'Vijayawada'
    WHEN 'store-poranki' THEN 'Vijayawada'
    WHEN 'store-tnagar' THEN 'Chennai'
    WHEN 'store-adyar' THEN 'Chennai'
    WHEN 'store-velachery' THEN 'Chennai'
    WHEN 'store-koramangala' THEN 'Bengaluru'
    WHEN 'store-indiranagar' THEN 'Bengaluru'
    WHEN 'store-whitefield' THEN 'Bengaluru'
    ELSE store_location
  END,
  store_address = CASE store_id
    WHEN 'india-store-1-1' THEN 'Madhapur Main Road, Hyderabad, Telangana 500081, India'
    WHEN 'store-gachibowli' THEN 'DLF Road, Gachibowli, Hyderabad, Telangana 500032, India'
    WHEN 'store-banjara' THEN 'Road No. 12, Banjara Hills, Hyderabad, Telangana 500034, India'
    WHEN 'store-secunderabad' THEN 'Sardar Patel Road, Secunderabad, Telangana 500003, India'
    WHEN 'store-benzcircle' THEN 'Benz Circle, Vijayawada, Andhra Pradesh 520010, India'
    WHEN 'store-governorpet' THEN 'Governorpet, Vijayawada, Andhra Pradesh 520002, India'
    WHEN 'store-poranki' THEN 'Poranki, Vijayawada, Andhra Pradesh 521137, India'
    WHEN 'store-tnagar' THEN 'Usman Road, T Nagar, Chennai, Tamil Nadu 600017, India'
    WHEN 'store-adyar' THEN 'Lattice Bridge Road, Adyar, Chennai, Tamil Nadu 600020, India'
    WHEN 'store-velachery' THEN 'Velachery Main Road, Velachery, Chennai, Tamil Nadu 600042, India'
    WHEN 'store-koramangala' THEN '5th Block, Koramangala, Bengaluru, Karnataka 560095, India'
    WHEN 'store-indiranagar' THEN '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India'
    WHEN 'store-whitefield' THEN 'Whitefield Main Road, Whitefield, Bengaluru, Karnataka 560066, India'
    ELSE store_address
  END,
  latitude = CASE store_id
    WHEN 'india-store-1-1' THEN 17.4482948
    WHEN 'store-gachibowli' THEN 17.4434778
    WHEN 'store-banjara' THEN 17.4138277
    WHEN 'store-secunderabad' THEN 17.4399295
    WHEN 'store-benzcircle' THEN 16.5061743
    WHEN 'store-governorpet' THEN 16.5131048
    WHEN 'store-poranki' THEN 16.4749723
    WHEN 'store-tnagar' THEN 13.0418068
    WHEN 'store-adyar' THEN 13.0064500
    WHEN 'store-velachery' THEN 12.9759710
    WHEN 'store-koramangala' THEN 12.9352403
    WHEN 'store-indiranagar' THEN 12.9783717
    WHEN 'store-whitefield' THEN 12.9698196
    ELSE latitude
  END,
  longitude = CASE store_id
    WHEN 'india-store-1-1' THEN 78.3914850
    WHEN 'store-gachibowli' THEN 78.3771953
    WHEN 'store-banjara' THEN 78.4397573
    WHEN 'store-secunderabad' THEN 78.4982741
    WHEN 'store-benzcircle' THEN 80.6480153
    WHEN 'store-governorpet' THEN 80.6298704
    WHEN 'store-poranki' THEN 80.7125405
    WHEN 'store-tnagar' THEN 80.2341001
    WHEN 'store-adyar' THEN 80.2577799
    WHEN 'store-velachery' THEN 80.2212092
    WHEN 'store-koramangala' THEN 77.6245320
    WHEN 'store-indiranagar' THEN 77.6408356
    WHEN 'store-whitefield' THEN 77.7499721
    ELSE longitude
  END,
  provider = COALESCE(provider, 'OPENSTREETMAP'),
  location_accuracy_meters = COALESCE(location_accuracy_meters, 25.00)
WHERE store_id IS NOT NULL;
