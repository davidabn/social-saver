-- Create monitored_profiles table
create table if not exists monitored_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  username text not null,
  platform text not null check (platform in ('instagram', 'tiktok')),
  avatar_url text,
  full_name text,
  last_checked_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, username, platform)
);

-- Create feed_items table
create table if not exists feed_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references monitored_profiles(id) on delete cascade not null,
  post_id text not null, -- External ID from IG/TikTok
  platform text not null check (platform in ('instagram', 'tiktok')),
  content_type text not null check (content_type in ('reel', 'post', 'carousel')),
  
  -- Media Data
  thumbnail_url text,
  video_url text,
  image_urls text[], -- Array of strings
  carousel_media jsonb, -- Store complex carousel data
  
  -- Metadata
  caption text,
  likes_count bigint default 0,
  comments_count bigint default 0,
  posted_at timestamp with time zone,
  
  -- State
  is_saved boolean default false, -- If user converted it to a "SavedContent"
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique post per user (or per profile)
  unique(user_id, post_id)
);

-- Create RLS policies
alter table monitored_profiles enable row level security;
alter table feed_items enable row level security;

create policy "Users can manage their monitored profiles"
  on monitored_profiles for all
  using (auth.uid() = user_id);

create policy "Users can manage their feed items"
  on feed_items for all
  using (auth.uid() = user_id);
