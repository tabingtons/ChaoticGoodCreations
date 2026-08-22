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

// ------------------------------------------------------------
// TelemetryDeck website conversion tracking
// ------------------------------------------------------------

(function () {

  function trackAppStoreClick() {

    if (typeof TelemetryDeck === "undefined") {
      return;
    }

    const path = window.location.pathname;

    let source = "homepage";
    let article = null;


    // Journal article pages
    if (path.includes("/journal/articles/")) {

      source = "article";

      if (path.includes("what-to-do-with-childrens-artwork")) {
        article = "what-to-do-with-childrens-artwork";
      }

      else if (path.includes("why-childrens-artwork-matters")) {
        article = "why-childrens-artwork-matters";
      }

      else if (path.includes("why-revisiting-memories-matters")) {
        article = "why-revisiting-memories-matters";
      }

      else if (path.includes("family-memories-privacy")) {
        article = "family-memories-privacy";
      }

    }

    // Journal index
    else if (path.includes("/journal")) {

      source = "journal";

    }


    const parameters = {
      source: source
    };


    if (article) {
      parameters.article = article;
    }


    TelemetryDeck.signal(
      "Website.appStore.click",
      parameters
    );

  }


  document
    .querySelectorAll('a[href*="apps.apple.com"]')
    .forEach(link => {

      link.addEventListener(
        "click",
        trackAppStoreClick
      );

    });


})();