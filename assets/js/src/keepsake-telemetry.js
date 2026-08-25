import TelemetryDeck from "@telemetrydeck/sdk";

const APP_ID = "C3D89652-51B1-44C3-9D3A-1B99E66B1E12";


// ------------------------------------------------------------
// Anonymous session identity
// ------------------------------------------------------------

function getSessionUserID() {
  const storageKey = "keepsakeTelemetrySessionID";

  let userID = sessionStorage.getItem(storageKey);

  if (!userID) {
    userID = crypto.randomUUID();
    sessionStorage.setItem(storageKey, userID);
  }

  return userID;
}


// ------------------------------------------------------------
// Initialise TelemetryDeck
// ------------------------------------------------------------

const td = new TelemetryDeck({
  appID: APP_ID,
  clientUser: getSessionUserID()
});


// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function getPageSource() {
  const path = window.location.pathname;

  if (path.includes("/journal/articles/")) {
    return "article";
  }

  if (path.includes("/journal/")) {
    return "journal";
  }

  if (path.includes("/presskit/")) {
    return "presskit";
  }

  if (path === "/keepsake/" || path.startsWith("/keepsake/")) {
    return "homepage";
  }

  return "other";
}


function getArticleSlug() {
  const match = window.location.pathname.match(
    /\/journal\/articles\/([^/]+)\/?/
  );

  return match ? match[1] : null;
}


// ------------------------------------------------------------
// App Store click tracking
// ------------------------------------------------------------

async function trackAppStoreClick(link) {
  const parameters = {
    source: getPageSource(),
    path: window.location.pathname
  };

  const article = getArticleSlug();

  if (article) {
    parameters.article = article;
  }

  try {
    await Promise.race([
      td.signal("Website.appStore.click", parameters),
      new Promise(resolve => setTimeout(resolve, 600))
    ]);
  } catch (error) {
    console.warn("TelemetryDeck App Store click failed:", error);
  }

  window.location.href = link.href;
}


// ------------------------------------------------------------
// Attach listeners
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  document
    .querySelectorAll('a[href*="apps.apple.com"]')
    .forEach(link => {

      link.addEventListener("click", event => {

        // Preserve normal behaviour for modifier-clicks/new tabs
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          link.target === "_blank"
        ) {
          td.signal("Website.appStore.click", {
            source: getPageSource(),
            path: window.location.pathname,
            ...(getArticleSlug()
              ? { article: getArticleSlug() }
              : {})
          });

          return;
        }

        event.preventDefault();

        trackAppStoreClick(link);
      });

    });

});