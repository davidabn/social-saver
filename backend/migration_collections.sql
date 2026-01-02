-- Create collections table
create table if not exists collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  cover_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- Add collection_id to saved_contents table
alter table saved_contents
add column if not exists collection_id uuid references collections(id) on delete set null;

-- Create indexes for faster queries
create index if not exists idx_saved_contents_collection_id on saved_contents(collection_id);
create index if not exists idx_collections_user_id on collections(user_id);

-- Create RLS policies
alter table collections enable row level security;

create policy "Users can manage their own collections"
  on collections for all
  using (auth.uid() = user_id);

-- Create trigger to update updated_at
create or replace function update_collections_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger collections_updated_at
before update on collections
for each row execute function update_collections_updated_at();
