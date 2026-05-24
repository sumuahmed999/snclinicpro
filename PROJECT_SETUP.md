# Frontend Project Setup - Complete

This document describes the frontend project setup that has been completed for the Clinic Management Portal.

## Technology Stack

- **React 19.2.4** - UI library
- **Vite 8.0.1** - Build tool and dev server
- **TypeScript 5.9.3** - Type safety
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **TanStack Query (React Query)** - Server state management
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/          # Layout components (Header, Sidebar, Footer)
│   │   ├── patient/         # Patient-specific components
│   │   ├── admin/           # Admin-specific components
│   │   └── staff/           # Staff-specific components
│   ├── pages/               # Page components
│   ├── services/            # API service layer
│   │   ├── api.ts           # Axios instance with interceptors
│   │   ├── auth.ts          # Authentication services
│   │   ├── appointments.ts  # Appointment services
│   │   ├── doctors.ts       # Doctor services
│   │   ├── slots.ts         # Slot services
│   │   ├── payments.ts      # Payment services
│   │   ├── familyMembers.ts # Family member services
│   │   ├── medicalRecords.ts # Medical record services
│   │   ├── messages.ts      # Messaging services
│   │   ├── feedback.ts      # Feedback services
│   │   ├── settings.ts      # Settings services
│   │   └── patients.ts      # Patient management services
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useAppointments.ts # Appointment hooks
│   │   ├── useDoctors.ts    # Doctor hooks
│   │   └── useSlots.ts      # Slot hooks
│   ├── context/             # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── utils/               # Utility functions
│   │   ├── constants.ts     # Application constants
│   │   ├── validators.ts    # Validation functions
│   │   └── formatters.ts    # Formatting functions
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # All application types
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── .env                     # Environment variables
├── .env.example             # Environment variables template
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies and scripts
```

## Key Features Implemented

### 1. API Service Layer
- Centralized Axios instance with base configuration
- Request interceptor to attach authentication tokens
- Response interceptor for error handling
- Service functions for all backend endpoints:
  - Authentication (register, login, logout)
  - Appointments (book, cancel, reschedule)
  - Doctors (list, details, availability)
  - Slots (list, available slots)
  - Payments (initiate, verify, manual)
  - Family Members (CRUD operations)
  - Medical Records (upload, download)
  - Messages (send, list, read)
  - Feedback (submit, view)
  - Settings (get, update)
  - Patient Management (list, details, deactivate)

### 2. Authentication System
- **AuthContext**: Global authentication state management
- **useAuth Hook**: Easy access to auth state and methods
- **ProtectedRoute Component**: Route protection with role-based access
- Token storage in localStorage
- Automatic token attachment to API requests
- Automatic redirect on authentication errors

### 3. React Query Integration
- QueryClient configured with sensible defaults
- Custom hooks for data fetching:
  - `useAppointments` - Fetch user appointments
  - `useAppointment` - Fetch single appointment
  - `useBookAppointment` - Book appointment mutation
  - `useCancelAppointment` - Cancel appointment mutation
  - `useRescheduleAppointment` - Reschedule appointment mutation
  - `useDoctors` - Fetch doctors list
  - `useDoctor` - Fetch single doctor
  - `useDoctorAvailability` - Fetch doctor availability
  - `useSlots` - Fetch slots
  - `useAvailableSlots` - Fetch available slots with auto-refresh
  - `useDoctorSlots` - Fetch doctor slots with auto-refresh
- Automatic cache invalidation on mutations
- Auto-refresh for slot availability (every 30 seconds)

### 4. TypeScript Types
Complete type definitions for:
- User, Doctor, Slot, Appointment
- FamilyMember, Payment, MedicalRecord
- Message, Feedback, Setting
- API responses and errors
- Service function parameters

### 5. Utility Functions
- **Validators**: Email, mobile, password, date, time validation
- **Formatters**: Date, time, currency, file size formatting
- **Constants**: API URLs, roles, statuses, enums

### 6. Tailwind CSS
- Configured with PostCSS
- Utility-first CSS framework
- Responsive design ready
- Dark mode support ready

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Next Steps

The following tasks are ready to be implemented:

1. **Task 25**: Common Components (Button, Input, Modal, Loader, Notification)
2. **Task 26**: Authentication Pages (Login, Register)
3. **Task 27**: Patient Booking Flow
4. **Task 28**: Patient Dashboard
5. **Task 29**: Family Member Management
6. **Task 30**: Admin Dashboard
7. **Task 31**: Staff Interface
8. **Task 32**: Messaging Interface
9. **Task 33**: Feedback Interface
10. **Task 34**: Notification System
11. **Task 35**: Error Handling and Loading States
12. **Task 36**: Responsive Design and Accessibility

## API Integration

The frontend is configured to connect to the Laravel backend API at `http://localhost:8000/api`. All API calls include:
- Automatic authentication token attachment
- Error handling for 401 (unauthorized), 422 (validation), and 500+ (server errors)
- Network error handling
- Automatic redirect to login on authentication failure

## Authentication Flow

1. User submits login/register form
2. API service sends request to backend
3. Backend returns token and user data
4. Token stored in localStorage
5. User state updated in AuthContext
6. Token automatically attached to all subsequent requests
7. On 401 error, token cleared and user redirected to login

## State Management

- **Server State**: Managed by TanStack Query (React Query)
- **Authentication State**: Managed by AuthContext
- **UI State**: Managed by component-level useState
- **Form State**: Will be managed by form libraries (to be added in future tasks)

## Build Output

The production build creates optimized static files in the `dist/` directory:
- Minified JavaScript bundles
- Optimized CSS with Tailwind utilities
- Static assets (images, fonts)
- HTML entry point

Build size: ~295 KB (gzipped: ~96 KB)

## Notes

- All service functions return typed responses
- Error handling is centralized in the API interceptor
- Protected routes check authentication and role-based access
- Slot availability auto-refreshes every 30 seconds to prevent booking conflicts
- The project follows React and TypeScript best practices
- Code is organized by feature and responsibility
