# CSS Architecture Guide

## Overview

This site uses a modular CSS architecture with a single entry point (`main.css`) that imports all other stylesheets.

## File Structure

```
assets/css/
├── main.css                    → Single entry point (import this in HTML)
├── flickity.css                → Third-party carousel library
├── app-rating-styles.css       → Star rating component
│
├── core/                       → Foundation styles
│   ├── variables.css          → Design tokens (colors, spacing, typography)
│   ├── reset.css              → Browser normalization
│   ├── typography.css         → Font styles and headings
│   ├── base.css               → Base element styles
│   └── dark-mode.css          → Dark mode overrides
│
├── layout/                     → Structural components
│   ├── navigation.css         → Main navigation
│   ├── footer.css             → Site footer
│   └── sections.css           → Section layouts
│
├── components/                 → Reusable UI elements
│   ├── buttons.css            → All button styles
│   ├── cards.css              → Card components
│   └── forms.css              → Form elements
│
├── utilities/                  → Helper classes
│   └── utilities.css          → Single-purpose utilities
│
└── pages/                      → Page-specific styles
    ├── case-study.css         → Portfolio/work pages
    └── booking.css            → Contact/booking page
```

## How to Use

### Adding Styles to HTML

Only one CSS link needed for main site pages:

<link rel="stylesheet" href="assets/css/main.css" />

### Changing Colors

Edit `assets/css/core/variables.css` - all colors are defined there as CSS custom properties.

### Adding New Components

1. Create new file in appropriate folder (components/, pages/, etc.)
2. Add `@import 'folder/filename.css';` to `main.css`

### Dark Mode

Automatically activates based on user's system preference. Styles in `core/dark-mode.css`.

## App Landing Pages

These are self-contained and use their own CSS:

-   `digdeeper/digdeeper.css` - Dig Deeper app page
-   `per100/per100.css` - Per 100 app page

## Best Practices

1. **Use CSS variables** - Defined in `variables.css`
2. **Follow BEM naming** - `.block`, `.block__element`, `.block--modifier`
3. **Mobile-first** - Base styles for mobile, then add desktop styles
4. **Keep specificity low** - Avoid deep nesting and `!important`

## Need Help?

-   Check existing components for patterns to follow
-   All color/spacing values should use CSS variables
-   Test in both light and dark mode
