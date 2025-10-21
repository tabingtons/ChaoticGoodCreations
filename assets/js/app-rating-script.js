// Star SVG template
        const starSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        `;
        
        function createStarRating(rating, ratingCount) {
            const container = document.createElement('div');
            container.className = 'app-rating';
            
            // Create stars container
            const starsDiv = document.createElement('div');
            starsDiv.className = 'stars';
            
            // Calculate filled, partial, and empty stars
            const fullStars = Math.floor(rating);
            const hasPartial = rating % 1 !== 0;
            const partialWidth = hasPartial ? ((rating % 1) * 100) : 0;
            
            // Create 5 stars
            for (let i = 0; i < 5; i++) {
                const star = document.createElement('span');
                star.className = 'star';
                
                if (i < fullStars) {
                    star.classList.add('filled');
                } else if (i === fullStars && hasPartial) {
                    star.classList.add('partial');
                    star.style.setProperty('--partial-width', `${partialWidth}%`);
                    star.innerHTML = starSVG;
                    const partialFill = document.createElement('span');
                    partialFill.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: ${partialWidth}%;
                        height: 100%;
                        overflow: hidden;
                    `;
                    partialFill.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: #fbbf24;">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>`;
                    star.appendChild(partialFill);
                    starsDiv.appendChild(star);
                    continue;
                }
                
                star.innerHTML = starSVG;
                starsDiv.appendChild(star);
            }
            
            container.appendChild(starsDiv);
            
            // Add rating text
            const ratingText = document.createElement('span');
            ratingText.className = 'rating-text';
            ratingText.innerHTML = `<span class="rating-value">${rating.toFixed(1)}</span> (${ratingCount.toLocaleString()} ratings)`;
            container.appendChild(ratingText);
            
            return container;
        }
        
        // Load ratings from JSON file
        async function loadAppRating(appSlug, elementId) {
            try {
                // Adjust path based on your site structure - may need '../data/app-ratings.json' or '/data/app-ratings.json'
                const response = await fetch('./data/app-ratings.json');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data[appSlug]) {
                    const app = data[appSlug];
                    const element = document.getElementById(elementId);
                    
                    if (element && app.rating > 0) {
                        element.appendChild(createStarRating(app.rating, app.ratingCount));
                    } else if (element) {
                        element.innerHTML = '<span class="rating-text">No ratings yet</span>';
                    }
                } else {
                    console.error(`App slug "${appSlug}" not found in ratings data`);
                }
            } catch (error) {
                console.error('Error loading app ratings:', error);
                const element = document.getElementById(elementId);
                if (element) {
                    element.innerHTML = '<span class="rating-text">Rating unavailable</span>';
                }
            }
        }
        
        // Load ratings for both apps
        loadAppRating('dig-deeper', 'dig-deeper-rating');
        loadAppRating('per-100', 'per-100-rating');