# John's Car App

An Angular and Cloud Firestore application for browsing, searching, filtering, sorting, and backing up an automobile dataset.

Live application: [john-doe-automobile-database.web.app](https://john-doe-automobile-database.web.app)

## Features

- Displays 398 automobile records from Cloud Firestore.
- Searches cars by name.
- Filters cars by origin.
- Sorts using dropdown controls or clickable table headers.
- Supports sorting by name, year, origin, MPG, cylinders, and horsepower.
- Persists search, filter, and sorting preferences in browser storage.
- Exports the complete collection as an importer-compatible CSV backup.
- Includes loading, error, empty-collection, and no-match states.
- Uses responsive and accessible controls.
- Supports local development through the Firestore emulator.
- Provides deterministic, idempotent CSV imports.
- Protects production imports with explicit project confirmation.

## Technology

- Angular 20
- AngularFire
- Cloud Firestore
- Firebase Hosting
- Firebase Local Emulator Suite
- TypeScript
- Vitest
- Firebase Admin SDK
- Node.js 22

No separate Node.js web server is required. Node.js is used only for the trusted CSV import tool.

## Project structure

```text
src/app/cars/
├── data-access/   Firestore repository and CSV download side effects
├── models/        Domain models, validation, mapping and pure transformations
├── pages/         Routed Angular page components
└── state/         Signal-based collection and query state

tools/import-cars/
├── import-cars.ts       CSV validation and Firestore import entry point
└── car-document-id.ts   Deterministic Firestore document IDs
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
- A Firebase project with Cloud Firestore and Hosting enabled

Install dependencies from the lockfile:

```bash
npm ci
```

On Windows PowerShell, use `npm.cmd`, `npx.cmd`, or the npm scripts shown below if PowerShell command resolution requires it.

## Local development

The development Angular configuration connects to the Firestore emulator at `127.0.0.1:8080`.

Start Firestore in one terminal:

```bash
npm run firebase:emulators
```

Import the CSV into the running emulator from another terminal:

```bash
npm run import:cars -- "<path-to-Automobile.csv>" --emulator
```

Start Angular:

```bash
npm start
```

Open:

```text
http://localhost:4200
```

The Firestore Emulator UI is available at:

```text
http://127.0.0.1:4000
```

Emulator data is temporary unless emulator import/export persistence is configured.

## CSV format

The importer expects these headers in this exact order:

```csv
name,mpg,cylinders,displacement,horsepower,weight,acceleration,model_year,origin
```

Optional numeric fields may use `?`, an empty value, `null`, `n/a`, or `na` to represent missing data.

The application’s **Export CSV** button produces the same format, allowing an exported backup to be validated and imported again.

## Validate a CSV without writing data

Always perform a dry run first:

```bash
npm run import:cars -- "<path-to-csv>" --dry-run
```

Expected output for the supplied dataset:

```text
Rows read: 398
Valid rows: 398
Invalid rows: 0
Dry run complete. No data was written.
```

## Deterministic imports

Each normalized car produces a deterministic document ID derived from its data.

This means:

- Re-importing the same CSV replaces the same documents.
- Repeated imports do not create duplicates.
- The importer does not delete unrelated documents.
- An expanded CSV can add future records.

Writes are sent in batches of 400, below Firestore’s batch limit.

## Production import

Production import uses the Firebase Admin SDK and Application Default Credentials. Admin credentials bypass client security rules and must never be committed.

The repository ignores:

```text
/secrets/
*.service-account.json
```

Generate a temporary key from:

```text
Firebase Console → Project settings → Service accounts
```

Set the credential path in the current PowerShell session:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "<absolute-path-to-service-account.json>"
```

Confirm the emulator variable is absent:

```powershell
Get-Item Env:FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
```

Perform another dry run, then use the explicitly confirmed production command:

```powershell
npm run import:cars -- "<path-to-csv>" --production --confirm-project=john-doe-automobile-database
```

Production mode refuses to run when:

- The confirmation is missing.
- The confirmation contains another project ID.
- `FIRESTORE_EMULATOR_HOST` is set.

After the import, revoke the temporary service-account key, delete the local JSON file, and unset the environment variable.

## Testing

Run the complete Angular test suite once:

```bash
npm test -- --watch=false
```

Run the importer typecheck:

```bash
npm run typecheck:importer
```

Run a production build:

```bash
npm run build
```

The project currently produces a non-blocking initial bundle-budget warning. The build remains below its configured error limit.

## Firestore security

Production rules allow public reads only for individual documents in the `cars` collection:

```text
/cars/{carId}
```

Client writes are denied, and all unspecified access is denied.

Deploy the rules:

```bash
npx firebase deploy --only firestore:rules --project john-doe-automobile-database
```

The trusted Admin importer bypasses these client rules.

## Firebase Hosting

Build the production application:

```bash
npm run build
```

Deploy a temporary preview:

```bash
npx firebase hosting:channel:deploy car-app-review --expires 1d --project john-doe-automobile-database
```

After testing the preview, promote the reviewed artifact:

```bash
npx firebase hosting:clone john-doe-automobile-database:car-app-review john-doe-automobile-database:live --project john-doe-automobile-database
```

Firebase Hosting rewrites unknown routes to `index.html`, allowing Angular routing to handle direct navigation.

## Design decisions

### Client-side collection querying

The application loads the 398-record collection and performs search, filtering, and sorting in memory.

This keeps the interaction immediate and avoids creating several Firestore composite indexes. For a much larger collection, the repository should move filtering, ordering, and pagination into Firestore queries.

### Browser-local preferences

Query preferences are stored in `localStorage` because they belong to the current browser and do not need to be shared between users.

Stored values are validated before use so malformed or outdated browser data safely falls back to defaults.

### Read-only public application

The hosted application is intentionally read-only and does not require authentication. Dataset changes are performed using the guarded administrator import tool.

## Useful commands

| Command                                     | Purpose                              |
| ------------------------------------------- | ------------------------------------ |
| `npm start`                                 | Start the Angular development server |
| `npm test -- --watch=false`                 | Run the test suite once              |
| `npm run build`                             | Create a production build            |
| `npm run firebase:emulators`                | Start the Firestore emulator         |
| `npm run typecheck:importer`                | Typecheck the import tool            |
| `npm run import:cars -- "<csv>" --dry-run`  | Validate a CSV                       |
| `npm run import:cars -- "<csv>" --emulator` | Import into the emulator             |
