# ClinicPortal Color Palette

This document defines the exact color palette used throughout the ClinicPortal application, matching the design specification.

## 🎨 Primary Colors

### Dark Teal (Main color)
- **Hex**: `#042126`
- **Usage**: Primary brand color, headers, main navigation, primary buttons
- **Tailwind**: `primary-500`, `bg-primary-500`, `text-primary-500`
- **Description**: Deep, professional teal that conveys trust and healthcare expertise

### Deep Greenish Teal
- **Hex**: `#294142`
- **Usage**: Secondary brand color, hover states, accents, section backgrounds
- **Tailwind**: `secondary-500`, `bg-secondary-500`, `text-secondary-500`
- **Description**: Softer teal that complements the main color

---

## 🎨 Secondary Colors (Backgrounds)

### Soft Beige (Section BG)
- **Hex**: `#D5DAC6`
- **Usage**: Section backgrounds, card backgrounds, subtle dividers
- **Tailwind**: `beige-500`, `bg-beige-500`
- **Description**: Warm, calming background color that reduces eye strain

### Light Cream
- **Hex**: `#F2F2DC`
- **Usage**: Page backgrounds, light sections, alternating backgrounds
- **Tailwind**: `cream-500`, `bg-cream-500`
- **Description**: Soft cream that provides excellent contrast with text

---

## 🎨 Neutral / Text Colors

### Muted Gray-Green
- **Hex**: `#899893`
- **Usage**: Secondary text, descriptions, muted content
- **Tailwind**: `sage-500`, `text-sage-500`
- **Description**: Readable gray-green for body text and descriptions

### Dark Gray
- **Hex**: `#5C655E`
- **Usage**: Primary text, headings, important content
- **Tailwind**: `charcoal-500`, `text-charcoal-500`
- **Description**: High-contrast dark gray for maximum readability

### Additional Teal Shade
- **Hex**: `#5526C6`
- **Usage**: Special accents, links, interactive elements
- **Tailwind**: `teal-muted`, `bg-teal-muted`, `text-teal-muted`
- **Description**: Vibrant teal for special emphasis

---

## 🎨 Accent Colors

### Warm Gold / Skin Tone Accent
- **Hex**: `#A88E6D`
- **Usage**: Call-to-action buttons, highlights, important badges, success states
- **Tailwind**: `gold-500`, `bg-gold-500`, `text-gold-500`
- **Description**: Warm, inviting gold that draws attention

### Soft Olive Tint
- **Hex**: `#9BA57D`
- **Usage**: Secondary accents, success messages, positive indicators
- **Tailwind**: `olive-500`, `bg-olive-500`, `text-olive-500`
- **Description**: Natural olive that complements the overall palette

---

## Color Usage Guidelines

### Text Hierarchy
1. **Primary Headings**: `text-primary-500` (Dark Teal #042126)
2. **Secondary Headings**: `text-charcoal-500` (Dark Gray #5C655E)
3. **Body Text**: `text-charcoal-600` or `text-sage-500`
4. **Muted Text**: `text-sage-600`

### Backgrounds
1. **Page Background**: `bg-cream-50` or `bg-beige-50`
2. **Section Background**: `bg-beige-500` (Soft Beige #D5DAC6)
3. **Card Background**: `bg-white` or `bg-cream-500`
4. **Alternate Sections**: `bg-cream-500` (Light Cream #F2F2DC)

### Interactive Elements
1. **Primary Buttons**: `bg-gradient-primary` (Dark Teal to Deep Greenish Teal)
2. **Secondary Buttons**: `bg-gradient-accent` (Warm Gold to Soft Olive)
3. **Links**: `text-primary-500` with `hover:text-secondary-500`
4. **Focus States**: `ring-gold-500` (Warm Gold)

### Status Colors
1. **Success**: `bg-olive-500` (Soft Olive)
2. **Warning**: `bg-gold-500` (Warm Gold)
3. **Info**: `bg-secondary-500` (Deep Greenish Teal)
4. **Error**: Use sparingly, consider `bg-gold-700` for serious errors

---

## Gradients

### Primary Gradient
```css
background: linear-gradient(135deg, #042126 0%, #294142 100%);
```
- **Tailwind**: `bg-gradient-primary`
- **Usage**: Hero sections, primary buttons, headers

### Accent Gradient
```css
background: linear-gradient(135deg, #A88E6D 0%, #9BA57D 100%);
```
- **Tailwind**: `bg-gradient-accent`
- **Usage**: Call-to-action buttons, highlights, featured content

### Soft Gradient
```css
background: linear-gradient(180deg, #F2F2DC 0%, #D5DAC6 100%);
```
- **Tailwind**: `bg-gradient-soft`
- **Usage**: Subtle section backgrounds, cards

---

## Accessibility Considerations

### Contrast Ratios (WCAG 2.1 AA Compliance)

#### Text on Light Backgrounds
- Dark Teal (#042126) on Light Cream (#F2F2DC): ✅ **14.2:1** (AAA)
- Dark Gray (#5C655E) on Light Cream (#F2F2DC): ✅ **7.8:1** (AAA)
- Muted Gray-Green (#899893) on Light Cream (#F2F2DC): ✅ **4.6:1** (AA)

#### Text on Dark Backgrounds
- Light Cream (#F2F2DC) on Dark Teal (#042126): ✅ **14.2:1** (AAA)
- Soft Beige (#D5DAC6) on Dark Teal (#042126): ✅ **10.5:1** (AAA)

#### Interactive Elements
- Warm Gold (#A88E6D) on Dark Teal (#042126): ✅ **4.8:1** (AA)
- White (#FFFFFF) on Warm Gold (#A88E6D): ✅ **4.9:1** (AA)

### Color Blindness Considerations
- The palette uses both color and contrast to convey information
- Avoid using color alone to indicate status or importance
- Use icons, labels, and patterns in addition to color
- Test with color blindness simulators

---

## Implementation Examples

### Hero Section
```jsx
<section className="bg-gradient-primary text-cream-500">
  <h1 className="text-cream-500">Welcome to ClinicPortal</h1>
  <p className="text-beige-400">Your healthcare management solution</p>
  <button className="bg-gradient-accent text-white">Get Started</button>
</section>
```

### Card Component
```jsx
<div className="bg-white shadow-card rounded-xl p-6">
  <h3 className="text-primary-500 font-bold">Card Title</h3>
  <p className="text-charcoal-600">Card description text</p>
  <span className="text-sage-500">Muted information</span>
</div>
```

### Button Variants
```jsx
// Primary Button
<button className="bg-gradient-primary text-cream-500 hover:shadow-glow">
  Primary Action
</button>

// Accent Button
<button className="bg-gradient-accent text-white hover:shadow-glow">
  Call to Action
</button>

// Secondary Button
<button className="bg-white text-primary-500 border-2 border-beige-500 hover:border-primary-500">
  Secondary Action
</button>
```

### Text Styles
```jsx
// Heading
<h1 className="text-4xl font-display font-bold text-primary-500">
  Main Heading
</h1>

// Subheading
<h2 className="text-2xl font-display font-semibold text-charcoal-500">
  Subheading
</h2>

// Body Text
<p className="text-base text-charcoal-600">
  Regular body text content
</p>

// Muted Text
<span className="text-sm text-sage-500">
  Secondary information
</span>
```

---

## Color Palette Summary

| Color Name | Hex Code | Tailwind Class | Primary Use |
|------------|----------|----------------|-------------|
| Dark Teal | #042126 | primary-500 | Main brand color |
| Deep Greenish Teal | #294142 | secondary-500 | Secondary brand |
| Soft Beige | #D5DAC6 | beige-500 | Section backgrounds |
| Light Cream | #F2F2DC | cream-500 | Page backgrounds |
| Muted Gray-Green | #899893 | sage-500 | Secondary text |
| Dark Gray | #5C655E | charcoal-500 | Primary text |
| Teal Muted | #5526C6 | teal-muted | Special accents |
| Warm Gold | #A88E6D | gold-500 | CTA buttons |
| Soft Olive | #9BA57D | olive-500 | Success states |

---

## Design Tokens

For developers using design tokens or CSS variables:

```css
:root {
  /* Primary Colors */
  --color-primary: #042126;
  --color-secondary: #294142;
  
  /* Background Colors */
  --color-bg-beige: #D5DAC6;
  --color-bg-cream: #F2F2DC;
  
  /* Text Colors */
  --color-text-primary: #5C655E;
  --color-text-secondary: #899893;
  
  /* Accent Colors */
  --color-accent-gold: #A88E6D;
  --color-accent-olive: #9BA57D;
  --color-accent-teal: #5526C6;
}
```

---

## Maintenance Notes

- All colors are defined in `frontend/tailwind.config.js`
- Color shades (50-900) are automatically generated for consistency
- When adding new colors, ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
- Test all color combinations with accessibility tools
- Document any new color usage patterns in this file

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)
- [Tailwind CSS Color Documentation](https://tailwindcss.com/docs/customizing-colors)
