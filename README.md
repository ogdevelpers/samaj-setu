# Shri Dasha Vaishnav Porwad Samaj portal

Members, families, family tree, events, gallery, dues and contributions. Hindi first, English available.
Next.js 15 on Vercel, Supabase (Postgres, login, private file storage). Runs on free tiers.

## Set up (about 20 minutes)

### 1. Supabase (free)
1. Create a project at supabase.com (choose a region near India, e.g. Mumbai).
2. SQL Editor > New query > paste `supabase/schema.sql` > Run.
   *Already ran an older version?* Run, in order, `supabase/updates/002_admin_setup.sql` and `supabase/updates/003_simple_registration.sql` instead.
3. Project Settings > API: copy the **Project URL** and the **anon public key**.
4. Authentication > Providers > Email: for a small pilot you can switch off "Confirm email" so people can sign in at once.

### 2. Vercel
1. Import the GitHub repository in Vercel (Framework: Next.js, automatic).
2. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_SETUP_CODE` (optional, recommended): a secret word that the first admin must type. Stops a stranger from claiming admin.
3. Deploy, copy the live URL.

### 3. Tell Supabase the live URL
Authentication > URL Configuration: Site URL = your Vercel URL; Redirect URLs: add `https://YOUR-URL/auth/callback`.

### 4. Open the admin console (no SQL needed)
Go to `https://YOUR-URL/admin/login`. While no admin exists it shows **Set up the portal**. Create the first admin account there.
The Overview page then gives a checklist:
1. **Places (chapters)**: optional. Families can register without any place existing; you assign or create the place when you approve them.
2. **Settings**: yearly fee per member and the trust UPI ID.
3. **People & roles**: after a coordinator and a treasurer sign up normally, give them their role and place.
4. **Announcements**: post the first event.

Families use the normal site (`/`). Admins, coordinators and treasurers use `/admin`.

## Roles
| Role | Can do |
|---|---|
| Member | See directory, events, gallery; manage own family; pay dues; contribute |
| Coordinator | Approve families of own chapter, post events and notices, upload photos, approve listings |
| Treasurer | Confirm payments, record cash, expenses, dues status of own chapter |
| Admin | Everything, all places, roles, fee, UPI ID, scholarships |

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
