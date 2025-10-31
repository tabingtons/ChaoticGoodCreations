/**
 * Component Loader - Smart Version
 * Automatically detects if running on Live Server or production
 * and uses appropriate paths
 */

// Detect if we're on Live Server (localhost/127.0.0.1) or production
function getComponentPath() {
    const isLocalHost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if (isLocalHost) {
        // For local development, calculate relative path based on actual file location
        const path = window.location.pathname;
        
        // Count directory levels (ignoring trailing slashes and filenames)
        // /index.html or / = 0 levels
        // /privacy/ or /privacy/index.html = 1 level
        // /work/project/ = 1 level
        // /work/project/detail/ = 2 levels
        
        const pathParts = path.split('/').filter(part => part.length > 0);
        
        // Remove filename if present
        if (pathParts.length > 0 && pathParts[pathParts.length - 1].includes('.')) {
            pathParts.pop();
        }
        
        const depth = pathParts.length;
        
        console.log('Path detection:', { path, pathParts, depth });
        
        if (depth === 0) {
            return './components/'; // Root level
        } else if (depth === 1) {
            return '../components/'; // One level deep (privacy/, work/, etc.)
        } else {
            return '../../components/'; // Two levels deep
        }
    } else {
        // Production: use absolute paths
        return '/components/';
    }
}

const componentPath = getComponentPath();

// Load navigation component
async function loadNav() {
    try {
        const response = await fetch(`${componentPath}nav.html`);
        const html = await response.text();
        const placeholder = document.getElementById('nav-placeholder');
        
        if (placeholder) {
            placeholder.innerHTML = html;
            // Wait for DOM to update, then initialize burger menu
            setTimeout(() => {
                initBurgerMenu();
            }, 50);
        }
    } catch (error) {
        console.error('Error loading navigation:', error);
        console.error('Tried to load from:', `${componentPath}nav.html`);
    }
}

// Load footer component
async function loadFooter() {
    try {
        const response = await fetch(`${componentPath}footer.html`);
        const html = await response.text();
        const placeholder = document.getElementById('footer-placeholder');
        
        if (placeholder) {
            placeholder.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading footer:', error);
        console.error('Tried to load from:', `${componentPath}footer.html`);
    }
}

// Initialize burger menu functionality
function initBurgerMenu() {
    const burger = document.getElementById('burger-menu');
    const menu = document.querySelector('nav ul');
    const menuIcon = document.getElementById('menu');
    const crossIcon = document.getElementById('cross');

    if (burger && menu && menuIcon && crossIcon) {
        // Toggle menu visibility on burger click
        burger.addEventListener('click', () => {
            menu.classList.toggle('show');
            menuIcon.classList.toggle('show');
            crossIcon.classList.toggle('show');
        });
        
        // Close menu when nav links are clicked
        initNavLinkClicks();
    }
}

// Close menu when nav links are clicked
function initNavLinkClicks() {
    const navLinks = document.querySelectorAll(".nav-link");
    const menu = document.querySelector('nav ul');
    const menuIcon = document.getElementById('menu');
    const crossIcon = document.getElementById('cross');
    
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            // Only close if menu is open (has 'show' class)
            if (menu && menu.classList.contains('show')) {
                menu.classList.remove('show');
                menuIcon.classList.add('show');
                crossIcon.classList.remove('show');
            }
        });
    });
}

// Load components when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadNav();
        loadFooter();
    });
} else {
    // DOM already loaded
    loadNav();
    loadFooter();
}