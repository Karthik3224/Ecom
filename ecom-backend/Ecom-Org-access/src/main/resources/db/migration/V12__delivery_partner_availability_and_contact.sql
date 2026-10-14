ALTER TABLE app_users ADD COLUMN emergency_contact VARCHAR(30), ADD COLUMN delivery_latitude DOUBLE, ADD COLUMN delivery_longitude DOUBLE, ADD COLUMN delivery_location_updated_at TIMESTAMP NULL;
UPDATE app_users u SET enabled=1 WHERE status='Inactive' AND locked=0 AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.name='DELIVERY_PARTNER');
