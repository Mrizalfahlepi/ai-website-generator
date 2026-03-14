-- WebGen AI Database Schema
-- Run this in Supabase SQL Editor

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  credits integer default 1 not null,
  total_generated integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Websites table
create table public.websites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  prompt text not null,
  html_output text not null,
  provider text not null default 'gemini',
  tokens_input integer default 0,
  tokens_output integer default 0,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  order_id text unique not null,
  amount integer not null,
  credits integer not null,
  payment_method text,
  status text default 'pending' not null,
  midtrans_response jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Edits table
create table public.edits (
  id uuid default gen_random_uuid() primary key,
  website_id uuid references public.websites(id) on delete cascade,
  edit_prompt text not null,
  html_before text,
  html_after text not null,
  tokens_used integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.websites enable row level security;
alter table public.transactions enable row level security;
alter table public.edits enable row level security;

-- Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view own websites" on public.websites
  for select using (auth.uid() = user_id);

create policy "Users can insert own websites" on public.websites
  for insert with check (auth.uid() = user_id);

create policy "Public websites are viewable" on public.websites
  for select using (is_public = true);

create policy "Users can view own transactions" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Users can view own edits" on public.edits
  for select using (
    exists (
      select 1 from public.websites
      where websites.id = edits.website_id
      and websites.user_id = auth.uid()
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 1);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes
create index idx_websites_user_id on public.websites(user_id);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_order_id on public.transactions(order_id);
create index idx_edits_website_id on public.edits(website_id);
