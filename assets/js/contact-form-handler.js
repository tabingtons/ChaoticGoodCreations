// Contact Form Handler for Formspree
// Handles AJAX submission to keep users on the page
// Shows success/error messages without redirect
// Called by load-components.js after form component loads

function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    // Only run if contact form exists
    if (!contactForm) return;

    const submitBtn = document.getElementById('submit-btn');
    const successMessage = document.getElementById('form-success');

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent default form submission

        // Disable button to prevent double submission
        submitBtn.disabled = true;
        submitBtn.value = 'Sending...';

        // Get form data
        const formData = new FormData(contactForm);

        try {
            // Send to Formspree via AJAX
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Show success message
                successMessage.style.display = 'block';
                // Clear form
                contactForm.reset();
                // Scroll to success message
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                // Handle error response from Formspree
                const errorData = await response.json();
                console.error('Formspree error:', errorData);
                alert('Oops! There was a problem submitting your form. Please try again or email us directly at hello@chaoticgoodcreations.co');
            }
        } catch (error) {
            // Handle network or other errors
            console.error('Form submission error:', error);
            alert('Oops! There was a problem submitting your form. Please try again or email us directly at hello@chaoticgoodcreations.co');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.value = 'Send message';
        }
    });
}