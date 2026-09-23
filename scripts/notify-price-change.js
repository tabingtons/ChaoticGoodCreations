// scripts/notify-price-change.js
//
// Wraps `node scripts/export-prices.js --check`'s captured output into a
// GitHub issue when Keepsake's App Store prices have changed. Never writes
// or commits data/keepsake-prices.json itself — prices are customer-facing,
// so refreshing that file is a deliberate, reviewed step: run
// `node scripts/export-prices.js` locally, eyeball the diff, commit.
//
// Usage: node scripts/notify-price-change.js <path-to-captured-check-output>
// Runs monthly via .github/workflows/monthly-marketing-check.yml, only
// when the preceding `export-prices.js --check` step exits 1 (changed).

const fs = require('fs');
const https = require('https');

const NOTIFY_LABEL = 'keepsake-pricing';

function getJSON(url, headers) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'chaoticgoodcreations-site', ...headers } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
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

function postJSON(url, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const request = https.request(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'chaoticgoodcreations-site',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
          return;
        }
        try { resolve(data ? JSON.parse(data) : {}); } catch (err) { reject(err); }
      });
    });
    request.setTimeout(15000, () => request.destroy(new Error('Timed out')));
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

async function main() {
  const outputPath = process.argv[2];
  if (!outputPath) throw new Error('Usage: node scripts/notify-price-change.js <path-to-captured-output>');
  const checkOutput = fs.readFileSync(outputPath, 'utf8').trim();

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) {
    console.log('Prices changed, but no GITHUB_TOKEN/GITHUB_REPOSITORY — skipping the notification.');
    console.log(checkOutput);
    return;
  }

  const authHeaders = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
  const title = 'Keepsake prices changed in App Store Connect';
  const howTo = 'To refresh the site: run `node scripts/export-prices.js` locally (needs the `asc` CLI signed in), review the diff, then commit and push `data/keepsake-prices.json`. This check never writes or commits that file itself — prices are customer-facing.';
  const body = `The monthly price check found changes:\n\n\`\`\`\n${checkOutput}\n\`\`\`\n\n${howTo}\n\nClose this issue once the site's prices are updated (or once you've decided the change doesn't need a site update).`;

  try {
    const existing = await getJSON(
      `https://api.github.com/repos/${repo}/issues?state=open&labels=${encodeURIComponent(NOTIFY_LABEL)}&per_page=5`,
      authHeaders
    );
    const openIssue = Array.isArray(existing) ? existing.find((i) => !i.pull_request) : null;

    if (openIssue) {
      await postJSON(`https://api.github.com/repos/${repo}/issues/${openIssue.number}/comments`, authHeaders, {
        body: `Still showing a difference at the latest check:\n\n\`\`\`\n${checkOutput}\n\`\`\``
      });
      console.log(`Commented on existing issue #${openIssue.number}.`);
    } else {
      const created = await postJSON(`https://api.github.com/repos/${repo}/issues`, authHeaders, {
        title,
        body,
        labels: [NOTIFY_LABEL]
      });
      console.log(`Opened issue #${created.number}.`);
    }
  } catch (err) {
    console.error(`Could not create/update the pricing issue: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('notify-price-change failed:', err.message);
  process.exit(1);
});
