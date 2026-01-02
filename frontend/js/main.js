// Backend API URL - Change this to your Render URL after deployment
const API_URL = 'http://localhost:5001/api/contact';

// Contact form submission
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get form data
  const formData = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    message: document.getElementById('message').value.trim()
  };

  // Validation
  if (!formData.name || !formData.email || !formData.phone || !formData.message) {
    showMessage('कृपया सभी फ़ील्ड भरें। / Please fill all fields.', 'error');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    showMessage('कृपया एक वैध ईमेल दर्ज करें। / Please enter a valid email.', 'error');
    return;
  }

  // Phone validation (10 digits)
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
    showMessage('कृपया 10 अंकों का फ़ोन नंबर दर्ज करें। / Please enter a 10-digit phone number.', 'error');
    return;
  }

  // Show loading state
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = currentLang === 'hi' ? 'भेजा जा रहा है...' : 'Sending...';
  formMessage.style.display = 'none';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      const successMsg = currentLang === 'hi' 
        ? '✅ धन्यवाद! आपका संदेश भेज दिया गया है। हम जल्द ही आपसे संपर्क करेंगे।'
        : '✅ Thank you! Your message has been sent. We will contact you soon.';
      showMessage(successMsg, 'success');
      contactForm.reset();
    } else {
      const errorMsg = currentLang === 'hi'
        ? '❌ संदेश भेजने में विफल। कृपया पुनः प्रयास करें।'
        : '❌ Failed to send message. Please try again.';
      showMessage(data.message || errorMsg, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    const networkErrorMsg = currentLang === 'hi'
      ? '❌ नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।'
      : '❌ Network error. Please check your internet connection.';
    showMessage(networkErrorMsg, 'error');
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`;
  formMessage.style.display = 'block';

  // Auto hide after 5 seconds
  setTimeout(() => {
    formMessage.style.display = 'none';
  }, 5000);

  // Scroll to message
  formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}