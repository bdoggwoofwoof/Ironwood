/* ============ Starred plans and exercises (Nov 16, Newt) ============
   settings.starPlans / settings.starEx: { id: 1 }. Starred plans get their own Starred filter at the top of Plans;
   starred exercises come first in the exercise picker and in Progress → Exercises. */
const isStarPlan = id => !!((S.meta.settings.starPlans || {})[id]);
const isStarEx = id => !!((S.meta.settings.starEx || {})[id]);
function toggleStarKey(key, id, name) {
  const on = !((S.meta.settings[key] || {})[id]);
  commit(st => { const m = { ...(st.meta.settings[key] || {}) }; if (on) m[id] = 1; else delete m[id]; st.meta.settings[key] = m; }, 'meta');
  showToast({ kind: 'info', text: (on ? 'Starred ' : 'Unstarred ') + (name || '') });
}
function ItemStar({ on, label, onClick, id, big }) {
  return html`<button class=${'rec-star' + (big ? ' big' : '') + (on ? ' on' : '')} id=${id} aria-pressed=${on} aria-label=${(on ? 'Unstar ' : 'Star ') + label} onClick=${e => { e.stopPropagation(); onClick(); }}>${on ? '★' : '☆'}</button>`;
}
const PlanStar = ({ r, big, id }) => html`<${ItemStar} on=${isStarPlan(r.id)} label=${r.name} big=${big} id=${id} onClick=${() => toggleStarKey('starPlans', r.id, r.name)}/>`;
const ExStar = ({ ex, big, id }) => html`<${ItemStar} on=${isStarEx(ex)} label=${exName(ex)} big=${big} id=${id} onClick=${() => toggleStarKey('starEx', ex, exName(ex))}/>`;
