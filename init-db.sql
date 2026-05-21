-- BDEN Database Initialization
-- This runs automatically when PostgreSQL container starts

-- Create separate databases for each service
CREATE DATABASE bden_auth;
CREATE DATABASE bden_donors;
CREATE DATABASE bden_requests;
CREATE DATABASE bden_campaigns;
CREATE DATABASE bden_notifications;

-- Grant all privileges to bden_user
GRANT ALL PRIVILEGES ON DATABASE bden_auth         TO bden_user;
GRANT ALL PRIVILEGES ON DATABASE bden_donors       TO bden_user;
GRANT ALL PRIVILEGES ON DATABASE bden_requests     TO bden_user;
GRANT ALL PRIVILEGES ON DATABASE bden_campaigns    TO bden_user;
GRANT ALL PRIVILEGES ON DATABASE bden_notifications TO bden_user;