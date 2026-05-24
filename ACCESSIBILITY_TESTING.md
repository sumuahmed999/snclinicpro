# Accessibility Testing Guide

This guide provides step-by-step instructions for testing the accessibility features of the Clinic Management Portal.

## Quick Start

### Automated Testing Tools

1. **axe DevTools** (Browser Extension)
   - Install: [Chrome](https://chrome.google.com/webstore) | [Firefox](https://addons.mozilla.org/firefox)
   - Run: Open DevTools → axe DevTools tab → Scan All
   - Fix: Address all Critical and Serious issues

2. **Lighthouse** (Built into Chrome DevTools)
   - Open DevTools → Lighthouse tab
   - Select "Accessibility" category
   - Run audit
   - Aim for score of 90+

3. **WAVE** (Browser Extension)
   - Install: [Chrome](https://chrome.google.com/webstore) | [Firefox](https://addons.mozilla.org/firefox)
   - Click extension icon on any page
   - Review errors, alerts, and features

## Manual Testing Checklist

### Keyboard Navigation Testing

#### Basic Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab moves backward
- [ ] Focus indicators are visible
- [ ] Tab order is logical
- [ ] No keyboard traps

#### Specific Components
- [ ] **Header**: Tab through logo, nav links, user menu
- [ ] **Sidebar**: Tab through all navigation links
- [ ] **Forms**: Tab through inputs, buttons
- [ ] **Modals**: Focus trapped within modal, Escape closes
- [ ] **Tables**: Tab through action buttons
- [ ] **Dropdowns**: Arrow keys navigate, Enter selects

#### Keyboard Shortcuts
- [ ] Escape closes modals
- [ ] Escape closes dropdowns
- [ ] Enter submits forms
- [ ] Space activates buttons

### Screen Reader Testing

#### Windows (NVDA - Free)
1. Download from [nvaccess.org](https://www.nvaccess.org/)
2. Install and start NVDA
3. Navigate with:
   - Tab: Next interactive element
   - H: Next heading
   - L: Next link
   - B: Next button
   - F: Next form field

#### macOS (VoiceOver - Built-in)
1. Enable: System Preferences → Accessibility → VoiceOver
2. Start: Cmd+F5
3. Navigate with:
   - VO+Right Arrow: Next item
   - VO+Left Arrow: Previous item
   - VO+Space: Activate
   - VO+H: Next heading

#### What to Test
- [ ] Page title is announced
- [ ] Headings are announced with level
- [ ] Links announce their purpose
- [ ] Buttons announce their action
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Modal dialogs are announced
- [ ] Images have alt text

### Visual Testing

#### Focus Indicators
- [ ] All interactive elements show focus
- [ ] Focus ring is visible (2px blue ring)
- [ ] Focus ring has sufficient contrast
- [ ] Focus order is logical

#### Color Contrast
- [ ] Text has 4.5:1 contrast ratio (normal text)
- [ ] Large text has 3:1 contrast ratio
- [ ] Interactive elements have 3:1 contrast
- [ ] Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

#### Touch Targets
- [ ] All buttons are at least 44x44px
- [ ] Links have adequate spacing
- [ ] Form inputs are large enough
- [ ] Mobile tap targets don't overlap

#### Zoom and Scaling
- [ ] Page works at 200% zoom
- [ ] No horizontal scrolling at 200% zoom
- [ ] Text remains readable
- [ ] Layout doesn't break

### Form Testing

#### Labels and Instructions
- [ ] All inputs have visible labels
- [ ] Labels are associated with inputs (htmlFor)
- [ ] Required fields are indicated
- [ ] Instructions are clear

#### Error Handling
- [ ] Errors are announced to screen readers
- [ ] Error messages are descriptive
- [ ] Errors are associated with fields (aria-describedby)
- [ ] Fields are marked invalid (aria-invalid)

#### Validation
- [ ] Inline validation works
- [ ] Submit validation works
- [ ] Success messages are announced
- [ ] Focus moves to first error

### Component-Specific Testing

#### Header
- [ ] Logo link has accessible name
- [ ] Navigation has aria-label
- [ ] Mobile menu button has aria-label
- [ ] Mobile menu has aria-expanded
- [ ] Skip to main content link works

#### Sidebar
- [ ] Navigation has aria-label
- [ ] Active link is indicated
- [ ] Close button has aria-label
- [ ] Keyboard accessible

#### Modal
- [ ] Has role="dialog"
- [ ] Has aria-modal="true"
- [ ] Title has aria-labelledby
- [ ] Focus trapped within modal
- [ ] Focus restored on close
- [ ] Escape closes modal

#### Tables
- [ ] Headers have scope="col"
- [ ] Caption or aria-label present
- [ ] Mobile card view is accessible
- [ ] Action buttons are labeled

#### Buttons
- [ ] Have accessible names
- [ ] Loading state is announced
- [ ] Disabled state is indicated
- [ ] Icon-only buttons have aria-label

#### Forms
- [ ] Labels are associated
- [ ] Errors are announced
- [ ] Required fields indicated
- [ ] Helper text is associated

## Testing Scenarios

### Scenario 1: Login Flow
1. Navigate to login page with keyboard
2. Tab to email field
3. Enter email
4. Tab to password field
5. Enter password
6. Tab to submit button
7. Press Enter
8. Verify error messages are announced
9. Verify success redirects properly

### Scenario 2: Booking Appointment
1. Navigate to booking page
2. Select doctor with keyboard
3. Select date with keyboard
4. Select time slot with keyboard
5. Submit form
6. Verify confirmation is announced
7. Verify focus management

### Scenario 3: Mobile Navigation
1. Resize to mobile viewport
2. Tab to hamburger menu
3. Press Enter to open
4. Tab through menu items
5. Press Escape to close
6. Verify focus returns to button

### Scenario 4: Form Validation
1. Navigate to registration form
2. Submit empty form
3. Verify errors are announced
4. Verify focus moves to first error
5. Fix errors
6. Submit successfully
7. Verify success message

## Common Issues and Fixes

### Issue: Focus not visible
**Fix**: Add focus-visible styles in CSS
```css
*:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

### Issue: Screen reader not announcing changes
**Fix**: Add aria-live region
```tsx
<div role="status" aria-live="polite">
  {message}
</div>
```

### Issue: Modal focus not trapped
**Fix**: Implement focus trap in useEffect
```tsx
useEffect(() => {
  if (isOpen) {
    modalRef.current?.focus();
  }
}, [isOpen]);
```

### Issue: Form errors not announced
**Fix**: Add aria-describedby and role="alert"
```tsx
<input aria-describedby="error-id" aria-invalid={hasError} />
<p id="error-id" role="alert">{error}</p>
```

## Accessibility Checklist Summary

### Must Have (Critical)
- [ ] All functionality available via keyboard
- [ ] Focus indicators visible
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Images have alt text
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets at least 44x44px

### Should Have (Important)
- [ ] Skip to main content link
- [ ] ARIA landmarks (header, nav, main, footer)
- [ ] Heading hierarchy (h1, h2, h3)
- [ ] Loading states announced
- [ ] Modal focus management
- [ ] Responsive design works

### Nice to Have (Enhancement)
- [ ] Keyboard shortcuts
- [ ] High contrast mode support
- [ ] Reduced motion support
- [ ] Language selection
- [ ] Custom focus styles
- [ ] Breadcrumb navigation

## Resources

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Learning
- [A11y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Google Web Fundamentals](https://developers.google.com/web/fundamentals/accessibility)

## Reporting Issues

When reporting accessibility issues, include:
1. **Issue**: What's wrong
2. **Impact**: Who is affected
3. **Location**: Where it occurs
4. **Steps**: How to reproduce
5. **Expected**: What should happen
6. **Actual**: What actually happens
7. **WCAG**: Which guideline it violates
8. **Priority**: Critical/High/Medium/Low

Example:
```
Issue: Login button not keyboard accessible
Impact: Keyboard users cannot log in
Location: /login page
Steps: 1. Tab to login button 2. Press Enter
Expected: Form submits
Actual: Nothing happens
WCAG: 2.1.1 Keyboard (Level A)
Priority: Critical
```
