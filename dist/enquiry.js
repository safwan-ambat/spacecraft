// Sends the enquiry, career and partner forms to the Google Sheet web app (source: scripts/google-sheet-endpoint.gs).
const ENQUIRY_ENDPOINT = 'https://script.google.com/macros/s/AKfycby7PiAs4v1y_psDLt0kb3lTg-WOMqZPyqRkN292CZs8_VY1teZZjEBt1RYlW4UvzeMH/exec';
const SENT_COPY = {
  project: 'We’ve received your enquiry and will be in touch soon.',
  career: 'We’ve received your details. Thank you for your interest in Space Craft.',
  partner: 'We’ve received your details. Thank you for getting in touch.'
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
