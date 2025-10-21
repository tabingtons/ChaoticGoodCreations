// fetch-ratings.js
// Run this script via GitHub Actions to update app ratings

const fs = require('fs');
const https = require('https');

const apps = [
  {
    id: '6472387394',
    name: 'Dig Deeper',
    slug: 'dig-deeper'
  },
  {
    id: '6670795904',
    name: 'Per 100',
    slug: 'per-100'
  }
];

function fetchAppRating(appId) {
  return new Promise((resolve, reject) => {
    const url = `https://itunes.apple.com/lookup?id=${appId}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            const app = json.results[0];
            resolve({
              rating: app.averageUserRating || 0,
              ratingCount: app.userRatingCount || 0,
              version: app.version || 'Unknown'
            });
          } else {
            reject(new Error('No results found'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function updateRatings() {
  const ratings = {};
  const timestamp = new Date().toISOString();
  
  console.log('Fetching app ratings...');
  
  for (const app of apps) {
    try {
      console.log(`Fetching rating for ${app.name}...`);
      const data = await fetchAppRating(app.id);
      ratings[app.slug] = {
        name: app.name,
        appId: app.id,
        rating: data.rating,
        ratingCount: data.ratingCount,
        version: data.version,
        lastUpdated: timestamp
      };
      console.log(`✓ ${app.name}: ${data.rating} stars (${data.ratingCount} ratings)`);
    } catch (err) {
      console.error(`✗ Error fetching ${app.name}:`, err.message);
      // Keep existing data if fetch fails
      ratings[app.slug] = {
        name: app.name,
        appId: app.id,
        rating: 0,
        ratingCount: 0,
        error: err.message,
        lastUpdated: timestamp
      };
    }
  }
  
  // Save to JSON file
  const outputPath = './data/app-ratings.json';
  fs.mkdirSync('./data', { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(ratings, null, 2));
  console.log(`\nRatings saved to ${outputPath}`);
}

updateRatings().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});