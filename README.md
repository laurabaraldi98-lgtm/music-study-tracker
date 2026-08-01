# Music Study Tracker

Music Study Tracker is a responsive web application built for a music student based on her specific study needs.

The app allows users to record and organize music dictation practice sessions, track correctly identified musical categories, and review progress through saved sessions, graphical statistics, and a monthly calendar.

## Live Demo

[Open Music Study Tracker](https://music-study-tracker.netlify.app)

## Features

- Save the date, title, and YouTube link of each dictation session
- Organize sessions into rhythmic, melodic, and harmonic types
- Create optional custom collections, such as study books or exercise groups
- Add and remove custom categories
- Mark the categories identified correctly during each exercise
- View saved dictation sessions
- Sort saved sessions by date
- Display the collection associated with each session
- Delete saved sessions
- View general statistics for each dictation type
- View success percentages for individual categories
- Display graphical progress bars for category results
- Browse a monthly calendar
- Navigate between previous and following months
- Highlight days containing saved dictation sessions
- Store data locally using localStorage
- Use the app from desktop and mobile browsers

## Technologies

- HTML
- CSS
- JavaScript
- localStorage
- Git and GitHub
- Netlify

## Project Background

This project was developed from the requirements of a real music student who needed a simple way to organize and review music dictation practice.

The first version was designed around her existing study workflow. The intended user then tested the application and provided feedback, which led to the addition of custom collections, clearer statistics, graphical progress indicators, and a monthly calendar.

The project is being developed iteratively, with each new feature based on real user needs and feedback.

## Project Status

The application currently includes the main features required for recording, organizing, and reviewing dictation practice.

Planned improvements include:

- Clickable calendar days showing the sessions completed on that date
- Further user interface improvements
- JavaScript refactoring and separation into modules
- Database integration
- Data synchronization across devices
- User authentication
- A Node.js backend

## Current Data Storage

Data is currently stored locally in the browser using localStorage.

This means that:

- each browser stores its own data
- data is not synchronized between devices
- clearing browser data may remove saved sessions

A future version may use an online database and a Node.js backend to provide persistent and synchronized storage across devices.