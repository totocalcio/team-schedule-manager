/*
  # Discord通知システム

  1. 新しいテーブル
    - `discord_notifications`
      - `id` (uuid, primary key)
      - `calendar_id` (uuid, foreign key to calendars)
      - `webhook_url` (text, Discord webhook URL)
      - `notification_time` (time, 通知送信時刻)
      - `enabled` (boolean, 通知の有効/無効)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. セキュリティ
    - RLSを有効化
    - パブリックアクセスポリシーを追加

  3. インデックス
    - calendar_idでの効率的なクエリ用インデックス
    - 有効な通知設定の処理用インデックス
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

-- RLSを有効化
ALTER TABLE discord_notifications ENABLE ROW LEVEL SECURITY;

-- パブリックアクセスポリシーを追加
CREATE POLICY "Allow public access to discord_notifications"
  ON discord_notifications
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_discord_notifications_calendar_id 
  ON discord_notifications(calendar_id);

CREATE INDEX IF NOT EXISTS idx_discord_notifications_enabled 
  ON discord_notifications(enabled) WHERE enabled = true;

-- カレンダーごとに1つの通知設定のみ許可
CREATE UNIQUE INDEX IF NOT EXISTS discord_notifications_calendar_id_key 
  ON discord_notifications(calendar_id);

-- updated_at自動更新用の関数とトリガー
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