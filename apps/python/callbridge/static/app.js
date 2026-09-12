const form = document.querySelector('#handoff-form');
const results = document.querySelector('#results');
const state = { handoff: null };

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch])); }

function fillForm(data) {
  for (const key of ['business_name', 'visitor_name', 'phone', 'reason', 'page_url']) {
    if (form.elements[key]) form.elements[key].value = data[key] || '';
  }
  form.elements.consent.checked = Boolean(data.consent);
}

async function post(path, body) {
  const response = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function readForm() { return { business_name:form.elements.business_name.value.trim(), visitor_name:form.elements.visitor_name.value.trim(), phone:form.elements.phone.value.trim(), reason:form.elements.reason.value.trim(), page_url:form.elements.page_url.value.trim(), consent:form.elements.consent.checked, context:{ account_stage:'trial', source:'human_handoff_cta' } }; }

async function createHandoff(event) {
  event.preventDefault();
  try { state.handoff = await post('/api/handoffs', readForm()); renderReady(state.handoff); }
  catch (error) { alert(error.message); }
}

function renderReady(handoff) {
  results.innerHTML = `<div class="plan-summary"><h3>Callback ready</h3><p>${escapeHtml(handoff.business_name)} · ${escapeHtml(handoff.visitor_name)} · ${escapeHtml(handoff.phone_masked)}</p></div><div class="notice">Preview is safe by default. No call is placed until the operator explicitly chooses live mode.</div><div class="brief"><div class="brief-label">Visitor reason</div><div class="brief-value">${escapeHtml(handoff.reason)}</div></div><div class="actions"><button class="button primary" id="preview-button">Preview callback</button><button class="button live" id="live-button">Place live call</button></div>`;
  document.querySelector('#preview-button').onclick = () => dispatch('preview');
  document.querySelector('#live-button').onclick = () => { if (confirm('This will place one real outbound call to the consented visitor. Continue?')) dispatch('live'); };
}

async function dispatch(mode) {
  const button = document.querySelector(mode === 'live' ? '#live-button' : '#preview-button');
  button.disabled = true; button.textContent = mode === 'live' ? 'Calling…' : 'Previewing…';
  try { state.handoff = await post(`/api/handoffs/${state.handoff.id}/dispatch`, { mode }); renderResult(state.handoff, mode); }
  catch (error) { alert(error.message); button.disabled = false; button.textContent = mode === 'live' ? 'Place live call' : 'Preview callback'; }
}

function renderResult(handoff, mode) {
  const result = handoff.result || {};
  results.innerHTML = `<div class="plan-summary"><h3>${mode === 'live' ? 'Live callback complete' : 'Preview handoff brief'}</h3><p>${escapeHtml(handoff.business_name)} · ${escapeHtml(handoff.phone_masked)} · ${mode === 'live' ? 'CALL-E' : 'no call placed'}</p></div><div class="result-grid"><div class="metric"><div class="metric-label">Intent</div><div class="metric-value">${escapeHtml(result.intent)}</div></div><div class="metric"><div class="metric-label">Urgency</div><div class="metric-value">${escapeHtml(result.urgency)}</div></div><div class="metric"><div class="metric-label">Human follow-up</div><div class="metric-value">${result.human_followup_requested ? 'Requested' : 'Not requested'}</div></div><div class="metric"><div class="metric-label">Preferred window</div><div class="metric-value">${escapeHtml(result.preferred_callback_window)}</div></div></div><div class="brief"><div class="brief-label">Summary</div><div class="brief-value">${escapeHtml(result.summary)}</div><div class="brief-label next-label">Next step</div><div class="brief-value">${escapeHtml(result.next_step)}</div></div><div class="notice">The AI gathered context; a human owns the final response and any account action.</div>`;
}

document.querySelector('#demo-button').onclick = async () => { try { const demo = await post('/api/demo', {}); fillForm(demo); state.handoff = demo; renderReady(demo); } catch (error) { alert(error.message); } };
form.addEventListener('submit', createHandoff);
