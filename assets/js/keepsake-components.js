async function loadKeepsakeComponent(elementId, componentPath) {
  const target = document.getElementById(elementId);

  if (!target) {
    return;
  }

  try {
    const response = await fetch(componentPath);

    if (!response.ok) {
      throw new Error(
        `Unable to load ${componentPath}: ${response.status}`
      );
    }

    target.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
  }
}


async function loadKeepsakeComponents() {
  await Promise.all([
    loadKeepsakeComponent(
      "keepsake-header",
      "/keepsake/partials/header.html"
    ),

    loadKeepsakeComponent(
      "keepsake-footer",
      "/keepsake/partials/footer.html"
    )
  ]);

  setActiveKeepsakeNavigation();
}


function setActiveKeepsakeNavigation() {
  const path = window.location.pathname;

  if (path.startsWith("/keepsake/journal")) {
    const journalLink = document.querySelector(
      '[data-nav-section="journal"]'
    );

    if (journalLink) {
      journalLink.classList.add("is-active");
      journalLink.setAttribute("aria-current", "page");
    }
  }
}


document.addEventListener(
  "DOMContentLoaded",
  loadKeepsakeComponents
);