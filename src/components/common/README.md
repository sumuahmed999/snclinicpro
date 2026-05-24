# Common UI Components

This directory contains reusable UI components used throughout the application.

## Components

### Button

A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `isLoading`: boolean (default: false) - Shows loading spinner
- `fullWidth`: boolean (default: false) - Makes button full width
- All standard HTML button attributes

**Example:**
```tsx
import { Button } from '@/components/common';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="danger" isLoading={isSubmitting}>
  Delete
</Button>
```

### Input

An input component with label, validation error display, and helper text.

**Props:**
- `label`: string - Label text
- `error`: string - Error message to display
- `helperText`: string - Helper text below input
- `fullWidth`: boolean (default: false) - Makes input full width
- All standard HTML input attributes

**Example:**
```tsx
import { Input } from '@/components/common';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  required
  fullWidth
/>
```

### Modal

A modal dialog component with backdrop and close functionality.

**Props:**
- `isOpen`: boolean - Controls modal visibility
- `onClose`: () => void - Callback when modal closes
- `title`: string - Modal title
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `showCloseButton`: boolean (default: true)
- `children`: React.ReactNode - Modal content

**Example:**
```tsx
import { Modal, Button } from '@/components/common';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div className="mt-4 flex gap-2">
    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
  </div>
</Modal>
```

### Loader

A loading spinner component with multiple sizes and colors.

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `color`: 'primary' | 'secondary' | 'white' (default: 'primary')
- `fullScreen`: boolean (default: false) - Shows full-screen overlay
- `text`: string - Optional loading text

**Example:**
```tsx
import { Loader } from '@/components/common';

<Loader size="md" color="primary" />

<Loader fullScreen text="Loading..." />
```

### Notification

A toast notification component for displaying messages.

**Props:**
- `type`: 'success' | 'error' | 'warning' | 'info' (default: 'info')
- `title`: string - Notification title
- `message`: string - Notification message (required)
- `duration`: number (default: 5000) - Auto-dismiss duration in ms
- `onClose`: () => void - Callback when notification closes
- `position`: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' (default: 'top-right')

**Example:**
```tsx
import { Notification } from '@/components/common';

<Notification
  type="success"
  title="Success"
  message="Your appointment has been booked!"
  duration={5000}
  onClose={() => console.log('Notification closed')}
/>
```

### NotificationContainer

A container component for managing multiple notifications.

**Props:**
- `notifications`: NotificationItem[] - Array of notifications
- `onRemove`: (id: string) => void - Callback to remove notification
- `position`: NotificationProps['position'] - Position for all notifications

**Example:**
```tsx
import { NotificationContainer } from '@/components/common';
import { useState } from 'react';

const [notifications, setNotifications] = useState([]);

const addNotification = (notification) => {
  setNotifications([...notifications, { ...notification, id: Date.now().toString() }]);
};

const removeNotification = (id) => {
  setNotifications(notifications.filter(n => n.id !== id));
};

<NotificationContainer
  notifications={notifications}
  onRemove={removeNotification}
  position="top-right"
/>
```

## Usage with Context

For global notification management, consider creating a NotificationContext:

```tsx
// context/NotificationContext.tsx
import { createContext, useContext, useState } from 'react';
import { NotificationContainer, NotificationItem } from '@/components/common';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (notification: Omit<NotificationItem, 'id'>) => {
    const id = Date.now().toString();
    setNotifications([...notifications, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
```
