// Apiary.PH — interactions

// Enable smooth in-page scrolling only after the initial hash jump has landed
window.addEventListener('load', () => {
	setTimeout(() => document.documentElement.classList.add('smooth'), 100);
});

// Nav shadow on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => {
	const open = links.classList.toggle('open');
	toggle.setAttribute('aria-expanded', open);
});
links.addEventListener('click', (e) => {
	if (e.target.tagName === 'A') {
		links.classList.remove('open');
		toggle.setAttribute('aria-expanded', 'false');
	}
});

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) {
			entry.target.classList.add('visible');
			io.unobserve(entry.target);
		}
	});
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Safety net: if the observer never fired at all (hidden tab, odd browser),
// force-reveal everything; otherwise leave the scroll animation intact.
window.addEventListener('load', () => {
	setTimeout(() => {
		if (!document.querySelector('.reveal.visible')) {
			document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
		}
	}, 2500);
});

// Active nav link while scrolling
const sections = [...document.querySelectorAll('section[id], header[id]')];
const navAnchors = [...links.querySelectorAll('a[href^="#"]')];
const spy = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) {
			navAnchors.forEach((a) =>
				a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
		}
	});
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach((s) => spy.observe(s));

// Contact form -> pre-filled email (static site, no backend)
document.getElementById('contactForm').addEventListener('submit', (e) => {
	e.preventDefault();
	const f = e.target;
	const subject = encodeURIComponent('Apiary.PH inquiry from ' + f.name.value);
	const body = encodeURIComponent(
		f.note.value +
		'\n\n—\nName: ' + f.name.value +
		'\nEmail: ' + f.email.value +
		(f.phone.value ? '\nPhone: ' + f.phone.value : '') +
		(f.address.value ? '\nAddress: ' + f.address.value : '')
	);
	window.location.href = 'mailto:heraldbebis@gmail.com?subject=' + subject + '&body=' + body;
});
