# Property Marketplace MVP

A minimal Next.js real-estate marketplace with four account types — **Admin**, **Buyer**,
**Property Owner**, and **Agent**. No styling, no header/footer — just the functional pieces.

## The flow

There are four account types: **Buyer**, **Property Owner**, **Agent** (lists on behalf of
someone else), and **Admin**. Owner and Agent share the same listing/review/moderation flow below
— the one difference is that an Agent must record who they're representing on every listing they
submit (name, plus an optional contact), since they aren't the property's actual owner.

1. An **Owner** or **Agent** registers/logs in and lists a property (title, description, location,
   type, price, bedrooms/bathrooms, acreage, image URL — all from the dashboard). An Agent's form
   additionally requires **"Representing (owner's name)"**.
1b. Right after a listing is created, they land on that listing's **Supporting Documents** page to
   upload proof of ownership/authority — one or more files (PDF, JPG, PNG, WEBP, DOC, DOCX; 10MB
   max each), each optionally tagged with a document type (Title Deed, Official Search, Ownership
   Document, Sale Agreement, Authorization Letter, or Other). This isn't required to submit the
   listing itself, but the page is always reachable afterward too — from "Your listings" on the
   dashboard, or from the listing's own detail page (see "Supporting documents" below for the
   full detail on access and storage).
2. The listing is created with `status: PENDING`, and every **Admin** gets a notification.
3. An **Admin** reviews pending listings on their dashboard and can:
   - **Approve** it (goes live, marked Verified by default)
   - **Reject** it, optionally with a reason
   - **Request changes** — requires a note explaining what's missing or needs fixing; the listing
     moves to `CHANGES_REQUESTED` and sits with the lister until they act on it
4. The lister gets a notification with the outcome, including the admin's note if changes were
   requested or it was rejected.
5. If a listing is `PENDING` (never reviewed), `CHANGES_REQUESTED`, or `REJECTED`, the lister can
   **edit and resubmit** it from their dashboard (or the listing's own page). Resubmitting a
   `CHANGES_REQUESTED`/`REJECTED` listing clears the admin's note, sets it back to `PENDING`, and
   notifies every admin it needs another look. Once a listing is `APPROVED`, this edit page is no
   longer available — there's no "edit after publish" flow in this MVP.
6. Approved listings appear publicly on the **homepage** — no login required to browse or search.
   Each one shows whether it was listed by the Property Owner or an Agent, and who the Agent is
   representing if applicable.
7. A **Buyer** can view any approved listing, **save** it to their dashboard (from either the
   homepage list or the listing's own page), and send an **enquiry** — but it goes to an admin
   for review first, not straight to the lister. It sits as `PENDING` until an admin approves it
   (only then does the lister get notified and see it) or rejects it (the buyer is notified
   instead). The buyer can track this on their dashboard under "Your enquiries."
7b. Whoever listed a property (Owner or Agent) can mark it **Available**, **Reserved**, **Sold**,
   or **Rented** at any time — from "Your listings" on the dashboard or right on the listing's own
   page. This `availabilityStatus` is completely separate from the admin review `status`
   (Pending/Approved/etc.) — changing it never resets a listing back to Pending or affects its
   Verified tag, unlike editing the listing's actual details. An Admin can also set this directly
   (from "All listings"), which notifies the lister; the lister changing their own listing doesn't
   notify anyone, since they already know. Marking something **Sold** or **Rented** doesn't hide
   the listing — it still shows on the homepage with that badge — but it does stop new enquiries:
   a buyer sees a message explaining it's no longer accepting them instead of the enquiry form,
   enforced both in the UI and server-side. The homepage search can also filter by availability.
8. From the **All listings** section of their dashboard, an Admin can independently:
   - Toggle a listing's **Verified / Not Verified** tag at any time (approving a pending listing
     sets it to Verified by default, but this can be changed afterwards without un-publishing it)
   - **Feature** or unfeature a listing — featured listings sort to the top of the homepage
   - **Show contact to public** / hide it again — off by default for every listing. When off, a
     buyer sees the listing details but no phone number, and has to go through the enquiry system
     to reach the lister; when on, the lister's phone shows directly on that listing's public
     page and its row on the homepage. This is per-listing, not per-user — the same lister could
     have one listing with contact shown and another without.
   - Set its **availability** (Available/Reserved/Sold/Rented), same as the lister can — see 7b.
   - **Delete** a listing entirely (its enquiries and saves are removed with it; any notifications
     that referenced it keep their text but lose the link)
   Each of these notifies the lister of the change.
9. The **All listings** section can also be **filtered by status** (Pending / Approved / Changes
   requested / Rejected) and **searched by the lister's name or phone number** — handy once
   there are enough listings that scrolling through everything isn't practical. Owners and Agents
   must give a phone number when registering (buyers and admins can leave it blank); anyone can
   add or update theirs later from a small form at the top of their dashboard. Wherever a phone
   number is collected — registration, the Google `/select-role` flow, or updating it later — it
   must be a complete, valid Kenyan number in one of two forms: `0743454334` or `+254743454334`.
   Partial input (a few digits, a wrong-length number) is rejected both client-side (immediate
   feedback via the input's `pattern` and an explicit check) and server-side (`lib/phoneValidation.ts`,
   shared by every endpoint that touches `phone` so the rule can't drift out of sync between them).
10. Every listing tracks **views** (incremented each time someone other than the lister/an admin
    opens its detail page — so checking your own listing doesn't inflate its own count) and
    **saves** (a live count of `SavedProperty` rows, i.e. how many buyers currently have it
    saved — this drops if someone unsaves it, since it reflects the present, not a running
    lifetime total). Both are visible to the lister on "Your listings," to admins in "All
    listings," and — for view count and save count together — right on the listing's own public
    page.
11. From "Manage users" on their dashboard, an Admin can **suspend** (and unsuspend), **delete**,
    or **change the role** of any non-admin account:
    - **Suspend** blocks new sign-ins immediately (both email/password and Google), and anyone
      already logged in gets caught on their next dashboard visit, which fetches their status
      fresh from the database and shows a blocked screen instead of the usual dashboard. A
      suspended lister's approved listings also disappear from the public homepage and their own
      detail page (admins can still see them for moderation).
    - **Delete** permanently removes the account along with everything tied to it — their
      listings, enquiries, saved properties, and notifications — via cascading deletes at the
      database level.
    - **Change role** reassigns someone between Buyer / Property Owner / Agent — mainly useful for
      migrating any old accounts that predate the Owner/Agent split (see below).
    - **Verify** / unverify — a separate, account-level "Verified" badge for Property Owner and
      Agent accounts specifically (Buyers and Admins don't have this option; it's about vouching
      for a lister's identity/legitimacy, not applicable to a buyer browsing listings). This is
      distinct from a *listing's* own Verified tag (which lives on the property, set when a
      listing is approved and independently toggleable afterward) — an account can be a Verified
      Agent while a specific listing of theirs is still Not Verified, or vice versa. When set, it
      shows as a "Verified Owner"/"Verified Agent" badge next to their name on the homepage, the
      listing's own page, and the admin's review views; the lister sees their own status at the
      top of their dashboard.
    - None of these can be used on your own account or on another admin's account, as a
      safeguard against accidental lockouts — see the Admin accounts section for why.
    - "Manage users" can also be **filtered by role** and **searched by name, email, or phone** —
      same independent-filter pattern as the listings section above (searching clears any role
      filter and vice versa), so it stays usable once there are a lot of accounts.

## Property Owner vs. Agent

These used to be a single "Seller" role; they're now split because an agent selling on someone
else's behalf is a meaningfully different situation from an owner selling their own property —
buyers and admins should be able to tell the difference, and an agent needs to say who they're
representing.

Both roles can do exactly the same things (list, edit, view enquiries, etc.) — the only functional
difference is that an Agent's listing form requires a **"Representing (owner's name)"** field
(with an optional contact), which is shown alongside the listing everywhere it appears (homepage,
detail page, admin review queue, admin's "All listings").

If you have existing accounts from before this split (with the old `SELLER` role), they'll need to
be reassigned — use **"Change role"** in the admin's "Manage users" section to move each one to
either Property Owner or Agent, whichever is accurate.

## Listing fields and validation

The listing form enforces practical bounds instead of accepting anything, both client-side
(so mistakes are caught immediately) and server-side (so the bounds can't be bypassed by calling
the API directly). All of these live in `lib/propertyConstants.ts`:

- **Price**: minimum KSh 10,000, maximum KSh 10,000,000,000.
- **Title**: 5–150 characters. **Description**: 20–5000 characters (long enough to actually say
  something). **Location**: at least 3 characters.
- **Bedrooms / Bathrooms**: 0–50 each. **Acreage**: greater than 0, up to 100,000.
- **Property type**: House / Apartment / Land / Commercial / **Other**. Selecting "Other" makes a
  "Please specify property type" field appear and become required — you can't submit "Other" with
  nothing behind it. That value (`propertyTypeOther`) is shown everywhere the type normally would
  be, e.g. "Other (Boathouse)".
- **Photo**: **required**, not optional — a real file upload (JPEG/PNG/WEBP, max 5MB), not a URL
  field. Stored under `public/uploads/properties/<listing-id>/` locally, or as a **public** Vercel
  Blob object in production (see "Deploying to Vercel" below) — either way it's directly usable as
  an `<img src>`, shown on both the homepage listing rows and the detail page, since — unlike
  supporting documents — a listing photo is meant to be public. Enforced both client-side (the
  form won't submit without one) and server-side (the API rejects a listing with no photo).
  Editing a listing lets you replace the photo — uploading a new one deletes the old file/blob —
  but there's no way to remove it down to nothing, since it's mandatory. Any listing created
  before this rule (with no photo at all) will be required to add one the next time it's edited.

## Supporting documents

Owners and Agents can upload one or more files per listing — proof of ownership, a sale
agreement, an agent's authorization letter, and so on — from that listing's **Supporting
Documents** page (`/properties/[id]/documents`), reachable right after submitting a listing, or
any time afterward from "Your listings" or the listing's own detail page.

- **File types**: PDF, JPG, PNG, WEBP, DOC, DOCX. **Size limit**: 10MB per file, 10 files per
  upload batch (you can upload more than once).
- **Document type** is optional — pick one of Title Deed / Official Search / Ownership Document /
  Sale Agreement / Authorization Letter / Agency Management Agreement / Agency Company Document /
  Agent License / Certification / Other, or leave it unspecified. It applies to every file in
  that particular upload (upload again with a different type if you need to mix types). The list
  covers both owner-side proof (title deed, official search) and agent-side proof (authorization
  letter, agency agreement, agent license) — an agent doesn't always have the owner's own
  paperwork in hand, so they can substitute their own credentials instead. Either role can pick
  from the full list; it's not restricted by role. The authoritative list lives in
  `lib/documentTypes.ts` if you want to add more.
- **Storage**: locally, files are saved to a local `uploads/` folder at the project root —
  deliberately *not* under `public/`, so they can't be fetched by guessing a URL. In production
  (when `BLOB_READ_WRITE_TOKEN` is set — see "Deploying to Vercel" below), they're stored as
  **private** Vercel Blob objects instead, which are genuinely access-gated by Vercel's SDK, not
  just an obscure public URL. Either way, files are only ever served through an authenticated API
  route (`/api/documents/[id]`) that checks the requester is either the listing's own lister or an
  admin, and the actual storage location (local path or private blob) is never exposed to the
  client — the route fetches the bytes server-side and streams them back. Buyers and the general
  public never see these, even for approved/public listings — they're for verification, not
  marketing photos (that's what the listing's `imageUrl` field is for).
- **Access**: only the lister who owns the listing can upload or delete its documents; admins can
  view and download (to actually do the verification the listing needs) but not upload or delete.
- **Deleting a listing** removes its documents' database records too (cascading delete), but the
  underlying files/blobs themselves are only cleaned up when deleted individually beforehand —
  deleting the whole listing doesn't currently sweep its stored files. Harmless (an orphaned
  file/blob, no dangling reference in the app), but worth knowing if storage usage matters.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your `.env` (copy `.env.example` — on Windows use `copy` instead of `cp`, or use
   PowerShell's `Copy-Item`):

   - `DATABASE_URL` / `DIRECT_URL` — a Postgres database. For local development without setting
     up Postgres yourself, a free hosted one (Neon, Supabase) works fine and is often the path of
     least resistance — copy both the pooled and direct connection strings it gives you. If you'd
     rather run Postgres locally, point both at the same local instance.
   - `NEXTAUTH_SECRET` — any long random string (e.g. generate one with
     `openssl rand -base64 32`, or in PowerShell:
     `[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))`).
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — see the Google sign-in section below. Leave
     blank if you only want email/password login for now.
   - `SMTP_*` / `EMAIL_FROM` and `BLOB_READ_WRITE_TOKEN` — both optional for local dev; see "Real
     email sending" and "Deploying to Vercel" below.

3. Create the database tables:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Deploying to Vercel

The app is built to deploy cleanly to Vercel via GitHub, but two things needed real
infrastructure instead of the local-machine defaults, since Vercel's serverless functions have no
persistent filesystem between requests or deployments:

- **Database**: switched from a local SQLite file to Postgres (`prisma/schema.prisma`'s
  `datasource` block). Any hosted Postgres works — Neon, Supabase, and Vercel Postgres all have
  free tiers. You'll get two connection strings: a **pooled** one (`DATABASE_URL`, used for
  normal queries — required on serverless, since each request may get a fresh connection) and a
  **direct/unpooled** one (`DIRECT_URL`, used only for running migrations, since most connection
  poolers don't support the prepared statements Prisma Migrate needs).
- **File storage** (property photos + supporting documents): both `lib/propertyImageStorage.ts`
  and `lib/documentStorage.ts` check for `BLOB_READ_WRITE_TOKEN` at runtime. If it's set, they use
  [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) instead of local disk — property
  photos as **public** blobs (they're meant to be public anyway), supporting documents as
  **private** blobs (genuinely access-gated by Vercel's SDK, not just an obscure public URL —
  they're still only ever served through the authenticated `/api/documents/[id]` route, which
  fetches the private blob server-side and streams it back, so the actual blob URL is never
  exposed to the client). If the token isn't set, both fall back to local disk — so local
  development still works with zero setup.

Steps:

1. **Push to GitHub**, then import the repo in Vercel as a new project.
2. **Set up Postgres**: create a database with Neon, Supabase, or Vercel Postgres (from the
   Storage tab in your Vercel project), and copy its pooled + direct connection strings.
3. **Set up Blob storage**: in your Vercel project → Storage → Create Database → Blob. Once
   created and connected to the project, Vercel automatically injects `BLOB_READ_WRITE_TOKEN` into
   your deployment's environment — you don't need to copy/paste it yourself.
4. **Set the rest of the environment variables** in Project Settings → Environment Variables:
   `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production domain, e.g.
   `https://yourapp.vercel.app`), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` if using Google
   sign-in, and `SMTP_*`/`EMAIL_FROM` if you want real email instead of the on-screen fallback
   (see "Real email sending" below — the fallback works fine on Vercel too, since it's
   database-driven, not disk-driven, but isn't what you want for real users).
5. **Update the Google OAuth redirect URI** (if using Google sign-in) to add your production
   callback: `https://yourapp.vercel.app/api/auth/callback/google`, alongside the localhost one —
   see the Google sign-in section below.
6. **Run the initial migration against your production database** before or right after the
   first deploy:
   ```bash
   DATABASE_URL="<your pooled url>" DIRECT_URL="<your direct url>" npx prisma migrate deploy
   ```
   (`migrate deploy` applies existing migrations without prompting or generating new ones — the
   right command for a production database, as opposed to `migrate dev` which is for local
   development.)
7. **Create your admin account(s)** the same way as local — `scripts/create-admin.js` — but
   pointed at the production database via the same env vars as step 6, since that script still
   needs direct database access and isn't a web endpoint.
8. Deploy. Vercel will run `npm install` (which runs `prisma generate` via `postinstall`) and
   `next build` automatically.

## Admin accounts

There's no "Admin" option on the registration form or the Google sign-in role picker — letting
anyone self-register as an admin would be a serious hole, so it's deliberately not exposed as a
public choice. With only 2–3 admins expected, the right approach is to create/promote those
specific accounts yourself, directly against the database, using the included script:

```bash
# Promote someone who already registered as a Buyer, Owner, or Agent:
npm run create-admin -- someone@example.com

# Or create a brand new admin account from scratch:
npm run create-admin -- someone@example.com "Full Name" "a-strong-password"
```

This only works if you're running it yourself with access to `.env`/the database — it's a local
script (`scripts/create-admin.js`), not a web endpoint, so it can't be reached or abused by anyone
using the site. A newly created admin account is marked as already email-verified, so they can log
in immediately.

## Data model

- **User** — `role` is a plain `String` (`ADMIN` / `BUYER` / `OWNER` / `AGENT`), not a native
  Postgres `enum`. This was originally a SQLite limitation (no enum support there); kept as a
  string after the Postgres switch too, since the app already validates it in the API routes and
  converting now would touch a lot of code for no functional benefit.
- **Property** — `propertyType` (`HOUSE` / `APARTMENT` / `LAND` / `COMMERCIAL`), `listingType`
  (`SALE` / `RENT`), `status` (`PENDING` / `APPROVED` / `REJECTED` / `CHANGES_REQUESTED`), plus
  price, bedrooms, bathrooms, acreage, an optional image URL, a link to whoever listed it
  (`seller`/`sellerId` — kept as the internal field name for both Owners and Agents to minimize
  churn), and `representingName`/`representingContact`, which are only set on Agent listings.
- **Enquiry** — a buyer's message about a specific property, linked to both.
- **SavedProperty** — a buyer/property join table (one row per save; unique per buyer+property).
- **Notification** — sender, receiver, message, and an optional link to the `Property` it's about.
  Used for: new listing submitted (to admins), listing approved/rejected (to seller), and buyer
  enquiries (to seller).

## Google sign-in setup

Google OAuth works fine on `localhost` — it does **not** need to be hosted anywhere.

1. Go to https://console.cloud.google.com/apis/credentials for your project.
2. If prompted, configure the **OAuth consent screen** first: External user type, fill in app
   name and support email, and — while in "Testing" mode — add your own Google account under
   **Test users** (otherwise Google will block your own sign-in).
3. Click **+ Create Credentials → OAuth client ID**, application type **Web application**.
4. Authorized JavaScript origin: `http://localhost:3000`
5. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the generated Client ID and Client Secret into `.env` as `GOOGLE_CLIENT_ID` /
   `GOOGLE_CLIENT_SECRET`, then restart `npm run dev` (env vars only load on startup).

Google sign-ups don't have a role yet, so they land on `/select-role` once to pick
Buyer/Property Owner/Agent before reaching the dashboard (Admin isn't selectable there either —
see "Admin accounts" above).

## Troubleshooting

**"Something went wrong" when creating an account or listing a property**

Almost always means the database tables don't exist yet, or `.env` is missing/misnamed. Run, in
order:

```bash
npx prisma migrate dev --name init
npm run dev
```

If you changed the schema after already running a migration once, run
`npx prisma migrate dev --name <describe-the-change>` again — it updates the existing database in
place without wiping your data.

On Windows, double check the file is actually named `.env` and not `.env.txt` (Explorer hides
extensions by default) — run `dir /a` in the project folder to check.

**"Sign up with Google" does nothing**

See the Google sign-in setup section above — this is virtually always a missing/misconfigured
Client ID, redirect URI, or test-user entry, not a hosting requirement.

**Deployed to Vercel and getting database errors**

Check that `DATABASE_URL` and `DIRECT_URL` are set correctly in Vercel's environment variables
and that you've run `npx prisma migrate deploy` against the production database (step 6 in
"Deploying to Vercel" above) — a fresh Postgres database has no tables until that's done, same
underlying issue as the SQLite version of this problem, just a different fix.

## Email verification

Registering with email/password requires verifying that address before the dashboard is usable.
See "Real email sending" below for how the link actually reaches you — either by real email if
configured, or shown directly on screen if not. A "Resend verification link" button is on the
dashboard if you missed it or the link expired (24 hours).

Google sign-ins skip this — Google has already verified that address, so those accounts are
marked verified automatically.

If a database migration wiped your test data and you're stuck on the "verify your email" screen
with no way to get a link, sign in again and click "Resend verification link" from the dashboard.

## Password reset

From the login page, "Forgot your password?" leads to a form where you enter your email. If an
account with that email exists and has a password (Google-only accounts don't have one to reset),
a reset link is sent — again, either by real email or shown on screen, same as above. The link
expires after 1 hour and can only be used once.

The response message is intentionally the same whether or not the email is registered, so the
page itself doesn't reveal which emails have accounts. The one exception is the on-screen
fallback link (when SMTP isn't configured) — showing it directly does confirm the account exists,
which is fine for local testing but is a reason to configure real email before any real
deployment.

## Real email sending

By default, no real email is sent — verification and password reset links are shown directly on
the page instead (clearly labeled as such). To send real emails instead, fill in these five
variables in `.env`:

```
SMTP_HOST="..."
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."
EMAIL_FROM="Notify App <no-reply@yourdomain.com>"
```

Any standard SMTP provider works. A few options:

- **Gmail** (fine for testing, not for real volume): `SMTP_HOST="smtp.gmail.com"`, `SMTP_PORT="587"`,
  `SMTP_USER` = your Gmail address, `SMTP_PASSWORD` = a 16-character
  [App Password](https://myaccount.google.com/apppasswords) (requires 2-Step Verification enabled
  — your normal Gmail password won't work here).
- **Mailtrap** (recommended for local development): create a free sandbox inbox at
  https://mailtrap.io — it catches all outgoing mail in a test inbox instead of sending it
  anywhere real, so you can safely test the full flow without spamming real addresses. It gives
  you ready-to-paste `SMTP_HOST`/`PORT`/`USER`/`PASSWORD` values.
- **Resend, Postmark, SendGrid, etc.** — any of these work too; use the SMTP credentials they
  provide (not their HTTP API, since this app uses plain SMTP via `nodemailer`).

Leave all five blank to keep using the on-screen fallback — the app works either way; restart
`npm run dev` after changing `.env`.

## Notes / next steps for a real product

- Passwords use bcrypt with a minimum length of 6 characters, but there's no rate limiting on
  login/register/forgot-password (a real product should add this to prevent brute forcing and
  password-reset spam).
- Notifications and enquiries aren't real-time — pages reload via `router.refresh()` after an
  action. Add polling, SSE, or a websocket if you want live updates.
- Database and file storage now both support real hosted infrastructure for production
  (Postgres, Vercel Blob) — see "Deploying to Vercel" above. File storage still has a local-disk
  fallback for local development when `BLOB_READ_WRITE_TOKEN` isn't set; the database is Postgres
  either way (local or hosted), per the Setup section.
