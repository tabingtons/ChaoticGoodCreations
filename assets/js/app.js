// ============================================
// PARALLAX EFFECT - DESKTOP ONLY
// Smooth parallax on desktop, static on mobile
// This is the most reliable cross-device solution
// ============================================

(function() {
    const parallaxLayer = document.getElementById('memphis');
    if (!parallaxLayer) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        parallaxLayer.style.transform = 'none';
        parallaxLayer.style.willChange = 'auto';
        return;
    }
    
    // Detect mobile devices OR small screens
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                     || window.innerWidth <= 720;
    
    // ============================================
    // MOBILE: No parallax - keep it static
    // ============================================
    if (isMobile) {
        // Keep background fixed but don't animate it
        parallaxLayer.style.transform = 'none';
        parallaxLayer.style.willChange = 'auto';
        parallaxLayer.style.transition = 'none';
        return; // Exit - no parallax on mobile
    }
    
    // ============================================
    // DESKTOP: Smooth JavaScript parallax
    // ============================================
    
    let ticking = false;
    
    // Negative value makes background scroll UP (same direction as page)
    // Lower absolute value = slower parallax
    // -0.3 means background moves 30% the speed of scroll
    const parallaxSpeed = -0.3;
    
    /**
     * Update parallax position smoothly
     * Runs at 60fps via requestAnimationFrame
     */
    function updateParallax() {
        const scrollY = window.pageYOffset || window.scrollY;
        
        // Calculate offset: negative value moves background UP as you scroll DOWN
        const offset = scrollY * parallaxSpeed;
        
        // Apply GPU-accelerated transform
        parallaxLayer.style.transform = `translate3d(0, ${offset}px, 0)`;
        
        ticking = false;
    }
    
    /**
     * Request animation frame to sync with browser refresh
     */
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    // Add smooth scroll listener (passive for performance)
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Initialize parallax on page load
    updateParallax();
    
    // Handle window resize (orientation change, etc.)
    let resizeTimeout;
    window.addEventListener('resize', function() {
        // Check if we switched to mobile size
        if (window.innerWidth <= 720) {
            parallaxLayer.style.transform = 'none';
            parallaxLayer.style.willChange = 'auto';
            window.removeEventListener('scroll', onScroll);
            return;
        }
        
        // Otherwise update parallax position
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateParallax, 150);
    }, { passive: true });
    
})();

// ============================================
// NOTES:
// - Mobile devices get a static background (no jitter)
// - Desktop devices get smooth parallax effect
// - Parallax scrolls UP with the page, just slower
// - Uses GPU acceleration for smooth performance
// - Respects user's reduced motion preferences
// ============================================