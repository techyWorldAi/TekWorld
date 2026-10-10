# TekWorld Firebase CMS setup

The application reuses the Firebase web app configured in `src/firebase.ts`. The CMS currently uses Firebase Authentication and Cloud Firestore. Cloud Storage is optional and image uploads are temporarily disabled; no Firebase Admin SDK credentials belong in this frontend.

## One-time Firebase Console setup

1. In Firebase Console, select the project matching `VITE_FIREBASE_PROJECT_ID`.
2. Under **Authentication → Sign-in method**, enable **Email/Password**. Create administrator accounts under **Authentication → Users**.
3. Use the existing Cloud Firestore database whose resource ID is `default` (the resource name is `projects/{projectId}/databases/default`). The application explicitly selects this database. Do not create another database if it already exists. Cloud Storage is not needed for text-based CMS features or existing image URLs, and `VITE_FIREBASE_STORAGE_BUCKET` may remain blank.
4. Copy the UID of each administrator account. As the project owner, create `admins/{uid}` in Firestore with the boolean field `enabled: true`. Do this only in Firebase Console or a trusted server/Admin SDK process. Admins cannot grant themselves access through the website.
5. The database ID is `default` (not `(default)`). The checked-in rules are mapped to this database in `firebase.json`; from the repository root, deploy them with `firebase deploy --only firestore:default --project tekworld-d57ca`. This deploys the current least-privilege rules and indexes to the existing named database. Review the target before deploying. The Storage rules remain checked in and unchanged; do not deploy them until Storage is configured and uploads are intentionally re-enabled.
6. Configure the five required `VITE_FIREBASE_*` values in the hosting provider's build environment, then rebuild and deploy the site. `VITE_FIREBASE_STORAGE_BUCKET` is optional.
7. Sign into the website using the provisioned user's email and password. In **Services**, use **Add existing TekWorld services** to copy the current static service details into Firestore; this operation only creates absent service slugs.

## Data and permissions

- Public users can read published projects, services, companies, and the homepage settings document. Draft content, admin records, and enquiries are not public.
- Public visitors can create contact enquiries only with the expected bounded fields. Only admins can read, update or delete them.
- Only authenticated UIDs with an enabled `admins/{uid}` record may edit CMS content. The client connects to Firestore database ID `default`, and its self-read admin check and CMS access rules must be deployed to that same database. Image uploads are temporarily disabled in the CMS; administrators can enter existing `http` or `https` image URLs for project covers/galleries, services, and company logos.
- Firebase Storage is optional until uploads are needed. Existing Storage security rules remain unchanged in `storage.rules`; when uploads are required, configure the bucket, review the rules, and deploy them separately. This is not required for Firestore-backed text content.
- Project and service document IDs are their unique URL slugs. The CMS rejects an existing slug before saving. Firestore query ordering is applied after retrieval, so no composite index is currently required.
- GitHub Pages deploy builds copy `index.html` to `404.html` so direct project-route refreshes still boot the client application.

## Existing Supabase content

The legacy Supabase database is not changed or deleted. The public compatibility loader can continue to display previously configured company logos and stories while those records are exported and migrated. The Firebase CMS does not provide an automatic Supabase import because safely mapping/exporting an existing private dataset requires its owner to review the source and destination records. Remove the legacy compatibility loader only after the data has been migrated and verified.

## Local development

Copy the five required Firebase web-app settings into an ignored `.env.local` file using the variable names in `.env.example`. Leave `VITE_FIREBASE_STORAGE_BUCKET` empty unless you later configure Storage. Then run `npm install`, `npm run dev`, and `npm run build`. Never commit `.env.local`, service-account JSON, or Admin SDK credentials. The Firestore CMS uses Firebase's no-cost usage allowances; no billing upgrade is needed for text content, subject to current Firebase plan quotas.
