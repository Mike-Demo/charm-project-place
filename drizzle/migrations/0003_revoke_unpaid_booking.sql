revoke execute on function public.book_appointment(text, text, text, date, text) from anon, authenticated, public;
revoke execute on function public.book_appointment(text, text, text, date, text, text) from anon, authenticated, public;
comment on function public.book_appointment(text, text, text, date, text, text) is 'DEPRECATED: replaced by create_pending_appointment + payment webhook';