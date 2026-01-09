# 🎨 Design System Quick Reference

## Color Palette

### CSS Custom Properties
```css
--forest-green: 77, 124, 54;
--bark-brown: 93, 64, 55;
--warm-cream: 255, 248, 240;
--soft-sage: 225, 247, 250;
--golden-sun: 255, 215, 0;
```

### Usage in Tailwind
```jsx
{/* Using RGB values */}
<div className="bg-[rgb(77,124,54)]" />
<div className="text-[rgb(93,64,55)]" />

{/* Or use the hex equivalents */}
<div className="bg-[#4d7c36]" /> {/* Forest Green */}
<div className="bg-[#5D4037]" /> {/* Bark Brown */}
<div className="bg-[#fff8f0]" /> {/* Warm Cream */}
```

## Gradient Presets

### Nature Gradient (Background)
```css
background: var(--gradient-nature);
/* or */
background: linear-gradient(135deg, #e0f7fa 0%, #f1f8e9 50%, #fff3e0 100%);
```

### Wood Gradient
```css
background: var(--gradient-wood);
/* or */
background: linear-gradient(135deg, #5D4037 0%, #795548 50%, #3E2723 100%);
```

### Premium Gradient (Buttons)
```css
background: var(--gradient-premium);
/* or */
background: linear-gradient(135deg, #4d7c36 0%, #5D4037 100%);
```

## Component Classes

### Glass Card
```jsx
<div className="glass-card">
  {/* Your content */}
</div>
```

**What it does:**
- Semi-transparent white background
- Backdrop blur (20px)
- Subtle border
- Medium shadow
- 1rem border radius

### Premium Button
```jsx
<button className="btn-premium">
  Click Me
</button>
```

**Features:**
- Premium gradient background
- White text
- Padding: 1.5rem x 1.5rem (top/bottom x left/right)
- Rounded full
- Hover: Lifts up 2px
- Active: Returns to original position
- Premium shadow on hover

### Hover Lift
```jsx
<div className="hover-lift">
  {/* Any card or element */}
</div>
```

**Effect:**
- Smooth transition
- Lifts 4px on hover
- Large shadow on hover

### Premium Badge
```jsx
<span className="badge-premium">
  Score: 100
</span>
```

**Styling:**
- Golden gradient (yellow-orange)
- Rounded full
- White text
- Glowing shadow

### Gradient Text
```jsx
<h1 className="text-gradient-nature">
  Roots of You
</h1>
```

**Effect:**
- Forest green to bark brown gradient
- Text becomes transparent to show gradient

## Animations

### Float Animation
```jsx
<div className="animate-float">
  {/* Floats up and down */}
</div>
```

**Behavior:** 6s ease-in-out infinite, -20px vertical movement

### Glow Animation
```jsx
<div className="animate-glow">
  {/* Pulses with green glow */}
</div>
```

**Behavior:** 2s alternating glow effect

### Soft Pulse
```jsx
<div className="animate-pulse-soft">
  {/* Gentle opacity pulse */}
</div>
```

**Behavior:** 3s opacity fade (1.0 ↔ 0.7)

## Shadow System

```css
var(--shadow-soft)     /* 0 2px 8px rgba(0,0,0,0.08) */
var(--shadow-medium)   /* 0 4px 16px rgba(0,0,0,0.12) */
var(--shadow-large)    /* 0 8px 32px rgba(0,0,0,0.16) */
var(--shadow-premium)  /* 0 12px 48px rgba(77,124,54,0.25) */
```

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Headings
```jsx
<h1 className="text-4xl font-bold">Title</h1>
<h2 className="text-2xl font-bold">Subtitle</h2>
```

**Auto-applied:**
- Bold weight
- -0.02em letter spacing
- Better readability

## Common Patterns

### Error Card
```jsx
<div className="glass-card p-8 max-w-md text-center space-y-4">
  {/* Icon */}
  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
    <svg>...</svg>
  </div>
  
  {/* Content */}
  <div className="space-y-2">
    <h2 className="text-xl font-bold text-[#5D4037]">Error Title</h2>
    <p className="text-[#795548] text-sm">Error message</p>
  </div>
</div>
```

### Premium Action Button
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="btn-premium"
>
  Take Action
</motion.button>
```

### Info Card with Icon
```jsx
<div className="glass-card p-6 space-y-3">
  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4d7c36] to-[#5D4037] flex items-center justify-center">
    {/* Icon */}
  </div>
  <h3 className="text-lg font-semibold text-[#5D4037]">Title</h3>
  <p className="text-[#795548] text-sm">Description</p>
</div>
```

## Best Practices

1. **Consistency**: Use design tokens (CSS custom properties) instead of hardcoded values
2. **Hierarchy**: Use the shadow system to show depth and importance
3. **Readability**: Stick to Inter font with appropriate sizes (14px-24px for body)
4. **Spacing**: Use Tailwind's spacing scale (space-y-4, p-8, etc.)
5. **Colors**: Prefer nature palette colors for brand consistency
6. **Animations**: Use sparingly for micro-interactions
7. **Glass Effect**: Apply to cards and overlays for premium feel

## Responsive Design

```jsx
{/* Mobile first, then larger screens */}
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    Responsive Heading
  </h1>
</div>
```

## Accessibility

- ✅ Sufficient color contrast ratios
- ✅ Focus states on interactive elements
- ✅ Readable font sizes (minimum 14px)
- ✅ Clear visual hierarchy
- 🔄 Consider adding focus-visible styles for keyboard navigation

---

**Quick Tip**: Combine multiple utility classes for custom components while maintaining design system consistency!
