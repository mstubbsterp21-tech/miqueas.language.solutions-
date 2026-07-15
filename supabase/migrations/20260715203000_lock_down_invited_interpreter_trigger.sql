revoke execute on function public.claim_invited_interpreter_profile() from public;
revoke execute on function public.claim_invited_interpreter_profile() from anon;
revoke execute on function public.claim_invited_interpreter_profile() from authenticated;
grant execute on function public.claim_invited_interpreter_profile() to service_role;
