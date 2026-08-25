const PRODUCT_PRICE = { ua: "2 023 ₴", other: "€49" };

function setPrice(countryCode) {
  const isUkraine = countryCode === "UA";
  document.querySelector("#price").textContent = isUkraine ? PRODUCT_PRICE.ua : PRODUCT_PRICE.other;
  document.querySelector("#price-note").textContent = isUkraine ? "для України" : "for Europe / other countries";
}

async function detectCurrency() {
  try {
    const response = await fetch("https://ipapi.co/json/", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("IP lookup failed");
    const data = await response.json();
    setPrice(data.country_code);
  } catch {
    setPrice((navigator.language || "").toUpperCase().includes("UA") ? "UA" : "OTHER");
  }
}

function loadOptionalGallery() {
  const image = document.querySelector(".gallery-square img");
  const frame = image.closest(".gallery-square");
  image.addEventListener("error", () => frame.classList.add("is-missing"));
  image.addEventListener("click", () => frame.classList.toggle("is-zoomed"));
}

function setupHeroCarousel() {
  const frame = document.querySelector(".hero-carousel");
  const image = document.querySelector("#hero-image");
  const counter = document.querySelector("#hero-counter");
  const previous = document.querySelector(".carousel-prev");
  const next = document.querySelector(".carousel-next");
  const files = ["product.jpg", "photo-2.jpg", "photo-3.jpg"];
  let slides = [];
  let currentIndex = 0;
  let transitionTimer;

  Promise.all(files.map((file) => new Promise((resolve) => {
    const candidate = new Image();
    candidate.onload = () => resolve({ src: file, alt: file === "product.jpg" ? "Premium EV charging cable storage bag" : `Charging cable bag view ${slides.length + 1}` });
    candidate.onerror = () => resolve(null);
    candidate.src = file;
  }))).then((loadedSlides) => {
    slides = loadedSlides.filter(Boolean);
    if (slides.length === 0) return;
    previous.hidden = next.hidden = slides.length < 2;
    updateCounter();
  });

  function updateCounter() {
    counter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    frame.classList.remove("is-square");
  }

  function showSlide(direction) {
    if (slides.length < 2) return;
    currentIndex = (currentIndex + direction + slides.length) % slides.length;
    frame.classList.add("is-changing");
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => {
      image.src = slides[currentIndex].src;
      image.alt = slides[currentIndex].alt;
      updateCounter();
      requestAnimationFrame(() => frame.classList.remove("is-changing"));
    }, 220);
  }

  previous.addEventListener("click", () => showSlide(-1));
  next.addEventListener("click", () => showSlide(1));
  frame.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    const direction = event.clientX < frame.getBoundingClientRect().left + frame.offsetWidth / 2 ? -1 : 1;
    showSlide(direction);
  });
}

function setupOrderForm() {
  const form = document.querySelector("#order-form");
  const status = document.querySelector("#form-status");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    status.textContent = "Надсилання замовлення...";
    if (window.location.protocol === "file:") {
      status.textContent = "Для справжнього надсилання відкрийте сайт через Netlify, а не index.html з комп'ютера.";
      button.disabled = false;
      return;
    }
    const order = Object.fromEntries(new FormData(form));
    order.price = document.querySelector("#price").textContent;
    try {
      const response = await fetch("/api/order", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Order request failed");
      status.textContent = "Замовлення надіслано. Ми зв'яжемося з вами найближчим часом.";
      form.reset();
    } catch (error) {
      status.textContent = error.message || "Не вдалося надіслати замовлення.";
    } finally {
      button.disabled = false;
    }
  });
}

function setupRevealAnimations() {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function setupSmoothAnchorScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();

      link.classList.remove("is-clicked");
      void link.offsetWidth;
      link.classList.add("is-clicked");

      const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
      const start = window.scrollY;
      const destination = Math.max(0, target.getBoundingClientRect().top + start - headerHeight - 18);
      const distance = destination - start;
      const duration = Math.min(1800, Math.max(900, Math.abs(distance) * 0.9));
      const startedAt = performance.now();

      const animateScroll = (now) => {
        const progress = duration === 0 ? 1 : Math.min(1, (now - startedAt) / duration);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, start + distance * eased);
        if (progress < 1) requestAnimationFrame(animateScroll);
      };

      requestAnimationFrame(animateScroll);
      history.pushState(null, "", link.getAttribute("href"));
    });
  });
}

detectCurrency();
setupHeroCarousel();
loadOptionalGallery();
setupOrderForm();
setupRevealAnimations();
setupSmoothAnchorScrolling();

