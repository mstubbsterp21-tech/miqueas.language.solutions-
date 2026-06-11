-- Miqueas Language Solutions interpreter portal matching fields
-- Run this once in Supabase SQL Editor after deploying the upgraded portal UI.

alter table public.interpreters
  add column if not exists current_location text,
  add column if not exists preferred_contact_method text,
  add column if not exists state_license_details text,
  add column if not exists years_experience text,
  add column if not exists education_itp text,
  add column if not exists situations_successfully_navigated text,
  add column if not exists challenging_situation_description text,
  add column if not exists assignment_type_preference text,
  add column if not exists willing_to_travel text,
  add column if not exists technical_readiness_confirmed text,
  add column if not exists professional_liability_insurance text,
  add column if not exists comfortable_with_rates text,
  add column if not exists availability_sunday text,
  add column if not exists availability_monday text,
  add column if not exists availability_tuesday text,
  add column if not exists availability_wednesday text,
  add column if not exists availability_thursday text,
  add column if not exists availability_friday text,
  add column if not exists availability_saturday text;
