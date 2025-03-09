# Data Extractor

A React application that provides a clean interface for uploading and processing PDF and PNG files. The UI is built with Material-UI components for a modern, responsive experience.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Google Cloud Platform account (for deployment)
- GitHub account (for deployment)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Features

- Modern, responsive UI built with Material-UI
- Google OAuth authentication
- PDF and PNG file upload with preview
- Dark/Light theme with system preference detection
- Interactive validation interface for extracted data
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
   - Enable Cloud Storage API
   - Create a service account with Storage Admin permissions
   - Set up Workload Identity Federation for GitHub Actions

2. Add the following secrets to your GitHub repository:
   ```
   GCP_PROJECT_ID          # Your Google Cloud Project ID
   GCS_BUCKET_NAME        # Desired bucket name for deployment
   GCP_SERVICE_ACCOUNT    # Service account email
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
- Data validation interface

## Usage

1. Sign in using your Google account
2. Upload a PDF or PNG file
3. View the file preview and extracted data
4. Validate each extracted item using the check/X buttons
5. Submit validated data when ready
