# John's Car App

An Angular and Firebase application for browsing, searching, filtering, sorting, exporting, and extending an automobile dataset.

Live application: [john-doe-automobile-database.web.app](https://john-doe-automobile-database.web.app)

## Features

- Displays 398 automobile records from Cloud Firestore.
- Searches cars by name and filters them by origin.
- Sorts using dropdown controls or accessible, clickable table headers.
- Supports sorting by name, year, origin, MPG, cylinders, and horsepower.
- Persists search, filter, and sorting preferences in browser storage.
- Exports the complete collection as an importer-compatible CSV backup.
- Allows visitors to browse the collection without signing in.
- Allows an authorised owner to sign in and add a car through a validated form.
- Prevents duplicate cars by giving identical normalized car data the same deterministic document ID.
- Includes loading, error, empty-collection, no-match, authentication, validation, duplicate, and success states.
- Supports local development with the Firebase Authentication and Firestore emulators.
- Provides deterministic, idempotent CSV imports.
- Protects production imports with explicit project confirmation.

## Technology

- Angular 20
- AngularFire
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting
- Firebase Local Emulator Suite
- TypeScript
- Vitest
- Firebase Admin SDK
- Node.js 22

No separate Node.js web server is required. The Angular application communicates directly with Firebase. Node.js is used only for development tools, automated rules tests, and the trusted CSV importer.

## Project structure

```text
src/app/
|-- auth/
|   `-- data-access/       Firebase session state and sign-in operations
`-- cars/
    |-- data-access/       Firestore repository, document mapping and CSV download
    |-- models/            Domain models, validation, identity and transformations
    |-- pages/             Routed pages, sign-in dialog and Add Car form
    `-- state/             Signal-based collection, query and creation state

tools/
|-- firestore-rules/       Firestore security rules integration tests
`-- import-cars/           CSV validation and trusted import tooling
```

The application keeps separate representations for:

- Untrusted CSV rows.
- Validated car domain data.
- Firestore documents.
- UI-ready cars containing document IDs and converted timestamps.

This prevents external data formats from leaking through the rest of the application.

## Prerequisites

- Node.js 22
- npm 10
- A Firebase project with Authentication, Cloud Firestore, and Hosting enabled

Install the exact dependency versions recorded in the lockfile:

```bash
npm ci
```

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if PowerShell command resolution requires it.

## Local development

The development Angular configuration connects automatically to:

- Authentication emulator at `127.0.0.1:9099`.
- Firestore emulator at `127.0.0.1:8080`.
- Emulator UI at `127.0.0.1:4000`.

Start the emulators in one terminal:

```powershell
npm.cmd run firebase:emulators
```

### Create a local owner

Emulator users and production users are separate. Create a local owner through the Emulator UI:

1. Open `http://127.0.0.1:4000`.
2. Open **Authentication** and create an email/password user.
3. Copy the generated user UID.
4. Open **Firestore** and create an `admins` collection.
5. Create a document whose document ID is exactly the copied UID.
6. Add a string field named `role` with the value `owner`.

The application never reads the admin document directly. Firestore security rules use it to authorise car creation.

Emulator data is temporary unless import/export persistence is configured, so the user and matching admin document may need to be recreated after restarting the emulators.

### Load and run the application

Import the CSV into the running Firestore emulator from another terminal:

```powershell
npm.cmd run import:cars -- "<path-to-Automobile.csv>" --emulator
```

Start Angular:

```powershell
npm.cmd start
```

Open `http://localhost:4200`. Visitors can browse immediately. Use **Owner sign in** with the local emulator account to test car creation.

## Adding a car

An authenticated owner can select **Add car** and submit all nine automobile fields. The form validates required values, numeric ranges, whole-number fields, and the supported origins before making a request.

The browser normalizes the submitted data and creates a SHA-256-based document ID in the form `car-` followed by 20 lowercase hexadecimal characters. The same identity algorithm is used by the CSV importer.

Duplicate identity includes all nine normalized fields:

- Name
- MPG
- Cylinders
- Displacement
- Horsepower
- Weight
- Acceleration
- Model year
- Origin

The repository performs the existence check and create operation in a Firestore transaction. If that deterministic document already exists, the operation returns a duplicate-specific message instead of creating another record. Firestore rules also deny replacing existing cars.

## CSV format

The importer expects these headers in this exact order:

```csv
name,mpg,cylinders,displacement,horsepower,weight,acceleration,model_year,origin
```

Optional numeric fields may use `?`, an empty value, `null`, `n/a`, or `na` to represent missing data.

The application's **Export CSV** button produces the same format, allowing an exported backup to be validated and imported again.

## Validate a CSV without writing data

Always perform a dry run first:

```powershell
npm.cmd run import:cars -- "<path-to-csv>" --dry-run
```

Expected output for the supplied dataset:

```text
Rows read: 398
Valid rows: 398
Invalid rows: 0
Dry run complete. No data was written.
```

## Deterministic imports

Each normalized car produces the same deterministic document ID as the Add Car form. Consequently:

- Re-importing the same CSV addresses the same documents.
- Repeated imports do not create duplicates.
- The importer does not delete unrelated documents.
- An expanded CSV can add future records.

Writes are sent in batches of 400, below Firestore's batch limit.

## Production import

Production import uses the Firebase Admin SDK and Application Default Credentials. Admin credentials bypass client security rules and must never be committed.

The repository ignores:

```text
/secrets/
*.service-account.json
```

Generate a temporary key from **Firebase Console -> Project settings -> Service accounts** and set its path only in the current PowerShell session:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "<absolute-path-to-service-account.json>"
```

Confirm the emulator variable is absent:

```powershell
Get-Item Env:FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
```

Perform another dry run, then use the explicitly confirmed production command:

```powershell
npm.cmd run import:cars -- "<path-to-csv>" --production --confirm-project=john-doe-automobile-database
```

Production mode refuses to run when:

- The confirmation is missing.
- The confirmation contains another project ID.
- `FIRESTORE_EMULATOR_HOST` is set.

After the import, revoke the temporary service-account key, delete the local JSON file, and unset the environment variable.

## Testing

Run the Angular unit and component tests:

```powershell
npm.cmd test
```

Typecheck and run the Firestore security rules tests against their isolated emulator:

```powershell
npm.cmd run typecheck:rules
npm.cmd run test:rules:emulator
```

The rules test environment uses a separate demo project and Firestore port `8081`. It does not read, clear, or modify the development emulator or production data.

Typecheck the importer and produce a production build:

```powershell
npm.cmd run typecheck:importer
npm.cmd run build
```

The build currently produces non-blocking bundle-budget warnings. It remains below the configured error limits.

## Firestore security

The deployed rules apply the following policy:

- Anyone can read documents in `/cars/{carId}`.
- Anonymous users cannot create cars.
- Authenticated users without a matching owner marker cannot create cars.
- An owner may create only a document with the expected deterministic ID shape and exact validated schema.
- Firestore server timestamps are required for `createdAt` and `updatedAt`.
- Car updates and deletes are denied to browser clients.
- Client access to `/admins/{uid}` is denied.
- All unspecified access is denied.

The automated rules suite verifies allowed reads and valid owner creates as well as rejected anonymous, non-owner, malformed, duplicate, update, delete, and admin-document requests.

Deploy the rules independently of Hosting:

```powershell
npx.cmd firebase deploy --only firestore:rules --project john-doe-automobile-database
```

Rules take effect on production Firestore immediately. The trusted Admin importer and Firebase Console operate outside browser-client rules.

## Production owner setup

Never store or document the owner's password in this repository.

1. Enable the **Email/Password** provider in Firebase Console under **Authentication -> Sign-in method**.
2. Create the owner's user under **Authentication -> Users**.
3. Copy the user's UID.
4. Create `/admins/{uid}` in production Firestore, using that UID as the document ID.
5. Add the string field `role` with the value `owner`.

The Authentication account proves identity. The protected Firestore admin marker grants permission to create cars. Both are required.

## Firebase Hosting release

Build the production application:

```powershell
npm.cmd run build
```

Deploy a temporary preview:

```powershell
npx.cmd firebase hosting:channel:deploy car-app-review --expires 1d --project john-doe-automobile-database
```

Preview channels use the real Firebase backend. Before promotion, verify public browsing, owner sign-in, valid car creation, duplicate rejection, validation, and sign-out. If Firebase Authentication rejects the preview domain, add the preview hostname under **Authentication -> Settings -> Authorized domains**.

After testing the preview, promote the reviewed artifact:

```powershell
npx.cmd firebase hosting:clone john-doe-automobile-database:car-app-review john-doe-automobile-database:live --project john-doe-automobile-database
```

Firebase Hosting rewrites unknown routes to `index.html`, allowing Angular routing to handle direct navigation.

## Design decisions

### Public browsing with restricted creation

The collection is publicly readable because browsing is the application's main purpose. Creation requires both a Firebase Authentication session and a server-side owner marker. The browser cannot grant itself owner access because client reads and writes to the `admins` collection are denied.

### Client-side collection querying

The application loads the small collection and performs search, filtering, and sorting in memory. This keeps interaction immediate and avoids unnecessary Firestore composite indexes. A much larger collection should move filtering, ordering, and pagination into Firestore queries.

### Browser-local preferences

Query preferences are stored in `localStorage` because they belong to the current browser and do not need to be shared between users. Stored values are validated before use so malformed or outdated data safely falls back to defaults.

### Deterministic duplicate protection

A stable identity derived from all normalized car fields gives the browser and importer the same definition of a duplicate. A Firestore transaction prevents concurrent submissions from silently overwriting the same document.

## Useful commands

| Command                                         | Purpose                                      |
| ----------------------------------------------- | -------------------------------------------- |
| `npm.cmd start`                                 | Start Angular with development configuration |
| `npm.cmd test`                                  | Run Angular tests once                       |
| `npm.cmd run build`                             | Create a production build                    |
| `npm.cmd run firebase:emulators`                | Start Authentication and Firestore emulators |
| `npm.cmd run typecheck:rules`                   | Typecheck the Firestore rules tests          |
| `npm.cmd run test:rules:emulator`               | Run rules tests in an isolated emulator      |
| `npm.cmd run typecheck:importer`                | Typecheck the import tool                    |
| `npm.cmd run import:cars -- "<csv>" --dry-run`  | Validate a CSV without writing               |
| `npm.cmd run import:cars -- "<csv>" --emulator` | Import into the Firestore emulator           |
