/**
 * Main app.js
 * Handles parallax effects
 * Note: All navigation functionality (burger menu and nav link clicks) 
 * is now handled in load-components.js
 */

// Optimized Parallax background effect
// Uses transform instead of background-position for better mobile performance
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    const parallaxLayer = document.querySelector('.parallax-layer');
    
    if (parallaxLayer) {
        // Use passive event listener for better scroll performance on mobile
        let ticking = false;
        let lastScrollY = 0;
        
        window.addEventListener('scroll', () => {
            lastScrollY = window.scrollY;
            
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // Use transform instead of background-position for GPU acceleration
                    // Negative value moves background UP (opposite direction), slower than scroll
                    // This creates the parallax effect where background moves slower than content
                    const offset = lastScrollY * -0.25;
                    parallaxLayer.style.transform = `translateY(${offset}px)`;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true }); // Passive listener improves scroll performance
    }
}