/**
 * Email Typo Guard
 * Catches common email address typos at point of entry.
 * Auto-discovers all <input type="email"> on the page.
 *
 * Behavior:
 *   - On blur: checks value against typo dictionary, shows inline suggestion if found
 *   - On submit: blocks if a suggestion is showing and not yet dismissed (accepted OR declined)
 *
 * No dependencies. ~100 lines.
 */
(function () {
  'use strict';

  // Common domain typos -> correct domain
  var DOMAIN_TYPOS = {
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'yhaoo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yahoo.co': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotnail.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmail.co': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
    'outlook.co': 'outlook.com',
    'iclooud.com': 'icloud.com',
    'icloud.co': 'icloud.com'
  };

  // Common TLD typos -> correct TLD (applied to ANY domain ending in these)
  var TLD_TYPOS = {
    '.con': '.com',
    '.cmo': '.com',
    '.vom': '.com',
    '.cim': '.com',
    '.comm': '.com',
    '.cm': '.com',
    '.om': '.com',
    '.cpm': '.com',
    '.xom': '.com',
    '.coom': '.com',
    '.con.com': '.com',
    '.ner': '.net',
    '.nte': '.net'
  };

  function suggest(email) {
    if (!email || email.indexOf('@') === -1) return null;
    var parts = email.split('@');
    if (parts.length !== 2) return null;
    var local = parts[0];
    var domain = parts[1].toLowerCase();

    // Domain-level typo (whole domain match)
    if (DOMAIN_TYPOS[domain]) {
      return local + '@' + DOMAIN_TYPOS[domain];
    }

    // TLD-level typo (endswith match, longest first to handle .con.com before .con)
    var tldKeys = Object.keys(TLD_TYPOS).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < tldKeys.length; i++) {
      var bad = tldKeys[i];
      if (domain.length > bad.length && domain.slice(-bad.length) === bad) {
        var fixedDomain = domain.slice(0, -bad.length) + TLD_TYPOS[bad];
        return local + '@' + fixedDomain;
      }
    }

    return null;
  }

  function makeSuggestionEl(input, suggested) {
    var existing = input.parentNode.querySelector('.email-typo-suggestion');
    if (existing) existing.remove();

    var wrap = document.createElement('div');
    wrap.className = 'email-typo-suggestion';
    wrap.setAttribute('data-typo-resolved', 'false');
    wrap.style.cssText = 'margin-top:6px;padding:8px 10px;background:#fff8e1;border:1px solid #f1c40f;border-radius:4px;font-size:14px;color:#333;line-height:1.4;';

    var msg = document.createElement('span');
    msg.textContent = 'Did you mean ';
    var strong = document.createElement('strong');
    strong.textContent = suggested;
    msg.appendChild(strong);
    msg.appendChild(document.createTextNode('?'));
    wrap.appendChild(msg);

    var btnYes = document.createElement('button');
    btnYes.type = 'button';
    btnYes.textContent = 'Use this';
    btnYes.style.cssText = 'margin-left:10px;padding:3px 10px;background:#2c7be5;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:13px;';
    btnYes.addEventListener('click', function () {
      input.value = suggested;
      wrap.setAttribute('data-typo-resolved', 'true');
      wrap.remove();
    });
    wrap.appendChild(btnYes);

    var btnNo = document.createElement('button');
    btnNo.type = 'button';
    btnNo.textContent = 'No, mine is correct';
    btnNo.style.cssText = 'margin-left:6px;padding:3px 10px;background:transparent;color:#666;border:1px solid #ccc;border-radius:3px;cursor:pointer;font-size:13px;';
    btnNo.addEventListener('click', function () {
      wrap.setAttribute('data-typo-resolved', 'true');
      wrap.remove();
    });
    wrap.appendChild(btnNo);

    input.parentNode.insertBefore(wrap, input.nextSibling);
    return wrap;
  }

  function checkInput(input) {
    var suggested = suggest(input.value.trim());
    if (suggested && suggested !== input.value.trim()) {
      makeSuggestionEl(input, suggested);
    } else {
      var existing = input.parentNode.querySelector('.email-typo-suggestion');
      if (existing) existing.remove();
    }
  }

  function attachToForm(form) {
    // Capture-phase listener fires before any other submit handlers (regardless of
    // attachment order). This prevents:
    //   (a) AJAX fetch() handlers on marketing pages from firing before our check
    //   (b) Google Analytics event handlers from inflating attempt counts when
    //       we end up blocking the submission
    form.addEventListener('submit', function (e) {
      var emailInputs = form.querySelectorAll('input[type="email"]');
      for (var i = 0; i < emailInputs.length; i++) {
        var input = emailInputs[i];
        // Re-check on submit in case user typed and didn't blur
        checkInput(input);
        var suggestion = input.parentNode.querySelector('.email-typo-suggestion');
        if (suggestion && suggestion.getAttribute('data-typo-resolved') === 'false') {
          e.preventDefault();
          e.stopImmediatePropagation();
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }
      }
    }, true); // <-- capture: true
  }

  function init() {
    var emailInputs = document.querySelectorAll('input[type="email"]');
    var attachedForms = [];
    for (var i = 0; i < emailInputs.length; i++) {
      var input = emailInputs[i];
      input.addEventListener('blur', function (e) { checkInput(e.target); });
      var form = input.form;
      if (form && attachedForms.indexOf(form) === -1) {
        attachToForm(form);
        attachedForms.push(form);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
