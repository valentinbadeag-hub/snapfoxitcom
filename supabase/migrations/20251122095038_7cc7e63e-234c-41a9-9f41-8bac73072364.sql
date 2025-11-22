-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  email text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- Create favorites table
create table public.favorites (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_name text not null,
  category text,
  description text,
  rating numeric,
  review_count integer,
  price_range text,
  best_price text,
  best_dealer text,
  currency text,
  average_price text,
  pros text[],
  cons text[],
  usage_tips text[],
  recommendation text,
  image_data text,
  created_at timestamp with time zone not null default now(),
  unique(user_id, product_name)
);

-- Enable RLS on favorites
alter table public.favorites enable row level security;

-- Favorites policies
create policy "Users can view their own favorites"
  on public.favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for profiles updated_at
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();