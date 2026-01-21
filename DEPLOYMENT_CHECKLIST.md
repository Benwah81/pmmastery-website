# PM MASTERY WEBSITE - DEPLOYMENT CHECKLIST

**Complete this checklist before going live**

---

## ✅ PRE-DEPLOYMENT

### **Files Ready**
- [ ] index.html exists in website/ folder
- [ ] css/style.css exists
- [ ] js/main.js exists
- [ ] All files saved with UTF-8 encoding

### **Content Verified**
- [ ] Hero section has correct copy
- [ ] Features section lists all 28 tools
- [ ] Pricing shows: Free, $39/mo, $149/yr
- [ ] FAQ answers common questions
- [ ] Footer has correct email addresses
- [ ] Legal disclaimers present

### **Links Tested**
- [ ] All buttons link to app.pmmastery.app/register
- [ ] Login links go to app.pmmastery.app/login
- [ ] Pricing page links to app.pmmastery.app/pricing
- [ ] Email links (mailto:) work correctly
- [ ] Anchor links (#features, #pricing, #faq) work
- [ ] No broken links (404s)

### **Mobile Responsive**
- [ ] Test on phone (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Mobile menu opens/closes
- [ ] All buttons clickable on mobile
- [ ] Text readable on all devices

### **Cross-Browser**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 🚀 DEPLOYMENT STEPS

### **1. Choose Hosting (Pick ONE)**

**OPTION A: Netlify (RECOMMENDED)**
- [ ] Go to netlify.com
- [ ] Sign up/login
- [ ] Drag & drop `website` folder
- [ ] Site deploys automatically
- [ ] Copy temporary URL (e.g., random-name-123.netlify.app)

**OPTION B: Vercel**
- [ ] Go to vercel.com
- [ ] Sign up/login
- [ ] Import project from GitHub or upload folder
- [ ] Deploy
- [ ] Copy deployment URL

**OPTION C: GitHub Pages**
- [ ] Create repo: pmmastery-website
- [ ] Push website files
- [ ] Settings → Pages → Enable
- [ ] Select main branch
- [ ] Save

---

### **2. Test Deployment**

**Visit your temporary URL and verify:**
- [ ] Site loads correctly
- [ ] All images show (if any)
- [ ] CSS styles applied
- [ ] JavaScript works (mobile menu, smooth scroll)
- [ ] All links work
- [ ] Forms work (if you added email capture)
- [ ] Mobile responsive

---

### **3. Connect Custom Domain**

**In your hosting platform:**
- [ ] Go to Domain settings
- [ ] Add custom domain: `pmmastery.app`
- [ ] Note the DNS records they provide

**In Namecheap:**
- [ ] Log into Namecheap
- [ ] Go to Domain List → pmmastery.app
- [ ] Click "Manage"
- [ ] Go to "Advanced DNS"

**Add these records (example for Netlify):**

```
Type: A Record
Host: @
Value: 75.2.60.5 (or IP provided by host)
TTL: Automatic

Type: CNAME Record
Host: www
Value: your-site.netlify.app
TTL: Automatic
```

- [ ] Save DNS changes
- [ ] Wait 5-30 minutes for propagation

---

### **4. Enable HTTPS (SSL)**

**Most platforms do this automatically:**
- [ ] Netlify: Automatic (Let's Encrypt)
- [ ] Vercel: Automatic
- [ ] GitHub Pages: Enable in settings

**Verify:**
- [ ] Visit https://pmmastery.app
- [ ] Green padlock shows in browser
- [ ] Certificate valid

---

### **5. Final Testing**

**Test live site at pmmastery.app:**
- [ ] Homepage loads
- [ ] All sections visible
- [ ] Links to app work
- [ ] Mobile menu works
- [ ] Smooth scrolling works
- [ ] Forms work (if applicable)
- [ ] No console errors
- [ ] Page loads in <3 seconds

---

## 📧 POST-DEPLOYMENT

### **Email Setup**
- [ ] Verify ben@pmmastery.app works
- [ ] Verify support@pmmastery.app works
- [ ] Verify hello@pmmastery.app works
- [ ] Test sending email from website contact
- [ ] Emails don't go to spam

### **Analytics (Optional)**
- [ ] Set up Google Analytics
- [ ] Add tracking code to index.html
- [ ] Verify tracking works
- [ ] Set up goals/conversions

### **SEO**
- [ ] Submit sitemap to Google Search Console
- [ ] Verify site in Google Search Console
- [ ] Check meta descriptions
- [ ] Test with PageSpeed Insights
- [ ] Check mobile-friendliness

---

## 🎉 LAUNCH CHECKLIST

**Before announcing:**
- [ ] Website live at pmmastery.app
- [ ] App live at app.pmmastery.app
- [ ] All links between them work
- [ ] Payment processing works (Stripe connected)
- [ ] Email system works
- [ ] Mobile responsive
- [ ] No broken links
- [ ] Legal pages accessible
- [ ] Support email monitored

**Ready to announce:**
- [ ] Post on Reddit (r/pmp)
- [ ] Post on LinkedIn
- [ ] Post in Facebook groups
- [ ] Email list (if you have one)
- [ ] Social media accounts
- [ ] Friends/family/network

---

## 🐛 COMMON ISSUES

**Site not loading?**
- Check DNS propagation (use whatsmydns.net)
- Wait 24-48 hours for full propagation
- Try incognito mode
- Clear browser cache

**Styles not working?**
- Check file paths (css/style.css)
- Verify files uploaded correctly
- Check browser console for errors

**Links broken?**
- Verify app.pmmastery.app is deployed
- Check all URLs in HTML
- Test each link manually

**Mobile menu not working?**
- Check js/main.js loaded
- Check browser console for errors
- Test on actual mobile device (not just resize)

**HTTPS not working?**
- Wait for SSL certificate to provision (5-30 min)
- Check hosting platform SSL settings
- Contact hosting support if issues persist

---

## 📊 SUCCESS METRICS

**Track these after launch:**
- [ ] Visitors per day
- [ ] Sign-up conversion rate
- [ ] Free → Paid conversion
- [ ] Bounce rate
- [ ] Time on site
- [ ] Mobile vs desktop traffic
- [ ] Traffic sources

---

## 🎯 NEXT STEPS AFTER LAUNCH

**Week 1:**
- Monitor for bugs
- Respond to feedback
- Fix any issues immediately
- Track key metrics

**Week 2-4:**
- Add testimonials as you get them
- Update FAQ based on questions
- Improve based on user feedback
- Add content (blog if planned)

**Month 2+:**
- SEO optimization
- Content marketing
- Social proof (case studies)
- Feature updates

---

## ✅ DEPLOYMENT COMPLETE!

**Once all boxes checked above:**

🎉 **YOUR WEBSITE IS LIVE!** 🎉

**Visit:** https://pmmastery.app
**App:** https://app.pmmastery.app

**Congratulations on launching PM Mastery!** 🚀

---

**Date Deployed:** _______________
**Deployed By:** Ben Schenck
**Hosting:** _______________ (Netlify/Vercel/GitHub Pages)
**Domain Connected:** Yes / No
**HTTPS Enabled:** Yes / No
**First Visitor:** _______________

---

**🎊 NOW GO CELEBRATE AND START MARKETING! 🎊**
