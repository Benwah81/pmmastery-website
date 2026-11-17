// PM MASTERY - WEBSITE INTERACTIONS

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileToggle && navLinks) {
        mobileToggle.setAttribute('role', 'button');
        mobileToggle.setAttribute('tabindex', '0');
        mobileToggle.setAttribute('aria-label', 'Menu');
        mobileToggle.setAttribute('aria-expanded', 'false');
        const toggleMenu = () => {
            const open = navLinks.classList.toggle('active');
            mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        mobileToggle.addEventListener('click', toggleMenu);
        mobileToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
        });
    }

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;
        
        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add animation class when elements come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards and pricing cards
    document.querySelectorAll('.feature-card, .pricing-card, .tool-category').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Google Preferred Sources button: blog posts only, placed under the last CTA.
    // Plain link to Google's source preferences page; if Google's publisher.js loads,
    // the click opens Google's pop-up instead so the reader stays on the post.
    (function () {
        var path = window.location.pathname;
        if (path.indexOf('/blog/') !== 0 || path === '/blog/' || path === '/blog/index.html') return;
        var article = document.querySelector('article');
        if (!article) return;

        var DEEPLINK = 'https://www.google.com/preferences/source?q=pmmastery.app';
        var wrap = document.createElement('div');
        wrap.className = 'pref-source';
        var link = document.createElement('a');
        link.className = 'pref-source-btn';
        link.href = DEEPLINK;
        link.target = '_blank';
        link.rel = 'noopener';
        link.innerHTML = '<i class="fab fa-google" aria-hidden="true"></i> Add PM Mastery as a preferred source on Google';
        var note = document.createElement('p');
        note.className = 'pref-source-note';
        note.textContent = 'Our posts can then show a \'preferred\' tag for you in Google Top Stories, AI Overviews and AI Mode.';
        wrap.appendChild(link);
        wrap.appendChild(note);

        // After the last CTA block (the one holding the app /try or /r/ link); else end of the article body.
        var ctaLinks = article.querySelectorAll('a[href*="app.pmmastery.app/try"], a[href*="app.pmmastery.app/r/"]');
        var cta = ctaLinks.length ? ctaLinks[ctaLinks.length - 1].closest('div') : null;
        if (cta && cta.parentNode) {
            cta.parentNode.insertBefore(wrap, cta.nextSibling);
        } else {
            (article.querySelector('.container') || article).appendChild(wrap);
        }

        var api = null;
        (self.PREFERRED_SOURCE = self.PREFERRED_SOURCE || []).push(function (preferredSource) {
            preferredSource.init({ theme: 'light', lang: 'en' });
            api = preferredSource;
        });
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://news.google.com/swg/js/v1/publisher.js';
        s.setAttribute('preferred-sources-control', 'manual');
        document.head.appendChild(s);

        link.addEventListener('click', function (e) {
            if (window.gtag) gtag('event', 'preferred_source_click', { page_path: path });
            if (api) { e.preventDefault(); api.addPreferredSource(); }
        });
    })();
});
