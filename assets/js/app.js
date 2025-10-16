// Nav hamburger selections
const burger = document.querySelector("#burger-menu");
const menu = document.querySelector("#menu");
const cross = document.querySelector("#cross");
const ul = document.querySelector("nav ul");
const nav = document.querySelector("nav");

burger.addEventListener("click", () => {
    ul.classList.toggle("show");
    menu.classList.toggle("show");
    cross.classList.toggle("show");
});

// Close hamburger menu when a link is clicked
// Select nav links
const navLink = document.querySelectorAll(".nav-link");

navLink.forEach((link) =>
    link.addEventListener("click", () => {
        ul.classList.remove("show");
        menu.classList.toggle("show");
        cross.classList.toggle("show");
    })
);

// Optimized Parallax background effect
// Uses transform instead of background-position for better mobile performance
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const parallaxLayer = document.querySelector('.parallax-layer');
  
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