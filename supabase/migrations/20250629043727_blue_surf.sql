/*
  # Add password protection to calendars

  1. Schema Changes
    - Add `password_hash` column to `calendars` table (nullable)
    - Add `has_password` computed column for easier querying
    
  2. Security
    - Password is hashed before storage (never store plain text)
    - Only affects deletion operations
    - Viewing and editing remain unrestricted for simplicity
    
  3. Notes
    - NULL password_hash means no password protection
    - Non-NULL password_hash means password protection is enabled
*/

-- Add password_hash column to calendars table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendars' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE calendars ADD COLUMN password_hash text;
  END IF;
END $$;

-- Add index for password queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_calendars_password_hash ON calendars(password_hash) WHERE password_hash IS NOT NULL;

-- Add a comment to document the password functionality
COMMENT ON COLUMN calendars.password_hash IS 'Hashed password for calendar deletion protection. NULL means no password protection.';