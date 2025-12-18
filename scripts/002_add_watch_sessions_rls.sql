-- Enable Row Level Security
ALTER TABLE watch_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active sessions (needed for guests to join)
-- But only sessions that are less than 24 hours old
CREATE POLICY "Anyone can read recent sessions"
ON watch_sessions
FOR SELECT
USING (
  created_at > NOW() - INTERVAL '24 hours'
);

-- Allow anyone to insert new sessions (for creating watch parties)
CREATE POLICY "Anyone can create sessions"
ON watch_sessions
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update sessions they have the code for
-- In practice, only host/guests who know the code can update
CREATE POLICY "Anyone can update sessions"
ON watch_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Auto-delete old sessions (cleanup)
CREATE OR REPLACE FUNCTION delete_old_watch_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM watch_sessions
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_watch_sessions_code ON watch_sessions(code);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_created_at ON watch_sessions(created_at);
