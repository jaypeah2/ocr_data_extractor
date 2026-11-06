# Data Extractor

A React application that provides a clean interface for uploading and processing PDF and PNG files. The UI is built with Material-UI components for a modern, responsive experience.

## Prerequisites

- Node.js 18 or newer, with npm

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the environment: copy `.env.example` to `.env` and set `VITE_GOOGLE_CLIENT_ID` to your Google OAuth client ID.

3. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3001. Opening it through
`localhost`, `*.localhost`, `127.0.0.1`, or `[::1]` selects the local API at
`http://localhost:9000` for both sign-in and document processing.

## Features

- PDF and PNG upload with preview
- Google sign-in; the API token is kept in `localStorage` until sign-out or a rejected request
- Dark/light theme following the system preference
- Extracted data displayed beside the preview

`src/App.jsx` handles upload, preview, results and theme; `src/components/GoogleAuth.jsx`
exchanges the Google credential for an API token. Outside localhost the app uses
`https://api.simplejay.com/`.

## Deployment

Every push to `main` runs [the workflow](.github/workflows/deploy.yml), so treat it as a
production deployment. It:

1. Builds with Node 18 (`npm ci`, `npm run build`), injecting `VITE_GOOGLE_CLIENT_ID`.
2. Uses the Terraform state bucket `tf_state_<repository-name>` provisioned by global_infra.
3. Runs Terraform in `terraform/` to manage the public site bucket, its backend bucket and
   the `ocr.simplejay.com` DNS record.
4. Uploads `dist/` with `gcloud storage rsync` (no deletion) and invalidates the CDN cache.

HTTPS routing to the backend bucket is managed separately in `../global_infra`.

The workflow uses keyless federation as `ci-ocr-extractor`; bootstrap its grants through
[global_infra](../global_infra/README.md#deployment) before publishing this workflow change.
Required GitHub secrets:

```
GOOGLE_PROJECT_ID     # Google Cloud project ID
GOOGLE_CLIENT_ID      # Google OAuth client ID, exposed to the app as VITE_GOOGLE_CLIENT_ID
GLOBAL_ADDRESS        # Global IP address for the DNS A record
```
