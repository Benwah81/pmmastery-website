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

  function checkFormForBlockingTypo(form) {
    var emailInputs = form.querySelectorAll('input[type="email"]');
    for (var i = 0; i < emailInputs.length; i++) {
      var input = emailInputs[i];
      // Re-check in case user typed and didn't blur
      checkInput(input);
      var suggestion = input.parentNode.querySelector('.email-typo-suggestion');
      if (suggestion && suggestion.getAttribute('data-typo-resolved') === 'false') {
        return input; // return the problem input so caller can focus it
      }
    }
    return null;
  }

  function attachToForm(form) {
    // Strategy: intercept the event chain BEFORE the submit event fires.
    // Why: inline onsubmit="..." attributes are part of the DOM dispatch chain
    // and CANNOT be stopped by stopImmediatePropagation() on a capture-phase
    // submit listener. So we have to block earlier — at click/keydown.
    //
    // Three intercept points:
    //   1. click on any submit button → catches mouse/touch button submission
    //   2. keydown (Enter) on any input inside the form → catches keyboard submission
    //   3. submit event itself (capture phase) → fallback for JS-triggered form.submit()

    function blockIfTypo(e) {
      var bad = checkFormForBlockingTypo(form);
      if (bad) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        bad.focus();
        bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
    }

    // 1. Submit buttons (button[type=submit], input[type=submit], or default-type buttons inside form)
    var submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
    for (var i = 0; i < submitButtons.length; i++) {
      submitButtons[i].addEventListener('click', blockIfTypo, true);
    }

    // 2. Enter key inside any field within the form
    var allInputs = form.querySelectorAll('input, select, textarea');
    for (var j = 0; j < allInputs.length; j++) {
      allInputs[j].addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          // Only intercept if this would trigger form submission (textarea Enter is for newline)
          if (e.target.tagName === 'TEXTAREA') return;
          blockIfTypo(e);
        }
      }, true);
    }

    // 3. Fallback: submit event itself, capture phase
    form.addEventListener('submit', blockIfTypo, true);
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
