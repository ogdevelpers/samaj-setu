-- Optional starter data. Edit the chapters to match your real places, then run once.
insert into public.chapters (name, state, district, area) values
  ('Jaipur - Sanganer', 'Rajasthan', 'Jaipur', 'Sanganer'),
  ('Jaipur - Mansarovar', 'Rajasthan', 'Jaipur', 'Mansarovar'),
  ('Indore', 'Madhya Pradesh', 'Indore', 'Indore'),
  ('Surat', 'Gujarat', 'Surat', 'Surat');

-- Yearly dues per member (change the amount any time in Admin > Finance)
insert into public.fee_years (fy, per_member) values ('2026-27', 1000) on conflict do nothing;

insert into public.scholarships (title, description, amount, deadline) values
  ('Class 10 to 12 merit', 'For students scoring above 80% in board exams.', 5000, '2026-11-30'),
  ('Higher education support', 'Engineering, medical, commerce and other degree courses.', 15000, '2026-11-30');

-- After you sign up on the website, make yourself the first admin:
--   update public.profiles set role = 'admin' where email = 'YOUR-EMAIL@example.com';
