import TelemetryDeck from "@telemetrydeck/sdk";

const APP_ID = "C3D89652-51B1-44C3-9D3A-1B99E66B1E12";
const KEEPSAKE_APP_STORE_ID = "6760719322";


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

  if (path === "/friends/" || path.startsWith("/friends/")) {
    return "friends";
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


function isKeepsakeAppStoreLink(link) {
  try {
    const url = new URL(link.href);

    return (
      url.hostname === "apps.apple.com" &&
      url.pathname.endsWith(`/id${KEEPSAKE_APP_STORE_ID}`)
    );
  } catch {
    return false;
  }
}


// ------------------------------------------------------------
// Visit attribution (how the visitor arrived)
//
// Stored for the browser session only, and sent as plain campaign
// values. No personal data: UTM values that we set ourselves, and the
// referring site's hostname only (never the full URL).
// ------------------------------------------------------------

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

function getAttribution() {
  const storageKey = "keepsakeAttribution";

  try {
    const stored = sessionStorage.getItem(storageKey);

    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Fall through and rebuild
  }

  const attribution = {};
  const query = new URLSearchParams(window.location.search);

  UTM_KEYS.forEach(key => {
    const value = query.get(key);

    if (value) {
      attribution[key] = value.slice(0, 60);
    }
  });

  try {
    if (document.referrer) {
      const referrerHost = new URL(document.referrer).hostname;

      if (referrerHost && referrerHost !== window.location.hostname) {
        attribution.referrer = referrerHost.replace(/^www\./, "");
      }
    }
  } catch {
    // Ignore malformed referrers
  }

  attribution.landing = window.location.pathname;

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(attribution));
  } catch {
    // Session storage unavailable; the values still apply to this page
  }

  return attribution;
}


function baseParameters() {
  const parameters = {
    source: getPageSource(),
    path: window.location.pathname,
    ...getAttribution()
  };

  const article = getArticleSlug();

  if (article) {
    parameters.article = article;
  }

  return parameters;
}


function sendSignal(type, extra = {}) {
  try {
    return td.signal(type, { ...baseParameters(), ...extra });
  } catch (error) {
    console.warn(`TelemetryDeck ${type} failed:`, error);
    return Promise.resolve();
  }
}


// ------------------------------------------------------------
// Click tracking that waits briefly for the signal before leaving
// the page (so same-tab navigation does not cancel it)
// ------------------------------------------------------------

async function trackThenNavigate(link, type, extra) {
  try {
    await Promise.race([
      sendSignal(type, extra),
      new Promise(resolve => setTimeout(resolve, 600))
    ]);
  } catch (error) {
    console.warn(`TelemetryDeck ${type} failed:`, error);
  }

  window.location.href = link.href;
}


function isModifiedClick(event, link) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    link.target === "_blank"
  );
}


// ------------------------------------------------------------
// Click handling (delegated, so it also covers header and footer
// content that is loaded after the page)
// ------------------------------------------------------------

function journalDestination(link) {
  try {
    const url = new URL(link.href);
    const match = url.pathname.match(/\/journal\/articles\/([^/]+)\/?/);

    return match ? match[1] : "index";
  } catch {
    return "unknown";
  }
}


function isJournalLink(link) {
  try {
    return new URL(link.href).pathname.startsWith("/keepsake/journal");
  } catch {
    return false;
  }
}


document.addEventListener("click", event => {

  const link = event.target.closest("a[href]");

  if (!link) {
    return;
  }

  // Friends of Keepsake
  if (link.dataset.friend) {
    td.signal("Website.friend.click", {
      friend: link.dataset.friend,
      destination: link.dataset.destination || "unknown",
      source: getPageSource(),
      path: window.location.pathname
    });

    return;
  }

  // Social links
  if (link.dataset.social) {
    sendSignal("Website.social.click", {
      network: link.dataset.social
    });

    return;
  }

  // App Store links
  if (isKeepsakeAppStoreLink(link)) {
    const extra = { placement: link.dataset.placement || "unknown" };

    // Preserve normal behaviour for modifier-clicks/new tabs
    if (isModifiedClick(event, link)) {
      sendSignal("Website.appStore.click", extra);
      return;
    }

    event.preventDefault();
    trackThenNavigate(link, "Website.appStore.click", extra);

    return;
  }

  // Journal links (navigation, cards, related articles)
  if (isJournalLink(link)) {
    const extra = {
      destination: journalDestination(link),
      placement: link.dataset.placement || "link"
    };

    if (isModifiedClick(event, link)) {
      sendSignal("Website.journal.click", extra);
      return;
    }

    event.preventDefault();
    trackThenNavigate(link, "Website.journal.click", extra);
  }

});


// ------------------------------------------------------------
// FAQ opens
// ------------------------------------------------------------

document.addEventListener("toggle", event => {

  const item = event.target;

  if (
    item instanceof HTMLDetailsElement &&
    item.open &&
    item.dataset.faq
  ) {
    sendSignal("Website.faq.open", {
      question: item.dataset.faq
    });
  }

}, true);
