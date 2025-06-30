/*
  # Remove Discord Notifications Feature

  1. Drop Tables
    - Drop `discord_notifications` table and all related objects
    
  2. Clean up
    - Remove triggers, functions, indexes, and policies
    - Remove all Discord-related database objects
*/

-- Drop the discord_notifications table and all related objects
DROP TABLE IF EXISTS discord_notifications CASCADE;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_discord_notifications_updated_at() CASCADE;

-- Clean up any remaining indexes (they should be dropped with the table, but just in case)
DROP INDEX IF EXISTS idx_discord_notifications_calendar_id;
DROP INDEX IF EXISTS idx_discord_notifications_enabled;
DROP INDEX IF EXISTS discord_notifications_calendar_id_key;