-- A Taverna - remove legacy aggregated storage
-- Safe to run even when the table does not exist.

drop table if exists public.rpg_data;
