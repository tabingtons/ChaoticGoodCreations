// fetch-keepsake-reviews.js
//
// Builds data/keepsake-reviews.json for the "proof strip" on the Keepsake page.
// Runs daily via GitHub Actions (see .github/workflows/update-ratings.yml).
//
// Review text: uses the authenticated App Store Connect API when
// ASC_KEY_ID / ASC_ISSUER_ID / ASC_PRIVATE_KEY are set (the authoritative
// source — every territory, in one call). Falls back to Apple's public,
// key-free customer-reviews RSS feed, checked per storefront, if the API
// key isn't configured. The RSS feed is known to sometimes miss reviews
// that the authenticated API shows (found 2026-09-23), so the API path is
// preferred whenever it's available.
// Rating average + count always come from the public iTunes Lookup API
// (no auth needed for that part), checked across every storefront.
//
// The App Store Connect key is scoped to the minimum needed: an
// "Individual API Key" with the Customer Support role, limited to the
// Keepsake app only. It cannot see or change anything else in App Store
// Connect (no pricing, no builds, no subscriptions). See
// Marketing/00-Strategy/Setup Checklist.md for how it was set up.
//
// What it publishes:
//   - The combined average rating and total rating count across storefronts
//   - The newest 5-star reviews that have written text
// What it never publishes: reviewer names/nicknames or any account details.
//
// Moderation: data/keepsake-review-overrides.json can hide a review by id
// ("hideIds") or block reviews containing certain words ("blockedTerms").
// Reviews are also filtered by length so only readable quotes are shown.

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const APP_ID = '6760719322';

// Storefronts to check for the rating average, and for reviews when the
// App Store Connect API key isn't configured: every App Store territory,
// not just the top download countries. A curated shortlist missed real
// 5-star reviews from Romania (2026-09-23) — reviews can land in any
// storefront, so the safest correct behaviour is to check all of them.
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

function getJSON(url, headers) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'chaoticgoodcreations-site', ...headers } }, (res) => {
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

// --- Public feed (fallback path, no API key needed) ---

async function fetchReviewsFromPublicFeed(region) {
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

async function fetchAllReviewsFromPublicFeed() {
  let reviews = [];
  for (const region of REGIONS) {
    try {
      reviews = reviews.concat(await fetchReviewsFromPublicFeed(region));
    } catch (err) {
      console.error(`${region.toUpperCase()}: reviews feed failed: ${err.message}`);
    }
  }
  return reviews;
}

// --- App Store Connect API (preferred path, needs a scoped key) ---

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Builds a short-lived (~20 minute) JWT signed with the App Store Connect
// API private key, per Apple's documented format (ES256, aud "appstoreconnect-v1").
function makeAppStoreConnectToken(keyId, issuerId, privateKeyPem) {
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: issuerId, iat: now, exp: now + 1190, aud: 'appstoreconnect-v1' };
  const signingInput = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(Buffer.from(JSON.stringify(payload)))}`;
  // ES256 in a JWT needs the raw (r || s) signature, not the default DER encoding.
  const signature = crypto.sign('sha256', Buffer.from(signingInput), { key: privateKeyPem, dsaEncoding: 'ieee-p1363' });
  return `${signingInput}.${base64url(signature)}`;
}

async function fetchAllReviewsFromASC(keyId, issuerId, privateKeyPem) {
  const token = makeAppStoreConnectToken(keyId, issuerId, privateKeyPem);
  const authHeader = { Authorization: `Bearer ${token}` };
  let url = `https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}/customerReviews?filter%5Brating%5D=5&sort=-createdDate&limit=200`;
  const reviews = [];

  while (url) {
    const json = await getJSON(url, authHeader);
    for (const entry of json.data || []) {
      const attrs = entry.attributes || {};
      reviews.push({
        id: entry.id,
        rating: attrs.rating,
        title: (attrs.title || '').trim(),
        text: (attrs.body || '').replace(/\s+/g, ' ').trim(),
        date: attrs.createdDate,
        region: attrs.territory // alpha-3, e.g. "NZL" — not shown in the UI, kept for our own reference
      });
    }
    url = json.links && json.links.next;
  }
  return reviews;
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

  // Rating average and count: always the public per-storefront lookup.
  const ratings = [];
  for (const region of REGIONS) {
    try {
      ratings.push(await fetchRating(region));
    } catch (err) {
      console.error(`${region.toUpperCase()}: rating lookup failed: ${err.message}`);
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

  // Review text: prefer the authenticated App Store Connect API. Fall back
  // to the public feed if the key isn't configured, or if the API call fails
  // for any reason (a bad or revoked key should degrade, not break the site).
  const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY } = process.env;
  let reviews;
  if (ASC_KEY_ID && ASC_ISSUER_ID && ASC_PRIVATE_KEY) {
    try {
      reviews = await fetchAllReviewsFromASC(ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY);
      console.log(`Fetched ${reviews.length} 5-star review(s) from the App Store Connect API.`);
    } catch (err) {
      console.error(`App Store Connect API failed (${err.message}), falling back to the public feed.`);
      reviews = await fetchAllReviewsFromPublicFeed();
    }
  } else {
    console.log('No App Store Connect API key configured — using the public review feed.');
    reviews = await fetchAllReviewsFromPublicFeed();
  }

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
