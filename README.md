# ChaoticGoodCreations

Source code for the Chaotic Good Creations website.

# Chaotic Good Creations

Source code for the Chaotic Good Creations website - a New Zealand-based design and development studio creating meaningful digital experiences.

## 🌐 Live Site

[chaoticgoodcreations.co](https://chaoticgoodcreations.co)

## 🏗️ Tech Stack

-   **HTML5** - Semantic markup
-   **CSS3** - Modular architecture with CSS custom properties
-   **JavaScript** - Vanilla JS with ES6+ features
-   **Flickity** - Carousel library
-   **Formspree** - Form handling
-   **Cal.com** - Booking integration

## 📁 Project Structure

```
├── assets/
│   ├── css/              → Modular CSS system
│   ├── js/               → JavaScript modules
│   ├── images/           → Image assets
│   └── icons/            → Favicons and icons
├── components/           → Reusable HTML components
├── digdeeper/            → Dig Deeper app landing page
├── per100/               → Per 100 app landing page
├── privacy/              → Privacy policy pages
├── work/                 → Case study pages
└── [page].html           → Main site pages
```

## 🎨 CSS Architecture

The site uses a modular CSS system. See [CSS-STRUCTURE.md](CSS-STRUCTURE.md) for details.

### Quick Start

All main site pages only need:

```html
<link rel="stylesheet" href="assets/css/main.css" />
```

## 🌙 Dark Mode

Automatic dark mode based on user's system preference (`prefers-color-scheme`).

## 🚀 Development

### Prerequisites

-   Web server (Live Server extension for VS Code recommended)
-   Modern browser with DevTools

### Local Development

1. Clone the repository
2. Open in your code editor
3. Use a local web server (Live Server, Python's http.server, etc.)
4. Navigate to `http://localhost:PORT`

### Testing Dark Mode

In Chrome DevTools:

1. Press F12
2. Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
3. Type "dark mode"
4. Select "Emulate CSS prefers-color-scheme: dark"

## 📱 App Landing Pages

-   **Dig Deeper** - Reflective journaling app
-   **Per 100** - Price comparison tool

These pages are self-contained with their own CSS.

## 🔧 Maintenance

### Updating Colors

Edit `assets/css/core/variables.css`

### Adding New Components

1. Create file in appropriate `assets/css/` subfolder
2. Add import to `assets/css/main.css`

### Updating Navigation/Footer

Edit HTML in `components/nav.html` or `components/footer.html`

## 📄 License

© 2025 Chaotic Good Creations. All rights reserved.

## 📧 Contact

hello@chaoticgoodcreations.co
