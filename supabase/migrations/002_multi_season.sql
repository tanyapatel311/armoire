-- Allow storing multiple seasons as comma-separated values (e.g., "spring,summer")
alter table public.clothing_items drop constraint if exists clothing_items_season_check;
