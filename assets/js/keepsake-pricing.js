/* ==========================================================
   Keepsake regional pricing

   Shows the visitor's local App Store price in the pricing
   section, using /data/keepsake-prices.json (exported from
   App Store Connect with scripts/export-prices.js).

   - The region is guessed in the browser from its time zone,
     then its language setting (for example en-NZ). No location
     lookup and no third-party request; nothing is sent anywhere.
   - A "Show prices for" picker lets visitors change it, and
     remembers the choice in this browser only.
   - If anything is missing the page keeps its built-in USD
     prices, so nothing ever looks broken.
   - Prices are a guide. The App Store shows the final price,
     including any local tax.
   ========================================================== */

(async function renderKeepsakePricing() {
  const STORAGE_KEY = "keepsakePricingRegion";
  const DEFAULT_REGION = "US";

  const note = document.getElementById("pricing-note");
  const picker = document.getElementById("pricing-region");
  const select = document.getElementById("pricing-region-select");

  if (!note || !picker || !select) {
    return;
  }

  let data;

  try {
    const response = await fetch("/data/keepsake-prices.json", { cache: "no-cache" });

    if (!response.ok) {
      return;
    }

    data = await response.json();
  } catch (error) {
    return;
  }

  const regions = data && data.regions;

  if (!regions || !regions[DEFAULT_REGION]) {
    return;
  }

  const locale = navigator.language || "en";
  // Region names stay in English to match the page copy; prices use the visitor's own number format
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

  function readSavedRegion() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function saveRegion(code) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Storage unavailable: the choice simply is not remembered
    }
  }

  // The browser's time zone is a better hint than its language: many New Zealanders,
  // for example, use British or Australian English. It stays in the browser and is
  // never sent anywhere.
  function regionFromTimeZone() {
    let timeZone;

    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return null;
    }

    if (!timeZone) {
      return null;
    }

    // Some browsers use older names for the same zone (Asia/Calcutta and Asia/Kolkata),
    // so compare both sides in the browser's own canonical form
    const canonical = (zone) => {
      try {
        return new Intl.DateTimeFormat("en", { timeZone: zone }).resolvedOptions().timeZone;
      } catch {
        return zone;
      }
    };

    timeZone = canonical(timeZone);

    for (const code of Object.keys(regions)) {
      try {
        const info = new Intl.Locale(`und-${code}`);
        const zones = typeof info.getTimeZones === "function"
          ? info.getTimeZones()
          : info.timeZones;

        if (zones && zones.some((zone) => canonical(zone) === timeZone)) {
          return code;
        }
      } catch {
        // Older browsers without time zone info: fall back to language
        return null;
      }
    }

    return null;
  }

  function regionFromBrowser() {
    const languages = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

    for (const language of languages) {
      try {
        const region = new Intl.Locale(language).region;

        if (region && regions[region]) {
          return region;
        }
      } catch {
        // Ignore malformed language tags
      }
    }

    return DEFAULT_REGION;
  }

  function guessRegion() {
    return regionFromTimeZone() || regionFromBrowser();
  }

  function formatPrice(amount, currency) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function setAmount(element, text) {
    if (!element) {
      return;
    }

    // The amount is the first text node; the "/ month" span after it stays as is
    const first = element.firstChild;

    if (first && first.nodeType === Node.TEXT_NODE) {
      first.textContent = `${text} `;
    } else {
      element.prepend(document.createTextNode(`${text} `));
    }
  }

  function render(code) {
    const price = regions[code] || regions[DEFAULT_REGION];
    const region = regions[code] ? code : DEFAULT_REGION;

    setAmount(document.querySelector('[data-price="free"]'), formatPrice(0, price.currency));
    setAmount(document.querySelector('[data-price="monthly"]'), formatPrice(price.monthly, price.currency));
    setAmount(document.querySelector('[data-price="annual"]'), formatPrice(price.annual, price.currency));

    const saving = Math.round((1 - price.annual / (price.monthly * 12)) * 100);
    const savingElement = document.querySelector('[data-price="saving"]');

    if (savingElement && saving > 0 && saving < 100) {
      savingElement.textContent = `Save ~${saving}% vs monthly`;
    }

    note.textContent =
      `Prices shown for ${regionNames.of(region)}, in ${price.currency}. ` +
      "The App Store shows your final price, including any local tax.";

    select.value = region;
  }

  // Build the region list, sorted by name in the visitor's language
  Object.keys(regions)
    .map(code => ({ code, name: regionNames.of(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .forEach(({ code, name }) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = name;
      select.append(option);
    });

  const saved = readSavedRegion();
  render(saved && regions[saved] ? saved : guessRegion());
  picker.hidden = false;

  select.addEventListener("change", () => {
    saveRegion(select.value);
    render(select.value);
  });
})();
