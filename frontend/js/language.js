// Current language state
let currentLang = "hi";

// Toggle language function
function toggleLanguage() {
  currentLang = currentLang === "hi" ? "en" : "hi";
  const elements = document.querySelectorAll("[data-en][data-hi]");

  elements.forEach((el) => {
    if (currentLang === "en") {
      el.textContent = el.getAttribute("data-en");
    } else {
      el.textContent = el.getAttribute("data-hi");
    }
  });

  // Update button text
  document.getElementById("langText").textContent =
    currentLang === "hi" ? "English" : "हिन्दी";

  // Update HTML lang attribute for SEO
  document.documentElement.lang = currentLang;

  // Save preference to localStorage
  localStorage.setItem("preferredLang", currentLang);
}

// Load saved language preference on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("preferredLang");
  if (savedLang && savedLang === "en") {
    toggleLanguage();
  }
});

// Mobile menu toggle
function toggleMenu() {
  const navLinks = document.getElementById("navLinks");
  navLinks.classList.toggle("active");
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // Close mobile menu if open
      document.getElementById("navLinks").classList.remove("active");
    }
  });
});

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe service cards and feature items
document.querySelectorAll(".service-card, .feature-item").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  el.style.transition = "opacity 0.6s, transform 0.6s";
  observer.observe(el);
});

// Coming Soon service card click handler
document.querySelectorAll(".service-card.coming-soon").forEach((card) => {
  card.addEventListener("click", function (e) {
    e.preventDefault();
    const message =
      currentLang === "hi"
        ? "🚀 यह सेवा जल्द ही उपलब्ध होगी! हमसे संपर्क करें अधिक जानकारी के लिए।"
        : "🚀 This service is coming soon! Contact us for more information.";
    alert(message);
  });
});