// Sends the enquiry, career and partner forms to the Google Sheet web app (source: scripts/google-sheet-endpoint.gs).
const ENQUIRY_ENDPOINT = 'https://script.google.com/macros/s/AKfycby7PiAs4v1y_psDLt0kb3lTg-WOMqZPyqRkN292CZs8_VY1teZZjEBt1RYlW4UvzeMH/exec';
const SENT_COPY = {
  project: 'We’ve received your enquiry and will be in touch soon.',
  career: 'We’ve received your details. Thank you for your interest in Space Craft.',
  partner: 'Thanks for the introduction. We’ll be in touch when a project fits your expertise.'
};

function bindEnquiryForm(form) {
  const status = form.querySelector('.enquiry-result,#form-status');
  const button = form.querySelector('button[type="submit"]');
  const label = button.firstChild.textContent;
  const kind = form.dataset.kind || 'project';
  const el = (tag, text) => { const n = document.createElement(tag); n.textContent = text; return n; };
  const show = (...nodes) => {
    status.replaceChildren(...nodes);
    status.hidden = false;
    status.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const data = new URLSearchParams(new FormData(form));
    data.set('source', kind);
    data.set('page', location.pathname);
    const first = String(data.get('name') || '').trim().split(/\s+/)[0];
    button.disabled = true;
    button.firstChild.textContent = 'Sending… ';
    form.setAttribute('aria-busy', 'true');
    status.hidden = true;
    try {
      if (!ENQUIRY_ENDPOINT) throw new Error('endpoint not configured');
      const res = await fetch(ENQUIRY_ENDPOINT, { method: 'POST', body: data });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'rejected');
      const again = el('button', 'Send another');
      again.type = 'button';
      again.addEventListener('click', () => {
        form.classList.remove('is-sent');
        status.hidden = true;
        form.querySelector('input').focus();
      });
      form.reset();
      form.classList.add('is-sent');
      show(el('strong', 'Thank you' + (first ? ', ' + first : '') + '.'), el('p', SENT_COPY[kind]), again);
    } catch (err) {
      show(el('strong', 'That didn’t go through.'), el('p', 'Please check your connection and try again in a moment.'));
    } finally {
      button.disabled = false;
      button.firstChild.textContent = label;
      form.removeAttribute('aria-busy');
    }
  });
}

document.querySelectorAll('#inquiry,.enquiry-form').forEach(bindEnquiryForm);

// Suggestions under Location and Company fields: a small accessible combobox (our own list, not the
// browser's datalist, so it always sits directly under the field). Free text is always accepted.
const CITIES = ['Agra', 'Ahmedabad', 'Ajmer', 'Aligarh', 'Amravati', 'Amritsar', 'Aurangabad', 'Bareilly', 'Belagavi', 'Bengaluru',
  'Bhiwadi', 'Bhopal', 'Bhubaneswar', 'Chandigarh', 'Chennai', 'Coimbatore', 'Cuttack', 'Dehradun', 'Delhi', 'Dhanbad',
  'Durgapur', 'Faridabad', 'Gandhinagar', 'Ghaziabad', 'Goa', 'Greater Noida', 'Guntur', 'Gurugram', 'Guwahati', 'Gwalior',
  'Hubballi', 'Hyderabad', 'Indore', 'Jabalpur', 'Jaipur', 'Jaisalmer', 'Jalandhar', 'Jammu', 'Jamshedpur', 'Jodhpur', 'Kanpur',
  'Kerala', 'Kochi', 'Kolhapur', 'Kolkata', 'Kota', 'Kozhikode', 'Lucknow', 'Ludhiana', 'Madurai', 'Manesar', 'Mangalore',
  'Mangaluru', 'Meerut',
  'Mohali', 'Mumbai', 'Mysuru', 'Nagpur', 'Nashik', 'Navi Mumbai', 'Noida', 'Panaji', 'Panchkula', 'Panipat', 'Patna',
  'Pimpri-Chinchwad', 'Puducherry', 'Pune', 'Raipur', 'Rajkot', 'Ranchi', 'Salem', 'Shimla', 'Siliguri', 'Sonipat', 'Srinagar',
  'Surat', 'Thane', 'Thiruvananthapuram', 'Thrissur', 'Tiruchirappalli', 'Tirupati', 'Udaipur', 'Vadodara', 'Varanasi',
  'Vijayawada', 'Visakhapatnam', 'Warangal',
  // Names people still commonly type.
  'Bangalore', 'Baroda', 'Bombay', 'Calcutta', 'Calicut', 'Gurgaon', 'Madras', 'Mysore', 'Pondicherry', 'Trivandrum', 'Vizag'];
const companyKey = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');
const companyShards = new Map();
const loadCompanies = prefix => {
  if (!companyShards.has(prefix)) {
    companyShards.set(prefix, fetch('/data/companies/' + prefix + '.json').then(r => (r.ok ? r.json() : [])).catch(() => []));
  }
  return companyShards.get(prefix);
};
// Company names come from Wikidata (scripts/fetch-company-names.py), split into files by two-letter prefix.
const companyMatches = async typed => {
  if (typed.length < 2) return [];
  const names = await loadCompanies(typed.slice(0, 2));
  const out = [];
  for (const name of names) {
    if (companyKey(name).startsWith(typed)) out.push(name);
    if (out.length === 8) break;
  }
  return out;
};
const cityMatches = async typed => (typed ? CITIES.filter(c => companyKey(c).startsWith(typed)).slice(0, 8) : []);

let comboCount = 0;
function attachSuggestions(input, source) {
  const id = 'suggest-' + (++comboCount);
  const list = document.createElement('ul');
  list.className = 'suggest';
  list.id = id;
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  input.after(list);
  input.parentElement.classList.add('has-suggest');
  Object.assign(input, { autocomplete: 'off' });
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', id);
  input.setAttribute('aria-expanded', 'false');

  let items = [], active = -1, latest = '';
  const close = () => {
    list.hidden = true; active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };
  const highlight = i => {
    active = i;
    [...list.children].forEach((li, n) => li.setAttribute('aria-selected', String(n === i)));
    if (i > -1) { input.setAttribute('aria-activedescendant', id + '-' + i); list.children[i].scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  };
  const choose = i => { input.value = items[i]; close(); input.dispatchEvent(new Event('change', { bubbles: true })); };
  const render = typedRaw => {
    if (!items.length) return close();
    list.replaceChildren(...items.map((name, n) => {
      const li = document.createElement('li');
      li.id = id + '-' + n;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      const cut = name.toLowerCase().startsWith(typedRaw.toLowerCase()) ? typedRaw.length : 0;
      const strong = document.createElement('strong');
      strong.textContent = name.slice(0, cut);
      li.append(strong, name.slice(cut));
      li.addEventListener('mousedown', e => { e.preventDefault(); choose(n); });
      return li;
    }));
    list.hidden = false; active = -1;
    input.setAttribute('aria-expanded', 'true');
    // Keep the list on screen: open towards the left when the field sits near the right edge.
    list.classList.remove('align-end');
    if (list.getBoundingClientRect().right > document.documentElement.clientWidth - 8) list.classList.add('align-end');
  };

  input.addEventListener('input', async () => {
    const raw = input.value.trim();
    const typed = companyKey(raw);
    latest = typed;
    const found = await source(typed);
    if (latest !== typed) return; // a newer keystroke has taken over
    items = found.filter(n => n !== input.value);
    render(raw);
  });
  input.addEventListener('keydown', e => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight((active + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active <= 0 ? items.length - 1 : active - 1); }
    else if (e.key === 'Enter' && active > -1) { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') close();
  });
  input.addEventListener('blur', () => setTimeout(close, 120));
}

document.querySelectorAll('input[name="location"]').forEach(input => attachSuggestions(input, cityMatches));
document.querySelectorAll('input[name="company"]').forEach(input => attachSuggestions(input, companyMatches));
