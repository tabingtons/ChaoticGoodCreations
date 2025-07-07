// Nav hamburgerburger selections

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

// Parallax background effect
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const offset = window.scrollY * -0.25;
        document.querySelector('.parallax-layer').style.backgroundPosition = `center ${offset}px`;
        ticking = false;
      });
      ticking = true;
    }
  });
}