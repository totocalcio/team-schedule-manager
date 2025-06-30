/*
  # Discord Notifications Feature

  1. New Tables
    - `discord_notifications`
      - `id` (uuid, primary key)
      - `calendar_id` (uuid, foreign key to calendars)
      - `webhook_url` (text, Discord webhook URL)
      - `notification_time` (time, when to send notifications)
      - `enabled` (boolean, whether notifications are active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `discord_notifications` table
    - Add policy for public access (same as other tables)

  3. Indexes
    - Add index on calendar_id for efficient queries
    - Add index on enabled status for notification processing
*/

CREATE TABLE IF NOT EXISTS discord_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  notification_time time NOT NULL DEFAULT '09:00:00',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE discord_notifications ENABLE ROW LEVEL SECURITY;

-- Add policy for public access
CREATE POLICY "Allow public access to discord_notifications"
  ON discord_notifications
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_discord_notifications_calendar_id 
  ON discord_notifications(calendar_id);

CREATE INDEX IF NOT EXISTS idx_discord_notifications_enabled 
  ON discord_notifications(enabled) WHERE enabled = true;

-- Add unique constraint to ensure one notification setting per calendar
CREATE UNIQUE INDEX IF NOT EXISTS discord_notifications_calendar_id_key 
  ON discord_notifications(calendar_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_discord_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discord_notifications_updated_at
  BEFORE UPDATE ON discord_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_notifications_updated_at();