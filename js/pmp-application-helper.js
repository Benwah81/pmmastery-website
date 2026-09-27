(function () {
    'use strict';

    // ---------- Pure month math ----------

    function monthIndex(year, month) {
        return year * 12 + (month - 1);
    }

    function validateRange(start, end, today) {
        var startIdx = monthIndex(start.year, start.month);
        var endIdx = monthIndex(end.year, end.month);
        var todayIdx = monthIndex(today.year, today.month);
        if (startIdx > todayIdx) return "The start month can't be after this month.";
        if (endIdx > todayIdx) return "The end month can't be after this month.";
        if (endIdx < startIdx) return "The end month is before the start month.";
        return null;
    }

    function windowStart(today) {
        return monthIndex(today.year, today.month) - 119;
    }

    function countMonths(ranges, today) {
        var wStart = windowStart(today);
        var valid = [];
        var i, r, startIdx, endIdx;
        for (i = 0; i < ranges.length; i++) {
            r = ranges[i];
            if (validateRange(r.start, r.end, today)) continue;
            startIdx = monthIndex(r.start.year, r.start.month);
            endIdx = monthIndex(r.end.year, r.end.month);
            valid.push({ start: startIdx, end: endIdx });
        }

        var clippedByWindow = false;
        var clipped = [];
        var j, v, s;
        for (j = 0; j < valid.length; j++) {
            v = valid[j];
            s = v.start;
            if (s < wStart) {
                clippedByWindow = true;
                s = wStart;
            }
            if (s > v.end) continue;
            clipped.push({ start: s, end: v.end });
        }

        clipped.sort(function (a, b) { return a.start - b.start; });

        var merged = [];
        var k, c, last;
        for (k = 0; k < clipped.length; k++) {
            c = clipped[k];
            last = merged[merged.length - 1];
            if (last && c.start <= last.end + 1) {
                if (c.end > last.end) last.end = c.end;
            } else {
                merged.push({ start: c.start, end: c.end });
            }
        }

        var total = 0;
        var m;
        for (m = 0; m < merged.length; m++) {
            merged[m].months = merged[m].end - merged[m].start + 1;
            total += merged[m].months;
        }

        return { total: total, merged: merged, clippedByWindow: clippedByWindow };
    }

    // Builds a {start, end} range from a project card's raw fields, or null if
    // the card is missing a start or end date. "Currently in this project"
    // forces end to today's month.
    function cardToRange(card, today) {
        if (!card.startYear || !card.startMonth) return null;
        var end;
        if (card.currently) {
            end = { year: today.year, month: today.month };
        } else {
            if (!card.endYear || !card.endMonth) return null;
            end = { year: card.endYear, month: card.endMonth };
        }
        return { start: { year: card.startYear, month: card.startMonth }, end: end };
    }

    // ---------- Word count ----------

    function wordCount(text) {
        var trimmed = text.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).filter(Boolean).length;
    }

    function wordCountMessage(count) {
        if (count === 0) return null;
        if (count < 100) {
            return { status: 'red', bucket: 'under_100', text: "PMI's form needs at least 100 words. Add detail about what you actually did. Don't pad it." };
        }
        if (count <= 479) {
            return { status: 'green', bucket: '100_479', text: "Within PMI's 100 to 500 word range." };
        }
        if (count <= 500) {
            return { status: 'amber', bucket: '480_500', text: "Close to PMI's 500-word limit. PMI's counter may count a little differently than ours, so leave some room." };
        }
        return { status: 'red', bucket: 'over_500', text: "Over PMI's 500-word limit. Cut it down before pasting." };
    }

    // Joins the four answers in order, trimmed, with a single space, empty
    // answers skipped. No connector words, no templates (H1).
    function buildSummary(answers) {
        var parts = [];
        for (var i = 0; i < answers.length; i++) {
            var t = (answers[i] || '').trim();
            if (t) parts.push(t);
        }
        return parts.join(' ');
    }

    var monthMath = {
        monthIndex: monthIndex,
        validateRange: validateRange,
        windowStart: windowStart,
        countMonths: countMonths,
        cardToRange: cardToRange,
        wordCount: wordCount,
        wordCountMessage: wordCountMessage,
        buildSummary: buildSummary
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = monthMath;
    }

    if (typeof document === 'undefined') {
        return;
    }

    // ---------- UI ----------

    document.addEventListener('DOMContentLoaded', function () {
        var STORAGE_KEY = 'pmm_apphelper_v1';
        var MAX_CARDS = 20;
        var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var REQUIRED_MONTHS = { hs: 60, assoc: 48, bachelor: 36, gac: 24 };

        var now = new Date();
        var today = { year: now.getFullYear(), month: now.getMonth() + 1 };

        var pathSelect = document.getElementById('ph-path');
        var totalsPanel = document.getElementById('ph-totals');
        var cardsContainer = document.getElementById('ph-cards');
        var addCardBtn = document.getElementById('ph-add-card');
        var attestCheckbox = document.getElementById('ph-attest-checkbox');
        var clearBtn = document.getElementById('ph-clear');
        var checklistBoxes = Array.prototype.slice.call(document.querySelectorAll('.ph-checklist-item'));
        var checklistDone = document.getElementById('ph-checklist-done');

        var cardIdCounter = 0;
        var cards = [];
        var monthsCalculatedFired = false;
        var checklistCompletedFired = false;

        function track(name, props) {
            if (window.posthog && typeof posthog.capture === 'function') {
                posthog.capture(name, props || {});
            }
        }

        function monthOptions() {
            var html = '<option value="">Month</option>';
            for (var m = 1; m <= 12; m++) {
                html += '<option value="' + m + '">' + MONTH_NAMES[m - 1] + '</option>';
            }
            return html;
        }

        function yearOptions() {
            var html = '<option value="">Year</option>';
            var currentYear = today.year;
            for (var y = currentYear; y >= currentYear - 15; y--) {
                html += '<option value="' + y + '">' + y + '</option>';
            }
            return html;
        }

        function indexToDate(idx) {
            var year = Math.floor(idx / 12);
            var month = idx - year * 12 + 1;
            return { year: year, month: month };
        }

        function formatMonthYear(idx) {
            var d = indexToDate(idx);
            return MONTH_NAMES[d.month - 1] + ' ' + d.year;
        }

        function formatRange(r) {
            return formatMonthYear(r.start) + ' to ' + formatMonthYear(r.end) + ' (' + r.months + ' month' + (r.months === 1 ? '' : 's') + ')';
        }

        // ---------- Cards ----------

        function cardSkeleton(id) {
            var wrap = document.createElement('div');
            wrap.className = 'ph-card';
            wrap.dataset.id = id;
            wrap.innerHTML =
                '<div class="ph-card-head">' +
                    '<h4>Project <span class="ph-card-num"></span></h4>' +
                    '<button type="button" class="ph-remove-btn"><i class="fas fa-trash"></i> Remove</button>' +
                '</div>' +
                '<div class="ph-field-row">' +
                    '<div class="ph-field"><label>Organization</label><input type="text" class="ph-org"></div>' +
                    '<div class="ph-field"><label>Job title</label><input type="text" class="ph-title"></div>' +
                '</div>' +
                '<label class="ph-checkbox"><input type="checkbox" class="ph-currently"> Currently in this project</label>' +
                '<div class="ph-field-row">' +
                    '<div class="ph-field"><label>Start month</label><div class="ph-date-pair"><select class="ph-start-month">' + monthOptions() + '</select><select class="ph-start-year">' + yearOptions() + '</select></div></div>' +
                    '<div class="ph-field"><label>End month</label><div class="ph-date-pair"><select class="ph-end-month">' + monthOptions() + '</select><select class="ph-end-year">' + yearOptions() + '</select></div></div>' +
                '</div>' +
                '<p class="ph-date-error"></p>' +
                '<div class="ph-textarea-field" data-key="role"><label>Your role</label><p class="ph-hint">What was your role on this project, who assigned it, and who did you report to?</p><textarea rows="3"></textarea></div>' +
                '<div class="ph-textarea-field" data-key="objective"><label>The project objective</label><p class="ph-hint">What was the project supposed to deliver, and by when? What made it a project and not ongoing work?</p><textarea rows="3"></textarea></div>' +
                '<div class="ph-textarea-field" data-key="contributions"><label>What you did</label><p class="ph-hint">What did you personally lead, plan or decide? Say &quot;I&quot; for your work and name the team for theirs.</p><textarea rows="3"></textarea></div>' +
                '<div class="ph-textarea-field" data-key="outcomes"><label>The outcome</label><p class="ph-hint">How did it end, and what was the result? Include the misses. Only use numbers you could back up.</p><textarea rows="3"></textarea></div>' +
                '<p class="ph-wordcount"></p>' +
                '<div class="ph-preview-wrap"><label>Preview (this is exactly what gets copied)</label><textarea class="ph-preview" readonly rows="4"></textarea></div>' +
                '<button type="button" class="ph-copy-btn" disabled>Copy summary</button>' +
                '<a href="#helper-attest" class="ph-attest-jump">Tick the attestation box above to unlock copying</a>' +
                '<p class="ph-copy-note">Paste this into PMI\'s Project Summary box. Organization, job title and dates go in their own fields.</p>';
            return wrap;
        }

        function newCardState(id) {
            return {
                id: id,
                org: '',
                title: '',
                currently: false,
                startMonth: '',
                startYear: '',
                endMonth: '',
                endYear: '',
                role: '',
                objective: '',
                contributions: '',
                outcomes: ''
            };
        }

        function addCard(state, skipTrack) {
            var id = 'c' + (cardIdCounter++);
            var data = state || newCardState(id);
            data.id = id;
            var el = cardSkeleton(id);
            cardsContainer.appendChild(el);
            cards.push({ id: id, el: el, data: data });
            wireCard(cards[cards.length - 1]);
            populateCard(cards[cards.length - 1]);
            renumberCards();
            if (!skipTrack) {
                track('apphelper_project_added', { project_count: cards.length });
            }
            return cards[cards.length - 1];
        }

        function renumberCards() {
            for (var i = 0; i < cards.length; i++) {
                cards[i].el.querySelector('.ph-card-num').textContent = String(i + 1);
                var removeBtn = cards[i].el.querySelector('.ph-remove-btn');
                removeBtn.style.display = cards.length > 1 ? '' : 'none';
            }
            addCardBtn.style.display = cards.length >= MAX_CARDS ? 'none' : '';
        }

        function populateCard(card) {
            var d = card.data;
            var el = card.el;
            el.querySelector('.ph-org').value = d.org;
            el.querySelector('.ph-title').value = d.title;
            el.querySelector('.ph-currently').checked = !!d.currently;
            el.querySelector('.ph-start-month').value = d.startMonth || '';
            el.querySelector('.ph-start-year').value = d.startYear || '';
            el.querySelector('.ph-end-month').value = d.endMonth || '';
            el.querySelector('.ph-end-year').value = d.endYear || '';
            var fields = el.querySelectorAll('.ph-textarea-field');
            fields.forEach(function (f) {
                var key = f.dataset.key;
                f.querySelector('textarea').value = d[key] || '';
            });
            updateEndDisabled(card);
            updateCard(card);
        }

        function updateEndDisabled(card) {
            var currently = card.el.querySelector('.ph-currently').checked;
            card.el.querySelector('.ph-end-month').disabled = currently;
            card.el.querySelector('.ph-end-year').disabled = currently;
        }

        function wireCard(card) {
            var el = card.el;
            var d = card.data;

            el.querySelector('.ph-org').addEventListener('input', function (e) {
                d.org = e.target.value;
                saveState();
            });
            el.querySelector('.ph-title').addEventListener('input', function (e) {
                d.title = e.target.value;
                saveState();
            });
            el.querySelector('.ph-currently').addEventListener('change', function (e) {
                d.currently = e.target.checked;
                updateEndDisabled(card);
                updateCard(card);
                saveState();
            });
            el.querySelector('.ph-start-month').addEventListener('change', function (e) {
                d.startMonth = e.target.value ? parseInt(e.target.value, 10) : '';
                updateCard(card);
                saveState();
            });
            el.querySelector('.ph-start-year').addEventListener('change', function (e) {
                d.startYear = e.target.value ? parseInt(e.target.value, 10) : '';
                updateCard(card);
                saveState();
            });
            el.querySelector('.ph-end-month').addEventListener('change', function (e) {
                d.endMonth = e.target.value ? parseInt(e.target.value, 10) : '';
                updateCard(card);
                saveState();
            });
            el.querySelector('.ph-end-year').addEventListener('change', function (e) {
                d.endYear = e.target.value ? parseInt(e.target.value, 10) : '';
                updateCard(card);
                saveState();
            });
            el.querySelectorAll('.ph-textarea-field textarea').forEach(function (ta) {
                var key = ta.closest('.ph-textarea-field').dataset.key;
                ta.addEventListener('input', function (e) {
                    d[key] = e.target.value;
                    updateCard(card);
                    saveState();
                });
            });
            el.querySelector('.ph-remove-btn').addEventListener('click', function () {
                removeCard(card);
            });
            el.querySelector('.ph-copy-btn').addEventListener('click', function () {
                copyCard(card);
            });
        }

        function removeCard(card) {
            if (cards.length <= 1) return;
            card.el.parentNode.removeChild(card.el);
            cards = cards.filter(function (c) { return c.id !== card.id; });
            renumberCards();
            saveState();
            updateTotals();
        }

        function updateCard(card) {
            var d = card.data;
            var errorEl = card.el.querySelector('.ph-date-error');
            var hasStart = d.startMonth && d.startYear;
            var hasEnd = d.currently || (d.endMonth && d.endYear);

            errorEl.textContent = '';
            if (!hasStart || !hasEnd) {
                if ((d.startMonth || d.startYear || d.endMonth || d.endYear) && !(hasStart && hasEnd)) {
                    errorEl.textContent = 'Add start and end months to count this project.';
                }
            } else {
                var start = { year: d.startYear, month: d.startMonth };
                var end = d.currently ? { year: today.year, month: today.month } : { year: d.endYear, month: d.endMonth };
                var err = validateRange(start, end, today);
                if (err) errorEl.textContent = err;
            }

            var summary = buildSummary([d.role, d.objective, d.contributions, d.outcomes]);
            var count = wordCount(summary);
            var msg = wordCountMessage(count);
            var wcEl = card.el.querySelector('.ph-wordcount');
            wcEl.className = 'ph-wordcount';
            if (msg) {
                wcEl.classList.add('ph-wc-' + msg.status);
                wcEl.textContent = count + ' words. ' + msg.text;
            } else {
                wcEl.textContent = count + ' words.';
            }

            card.el.querySelector('.ph-preview').value = summary;

            updateTotals();
        }

        // ---------- Totals ----------

        function updateTotals() {
            var path = pathSelect.value;
            var ranges = [];
            var anyValidDates = false;

            cards.forEach(function (card) {
                var d = card.data;
                var r = cardToRange(d, today);
                if (r && !validateRange(r.start, r.end, today)) {
                    ranges.push(r);
                    anyValidDates = true;
                }
            });

            if (!path) {
                totalsPanel.innerHTML = '<p>Pick your education to see the months you need.</p>';
                return;
            }

            var required = REQUIRED_MONTHS[path];
            var result = countMonths(ranges, today);
            var meets = result.total >= required;

            var html = '';
            var mergedList = result.merged.map(formatRange);
            if (mergedList.length) {
                html += '<p class="ph-merged-label">Counted ranges:</p><ul class="ph-merged-list">';
                mergedList.forEach(function (m) { html += '<li>' + escapeHtml(m) + '</li>'; });
                html += '</ul>';
            }

            if (meets) {
                html += "<p class=\"ph-totals-status ph-totals-meets\">That's " + result.total + " months, which meets the " + required + "-month minimum on paper. PMI decides eligibility, and any entry can be audited.</p>";
            } else {
                html += "<p class=\"ph-totals-status ph-totals-short\">You're showing " + result.total + " of the " + required + " months your education path needs. Only count months you actually spent leading or directing a project. If you're short, the honest fix is time: keep leading projects and apply when the months are there.</p>";
            }

            if (result.clippedByWindow) {
                var wStartLabel = formatMonthYear(windowStart(today));
                html += "<p class=\"ph-totals-window\">Months before " + wStartLabel + " fall outside the last 10 years, so they aren't counted here. PMI doesn't publish exactly how it measures the window, so compare your earliest dates against PMI's form.</p>";
            }

            totalsPanel.innerHTML = html;

            if (!monthsCalculatedFired && path && anyValidDates) {
                monthsCalculatedFired = true;
                track('apphelper_months_calculated', {
                    path: path,
                    total_months: result.total,
                    required_months: required,
                    meets: meets
                });
            }
        }

        function escapeHtml(s) {
            return String(s).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        }

        // ---------- Attestation ----------

        function updateAttestState() {
            var attested = attestCheckbox.checked;
            document.getElementById('helper').classList.toggle('ph-attested', attested);
            cards.forEach(function (card) {
                card.el.querySelector('.ph-copy-btn').disabled = !attested;
            });
        }

        attestCheckbox.addEventListener('change', function () {
            updateAttestState();
            if (attestCheckbox.checked) {
                track('apphelper_attested', {});
            }
        });

        // ---------- Copy ----------

        function copyCard(card) {
            if (!attestCheckbox.checked) return;
            var textarea = card.el.querySelector('.ph-preview');
            var text = textarea.value;
            var btn = card.el.querySelector('.ph-copy-btn');

            function done() {
                var original = 'Copy summary';
                btn.textContent = 'Copied';
                setTimeout(function () { btn.textContent = original; }, 2000);
                var count = wordCount(text);
                var msg = wordCountMessage(count);
                track('apphelper_summary_copied', { word_bucket: msg ? msg.bucket : 'under_100' });
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, function () {
                    fallbackCopy(textarea, done);
                });
            } else {
                fallbackCopy(textarea, done);
            }
        }

        function fallbackCopy(textarea, cb) {
            textarea.removeAttribute('readonly');
            textarea.select();
            try { document.execCommand('copy'); } catch (e) { /* no-op */ }
            textarea.setAttribute('readonly', 'readonly');
            cb();
        }

        // ---------- Checklist ----------

        function updateChecklist() {
            var allDone = checklistBoxes.every(function (b) { return b.checked; });
            checklistDone.style.display = allDone ? '' : 'none';
            if (allDone && !checklistCompletedFired) {
                checklistCompletedFired = true;
                track('apphelper_checklist_completed', {});
            }
        }

        checklistBoxes.forEach(function (box) {
            box.addEventListener('change', function () {
                updateChecklist();
                saveState();
            });
        });

        // ---------- Storage ----------

        function saveState() {
            try {
                var data = {
                    path: pathSelect.value,
                    projects: cards.map(function (c) { return c.data; }),
                    checklist: checklistBoxes.map(function (b) { return b.checked; })
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) { /* private mode or storage unavailable */ }
        }

        function loadState() {
            var raw = null;
            try {
                raw = localStorage.getItem(STORAGE_KEY);
            } catch (e) { /* private mode or storage unavailable */ }
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch (e) {
                return null;
            }
        }

        function clearEverything() {
            if (!window.confirm('Clear all drafts saved in this browser? This cannot be undone.')) return;
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* no-op */ }
            cardsContainer.innerHTML = '';
            cards = [];
            pathSelect.value = '';
            checklistBoxes.forEach(function (b) { b.checked = false; });
            monthsCalculatedFired = false;
            checklistCompletedFired = false;
            addCard(null, true);
            updateChecklist();
            updateTotals();
        }

        clearBtn.addEventListener('click', clearEverything);
        pathSelect.addEventListener('change', function () {
            saveState();
            updateTotals();
        });
        addCardBtn.addEventListener('click', function () { addCard(); });

        // ---------- CTA ----------

        var ctaBtn = document.getElementById('ph-cta-btn');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', function () {
                if (window.posthog && typeof posthog.capture === 'function') {
                    posthog.capture('apphelper_cta_click', { cta: 'signup' }, { transport: 'sendBeacon' });
                }
            });
        }

        // ---------- Init ----------

        var saved = loadState();
        if (saved && saved.projects && saved.projects.length) {
            pathSelect.value = saved.path || '';
            saved.projects.forEach(function (p) { addCard(p, true); });
        } else {
            addCard(null, true);
        }
        if (saved && Array.isArray(saved.checklist)) {
            checklistBoxes.forEach(function (b, i) { b.checked = !!saved.checklist[i]; });
        }

        updateAttestState();
        updateChecklist();
        updateTotals();
    });
})();
