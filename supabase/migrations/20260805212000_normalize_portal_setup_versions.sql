-- Ensure every existing portal profile is tagged with the current setup schema version,
-- including records that were already incomplete before setup v2 was introduced.

update public.interpreters
set setup_version = greatest(coalesce(setup_version, 1), 2),
    updated_at = now()
where setup_version is null or setup_version < 2;

update public.clients
set setup_version = greatest(coalesce(setup_version, 1), 2),
    updated_at = now()
where setup_version is null or setup_version < 2;
