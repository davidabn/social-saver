-- Create user_images table to track uploads and generated images
create table if not exists user_images (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  url text not null,
  type text not null check (type in ('upload', 'generated')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

-- Internal policies (admin only for now, or match your existing rls)
alter table user_images enable row level security;

create policy "Users can view their own images"
  on user_images for select
  using (auth.uid() = user_id);

create policy "Users can insert their own images"
  on user_images for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own images"
  on user_images for delete
  using (auth.uid() = user_id);
