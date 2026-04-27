-- Add laundry tracking
alter table public.clothing_items add column if not exists in_laundry boolean not null default false;
