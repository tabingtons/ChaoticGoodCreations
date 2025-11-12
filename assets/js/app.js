// ============================================
// MOBILE-OPTIMIZED PARALLAX EFFECT
// Smooth parallax scrolling for all devices
// ============================================

(function() {
    // Get the parallax layer
    const parallaxLayer = document.getElementById('memphis');
    
    // Only run parallax if the element exists
    if (!parallaxLayer) return;
    
    // Detect if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    // Performance optimization variables
    let ticking = false;
    let lastScrollY = 0;
    
    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Different parallax speeds for desktop vs mobile
    const parallaxSpeed = isMobile ? 0.3 : 0.5; // Slower on mobile for better performance
    
    /**
     * Updates the parallax transform
     * Uses transform3d for GPU acceleration
     */
    function updateParallax() {
        // Calculate the parallax offset
        const scrollY = window.pageYOffset || window.scrollY;
        const offset = scrollY * parallaxSpeed;
        
        // Apply transform using GPU-accelerated 3D transform
        // translate3d is faster than translateY alone
        parallaxLayer.style.transform = `translate3d(0, ${offset}px, 0)`;
        
        // Reset ticking flag
        ticking = false;
        lastScrollY = scrollY;
    }
    
    /**
     * Request animation frame for smooth scrolling
     * This throttles updates to match the browser's refresh rate
     */
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    /**
     * Passive scroll listener for better performance
     * Passive: true prevents scroll blocking
     */
    function onScroll() {
        requestTick();
    }
    
    // Add scroll listener with passive flag for better mobile performance
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Initialize parallax position on page load
    updateParallax();
    
    // Re-calculate on window resize (for orientation changes on mobile)
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            updateParallax();
        }, 150);
    }, { passive: true });
    
})();

// ============================================
// ADDITIONAL MOBILE OPTIMIZATION
// Reduce parallax range on very small screens
// ============================================

(function() {
    const parallaxLayer = document.getElementById('memphis');
    if (!parallaxLayer) return;
    
    // On very small screens (< 480px), reduce the background size further
    function optimizeForScreenSize() {
        if (window.innerWidth < 480) {
            parallaxLayer.style.backgroundSize = '800px auto';
        } else if (window.innerWidth < 720) {
            parallaxLayer.style.backgroundSize = '1000px auto';
        } else {
            parallaxLayer.style.backgroundSize = '2000px auto';
        }
    }
    
    // Run on load
    optimizeForScreenSize();
    
    // Run on resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(optimizeForScreenSize, 150);
    }, { passive: true });
    
})();