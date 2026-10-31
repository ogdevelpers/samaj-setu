# Shri Dasha Vaishnav Porwad Samaj portal

Members, families, family tree, events, gallery, dues and contributions. Hindi first, English available.
Next.js 15 on Vercel, Supabase (Postgres, login, private file storage). Runs on free tiers.

## Set up (about 20 minutes)

### 1. Supabase (free)
1. Create a project at supabase.com (choose a region near India, e.g. Mumbai).
2. SQL Editor > New query > paste `supabase/schema.sql` > Run.
3. New query > paste `supabase/seed.sql` (edit the chapters first) > Run.
4. Project Settings > API: copy the **Project URL** and the **anon public key**.
5. Authentication > Providers > Email: for a small pilot you can switch off "Confirm email" so people can sign in at once.
   Leave it on if you prefer verified emails.

### 2. Vercel
1. Push this folder to a GitHub repository (private is fine).
2. vercel.com > Add New > Project > import the repository. Framework: Next.js (automatic).
3. Environment variables (Settings > Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_UPI_ID` (the trust's UPI ID)
   - `NEXT_PUBLIC_UPI_NAME` (name shown in the UPI app)
4. Deploy. Copy the live URL.

### 3. Tell Supabase the live URL
Authentication > URL Configuration:
- Site URL: your Vercel URL
- Redirect URLs: add `https://YOUR-URL/auth/callback`

### 4. Make yourself the first admin
Open the live site, sign up, then run in the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'YOUR-EMAIL@example.com';
```

Then in the portal: **Admin > Chapters** (add places), **Finance** (set the yearly fee), **Admin > Roles**
(make a coordinator and treasurer for each chapter).

## Roles
| Role | Can do |
|---|---|
| Member | See directory, events, gallery; manage own family; pay dues; contribute |
| Coordinator | Approve families of own chapter, post events and notices, upload photos, approve listings |
| Treasurer | Confirm payments, record cash, expenses, dues status of own chapter |
| Admin | Everything, all chapters, roles, fees, scholarships |

## Privacy
Rules are enforced in the database (row level security), not only in the pages:
members see only verified families; phone numbers only where the family allowed it; addresses only to the family and
their coordinator; contribution amounts on the board only if the contributor chose to show them.
Photos and payment screenshots are in private buckets and served through short-lived links.

## Local development
```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

## Not included yet
SMS/WhatsApp auto-sending (WhatsApp share and reminder links are included), online payment gateway
(UPI QR with treasurer confirmation is used to keep it free), moving a married daughter between households.
