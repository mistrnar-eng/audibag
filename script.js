const CONTACT_PHONE = "+380506410207";
const CONTACT_EMAIL = "sergey.romanenko@gmail.com";
const TEXT_SIZE_KEY = "eva-accessories-text-size";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setupTextSize() {
  const slider = document.querySelector("#text-size");
  const saved = Number(localStorage.getItem(TEXT_SIZE_KEY));
  const value = Number.isFinite(saved) ? Math.min(130, Math.max(90, saved)) : 110;
  const apply = (percent) => {
    const next = Math.min(130, Math.max(90, percent));
    slider.value = next - 90;
    slider.style.setProperty("--range-position", `${((next - 90) / 40) * 100}%`);
    document.documentElement.style.setProperty("--text-scale", next / 100);
    localStorage.setItem(TEXT_SIZE_KEY, String(next));
  };
  apply(value);
  slider.addEventListener("input", () => apply(Number(slider.value) + 90));
  document.querySelectorAll("[data-text-step]").forEach((button) => button.addEventListener("click", () => apply(Number(slider.value) + 90 + Number(button.dataset.textStep) * 5)));
}

function setupContacts() {
  const phone = document.querySelector("#phone-link");
  const email = document.querySelector("#email-link");
  phone.querySelector("strong").textContent = CONTACT_PHONE;
  email.href = `mailto:${CONTACT_EMAIL}`;
  email.querySelector("strong").textContent = CONTACT_EMAIL;
  phone.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(CONTACT_PHONE); } catch { /* Clipboard is unavailable in some local previews. */ }
    document.querySelector("#copy-status").textContent = "Скопійовано";
  });
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".reveal, .benefit");
  if (reducedMotion || !("IntersectionObserver" in window)) { elements.forEach((element) => element.classList.add("visible")); return; }
  const observer = new IntersectionObserver((entries, currentObserver) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("visible"); currentObserver.unobserve(entry.target); } }), { threshold: 0.12 });
  elements.forEach((element) => observer.observe(element));
}

function setupSmoothScrolling() {
  let animationFrame = null;
  const cancel = () => { if (animationFrame) cancelAnimationFrame(animationFrame); animationFrame = null; };
  ["wheel", "touchstart", "keydown"].forEach((eventName) => window.addEventListener(eventName, cancel, { passive: true }));
  document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault(); cancel();
    const start = window.scrollY;
    const destination = Math.max(0, target.getBoundingClientRect().top + start - document.querySelector(".site-header").offsetHeight - 18);
    const distance = destination - start;
    const duration = reducedMotion ? 0 : Math.min(1600, Math.max(700, Math.abs(distance) * 0.75));
    const startedAt = performance.now();
    const animate = (now) => {
      const progress = duration ? Math.min(1, (now - startedAt) / duration) : 1;
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2;
      window.scrollTo(0, start + distance * eased);
      if (progress < 1) animationFrame = requestAnimationFrame(animate); else animationFrame = null;
    };
    animationFrame = requestAnimationFrame(animate);
    history.pushState(null, "", link.getAttribute("href"));
  }));
}

setupTextSize();
setupContacts();
setupRevealAnimations();
setupSmoothScrolling();
