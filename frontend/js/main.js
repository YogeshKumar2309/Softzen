// ====== Mobile Menu Toggle ======
function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.toggle("active");
}

// ====== Smooth Scroll for anchor links ======
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("navLinks")?.classList.remove("active");
    }
  });
});