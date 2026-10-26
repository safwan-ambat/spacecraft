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

// Location suggestions as people type: one shared native datalist for every Location field. Free text is still accepted.
const CITIES = ['Agra', 'Ahmedabad', 'Ajmer', 'Aligarh', 'Amravati', 'Amritsar', 'Aurangabad', 'Bareilly', 'Belagavi', 'Bengaluru',
  'Bhiwadi', 'Bhopal', 'Bhubaneswar', 'Chandigarh', 'Chennai', 'Coimbatore', 'Cuttack', 'Dehradun', 'Delhi', 'Dhanbad',
  'Durgapur', 'Faridabad', 'Gandhinagar', 'Ghaziabad', 'Goa', 'Greater Noida', 'Guntur', 'Gurugram', 'Guwahati', 'Gwalior',
  'Hubballi', 'Hyderabad', 'Indore', 'Jabalpur', 'Jaipur', 'Jaisalmer', 'Jalandhar', 'Jammu', 'Jamshedpur', 'Jodhpur', 'Kanpur',
  'Kerala', 'Kochi', 'Kolhapur', 'Kolkata', 'Kota', 'Kozhikode', 'Lucknow', 'Ludhiana', 'Madurai', 'Manesar', 'Mangalore',
  'Mangaluru', 'Meerut',
  'Mohali', 'Mumbai', 'Mysuru', 'Nagpur', 'Nashik', 'Navi Mumbai', 'Noida', 'Panaji', 'Panchkula', 'Panipat', 'Patna',
  'Pimpri-Chinchwad', 'Puducherry', 'Pune', 'Raipur', 'Rajkot', 'Ranchi', 'Salem', 'Shimla', 'Siliguri', 'Sonipat', 'Srinagar',
  'Surat', 'Thane', 'Thiruvananthapuram', 'Thrissur', 'Tiruchirappalli', 'Tirupati', 'Udaipur', 'Vadodara', 'Varanasi',
  'Vijayawada', 'Visakhapatnam', 'Warangal'];
const locationFields = document.querySelectorAll('input[name="location"]');
if (locationFields.length) {
  const list = document.createElement('datalist');
  list.id = 'city-suggestions';
  list.append(...CITIES.map(city => Object.assign(document.createElement('option'), { value: city })));
  document.body.append(list);
  locationFields.forEach(input => { input.setAttribute('list', list.id); input.autocomplete = 'off'; });
}

// Company suggestions from Wikidata (built by scripts/fetch-company-names.py). Names are split into small files by
// the first two letters of the normalised name; each is fetched once, on demand, and the best matches fill a datalist.
const companyKey = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');
const companyShards = new Map();
const loadCompanies = prefix => {
  if (!companyShards.has(prefix)) {
    companyShards.set(prefix, fetch('/data/companies/' + prefix + '.json').then(r => (r.ok ? r.json() : [])).catch(() => []));
  }
  return companyShards.get(prefix);
};
document.querySelectorAll('input[name="company"]').forEach((input, i) => {
  const list = document.createElement('datalist');
  list.id = 'company-suggestions-' + i;
  document.body.append(list);
  input.setAttribute('list', list.id);
  input.autocomplete = 'off';
  let latest = '';
  input.addEventListener('input', async () => {
    const typed = companyKey(input.value);
    latest = typed;
    if (typed.length < 2) { list.replaceChildren(); return; }
    const names = await loadCompanies(typed.slice(0, 2));
    if (latest !== typed) return; // a newer keystroke has taken over
    const matches = [];
    for (const name of names) {
      if (companyKey(name).startsWith(typed) && name !== input.value) matches.push(name);
      if (matches.length === 8) break;
    }
    list.replaceChildren(...matches.map(name => Object.assign(document.createElement('option'), { value: name })));
  });
});
