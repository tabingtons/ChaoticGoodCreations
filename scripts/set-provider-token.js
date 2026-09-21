// scripts/set-provider-token.js
//
// Adds your App Store Connect provider token (pt) to every Keepsake App Store
// campaign link in the site, next to the campaign token (ct) that is already there.
//
// Usage:   node scripts/set-provider-token.js 123456
//
// Safe to run more than once. Running it with a different token replaces the old one.
// Get the token by creating one campaign link in App Store Connect
// (App Analytics > Campaigns > Create Link) and copying the number after "pt=".

const fs = require('fs');
const path = require('path');

const token = process.argv[2];

if (!token || !/^\d+$/.test(token)) {
  console.error('Usage: node scripts/set-provider-token.js <numeric provider token>');
  process.exit(1);
}

const root = path.join(__dirname, '..');
const skip = new Set(['node_modules', '.git']);
const linkPattern =
  /(https:\/\/apps\.apple\.com\/app\/keepsake-hold-memories\/id6760719322\?)((?:pt=\d+(?:&amp;|&))?)(ct=[^"&\s]+)/g;

let changed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) update(full);
  }
}

function update(file) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = original.replace(linkPattern, `$1pt=${token}&amp;$3`);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed += 1;
    console.log('Updated', path.relative(root, file));
  }
}

walk(root);
console.log(`Done. ${changed} file(s) updated.`);
