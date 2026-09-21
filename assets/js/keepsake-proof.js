/* ==========================================================
   Keepsake proof strip

   Reads /data/keepsake-reviews.json (refreshed daily by the
   GitHub Action) and shows the App Store rating plus the newest
   5-star reviews. The section stays hidden if the data is
   missing, so the page never shows an empty or broken strip.
   Reviewer names are never stored or shown.
   ========================================================== */

(async function renderKeepsakeProof() {
  const section = document.getElementById("ks-proof");

  if (!section) {
    return;
  }

  try {
    const response = await fetch("/data/keepsake-reviews.json", {
      cache: "no-cache"
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    if (!data || !data.ratingCount || !data.rating) {
      return;
    }

    const rounded = Math.max(0, Math.min(5, Math.round(data.rating)));
    const stars = section.querySelector("[data-proof-stars]");
    const summary = section.querySelector("[data-proof-summary]");
    const quotes = section.querySelector("[data-proof-quotes]");

    stars.textContent = "★".repeat(rounded) + "☆".repeat(5 - rounded);
    stars.setAttribute("aria-label", `Rated ${data.rating.toFixed(1)} out of 5`);

    const ratingWord = data.ratingCount === 1 ? "rating" : "ratings";
    summary.textContent =
      `${data.rating.toFixed(1)} on the App Store · ${data.ratingCount} ${ratingWord}`;

    (data.reviews || []).slice(0, 3).forEach(review => {
      const figure = document.createElement("figure");
      figure.className = "ks-proof-quote";

      const blockquote = document.createElement("blockquote");
      blockquote.textContent = `“${review.text}”`;

      const caption = document.createElement("figcaption");
      caption.textContent = "App Store review";

      figure.append(blockquote, caption);
      quotes.append(figure);
    });

    section.hidden = false;
  } catch (error) {
    console.warn("Keepsake proof strip unavailable:", error);
  }
})();
