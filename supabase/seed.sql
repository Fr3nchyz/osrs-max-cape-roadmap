-- Seed: ensure a settings row exists for fr3nchy. Methods stay empty (app
-- defaults to index 0 per skill); the user's saved choices overwrite on first save.
insert into public.settings ("user", methods, order_type, hours_per_day)
values ('fr3nchy', '{}'::jsonb, 'efficient', 4)
on conflict ("user") do nothing;
