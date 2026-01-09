-- Storyworthy Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gtgisopvzyjchspxwepa/sql

-- 1. Create entries table
CREATE TABLE IF NOT EXISTS entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  storyworthy TEXT DEFAULT '',
  thankful TEXT DEFAULT '',
  photo_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  modified_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- 2. Enable Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies (users can only access their own entries)
CREATE POLICY "Users can view own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create index for efficient sync queries
CREATE INDEX IF NOT EXISTS entries_user_modified
  ON entries(user_id, modified_at DESC);

CREATE INDEX IF NOT EXISTS entries_user_date
  ON entries(user_id, date);

-- 5. Create storage bucket for photos
-- Note: Run this in the Supabase Dashboard > Storage > New Bucket
-- Bucket name: photos
-- Public bucket: Yes (for authenticated users)

-- 6. Storage RLS policies (run after creating bucket)
-- Go to Storage > Policies and add these:

-- Policy: Users can upload to their own folder
-- Operation: INSERT
-- Policy: (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1])

-- Policy: Users can read from their own folder
-- Operation: SELECT
-- Policy: (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1])

-- Policy: Users can delete from their own folder
-- Operation: DELETE
-- Policy: (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1])
