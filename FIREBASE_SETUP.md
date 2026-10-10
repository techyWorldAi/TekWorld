# TekWorld Firebase CMS setup

The application reuses the Firebase web app configured in `src/firebase.ts`. The CMS uses Firebase Authentication, Cloud Firestore and Cloud Storage; no Firebase Admin SDK credentials belong in this frontend.

## One-time Firebase Console setup

1. In Firebase Console, select the project matching `VITE_FIREBASE_PROJECT_ID`.
2. Under **Authentication → Sign-in method**, enable **Email/Password**. Create administrator accounts under **Authentication → Users**.
3. Create a **Cloud Firestore** database in production mode and a **Cloud Storage** bucket. The site's Firebase web config must include `VITE_FIREBASE_STORAGE_BUCKET`.
4. Copy the UID of each administrator account. As the project owner, create `admins/{uid}` in Firestore with the boolean field `enabled: true`. Do this only in Firebase Console or a trusted server/Admin SDK process. Admins cannot grant themselves access through the website.
5. From the repository root, deploy the checked-in Firestore and Storage rules with the Firebase CLI: `firebase deploy --only firestore:rules,firestore:indexes,storage`. Review the selected Firebase project before deploying.
6. Configure the six `VITE_FIREBASE_*` values in the hosting provider's build environment, then rebuild and deploy the site.
7. Sign into the website using the provisioned user's email and password. In **Services**, use **Add existing TekWorld services** to copy the current static service details into Firestore; this operation only creates absent service slugs.

## Data and permissions

- Public users can read published projects/services and the homepage settings document. Draft content, admin records, and enquiries are not public.
- Public visitors can create contact enquiries only with the expected bounded fields. Only admins can read, update or delete them.
- Only authenticated UIDs with an enabled `admins/{uid}` record may edit CMS content or manage media.
- Storage uploads are restricted to image types up to 10 MB under `media/{uid}/`. Public reads allow those images to display on the website; writes/deletes remain admin-only.
- Project and service document IDs are their unique URL slugs. The CMS rejects an existing slug before saving. Firestore query ordering is applied after retrieval, so no composite index is currently required.
- GitHub Pages deploy builds copy `index.html` to `404.html` so direct project-route refreshes still boot the client application.

## Existing Supabase content

The legacy Supabase database is not changed or deleted. The public compatibility loader can continue to display previously configured company logos and stories while those records are exported and migrated. The Firebase CMS does not provide an automatic Supabase import because safely mapping/exporting an existing private dataset requires its owner to review the source and destination records. Remove the legacy compatibility loader only after the data has been migrated and verified.

## Local development

Copy the Firebase web-app settings into an ignored `.env.local` file using the variable names in `.env.example`, then run `npm install`, `npm run dev`, and `npm run build`. Never commit `.env.local`, service-account JSON, or Admin SDK credentials.
