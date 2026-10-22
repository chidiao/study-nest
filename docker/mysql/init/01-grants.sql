-- Grant the application user privileges needed by Prisma Migrate
-- (creating the shadow database requires create/drop database rights).
GRANT ALL PRIVILEGES ON *.* TO 'study-nest'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
