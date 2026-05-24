# Staff Dashboard Redesign - Operations Focused

## Overview
Complete redesign of the Staff Dashboard to focus on fast daily clinic operations rather than patient-focused features.

## Key Differences from Patient Dashboard

### Patient Dashboard Focus:
- Personal appointments
- Booking for self/family
- Health records viewing
- Payment history
- Messages

### Staff Dashboard Focus:
- TODAY's all appointments (all patients)
- Quick actions (complete, cancel, call next)
- Real-time queue/token management
- Walk-in patient booking (instant)
- Patient search with history
- Upload prescriptions/reports
- Mark payments (cash/offline)
- Filters (date, doctor, status)
- Minimal clicks, fast workflow

## Implementation Plan

### 1. Main Dashboard View
- **Header**: Date selector, Quick filters (Doctor, Status)
- **Stats Cards**: Today's Total, Waiting, In Progress, Completed, Pending Payments
- **Quick Actions Bar**: Walk-in Booking, Search Patient, Upload Records
- **Appointments Table**: 
  - Token Number (large, prominent)
  - Patient Name
  - Doctor
  - Time
  - Status with color coding
  - Quick action buttons (Complete, Cancel, Call Next, View)
  - Payment status indicator

### 2. Queue/Token System
- Visual queue display
- Current token being served
- Next in queue
- Waiting count
- Call next patient button (prominent)

### 3. Walk-in Booking (Fast)
- Quick search or create patient
- Select doctor + available slot
- Assign token instantly
- Mark payment method
- Done in 3 clicks

### 4. Patient Search
- Search by name, mobile, token
- View patient history
- Recent appointments
- Medical records
- Quick actions from search

### 5. Quick Record Upload
- Select appointment
- Upload file
- Auto-link to appointment
- Done

### 6. Payment Management
- Mark as paid (cash/offline)
- View pending payments
- Quick payment collection
- No full financial control

### 7. Real-time Updates
- Auto-refresh appointments
- Live queue updates
- Status change notifications
- Minimal page reloads

## Design Principles
- **Speed First**: Everything in 1-3 clicks
- **Visual Clarity**: Color-coded statuses, large tokens
- **Minimal Navigation**: Everything on one screen
- **Real-time**: Live updates, no manual refresh
- **Limited Access**: No system settings, no full financial reports
- **Mobile Friendly**: Works on tablets at reception

## Status
- [ ] Redesign StaffDashboard.tsx
- [ ] Create QuickBooking component
- [ ] Create PatientSearch component
- [ ] Create QueueDisplay component
- [ ] Add real-time updates
- [ ] Test workflow speed
