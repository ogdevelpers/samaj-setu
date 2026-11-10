# Shri Dasha Vaishnav Porwad Samaj portal

Members, families, family tree, events, gallery, dues and contributions. Hindi first, English available.
Next.js 15 on Vercel, Supabase (Postgres, login, private file storage). Runs on free tiers.

## Set up (for non-technical people)

You need two free accounts: **Supabase** (the database) and **Vercel** (the website). Then the website guides you.

1. **Supabase:** create a free project at supabase.com. Note the database password you choose.
2. **Vercel:** import this GitHub repository. Before deploying, add these Environment Variables:

   | Name | Where to find it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
   | `DATABASE_URL` | Supabase → green **Connect** button → **Transaction pooler** string. Replace `[YOUR-PASSWORD]` with your database password |
   | `ADMIN_SETUP_CODE` | Optional. Any secret word you choose. Stops a stranger from becoming admin |

3. Open `https://YOUR-SITE/setup`. It shows three steps and turns each one green:
   **Connect** → **Install the database (one button)** → **Create the admin account**.
4. In Supabase → Authentication → URL Configuration: set Site URL to your website address and add
   `https://YOUR-SITE/auth/callback` as a Redirect URL. (For a small pilot you can also switch off "Confirm email" under Authentication → Providers → Email.)

Once an admin exists, the installer locks itself. You can then delete `DATABASE_URL` from Vercel.

### Two separate doors
- **Members** use the normal site: `/login` and `/signup`.
- **Admin, coordinators and treasurers** use `/admin/login`.

After you create the admin account, the Overview page gives a short checklist (fee and UPI ID, coordinator and treasurer,
first event). Places are optional: families can register without them and you create the place when you approve them.

*Manual option:* instead of the button, you can paste `supabase/schema.sql` into Supabase → SQL Editor. If you installed an
older version, run `supabase/updates/002_admin_setup.sql` then `supabase/updates/003_simple_registration.sql`.

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
