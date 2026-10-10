# TekWorld

TekWorld is a React, TypeScript, and Vite website backed by Firebase Authentication and Cloud Firestore for administrator-managed content. CMS image uploads use Cloudinary; Firebase Storage is not used.

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

Copy `.env.example` to the ignored `.env.local` file and enter the Firebase web-app settings and Cloudinary cloud name/unsigned upload preset. Firebase web-app settings and Cloudinary cloud name/preset are browser-visible configuration. Never expose a Firebase service-account credential, Firebase Admin SDK secret, or Cloudinary API secret in the frontend.

## CMS setup

The admin panel opens with `Ctrl + Shift + A` or the discreet footer control. Sign-in uses Firebase Email/Password. Authentication alone does not grant admin rights: the administrator UID must have an `admins/{uid}` Firestore document with `enabled: true`. Provision that document through Firebase Console or a trusted server-side process; the website cannot grant administrator access.

Enable Firebase Authentication Email/Password, then reuse the existing named Cloud Firestore database with ID `default` in project `tekworld-d57ca`. Review and deploy the checked-in rules to that database:

```bash
firebase deploy --only firestore:default --project tekworld-d57ca
```

Cloudinary setup, required environment variables, Firestore collections, and the unsigned-upload security limits are described in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Content and media

The CMS supports Firebase-backed projects, services, companies/logos, homepage messaging and featured projects, and enquiries. Projects are available at `/work/{slug}`; `/work` lists published projects with category filters. Only published content is public. The project editor accepts multiple gallery image uploads; project detail pages automatically cycle through those images and include manual controls. Project covers, galleries, service images, and company logos upload directly to Cloudinary and store their secure URL plus public ID and image metadata in Firestore. The site uses responsive Cloudinary image variants and browser/CDN caching, plus persistent Firestore content caching with a five-minute freshness window. Unsigned Cloudinary uploads are public; the admin browser does not delete Cloudinary assets.

The homepage keeps the existing TekWorld hero and contact messaging by default, including “DIGITAL PRESENCE, REIMAGINED” and “Ready to Bridge the AI Gap?”. Administrators can edit the hero copy and featured projects, choose the theme accent color, and reorder or hide the existing hero, services, work, companies, and contact sections. This is a structured section editor, not a freeform canvas. Service cards now display their configured images, and published companies are shown in their own section even when projects are present.

Existing Supabase records are not modified or deleted. Supabase configuration and browser-side loading have been removed; export and review any legacy content, then import it into Firestore before retiring the old source. Firebase Storage is not required.
