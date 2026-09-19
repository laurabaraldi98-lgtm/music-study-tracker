# Music Study Tracker

Music Study Tracker is a responsive full-stack web application built for a real music student around her specific study workflow.

The application allows users to record music dictation practice sessions, organize exercises by type and collection, evaluate musical categories, review previous work through an interactive calendar, and analyze progress through a dedicated Practice Report with statistical and AI-assisted insights.

## Live App

[Open Music Study Tracker](https://music-study-tracker.netlify.app)

## Screenshots

The screenshots below use demo data created specifically to demonstrate the application's functionality.

### Practice Report

The Practice Report summarizes the complete filtered dataset and shows overall accuracy together with the user's performance trend.

![Practice Report](screenshots/practice-report.png)

### Deterministic Insights and AI Analysis

Statistical insights are calculated by the application first. Google Gemini then receives those already-calculated conclusions and generates a short natural-language summary.

![Practice Report Insights](screenshots/practice-report-insights.png)

### Interactive Calendar

Practice days are highlighted directly in the monthly calendar.

![Calendar](screenshots/calendar.png)

Clicking a highlighted day opens the sessions completed on that date.

![Calendar Details](screenshots/calendar-details.png)

### Saved Dictations

Saved sessions can be reviewed individually together with their type, collection, correctly identified categories, and source link.

![Saved Dictations](screenshots/saved-dictations.png)

## Features

### Practice Sessions

- Sign up, sign in, and sign out
- Save the date, title, and YouTube link of each dictation session
- Assign sessions to a dictation type
- Create and use custom dictation types
- Create optional custom collections, such as study books or exercise groups
- Add and remove custom musical categories
- Select which categories were evaluated during each exercise
- Mark correctly identified categories
- View saved dictation sessions
- Sort saved sessions by date
- Filter saved sessions by collection
- Expand individual sessions to view their details
- Delete saved sessions
- Synchronize data across browsers and devices

### Custom Dictation Types

The application includes the default rhythmic, melodic, and harmonic dictation types while also allowing users to create their own.

Categories are associated with a specific dictation type, allowing the system to support study workflows beyond the original predefined categories.

### Interactive Calendar

- Browse practice sessions through a monthly calendar
- Navigate between previous and following months
- Filter the calendar by collection
- Highlight days containing saved dictation sessions
- Click highlighted days to view all sessions completed on that date
- View session details inside a modal window
- Open the source video directly from the session details

### Practice Report

The Practice Report provides a backend-generated overview of the user's progress.

Users can filter the report by:

- current month
- previous month
- last 3 months
- last 6 months
- complete history
- custom date range
- collection
- dictation type

The report includes:

- total number of dictations
- total evaluated categories
- total correct categories
- overall accuracy
- results grouped by dictation type
- results grouped by musical category
- best-performing category or categories
- category or categories requiring the most improvement
- performance trend over time

Statistics are calculated from the complete filtered dataset on the backend rather than from only the data currently rendered by the frontend.

### Adaptive Trend Visualization

The report automatically chooses the appropriate time resolution for the selected period.

It displays:

- daily results for the current month
- daily results for the previous month
- daily results for custom periods up to 45 days
- monthly results for longer custom periods
- monthly results for 3-month, 6-month, and complete-history reports

The chart is based on category accuracy rather than simply counting completed sessions.

This makes it possible to visualize how accurately the student is performing over time rather than only how frequently they practise.

### Deterministic Practice Insights

The application calculates its main conclusions before any AI request is made.

The deterministic insight layer identifies:

- the strongest-performing category or categories
- the category or categories that need the most improvement
- the overall performance trend

These calculations remain the source of truth for the report.

### AI-Assisted Analysis

The application integrates Google Gemini to transform the already-calculated report insights into a short natural-language analysis.

Gemini receives only:

- the selected report period
- the global summary
- the deterministic insights

The model is explicitly instructed not to recalculate statistics, choose different categories, invent values, or replace the conclusions produced by the application.

This keeps statistical logic inside the application while using AI only for presentation and interpretation.

### Non-Blocking AI Loading

The statistical report and the AI analysis use separate API requests.

The main report endpoint returns the calculated statistics immediately:

```text
GET /statistics/report
```

Once the report has been rendered, the frontend independently requests the AI commentary:

```text
POST /statistics/report/ai
```

As a result, external AI latency does not block the main Practice Report.

If Gemini takes longer to respond, the user can still immediately see:

- summary statistics
- trend graph
- results by dictation type
- results by category
- deterministic insights

The AI section is updated separately when its response becomes available.

## Technologies

### Frontend

- HTML
- CSS
- JavaScript
- Clerk authentication
- Jest
- jsdom
- Netlify

### Backend

- Node.js
- Express
- REST API
- Clerk server-side authentication
- Google Gemini API
- CORS
- Jest
- Supertest
- Vercel

### Database

- PostgreSQL
- Neon
- `pg`

### Development and Infrastructure

- Git
- GitHub
- GitHub Actions
- Docker
- Visual Studio Code

## Architecture

The frontend is deployed on Netlify and communicates with a Node.js and Express backend deployed on Vercel.

PostgreSQL data is hosted on Neon.

Authentication is handled through Clerk.

```text
Frontend on Netlify
        ↓
Clerk session token
        ↓
Node.js + Express REST API on Vercel
        ↓
PostgreSQL on Neon
```

Authenticated frontend requests include a Clerk session token in the `Authorization` header.

The backend verifies the authenticated user and applies the corresponding Clerk user ID when accessing application data.

### Practice Report Architecture

The Practice Report separates deterministic analytics from AI-generated text.

```text
Frontend
   ↓
GET /statistics/report
   ↓
PostgreSQL aggregation queries
   ↓
Summary
Daily / monthly data
Results by dictation type
Results by category
   ↓
Deterministic insight calculation
   ↓
Report returned and rendered immediately
```

The AI analysis then runs independently:

```text
Already-calculated report
   ↓
POST /statistics/report/ai
   ↓
Google Gemini
   ↓
Short natural-language commentary
   ↓
AI section updated in the frontend
```

The statistical endpoint therefore has no dependency on the Gemini response.

## Backend Statistics

The Practice Report executes independent PostgreSQL aggregation queries for:

- global report summary
- monthly performance
- daily performance
- performance by dictation type
- performance by category

These queries are executed concurrently with `Promise.all` rather than sequentially.

This allows the backend to wait only for the slowest independent query instead of waiting for each query one after another.

The query results are converted into the report structure and then passed to the deterministic insight service.

## Frontend Structure

The frontend uses vanilla JavaScript and separates responsibilities into dedicated files.

Important files include:

```text
api.js
auth.js
calendar.js
categories.js
collections.js
dictations.js
dictation-types.js
sidebar.js
practice-report.js
practice-report-months.js
practice-report-types.js
practice-report-categories.js
practice-report-insights.js
practice-report-ai.js
```

Responsibilities include:

- `api.js` – authenticated communication with the backend
- `auth.js` – authentication-related interface behavior
- `dictations.js` – creation and display of practice sessions
- `dictation-types.js` – management of custom dictation types
- `categories.js` – musical category management
- `collections.js` – collection management
- `calendar.js` – calendar rendering and interaction
- `sidebar.js` – application navigation
- `practice-report.js` – Practice Report orchestration
- `practice-report-months.js` – daily and monthly trend visualization
- `practice-report-types.js` – results grouped by dictation type
- `practice-report-categories.js` – results grouped by category
- `practice-report-insights.js` – deterministic insight rendering
- `practice-report-ai.js` – AI analysis rendering

## CSS Structure

Styles are separated by responsibility rather than being stored in one large stylesheet.

```text
styles/
├── base.css
├── auth.css
├── calendar.css
├── sidebar.css
└── practice-report.css
```

This keeps general application styles, authentication, calendar components, navigation, and Practice Report styling independent from one another.

## Backend Structure

The Express backend separates API routes and reusable services.

Main route groups include:

```text
server/routes/
├── dictations.js
├── categories.js
├── collections.js
├── dictation-types.js
└── statistics.js
```

Services used by the Practice Report include deterministic insight calculation and Gemini integration.

This keeps external AI communication separate from the core statistical logic.

## API

The backend exposes REST endpoints for the application's main resources.

### Dictations

```text
/dictations
```

Supports retrieving, creating, and deleting user-specific practice sessions.

### Categories

```text
/categories
```

Supports retrieving, creating, and deleting categories associated with the authenticated user.

### Collections

```text
/collections
```

Supports retrieving, creating, and deleting optional practice collections.

### Dictation Types

```text
/dictation-types
```

Supports the default dictation types as well as custom user-created types.

### Statistics

```text
/statistics
```

Practice Report endpoints:

```text
GET /statistics/report
POST /statistics/report/ai
```

`GET /statistics/report` calculates and returns the statistical report.

`POST /statistics/report/ai` generates the optional AI commentary from the report's already-calculated summary and insights.

The backend also handles:

- authentication
- input validation
- invalid resource IDs
- missing resources
- database errors
- user-specific filtering
- appropriate HTTP error responses

## Authentication and Data Isolation

Authentication is handled using Clerk.

The frontend obtains a Clerk session token and includes it in authenticated API requests.

The Express backend uses Clerk middleware to verify the request and determine the authenticated user.

Database queries use the authenticated Clerk user ID when reading, creating, or deleting user-specific records.

This prevents one application user from accessing another user's data through the API.

## Security

The application includes several security measures:

- Clerk authentication
- server-side authentication verification
- authenticated user IDs applied to database queries
- backend request validation
- restricted CORS origins
- environment variables for backend secrets
- `.env` files excluded from version control
- no PostgreSQL credentials exposed to frontend code
- no Gemini API key exposed to frontend code

The backend currently accepts requests from the deployed Netlify frontend and the configured local development origin.

The Clerk publishable key is client-side by design, while private credentials remain on the backend.

## Database

The application uses PostgreSQL hosted on Neon.

The main application data includes:

- dictation sessions
- musical categories
- collections
- dictation types
- user-specific initialization settings

Dictations and categories are associated with both a user and a dictation type.

This allows each account to maintain an independent study configuration.

## Database Migrations

Database schema changes are versioned inside:

```text
database/migrations/
```

Current migrations include:

```text
001_initial_schema.sql
002_add_dictation_types.sql
```

The initial migration creates the original PostgreSQL structure.

The second migration introduces custom dictation types, associates existing categories and dictations with the new type records, and migrates existing rhythmic, melodic, and harmonic data.

Migrations should be applied in filename order.

Example:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_add_dictation_types.sql
```

Future schema changes should be implemented as additional numbered migration files rather than modifying already-applied migrations.

Docker can be used to run PostgreSQL locally and validate migrations without requiring a native PostgreSQL installation.

## Testing

The project includes independent automated test suites for the frontend and backend.

External systems are mocked where appropriate so application behavior can be tested without depending on live authentication, databases, or AI services.

### Frontend Testing

Frontend tests use Jest and jsdom.

The test suite covers areas including:

- authentication interface behavior
- authenticated API requests
- API success and failure responses
- dictation creation
- form validation
- saved dictation rendering
- collection management
- category management
- custom dictation types
- calendar rendering
- calendar navigation
- calendar session details
- modal behavior
- keyboard interactions
- Practice Report filters
- custom report periods
- summary cards
- daily trend rendering
- monthly trend rendering
- dictation type results
- category results
- deterministic insights
- AI loading state
- successful AI analysis
- AI failure handling

The tested frontend JavaScript application logic achieves:

- 100% statement coverage
- 100% branch coverage
- 100% function coverage
- 100% line coverage

Run the frontend tests from the project root:

```bash
npm test
```

Run them with coverage:

```bash
npm run test:coverage
```

### Backend Testing

Backend tests use Jest and Supertest.

The test suite covers areas including:

- unauthenticated requests
- authenticated API requests
- request validation
- invalid resource IDs
- missing resources
- database failure scenarios
- dictation management
- collection management
- category management
- custom dictation type management
- report period resolution
- custom report date ranges
- collection filters
- dictation type filters
- global summary calculation
- daily aggregation
- monthly aggregation
- category accuracy
- dictation type accuracy
- deterministic practice insights
- database error handling
- separate Gemini analysis requests
- invalid AI report requests
- Gemini failure handling

PostgreSQL queries, Clerk authentication, and Gemini calls are mocked during automated testing.

The tested backend application logic achieves:

- 100% statement coverage
- 100% branch coverage
- 100% function coverage
- 100% line coverage

Run backend tests from the `server` directory:

```bash
npm test
```

Run them with coverage:

```bash
npm test -- --coverage
```

## CI/CD

The project uses GitHub Actions for continuous integration.

Automated tests are run on repository pushes and pull requests so regressions can be detected before changes are merged.

Continuous deployment is handled by:

- Netlify for the frontend
- Vercel for the backend

The production architecture is therefore:

```text
GitHub
   ↓
GitHub Actions
   ↓
Automated tests
   ↓
Netlify / Vercel deployment
```

## Running Locally

### 1. Clone the Repository

```bash
git clone https://github.com/laurabaraldi98-lgtm/music-study-tracker.git
cd music-study-tracker
```

### 2. Install Frontend Test Dependencies

From the project root:

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Configure Backend Environment Variables

Create:

```text
server/.env
```

The backend requires a PostgreSQL connection string and Gemini API key:

```env
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

The Clerk environment for the backend must also be configured with the credentials for the Clerk instance used by the application.

Never commit secret credentials or `.env` files.

### 5. Prepare the Database

Apply database migrations in order:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_add_dictation_types.sql
```

Alternatively, Docker can be used to run and validate the PostgreSQL environment locally.

### 6. Start the Backend

From the `server` directory:

```bash
node server.js
```

The backend uses port `3000` by default:

```text
http://localhost:3000
```

A different port can be provided through the `PORT` environment variable.

### 7. Start the Frontend

Serve the project root using a local web server such as VS Code Live Server.

The current local CORS configuration supports:

```text
http://127.0.0.1:5500
```

When the frontend runs locally, `api.js` automatically uses the local backend instead of the deployed Vercel endpoint.

## Project Background

Music Study Tracker was created for a real music student who needed a better way to organize and evaluate music dictation practice.

The first version was a browser-based application using local storage and was designed around the student's existing study routine.

The application evolved through direct feedback from its intended user.

That process led to the addition of:

- custom collections
- custom musical categories
- authentication
- PostgreSQL persistence
- multi-device synchronization
- an interactive calendar
- improved mobile usability
- custom dictation types
- backend-generated analytics
- daily and monthly progress visualization
- deterministic performance insights
- AI-assisted report commentary

The application was progressively converted into a complete full-stack system using Node.js, Express, PostgreSQL, Clerk, and cloud deployment.

## Project Status

The application is deployed and its main workflows are functional.

Recent development has focused on the Practice Report and application architecture, including:

- custom dictation types
- modular navigation
- modular CSS
- backend statistical aggregation
- adaptive daily and monthly trend visualization
- deterministic practice insights
- Google Gemini integration
- separation of statistical and AI requests
- non-blocking AI analysis loading
- comprehensive frontend testing
- comprehensive backend testing
- 100% statement, branch, function, and line coverage for the tested application logic

## Planned Improvements

Possible future improvements include:

- editing existing dictation sessions
- additional loading indicators
- more detailed user-facing error states
- further accessibility improvements
- additional statistical visualizations
- a pre-populated public demo mode
- API rate limiting
- continued UI refinements
- additional mobile interface improvements