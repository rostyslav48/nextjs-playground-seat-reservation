import config from './config.js';
import {escapeHtml as e} from './mail.js';

export const formFields=()=>config.fields.map(field=>`<label><span>${e(field.label)}</span><input name="${e(field.name)}" type="${e(field.type)}" required maxlength="300" autocomplete="${field.name==='email'?'email':field.name==='name'?'name':'off'}"></label>`).join('');
export const detailsHtml=()=>config.details.map(([key,value])=>`<div class="detail"><small>${e(key)}</small><strong>${e(value)}</strong></div>`).join('');
export function layout(title,body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>${e(title)} · ${e(config.title)}</title><link rel="stylesheet" href="/style.css"><link rel="icon" href="/favicon.svg"></head><body><header class="site-header"><a class="wordmark" href="/">${e(config.title)}</a><a class="quiet-link" href="/admin">Operator</a></header><main>${body}</main><footer>Small tools, useful work. <span>${e(config.framework)}</span></footer></body></html>`;
}
export function homeHtml(model,message='') {
  const overview=`<div class="eyebrow">${e(config.eyebrow)}</div><h1>${e(config.headline)}</h1><p class="intro">${e(config.description)}</p><div class="details">${detailsHtml()}</div><p class="count">${model.remaining} of ${config.capacity} seats available</p>`;
  const feedback=message?`<div role="status" class="notice">${e(message)}</div>`:'';
  const form=`<form class="card" method="post" action="/api/submit"><h2>${e(config.button)}</h2>${feedback}${formFields()}<button>${e(config.button)}</button><p class="form-note">${e(config.formNote)}</p></form>`;
  return layout(config.title,`<section class="hero"><div>${overview}</div>${form}</section>`);
}
export function adminHtml(model,message='') {
  const entries=model.records.map(row=>`<article class="admin-row"><div><span class="status">${e(row.status)}</span><h3>${e(row.data.name)}</h3><p>${e(row.email)}</p><small>Reference ${e(row.id)}</small></div></article>`).join('');
  const mail=model.outbox.map(item=>`<tr><td>${e(item.status)}</td><td>${e(item.error || (item.status==='accepted'?'Accepted by email provider; delivery not confirmed.':item.status==='logged'?'Recorded locally. No email was sent.':''))}</td></tr>`).join('');
  return layout('Operator',`<section class="operator"><div class="eyebrow">WORKSPACE</div><h1>Manage ${e(config.title.toLowerCase())}.</h1>${message?`<p class="notice" role="status">${e(message)}</p>`:''}<h2>Recent records</h2>${entries || '<p class="muted">No records yet. Complete the form to get started.</p>'}<h2>Email status</h2><p class="muted">Failed messages can be retried with <code>npm run retry-email</code>. Reconcile unknown or interrupted sends with provider logs first.</p><div class="table-wrap"><table><thead><tr><th>State</th><th>Details</th></tr></thead><tbody>${mail || '<tr><td colspan="2">No emails queued.</td></tr>'}</tbody></table></div></section>`);
}
export const messageHtml=(message,isError=false)=>layout(isError?'Unable to continue':'All set',`<section class="operator narrow"><h1>${isError?'Unable to continue.':'All set.'}</h1><p class="intro" role="${isError?'alert':'status'}">${e(message)}</p><a class="button" href="/">Back to the app</a></section>`);
