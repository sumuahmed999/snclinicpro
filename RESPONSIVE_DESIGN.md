# Responsive Design Guidelines

This document outlines the responsive design approach used in the Clinic Management Portal.

## Design Philosophy

The application follows a **mobile-first** design approach, ensuring optimal experience across all device sizes.

## Breakpoints

We use Tailwind CSS default breakpoints:

```
sm: 640px   // Small tablets and large phones
md: 768px   // Tablets
lg: 1024px  // Laptops and small desktops
xl: 1280px  // Large desktops
2xl: 1536px // Extra large screens
```

## Responsive Patterns

### 1. Navigation

#### Desktop (lg+)
- Horizontal navigation in header
- Visible sidebar for authenticated users
- Full menu items with labels

#### Mobile (< lg)
- Hamburger menu in header
- Collapsible mobile menu
- Sidebar hidden by default
- Floating action button to open sidebar

### 2. Tables

#### Desktop (md+)
- Traditional table layout
- All columns visible
- Horizontal scrolling if needed

#### Mobile (< md)
- Card-based layout
- Stacked information
- Key data prioritized
- Actions easily accessible

Example usage:
```tsx
<ResponsiveTable
  data={items}
  columns={columns}
  keyExtractor={(item) => item.id}
  mobileCardRender={(item) => (
    <div>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </div>
  )}
/>
```

### 3. Forms

#### Desktop
- Multi-column layouts (2-3 columns)
- Side-by-side fields
- Larger input sizes

#### Mobile
- Single column layout
- Full-width inputs
- Stacked fields
- Touch-friendly spacing

### 4. Modals

#### Desktop
- Centered on screen
- Fixed max-width
- Padding around edges

#### Mobile
- Full-width or near full-width
- Responsive padding (sm:px-6 px-4)
- Scrollable content
- Touch-friendly close buttons

### 5. Cards and Grids

#### Desktop
- Multi-column grids (2-4 columns)
- Fixed card sizes
- Hover effects

#### Mobile
- Single column
- Full-width cards
- Touch-friendly tap targets
- Reduced spacing

## Responsive Utilities

### Text Sizing
```tsx
// Responsive text classes
text-responsive-xs   // text-xs sm:text-sm
text-responsive-sm   // text-sm sm:text-base
text-responsive-base // text-base sm:text-lg
text-responsive-lg   // text-lg sm:text-xl
text-responsive-xl   // text-xl sm:text-2xl
text-responsive-2xl  // text-2xl sm:text-3xl
```

### Spacing
```tsx
// Responsive spacing
space-responsive // space-y-4 sm:space-y-6
gap-responsive   // gap-4 sm:gap-6
```

### Layout
```tsx
// Common responsive patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

<div className="flex flex-col md:flex-row gap-4">
  {/* Stacked on mobile, side-by-side on desktop */}
</div>
```

## Component Responsive Behavior

### Header
- Logo: Smaller on mobile (text-xl sm:text-2xl)
- Navigation: Hidden on mobile (< lg), shown in hamburger menu
- User info: Hidden on small screens (< md)
- Actions: Always visible, compact on mobile

### Sidebar
- Desktop: Static, always visible
- Mobile: Fixed overlay, toggled by button
- Backdrop: Only on mobile when open
- Transitions: Smooth slide animation

### Layout
- Container: max-w-7xl with responsive padding
- Main content: Full width on mobile, constrained on desktop
- Spacing: Reduced on mobile (py-6 sm:py-8)

### Buttons
- Size: Minimum 44x44px for touch targets
- Text: May be hidden on mobile, icon-only
- Spacing: Increased padding on mobile

### Forms
- Labels: Always visible
- Inputs: Full width on mobile
- Buttons: Full width on mobile, auto on desktop
- Grid: Single column on mobile, multi-column on desktop

## Testing Checklist

### Screen Sizes to Test
- [ ] Mobile portrait (320px - 480px)
- [ ] Mobile landscape (480px - 768px)
- [ ] Tablet portrait (768px - 1024px)
- [ ] Tablet landscape (1024px - 1280px)
- [ ] Desktop (1280px+)

### Features to Test
- [ ] Navigation works on all sizes
- [ ] Forms are usable on mobile
- [ ] Tables/lists are readable on mobile
- [ ] Modals fit on screen
- [ ] Touch targets are large enough (44x44px minimum)
- [ ] Text is readable without zooming
- [ ] Images scale appropriately
- [ ] No horizontal scrolling (except tables)

### Browser Testing
- [ ] Chrome (mobile and desktop)
- [ ] Safari (iOS and macOS)
- [ ] Firefox
- [ ] Edge
- [ ] Samsung Internet (Android)

## Best Practices

### 1. Mobile-First CSS
Write styles for mobile first, then add breakpoints for larger screens:
```tsx
// Good
className="text-sm md:text-base lg:text-lg"

// Avoid
className="text-lg md:text-base sm:text-sm"
```

### 2. Touch Targets
Ensure all interactive elements are at least 44x44px:
```tsx
className="min-h-[44px] min-w-[44px] tap-target"
```

### 3. Flexible Layouts
Use flexbox and grid for flexible layouts:
```tsx
className="flex flex-col md:flex-row"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### 4. Responsive Images
Use responsive image techniques:
```tsx
<img 
  src={image} 
  alt="Description"
  className="w-full h-auto"
/>
```

### 5. Conditional Rendering
Hide/show elements based on screen size:
```tsx
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>
```

### 6. Responsive Typography
Use relative units and responsive classes:
```tsx
className="text-base sm:text-lg lg:text-xl leading-relaxed"
```

## Performance Considerations

### 1. Image Optimization
- Use appropriate image sizes for different screens
- Implement lazy loading
- Use modern formats (WebP, AVIF)

### 2. Code Splitting
- Load mobile-specific code only on mobile
- Lazy load components not immediately visible

### 3. CSS Optimization
- Use Tailwind's purge feature
- Minimize custom CSS
- Avoid large CSS frameworks

## Common Responsive Patterns

### Responsive Container
```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
  {/* Items */}
</div>
```

### Responsive Flex
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
  {/* Items */}
</div>
```

### Responsive Spacing
```tsx
<div className="p-4 sm:p-6 lg:p-8">
  {/* Content */}
</div>
```

### Responsive Text
```tsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Title
</h1>
```

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [Responsive Design Checker](https://responsivedesignchecker.com/)
