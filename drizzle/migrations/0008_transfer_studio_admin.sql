delete from public.user_roles where user_id = '459b2da8-40e2-4eae-877f-52bd9f358181';
insert into public.user_roles (user_id, role) values ('8949f895-6e4c-404b-a704-452b7d912c2c', 'admin')
on conflict (user_id, role) do nothing;