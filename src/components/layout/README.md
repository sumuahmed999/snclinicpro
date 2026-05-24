# Layout Components

This directory contains the layout components for the Clinic Management Portal frontend.

## Components

### Header
The main navigation header displayed at the top of all pages.

**Features:**
- Logo and brand name
- Role-based navigation links (Patient, Staff, Admin)
- User menu with logout functionality
- Login/Register buttons for unauthenticated users
- Responsive design

**Usage:**
```tsx
import { Header } from './components/layout';

<Header />
```

### Sidebar
A collapsible sidebar for dashboard navigation.

**Features:**
- Role-based navigation links with icons
- Active link highlighting
- User profile display at bottom
- Mobile responsive (slide-in drawer)
- Close button for mobile view

**Usage:**
```tsx
import { Sidebar } from './components/layout';

<Sidebar isOpen={true} onClose={() => {}} />
```

### Footer
The footer displayed at the bottom of pages.

**Features:**
- About section
- Quick links
- Support links
- Social media links
- Copyright information

**Usage:**
```tsx
import { Footer } from './components/layout';

<Footer />
```

### Layout
The main layout wrapper that combines Header, Sidebar, and Footer.

**Features:**
- Responsive layout structure
- Optional sidebar and footer
- Mobile menu button
- Sidebar backdrop for mobile
- Content area with max-width container

**Props:**
- `children`: ReactNode - The page content
- `showSidebar`: boolean (default: true) - Show/hide sidebar
- `showFooter`: boolean (default: true) - Show/hide footer

**Usage:**
```tsx
import { Layout } from './components/layout';

<Layout showSidebar={true} showFooter={true}>
  <YourPageContent />
</Layout>
```

### RoleBasedLayout
A protected layout wrapper that enforces role-based access control.

**Features:**
- Authentication check
- Role-based authorization
- Automatic redirects for unauthorized access
- Loading state handling
- Wraps content in Layout component

**Props:**
- `children`: ReactNode - The page content
- `allowedRoles`: Array<'patient' | 'staff' | 'admin'> - Allowed user roles
- `showSidebar`: boolean (default: true) - Show/hide sidebar
- `showFooter`: boolean (default: true) - Show/hide footer

**Usage:**
```tsx
import { RoleBasedLayout } from './components/layout';

<RoleBasedLayout allowedRoles={['admin']}>
  <AdminDashboard />
</RoleBasedLayout>
```

### Convenience Wrappers

Pre-configured role-based layouts for common use cases:

#### PatientLayout
```tsx
import { PatientLayout } from './components/layout';

<PatientLayout>
  <PatientDashboard />
</PatientLayout>
```

#### StaffLayout
```tsx
import { StaffLayout } from './components/layout';

<StaffLayout>
  <StaffDashboard />
</StaffLayout>
```

#### AdminLayout
```tsx
import { AdminLayout } from './components/layout';

<AdminLayout>
  <AdminDashboard />
</AdminLayout>
```

#### StaffOrAdminLayout
```tsx
import { StaffOrAdminLayout } from './components/layout';

<StaffOrAdminLayout>
  <SharedStaffAdminPage />
</StaffOrAdminLayout>
```

## Navigation Structure

### Patient Navigation
- Dashboard
- My Appointments
- Book Appointment
- Family Members
- Messages

### Staff Navigation
- Dashboard
- Appointments
- Manual Booking
- Queue Management
- Patients
- Medical Records
- Messages

### Admin Navigation
- Dashboard
- Doctors
- Slots
- Appointments
- Patients
- Payments
- Feedback
- Settings

## Styling

All components use Tailwind CSS for styling with:
- Responsive breakpoints (sm, md, lg)
- Consistent color scheme (blue-600 primary)
- Hover states and transitions
- Accessible focus indicators
- Mobile-first approach

## Accessibility

- Semantic HTML elements
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Mobile Responsiveness

- Hamburger menu for mobile navigation
- Slide-in sidebar drawer
- Backdrop overlay
- Touch-friendly tap targets
- Responsive grid layouts
