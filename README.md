# Music Study Tracker

Music Study Tracker is a responsive full-stack web application built for a music student based on her specific study needs.

The app allows users to record and organize music dictation practice sessions, track correctly identified musical categories, and review progress through saved sessions, graphical statistics, and an interactive monthly calendar.

## Live Demo

[Open Music Study Tracker](https://music-study-tracker.netlify.app)

> The public demo currently uses a Clerk development instance for authentication.

## Features

- Sign up, sign in, and sign out
- Save the date, title, and YouTube link of each dictation session
- Organize sessions into rhythmic, melodic, and harmonic types
- Create optional custom collections, such as study books or exercise groups
- Add and remove custom categories
- Mark the categories identified correctly during each exercise
- View saved dictation sessions
- Sort saved sessions by date
- Filter saved sessions by collection
- Display the collection associated with each session
- Delete saved sessions
- View general statistics for each dictation type
- View success percentages for individual categories
- Display graphical progress bars for category results
- Filter statistics by collection
- Browse an interactive monthly calendar
- Navigate between previous and following months
- Filter the calendar by collection
- Highlight days containing saved dictation sessions
- Click highlighted calendar days to view all sessions completed on that date
- View session details inside a modal window
- Store data in a PostgreSQL database
- Synchronize data across browsers and devices
- Keep each user's data separated through authenticated database queries
- Use the app from desktop and mobile browsers

## Technologies

### Frontend

- HTML
- CSS
- JavaScript
- Clerk authentication
- Netlify

### Backend

- Node.js
- Express
- REST API
- Clerk server-side authentication
- CORS
- Vercel

### Database

- PostgreSQL
- Neon
- `pg` for database queries

### Development Tools

- Git
- GitHub
- Visual Studio Code

## Architecture

The frontend is deployed on Netlify and communicates with a Node.js and Express backend deployed on Vercel.

The frontend codebase is organized into separate JavaScript files by responsibility, reducing duplication and keeping authentication, API calls, data management, calendar logic, and statistics isolated from one another.

Authenticated requests include a Clerk session token in the `Authorization` header.

```text
Frontend on Netlify
        ↓
Clerk authentication token
        ↓
Node.js and Express REST API on Vercel
        ↓
PostgreSQL database on Neon
```

The backend verifies the authenticated user and uses the corresponding Clerk user ID when reading, creating, or deleting data.

This prevents users from accessing records belonging to another account.

## API

The backend provides endpoints for managing:

- dictation sessions
- custom categories
- custom collections
- user-specific settings

The API supports operations such as:

- retrieving saved records
- creating new records
- deleting existing records
- validating incoming data
- returning appropriate HTTP error responses

## Security

- Authentication tokens are verified by the backend
- Database queries are filtered by the authenticated user's ID
- CORS allows requests only from approved frontend origins
- Sensitive values, such as the database connection string and Clerk secret key, are stored in environment variables
- Environment files are excluded from Git
- User input is validated again on the backend before being stored

The Clerk publishable key is included in the frontend because it is designed to be public. Secret keys are never included in the client-side code.

## Project Background

This project was developed from the requirements of a real music student who needed a simple way to organize and review music dictation practice.

The first version used browser-based local storage and was designed around her existing study workflow.

The intended user tested the application and provided feedback, which led to the addition of:

- custom collections
- custom categories
- clearer statistics
- graphical progress indicators
- an interactive monthly calendar
- improved mobile usability
- user authentication
- persistent cloud data storage

The application was later converted into a full-stack project with a Node.js and Express backend, PostgreSQL database, and user-specific data synchronization.

## Project Status

The main application features are implemented and the app is available online.

Recent improvements include:

- Clerk user authentication
- Node.js and Express backend
- PostgreSQL database integration
- user-specific data isolation
- frontend deployment on Netlify
- backend deployment on Vercel
- validation of incoming API data
- improved API error handling
- CORS configuration for the deployed frontend
- prevention of protected data loading after logout
- responsive authentication interface
- custom application favicon

## Planned Improvements

- Further improve the user interface
- Add loading indicators and more detailed user-facing error messages
- Add editing of existing dictation sessions
- Add automated tests
- Refactor JavaScript files into ES modules
- Improve accessibility
- Add additional statistical visualizations