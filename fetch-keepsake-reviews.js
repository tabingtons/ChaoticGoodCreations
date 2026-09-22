// fetch-keepsake-reviews.js
//
// Builds data/keepsake-reviews.json for the "proof strip" on the Keepsake page.
// Runs daily via GitHub Actions (see .github/workflows/update-ratings.yml).
//
// Uses only Apple's public, key-free endpoints:
//   - iTunes Lookup (rating + rating count per storefront)
//   - iTunes customer reviews feed (review text per storefront)
//
// What it publishes:
//   - The combined average rating and total rating count across storefronts
//   - The newest 5-star reviews that have written text
// What it never publishes: reviewer names or any account details.
//
// Moderation: data/keepsake-review-overrides.json can hide a review by id
// ("hideIds") or block reviews containing certain words ("blockedTerms").
// Reviews are also filtered by length so only readable quotes are shown.

const fs = require('fs');
const https = require('https');

const APP_ID = '6760719322';

// Storefronts to check: every App Store territory, not just the top download countries.
// A curated shortlist missed real 5-star reviews from Romania (2026-09-23) — reviews can
// land in any storefront, so the safest correct behaviour is to check all of them.
const REGIONS = [
  'ae', 'ag', 'ai', 'al', 'am', 'ao', 'ar', 'at', 'au', 'az', 'ba', 'bb', 'bd', 'be', 'bf', 'bg',
  'bh', 'bj', 'bm', 'bn', 'bo', 'br', 'bs', 'bt', 'bw', 'by', 'bz', 'ca', 'cd', 'cg', 'ch', 'ci',
  'cl', 'cn', 'co', 'cr', 'cv', 'cy', 'cz', 'de', 'dk', 'dm', 'do', 'dz', 'ec', 'ee', 'eg', 'es',
  'fi', 'fj', 'fm', 'fr', 'ga', 'gb', 'gd', 'ge', 'gh', 'gm', 'gr', 'gt', 'gw', 'gy', 'hk', 'hn',
  'hr', 'hu', 'id', 'ie', 'il', 'in', 'iq', 'is', 'it', 'jm', 'jo', 'jp', 'ke', 'kg', 'kh', 'kn',
  'kr', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'lk', 'lr', 'lt', 'lu', 'lv', 'ly', 'ma', 'md', 'me',
  'mg', 'mk', 'ml', 'mm', 'mn', 'mo', 'mr', 'ms', 'mt', 'mu', 'mv', 'mw', 'mx', 'my', 'mz', 'na',
  'ne', 'ng', 'ni', 'nl', 'no', 'np', 'nz', 'om', 'pa', 'pe', 'pg', 'ph', 'pk', 'pl', 'pt', 'pw',
  'py', 'qa', 'ro', 'rs', 'ru', 'rw', 'sa', 'sb', 'sc', 'se', 'sg', 'si', 'sk', 'sl', 'sn', 'sr',
  'sv', 'sz', 'tc', 'td', 'th', 'tj', 'tm', 'tn', 'tr', 'tt', 'tw', 'tz', 'ua', 'ug', 'us', 'uy',
  'uz', 'vc', 've', 'vg', 'vn', 'vu', 'ye', 'za', 'zm', 'zw'
];

const MIN_LENGTH = 20;
const MAX_LENGTH = 300;
const MAX_REVIEWS = 6;

const OUTPUT_PATH = './data/keepsake-reviews.json';
const OVERRIDES_PATH = './data/keepsake-review-overrides.json';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'chaoticgoodcreations-site' } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (err) { reject(err); }
      });
    });
    request.setTimeout(15000, () => request.destroy(new Error('Timed out')));
    request.on('error', reject);
  });
}

async function fetchRating(region) {
  const json = await getJSON(`https://itunes.apple.com/${region}/lookup?id=${APP_ID}`);
  const app = json.results && json.results[0];
  return {
    region,
    rating: app ? app.averageUserRating || 0 : 0,
    ratingCount: app ? app.userRatingCount || 0 : 0
  };
}

async function fetchReviews(region) {
  const url = `https://itunes.apple.com/${region}/rss/customerreviews/page=1/id=${APP_ID}/sortby=mostrecent/json`;
  const json = await getJSON(url);
  const raw = json.feed && json.feed.entry;
  const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return entries
    .filter((entry) => entry['im:rating'])
    .map((entry) => ({
      id: entry.id && entry.id.label,
      rating: Number(entry['im:rating'].label),
      title: (entry.title && entry.title.label || '').trim(),
      text: (entry.content && entry.content.label || '').replace(/\s+/g, ' ').trim(),
      date: entry.updated && entry.updated.label,
      region: region.toUpperCase()
    }));
}

function loadOverrides() {
  try {
    const overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
    return {
      hideIds: overrides.hideIds || [],
      blockedTerms: (overrides.blockedTerms || []).map((t) => t.toLowerCase())
    };
  } catch {
    return { hideIds: [], blockedTerms: [] };
  }
}

async function main() {
  const overrides = loadOverrides();
  const ratings = [];
  let reviews = [];

  for (const region of REGIONS) {
    try {
      ratings.push(await fetchRating(region));
    } catch (err) {
      console.error(`${region.toUpperCase()}: rating lookup failed: ${err.message}`);
    }
    try {
      reviews = reviews.concat(await fetchReviews(region));
    } catch (err) {
      console.error(`${region.toUpperCase()}: reviews feed failed: ${err.message}`);
    }
  }

  // If Apple could not be reached at all, keep the last good file instead of publishing zeros.
  if (ratings.length === 0) {
    console.error('No storefront responded. Leaving the existing file unchanged.');
    return;
  }

  const counted = ratings.filter((r) => r.ratingCount > 0);
  const ratingCount = counted.reduce((sum, r) => sum + r.ratingCount, 0);
  const rating = ratingCount
    ? counted.reduce((sum, r) => sum + r.rating * r.ratingCount, 0) / ratingCount
    : 0;

  const seen = new Set();
  const quotes = reviews
    .filter((r) => r.rating === 5)
    .filter((r) => r.text.length >= MIN_LENGTH && r.text.length <= MAX_LENGTH)
    .filter((r) => !overrides.hideIds.includes(r.id))
    .filter((r) => !overrides.blockedTerms.some((term) => (r.title + ' ' + r.text).toLowerCase().includes(term)))
    .filter((r) => (seen.has(r.id) ? false : seen.add(r.id)))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_REVIEWS)
    .map(({ id, title, text, date, region }) => ({ id, title, text, date, region }));

  const output = {
    appId: APP_ID,
    rating: Math.round(rating * 100) / 100,
    ratingCount,
    reviews: quotes,
    lastUpdated: new Date().toISOString()
  };

  fs.mkdirSync('./data', { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Keepsake: ${output.rating} stars from ${ratingCount} ratings, ${quotes.length} quotable 5-star review(s).`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
