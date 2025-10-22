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

// Country codes for major regions
const regions = ['us', 'gb', 'ca', 'au', 'de', 'nz'];

function fetchAppRating(appId, countryCode) {
  return new Promise((resolve, reject) => {
    const url = `https://itunes.apple.com/${countryCode}/lookup?id=${appId}`;
    
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
              country: countryCode.toUpperCase(),
              rating: app.averageUserRating || 0,
              ratingCount: app.userRatingCount || 0,
              version: app.version || 'Unknown'
            });
          } else {
            resolve({
              country: countryCode.toUpperCase(),
              rating: 0,
              ratingCount: 0,
              version: 'Unknown'
            });
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

// Calculate weighted average rating
function calculateCombinedRating(regionalData) {
  let totalRatings = 0;
  let weightedSum = 0;
  
  regionalData.forEach(region => {
    if (region.ratingCount > 0) {
      totalRatings += region.ratingCount;
      weightedSum += region.rating * region.ratingCount;
    }
  });
  
  if (totalRatings === 0) {
    return { rating: 0, ratingCount: 0 };
  }
  
  return {
    rating: weightedSum / totalRatings,
    ratingCount: totalRatings
  };
}

async function updateRatings() {
  const ratings = {};
  const timestamp = new Date().toISOString();
  
  console.log('Fetching app ratings from multiple regions...\n');
  
  for (const app of apps) {
    try {
      console.log(`Fetching ratings for ${app.name}...`);
      const regionalData = [];
      
      // Fetch from all regions
      for (const region of regions) {
        try {
          const data = await fetchAppRating(app.id, region);
          regionalData.push(data);
          
          if (data.ratingCount > 0) {
            console.log(`  ${data.country}: ${data.rating.toFixed(1)} stars (${data.ratingCount} ratings)`);
          } else {
            console.log(`  ${data.country}: No ratings`);
          }
        } catch (err) {
          console.error(`  ${region.toUpperCase()}: Error - ${err.message}`);
        }
      }
      
      // Calculate combined rating
      const combined = calculateCombinedRating(regionalData);
      
      console.log(`  ✓ Combined: ${combined.rating.toFixed(2)} stars (${combined.ratingCount} total ratings)\n`);
      
      ratings[app.slug] = {
        name: app.name,
        appId: app.id,
        rating: combined.rating,
        ratingCount: combined.ratingCount,
        regionalBreakdown: regionalData,
        lastUpdated: timestamp
      };
      
    } catch (err) {
      console.error(`✗ Error fetching ${app.name}:`, err.message);
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
  console.log(`Ratings saved to ${outputPath}`);
}

updateRatings().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});