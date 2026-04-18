-- Add private team notes column expected by the dashboard API.
-- Safe to run multiple times.
-- Run in Supabase SQL Editor if you see: column leads.client_notes does not exist

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_notes TEXT;
