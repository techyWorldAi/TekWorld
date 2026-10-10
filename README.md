# TekWorld

TekWorld is a React, TypeScript and Vite website backed by Firebase Authentication and Cloud Firestore for administrator-managed content. Firebase Storage is optional; image uploads are temporarily unavailable while the CMS accepts existing image URLs.

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

Create an ignored `.env.local` file using the keys in `.env.example`. Firebase web-app settings are public client configuration; never put service-account credentials or Admin SDK secrets in the frontend.

## Firebase CMS

The admin panel opens with `Ctrl + Shift + A` or the discreet footer control. Sign-in uses Firebase Email/Password. Authentication alone does not grant admin rights: an authorized administrator UID must have an `admins/{uid}` Firestore document with `enabled: true`. Create this record through Firebase Console or a trusted server-side process; the website cannot grant admin privileges.

Enable Firebase Authentication Email/Password, provision the administrator UID in the existing Firestore database with ID `default`, and deploy its checked-in rules with `firebase deploy --only firestore:default --project tekworld-d57ca`. Storage and `VITE_FIREBASE_STORAGE_BUCKET` are optional until image uploads are required. The manual setup and permission model are documented in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Content

The CMS provides project, service and company/logo editing, homepage messaging and featured projects, enquiries, and publishing controls. Use a public image URL for project, service, and company imagery; image uploads are temporarily unavailable. Only published projects, services and companies are exposed to public readers. Existing Supabase content is preserved; migrate and verify it before retiring the legacy source.

Project URLs use `/work/{slug}`. Production builds include a GitHub Pages SPA fallback for direct route access and page refresh.
