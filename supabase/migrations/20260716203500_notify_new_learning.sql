create or replace function public.notify_interpreters_of_published_learning()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  should_notify boolean := false;
begin
  if tg_op = 'INSERT' then
    should_notify := new.is_published;
  else
    should_notify := new.is_published and old.is_published is distinct from true;
  end if;

  if should_notify then
    insert into public.notifications (
      recipient_clerk_user_id,
      category,
      title,
      body,
      section,
      related_type,
      related_id
    )
    select
      interpreter.clerk_user_id,
      'training',
      'New learning available',
      new.title,
      'learning',
      'training_course',
      new.id
    from public.interpreters as interpreter
    where interpreter.clerk_user_id is not null
      and coalesce(interpreter.roster_status, '') <> 'removed';
  end if;

  return new;
end;
$$;

drop trigger if exists notify_interpreters_of_published_learning_trigger on public.training_courses;

create trigger notify_interpreters_of_published_learning_trigger
after insert or update of is_published
on public.training_courses
for each row
execute function public.notify_interpreters_of_published_learning();
