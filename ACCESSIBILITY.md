# Accessibility Guidelines

This document outlines the accessibility features implemented in the Clinic Management Portal frontend.

## Overview

The application follows WCAG 2.1 Level AA guidelines to ensure accessibility for all users, including those using assistive technologies.

## Key Accessibility Features

### 1. Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus indicators are visible on all focusable elements
- Tab order follows logical reading order
- Escape key closes modals and dropdowns
- Skip-to-main-content link for keyboard users

### 2. Screen Reader Support

- Semantic HTML elements (header, nav, main, footer)
- ARIA labels on interactive elements
- ARIA live regions for dynamic content
- ARIA roles for custom components
- Screen reader-only text for icon buttons

### 3. Visual Design

- Minimum touch target size: 44x44px
- Sufficient color contrast ratios
- Focus indicators with 2px ring
- Responsive text sizing
- Clear visual hierarchy

### 4. Forms

- Associated labels with form inputs
- Error messages linked via aria-describedby
- Required field indicators
- Validation feedback
- Helper text for complex inputs

### 5. Responsive Design

- Mobile-first approach
- Responsive navigation (hamburger menu on mobile)
- Tables convert to cards on mobile
- Touch-friendly tap targets
- Flexible layouts for all screen sizes

## Component Accessibility

### Button Component
- Proper ARIA attributes (aria-label, aria-busy, aria-disabled)
- Loading state announcements
- Minimum height for touch targets
- Active and focus states

### Input Component
- Label association with htmlFor
- Error announcements with role="alert"
- aria-invalid for validation states
- aria-describedby for helper text
- Unique IDs for each input

### Modal Component
- role="dialog" and aria-modal="true"
- Focus trap within modal
- Focus restoration on close
- Keyboard navigation (Escape to close)
- aria-labelledby for title

### Loader Component
- role="status" for loading indicators
- aria-live="polite" for updates
- Screen reader text
- Visual loading indicators

### ResponsiveTable Component
- Proper table semantics on desktop
- Card layout on mobile for better readability
- Column headers with scope="col"
- Hover states for rows

### Header Component
- Semantic header element
- Navigation with aria-label
- Mobile menu with aria-expanded
- Skip-to-main-content link

### Sidebar Component
- Navigation landmark with aria-label
- Active link indication
- Focus management
- Keyboard accessible

## Testing Recommendations

### Manual Testing
1. Test all functionality with keyboard only
2. Test with screen readers (NVDA, JAWS, VoiceOver)
3. Test on multiple screen sizes
4. Test with browser zoom (up to 200%)
5. Test with high contrast mode

### Automated Testing
1. Use axe DevTools browser extension
2. Run Lighthouse accessibility audits
3. Use WAVE browser extension
4. Validate HTML semantics

### Screen Reader Testing
- Windows: NVDA (free) or JAWS
- macOS: VoiceOver (built-in)
- Mobile: TalkBack (Android) or VoiceOver (iOS)

## Common Patterns

### Skip Links
```tsx
<a href="#main-content" className="skip-to-main">
  Skip to main content
</a>
```

### ARIA Labels
```tsx
<button aria-label="Close modal" onClick={onClose}>
  <XIcon />
</button>
```

### Form Labels
```tsx
<label htmlFor="email">Email</label>
<input 
  id="email" 
  type="email"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
<p id="email-error" role="alert">{error}</p>
```

### Loading States
```tsx
<div role="status" aria-live="polite">
  <Loader />
  <span className="sr-only">Loading...</span>
</div>
```

## CSS Classes

### Screen Reader Only
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Focus Indicators
```css
*:focus-visible {
  outline: none;
  ring: 2px solid blue;
  ring-offset: 2px;
}
```

### Touch Targets
```css
.tap-target {
  min-height: 44px;
  min-width: 44px;
}
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

## Future Improvements

- [ ] Add more comprehensive keyboard shortcuts
- [ ] Implement focus management for complex interactions
- [ ] Add high contrast theme support
- [ ] Implement reduced motion preferences
- [ ] Add language selection support
- [ ] Improve error recovery mechanisms
