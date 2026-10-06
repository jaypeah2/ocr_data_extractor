# Data Extractor

A React application that provides a clean interface for uploading and processing PDF and PNG files. The UI is built with Material-UI components for a modern, responsive experience.

## Prerequisites

- Node.js (v18 or higher)
- npm (Node Package Manager)
- Google Cloud Platform account (for deployment)
- GitHub account (for deployment)

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

The application will be available at http://localhost:3001

## Features

- Modern, responsive UI built with Material-UI
- Google OAuth authentication
- PDF and PNG file upload with preview
- Dark/Light theme with system preference detection
- Clean, organized display of results

## Authentication

The application uses Google OAuth for authentication:
- Users must sign in to upload and process documents
- Authentication state persists across sessions
- Secure token management for API requests

## Deployment

The application is configured to deploy to Google Cloud Storage using GitHub Actions.

### Prerequisites for Deployment

1. Create a Google Cloud Project and set up the following:
   - Enable the Cloud Storage and Compute APIs
   - Create a service account with Storage Admin permissions and add its key JSON as a GitHub secret

2. Add the following secrets to your GitHub repository:
   ```
   GOOGLE_PROJECT_ID     # Your Google Cloud Project ID
   GOOGLE_CREDENTIALS    # Service account key JSON (used to authenticate GitHub Actions)
   GOOGLE_CLIENT_ID      # Google OAuth client ID, exposed to the app as VITE_GOOGLE_CLIENT_ID
   GLOBAL_ADDRESS        # Global IP address for the Cloud CDN A record
   ```

### Deployment Process

The GitHub Actions workflow will:
1. Build the application
2. Create a Cloud Storage bucket if it doesn't exist
3. Configure the bucket for web hosting
4. Upload the built files to the bucket

The deployment is triggered automatically on pushes to the main branch.

## Development

The application is built with:
- React for the UI framework
- Material-UI for components and styling
- Vite for build tooling and development server
- @react-oauth/google for authentication

The `App.jsx` component handles:
- Authentication flow
- File upload and preview
- Theme management

## Usage

1. Sign in using your Google account
2. Upload a PDF or PNG file
3. View the file preview and extracted data
