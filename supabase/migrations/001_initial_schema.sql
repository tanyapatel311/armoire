-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clothing items table
create table if not exists public.clothing_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text not null check (category in ('tops', 'bottoms', 'shoes', 'outerwear', 'accessories', 'dresses')),
  subcategory text,
  color text,
  season text check (season in ('spring', 'summer', 'fall', 'winter', 'all')),
  image_url text,
  brand text,
  ai_tags jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null
);

alter table public.clothing_items enable row level security;

create policy "Users can view their own clothing"
  on public.clothing_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own clothing"
  on public.clothing_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own clothing"
  on public.clothing_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own clothing"
  on public.clothing_items for delete
  using (auth.uid() = user_id);

-- Outfits table
create table if not exists public.outfits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  occasion text,
  items jsonb not null default '[]'::jsonb,
  ai_reasoning text,
  created_at timestamptz default now() not null
);

alter table public.outfits enable row level security;

create policy "Users can view their own outfits"
  on public.outfits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own outfits"
  on public.outfits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own outfits"
  on public.outfits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own outfits"
  on public.outfits for delete
  using (auth.uid() = user_id);

-- Outfit log table
create table if not exists public.outfit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  outfit_id uuid references public.outfits on delete set null,
  date_worn date not null,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.outfit_log enable row level security;

create policy "Users can view their own outfit log"
  on public.outfit_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their own outfit log"
  on public.outfit_log for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own outfit log"
  on public.outfit_log for update
  using (auth.uid() = user_id);

create policy "Users can delete their own outfit log"
  on public.outfit_log for delete
  using (auth.uid() = user_id);

-- Storage bucket for clothing images
insert into storage.buckets (id, name, public)
values ('clothing-images', 'clothing-images', true)
on conflict (id) do nothing;

create policy "Users can upload clothing images"
  on storage.objects for insert
  with check (bucket_id = 'clothing-images' and auth.role() = 'authenticated');

create policy "Users can view clothing images"
  on storage.objects for select
  using (bucket_id = 'clothing-images');

create policy "Users can delete their own clothing images"
  on storage.objects for delete
  using (bucket_id = 'clothing-images' and auth.uid()::text = (storage.foldername(name))[1]);
