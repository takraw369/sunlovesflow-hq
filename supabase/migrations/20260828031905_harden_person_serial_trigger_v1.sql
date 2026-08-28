revoke all on function public.ensure_person_serial() from public;
revoke all on function public.ensure_person_serial() from anon;
revoke all on function public.ensure_person_serial() from authenticated;
grant execute on function public.ensure_person_serial() to service_role;

comment on function public.ensure_person_serial() is 'Trigger-only helper for automatic person serial assignment; client RPC execution is revoked.';
