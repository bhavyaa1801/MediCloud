# MediCloud – Cloud-Based Hospital Management System

MediCloud is a cloud-based hospital management system designed to simplify hospital operations by connecting patients, doctors, receptionists, and administrators through a single platform.

The application provides appointment scheduling, doctor management, patient registration, medical records, prescriptions, notifications, and hospital resource management.

Built with React and Firebase, MediCloud supports role-based dashboards and real-time data synchronization.

## Features

### 1. Patient Portal
- Patient registration and secure login.
- Browse doctors and hospital departments.
- View doctor profiles, specializations, and availability.
- Book and cancel appointments.
- Track appointment status.
- Access medical records and prescriptions.
- Manage personal profile.
- Receive notifications.

### 2. Doctor Portal
- Doctor-specific dashboard.
- View upcoming appointments and schedules.
- Manage availability and working days.
- View assigned patients.
- Access patient details and medical history.
- Conduct consultations.
- Create and manage prescriptions.
- Upload medical records.
- Receive appointment notifications.

### 3. Receptionist Portal
- Register and manage patient information.
- Book appointments on behalf of patients.
- View doctor availability.
- Manage appointment statuses.
- Access patient and appointment information.
- Receive notifications.

### 4. Admin Portal
- Hospital overview dashboard.
- Manage doctors and their profiles.
- Add and manage hospital departments.
- Manage patients and receptionists.
- Monitor and manage appointments.
- Manage hospital resources.
- View audit logs.
- Manage hospital settings.
- Download application data backups in JSON format.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| Icons | Lucide React |
| Charts | Recharts |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Hosting | Vercel |
| Version Control | Git, GitHub |

## Application Architecture

MediCloud uses a service-based architecture that separates frontend components from data operations.

```text
                 MediCloud
                     |
              React + Vite
                     |
               React Router
                     |
          Role-Based Dashboards
                     |
              Service Layer
                /       \
               /         \
         Mock Mode      Live Mode
             |              |
        LocalStorage    Firebase Auth
                            |
                       Firestore
                            |
                    Security Rules
```

The application supports two operating modes:

- **Mock Mode:** Uses predefined demo data and localStorage for development and demonstration.
- **Live Mode:** Uses Firebase Authentication and Cloud Firestore for persistent data storage.

The mode is controlled through the `VITE_DATA_MODE` environment variable.

## Role-Based Access Control

MediCloud supports four user roles:

| Role | Account Creation | Dashboard |
|---|---|---|
| Patient | Self-registration | Patient Portal |
| Doctor | Admin-created | Doctor Portal |
| Receptionist | Admin-created | Receptionist Portal |
| Admin | Manually provisioned | Admin Portal |

Each user is redirected to the appropriate dashboard after authentication.

Doctor, receptionist, and admin registration is restricted to prevent unauthorized privilege assignment.

## Firebase Integration

MediCloud uses Firebase Authentication for email/password authentication and Cloud Firestore for application data.

### Firestore Collections

The application uses the following collections:

- `users` – User profiles and roles.
- `patients` – Patient information and care-team relationships.
- `doctors` – Doctor profiles and availability.
- `staff` – Receptionist information.
- `departments` – Hospital departments.
- `appointments` – Appointment information.
- `appointmentSlots` – Appointment slot reservation tracking.
- `medicalRecords` – Patient medical records.
- `prescriptions` – Doctor-created prescriptions.
- `resources` – Hospital resources.
- `notifications` – User notifications.
- `auditLogs` – Application activity logs.
- `settings` – Hospital configuration.
- `counters` – Generated identifiers.

### Appointment Booking

Appointment booking uses Firestore transactions and deterministic appointment-slot identifiers.

This helps prevent two patients from booking the same doctor's time slot simultaneously.

### Security

- Firebase Authentication for user authentication.
- Firestore Security Rules for role-based access.
- Restricted access to patient medical records.
- Role-based restrictions on administrative operations.
- User roles cannot be modified through ordinary client-side profile updates.

**Note:** The application requires security-rule testing and a proper security review before production use.

## Getting Started

### Prerequisites

- Node.js (LTS recommended).
- npm.
- Git.
- A Firebase account.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/medicloud.git

cd medicloud
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
VITE_DATA_MODE=live

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

For demo mode, use:

```env
VITE_DATA_MODE=mock
```

### 4. Configure Firebase

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable Email/Password authentication.
3. Create a Cloud Firestore database.
4. Configure the database location.
5. Publish the provided `firestore.rules`.
6. Configure the Firebase web application credentials.
7. Add your application's authorized domain under Firebase Authentication settings.

### 5. Create the First Admin Account

The first administrator must be provisioned manually.

1. Open Firebase Authentication.
2. Create a user using an email address and password.
3. Copy the generated Firebase UID.
4. Open Firestore.
5. Create a document inside the `users` collection.
6. Use the Firebase UID as the document ID.
7. Add the following fields:

| Field | Value |
|---|---|
| uid | Firebase UID |
| name | Hospital Admin |
| email | Admin email |
| phone | Empty string |
| role | admin |
| profileId | ADM-01 |
| status | active |
| profileImage | null |

Log in using these administrator credentials.

The administrator can then create departments, doctors, and receptionist accounts through the dashboard.

### 6. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Deployment

MediCloud can be deployed using Vercel.

1. Push the project to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Select Vite as the framework.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Configure the Firebase environment variables in Vercel.
7. Deploy the application.
8. Add your Vercel domain to Firebase Authentication's authorized domains.

## Available Scripts

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Generate production build |
| `npm run preview` | Preview production build locally |

## Project Structure

```text
medicloud/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── doctors/
│   │   └── records/
│   │
│   ├── data/
│   │   └── seed.js
│   │
│   ├── hooks/
│   │   └── useData.js
│   │
│   ├── layouts/
│   │
│   ├── pages/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── doctor/
│   │   ├── patient/
│   │   ├── public/
│   │   ├── reception/
│   │   └── shared/
│   │
│   ├── routes/
│   │
│   ├── services/
│   │   ├── live/
│   │   ├── mock/
│   │   └── firebase.js
│   │
│   ├── utils/
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── docs/
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .env.example
├── .gitignore
├── package.json
└── vite.config.js
```

## Current Limitations

- Firebase live integration requires configuration with an actual Firebase project and end-to-end testing.
- The free-plan implementation does not use Cloud Functions.
- Medical record files are stored in Firestore as Base64 data, with a 700 KB limit.
- Firebase Cloud Storage is not integrated in the current free-plan implementation.
- Automated database backups are not configured.
- Additional server-side validation and security testing are required before production deployment.

MediCloud is currently an academic full-stack project and should not be used to store real patient information without appropriate security, privacy, and regulatory review.

## Future Improvements

- Firebase Cloud Storage integration.
- Automated database backups and recovery.
- Server-side validation and processing.
- Advanced analytics and reporting.
- Improved appointment reminders.
- Secure document management.
- Enhanced audit and monitoring capabilities.

## License

This project is developed for academic and educational purposes.