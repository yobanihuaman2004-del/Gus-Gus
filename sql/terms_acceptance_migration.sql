-- GusGus: aceptación obligatoria de documentos en el registro
-- Migración aditiva. No borra ni modifica usuarios existentes.
-- Ejecutar en Supabase SQL Editor después de respaldar la base.

create extension if not exists pgcrypto;

create table if not exists public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  accepted_via text not null default 'signup',
  unique(user_id, terms_version)
);

alter table public.terms_acceptances enable row level security;
drop policy if exists "terms acceptance read self or staff" on public.terms_acceptances;
create policy "terms acceptance read self or staff" on public.terms_acceptances
for select to authenticated
using (user_id=auth.uid());
-- No conceder INSERT/UPDATE/DELETE a authenticated: solo el trigger de Auth escribe.

create or replace function public.gus_handle_new_user()
returns trigger language plpgsql security definer set search_path=public,pg_temp
as $$
begin
  insert into public.profiles(id,name,dni,tel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name','Usuario'),
    new.raw_user_meta_data->>'dni',
    new.raw_user_meta_data->>'tel'
  )
  on conflict (id) do update set name=coalesce(public.profiles.name,excluded.name);

  if new.raw_user_meta_data->>'gusgus_terms_accepted' = 'true'
     and new.raw_user_meta_data->>'gusgus_terms_version' = '1.0.0' then
    insert into public.terms_acceptances(user_id,terms_version,accepted_at,accepted_via)
    values(new.id,'1.0.0',now(),'signup')
    on conflict(user_id,terms_version) do nothing;
  end if;
  return new;
end;
$$;

-- El trigger existente gus_on_auth_user_created ya llama esta función.
-- Si no existe en el proyecto, créalo con:
-- create trigger gus_on_auth_user_created after insert on auth.users
-- for each row execute procedure public.gus_handle_new_user();
