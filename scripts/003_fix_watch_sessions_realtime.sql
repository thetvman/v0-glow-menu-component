-- Ensure Realtime is properly enabled for watch_sessions table
-- This script fixes any Realtime configuration issues

-- First, make sure the table exists with correct schema
DO $$ 
BEGIN
  -- Check if we need to rename any columns that don't match
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'watch_sessions' 
    AND column_name = 'current_time'
  ) THEN
    ALTER TABLE public.watch_sessions RENAME COLUMN current_time TO playback_time;
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'watch_sessions' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.watch_sessions RENAME COLUMN title TO video_title;
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'watch_sessions' 
    AND column_name = 'host_id'
  ) THEN
    ALTER TABLE public.watch_sessions RENAME COLUMN host_id TO host_name;
    ALTER TABLE public.watch_sessions ALTER COLUMN host_name TYPE text;
  END IF;
END $$;

-- Ensure Realtime is enabled (check first to avoid errors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'watch_sessions'
  ) THEN
    -- Add table to Realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_sessions;
    RAISE NOTICE '✓ Added watch_sessions to supabase_realtime publication';
  ELSE
    RAISE NOTICE '✓ watch_sessions already in supabase_realtime publication';
  END IF;
END $$;

-- Add updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Drop and recreate trigger to ensure it's working
DROP TRIGGER IF EXISTS watch_sessions_updated_at ON public.watch_sessions;
CREATE TRIGGER watch_sessions_updated_at
  BEFORE UPDATE ON public.watch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add index for better Realtime performance
CREATE INDEX IF NOT EXISTS idx_watch_sessions_updated_at ON public.watch_sessions(updated_at DESC);

-- Verify final schema
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'watch_sessions'
    AND column_name IN ('playback_time', 'video_title', 'host_name', 'is_playing', 'participants');
  
  IF col_count = 5 THEN
    RAISE NOTICE '✓ Schema verification passed - all required columns exist';
  ELSE
    RAISE WARNING '⚠ Schema verification incomplete - found % of 5 required columns', col_count;
  END IF;
END $$;
