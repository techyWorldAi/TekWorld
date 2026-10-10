# TekWorld

TekWorld is a React, TypeScript and Vite website backed by Firebase Authentication, Cloud Firestore and Cloud Storage for administrator-managed content.

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

Enable Firebase Authentication Email/Password, create Firestore and Storage, provision the administrator UID, and deploy the checked-in rules. The manual setup and permission model are documented in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Content

The CMS provides project and service editing, homepage messaging and featured projects, image uploads, enquiries, and publishing controls. Only published projects and services are exposed to public readers. Existing Supabase content is preserved; migrate and verify it before retiring the legacy source.

Project URLs use `/work/{slug}`. Production builds include a GitHub Pages SPA fallback for direct route access and page refresh.
