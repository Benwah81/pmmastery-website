// Announcement bar (BANNER-1): new question types. Self-expires after Oct 31 2026 CT; remove in a later cleanup.
(function () {
    var KEY = 'pmm_banner_qtypes_2026_10';
    var END = Date.parse('2026-11-01T05:00:00Z'); // 2026-10-31 11:59 pm CT
    var POST = '/blog/pm-mastery-new-question-types-2026';
    try {
        if (Date.now() >= END) return;
        if (location.pathname.replace(/\/$/, '').replace(/\.html$/, '') === POST) return;
        try { if (localStorage.getItem(KEY) === '1') return; } catch (e) {}
        if (!document.body || document.getElementById('pmm-announce')) return;
        var bar = document.createElement('div');
        bar.id = 'pmm-announce';
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Announcement');
        bar.style.cssText = 'background:#3B4C8B;color:#fff;font-size:0.9rem;line-height:1.4;padding:8px 44px;text-align:center;position:relative;border-bottom:2px solid #C9A55C;';
        bar.appendChild(document.createTextNode('New: every PM Mastery mock now includes matching, multi-select and chart questions.'));
        var a = document.createElement('a');
        a.href = POST;
        a.textContent = 'See what’s new';
        a.style.cssText = 'color:#fff;font-weight:600;text-decoration:underline;margin-left:6px;';
        bar.appendChild(a);
        var x = document.createElement('button');
        x.type = 'button';
        x.setAttribute('aria-label', 'Dismiss announcement');
        x.textContent = '×';
        x.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;color:#fff;font-size:1.3rem;line-height:1;cursor:pointer;padding:4px 8px;';
        x.addEventListener('click', function () {
            try { localStorage.setItem(KEY, '1'); } catch (e) {}
            bar.parentNode && bar.parentNode.removeChild(bar);
        });
        bar.appendChild(x);
        document.body.insertBefore(bar, document.body.firstChild);
    } catch (e) {}
})();

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
});
