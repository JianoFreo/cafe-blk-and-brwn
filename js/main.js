// Shared by every page: phone menu, footer year, and the sliding highlight behind filter tabs.

function toggleMenu(open) {
  const nav = document.getElementById("nav");
  const button = document.querySelector(".nav-toggle");
  if (!nav || !button) return;
  const isOpen = typeof open === "boolean" ? open : !nav.classList.contains("open");
  nav.classList.toggle("open", isOpen);
  button.setAttribute("aria-expanded", String(isOpen));
  const header = document.querySelector(".site-header");
  if (header) header.classList.toggle("is-menu-open", isOpen);
}

document.querySelectorAll(".site-nav li").forEach((li, i) => li.style.setProperty("--i", i));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMenu(false); });
document.querySelectorAll(".site-nav a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Tab highlight: a pill that glides under whichever .tab has the class "on".
function glideTabs(tabs) {
  const glide = tabs.querySelector(".tabs__glide");
  const on = tabs.querySelector(".tab.on");
  if (!glide || !on || !on.offsetWidth) return;
  // offset sizes ignore transforms, so this also works while the bar is still animating in
  glide.style.setProperty("--gx", on.offsetLeft + "px");
  glide.style.setProperty("--gy", on.offsetTop - 8 + "px");
  glide.style.setProperty("--gw", on.offsetWidth + "px");
}
function glideAll() { document.querySelectorAll(".tabs").forEach(glideTabs); }
window.glideTabs = glideTabs;
window.addEventListener("load", glideAll);
window.addEventListener("resize", glideAll);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(glideAll);
glideAll();
