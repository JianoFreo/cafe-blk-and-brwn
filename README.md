# Café BLK & BRWN: website + editor

A React website whose **every word, photo, menu item, branch and gallery image is edited from a private
editor page**, backed by one Express server (the same server powers the website and the editor).

```
frontend/   React 19 + Vite + TypeScript   the public website  AND  the editor (lazy-loaded, own bundle)
backend/    Express + TypeScript           /api/public  (website)   /api/auth   /api/admin (editor)
            Neon Postgres · Cloudinary · JWT
```

The website **starts empty**. Nothing is hard-coded: sections appear as you fill them in.
The look and every animation are exactly the approved design.

---

## 1. Set up (about 10 minutes)

You need: **Node 20+**, a free **Neon** database, a free **Cloudinary** account.

1. **Install**
   ```bash
   npm run install:all
   ```
2. **Backend settings**: copy `backend/.env.example` to `backend/.env` and fill it in:
   | Setting | Where to get it |
   |---|---|
   | `DATABASE_URL` | neon.tech → create a project → copy the connection string |
   | `JWT_SECRET` | any long random text (16+ characters) |
   | `ADMIN_USERNAME`, `ADMIN_PASSWORD` | your editor login (created once, on the first start) |
   | `CLOUDINARY_CLOUD_NAME`, `_API_KEY`, `_API_SECRET` | cloudinary.com → Dashboard |

   *No Neon account yet?* Use `DATABASE_URL=pglite://./.data` to try everything on your own computer.
3. **Run it**
   ```bash
   npm run dev
   ```
   - Website: http://localhost:5173
   - Editor: http://localhost:5173/admin  (sign in with the username and password from `.env`)

   The tables are created automatically on first start.

## 2. The editor

Open **`/admin`** by typing it into the address bar. **Nothing on the website links to it.**
To make the address your own secret, set `VITE_ADMIN_PATH=/something-only-you-know` in `frontend/.env`
(copy `frontend/.env.example`) before building.

| Editor section | What it controls |
|---|---|
| **Site settings** | Brand name, tagline, logo (also the browser-tab icon and map pin), phone, email, Facebook/Instagram, footer |
| **Home / About / Menu / Branches / Gallery / Contact / Reserve / Status / Privacy** | Every heading, paragraph, list, number and photo on that page |
| **Menu items** | Categories (the menu tabs) and items: photo, price, note, badge, visibility, "show on the home page" and its position |
| **Branches** | Name, photo, area, region, hours (any rows), note, Facebook link, directions link and **map location** (click the map to place the pin) |
| **Gallery** | Upload many photos at once, caption, category, reorder, "show on the home page strips" |
| **Reservations** | Requests from the website: confirm, complete, cancel, delete |
| **Messages** | Contact-form messages: read, reply by email, delete |
| **Password** | Change your password |

Photos are uploaded straight to **Cloudinary** (stored there, served optimised). Replacing or deleting a photo
removes the old one from Cloudinary.

### Start with the original content (optional)
The site starts empty on purpose. If you want the original café content (copy, 81 menu items with prices,
7 branches with hours and locations, 23 gallery photos) loaded as a starting point:

```bash
npm run seed          # uploads backend/seed/assets to Cloudinary, then fills the database
npm run seed:local    # no Cloudinary: serves the photos from the server (demo only)
```
Add `-- --force` to replace existing content. Reservations, messages and users are never touched.
You can delete `backend/seed/` once you no longer need it.

## 3. Put it online (one server)

```bash
npm run build     # builds the React app and the API
npm start         # one Node server: website + editor + API
```
`npm start` serves everything from the same address (the API at `/api`, the website and `/admin` from the build).
On Render / Railway / similar: build command `npm run install:all && npm run build`, start command `npm start`,
and add the same variables as `backend/.env` in the host's dashboard. Set `NODE_ENV=production`.

## 4. How it is organised

```
backend/src
  server.ts                      Express app, routes, serves the built React app
  config/        env.ts db.ts (Neon + schema) cloudinary.ts pages.ts
  middlewares/   auth (JWT) · admin (role) · multer (image upload) · rateLimit
  routes/        public.route.ts   auth.route.ts   admin.route.ts
  controllers/   public|auth|admin / getRequests · postRequests · updateRequests · deleteRequest
  utils/         generateId.ts (BR-26-10-001 style ids) · images.ts (Cloudinary) · validate.ts
  seed/          optional starter content loader

frontend/src
  App.tsx                        routes (the editor is lazy-loaded)
  site/                          the public website
    SiteLayout.tsx SiteContext.tsx Transition.tsx
    components/  Header Footer Split Marquee Counter Cup Preloader Tabs …
    pages/       Home About Menu Branches Gallery Contact Reserve Track Privacy
  motion/        engine.ts (scroll scenes, reveals, tilt, parallax) · hooks.ts
  admin/         the editor
    contentSchema.ts             ← every editable field of every page (the editor forms are built from this)
    Shell.tsx fields.tsx ui.tsx upload.ts
    pages/       Dashboard PageEditor MenuAdmin BranchesAdmin GalleryAdmin Reservations Inquiries Account
  styles/        the approved stylesheets (unchanged)
```

**Make something else editable:** add the field to `frontend/src/admin/contentSchema.ts`, then read it in the page
component with `usePage("home").your_key`. No backend change needed.

## 5. API at a glance

| | Who | Endpoints |
|---|---|---|
| `/api/public` | everyone | `GET content · menu · branches · gallery` · `POST reservations · inquiries` · `GET reservations/:reference` |
| `/api/auth` | sign-in | `POST login` · `GET me` · `PUT password` |
| `/api/admin` | signed-in administrators only | pages, menu categories/items, branches, gallery, upload, reorder, reservations, inquiries |

## 6. Good to know

- **Security:** passwords are hashed (bcrypt); every `/api/admin` call needs a valid token; sign-in is rate-limited;
  uploads must be images ≤ 10 MB; saved links must be `http(s)`; the website's forms have a hidden bot trap and rate limits.
  Remove `ADMIN_PASSWORD` from `.env` after the first start.
- **Reservation status page:** a guest enters their reference (e.g. `BNB-1012-001`, shown after they reserve).
  Only first name, branch, date, time, guests and status are shown, never phone or email.
- **"Reduce motion"** and no-JavaScript visitors get a calm, fully readable version of every page.
- The old staff demo page was replaced by the real editor (Reservations and Messages).
