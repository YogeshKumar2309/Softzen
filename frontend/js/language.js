// ====== Current language state ======
let currentLang = "hi";

// ====== Toggle language ======
function toggleLanguage() {
  currentLang = currentLang === "hi" ? "en" : "hi";
  const elements = document.querySelectorAll("[data-en][data-hi]");

  elements.forEach((el) => {
    el.textContent =
      currentLang === "en"
        ? el.getAttribute("data-en")
        : el.getAttribute("data-hi");
  });

  // Update button text
  const langText = document.getElementById("langText");
  if (langText) {
    langText.textContent = currentLang === "hi" ? "English" : "हिन्दी";
  }

  // Update HTML lang attribute (SEO)
  document.documentElement.lang = currentLang;

  // Save preference
  localStorage.setItem("preferredLang", currentLang);
}

// ====== Load saved language on page start ======
window.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("preferredLang");
  if (savedLang && savedLang === "en") {
    toggleLanguage();
  }
});