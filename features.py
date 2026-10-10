"""Apply Oct 10 overnight changes to the Liftbook artifact source (source.html) -> app.html.

- Name: Ironwood everywhere people see it (storage keys and backup label unchanged).
- Photos backup: Profile -> Backup -> "Prepare photos backup", then save the file.
- Restore: accepts workout backups and photo backups; reads big files without the text box;
  a backup restored into an empty app brings back everything (settings, bodyweight,
  challenges, timers, day marks); into a used app it adds whatever is missing.
"""
import re, sys

src = open('source.html', encoding='utf8').read()


def swap(old, new, count=1):
    global src
    n = src.count(old)
    if n != count:
        sys.exit(f'Expected {count} of {old[:80]!r}, found {n}')
    src = src.replace(old, new)


# 1. Name
src = src.replace('Liftbook', 'Ironwood')
swap("filename: 'liftbook-backup-'", "filename: 'ironwood-backup-'")
swap("'liftbook-phrases.csv'", "'ironwood-phrases.csv'")
swap("Saved liftbook-phrases.csv", "Saved ironwood-phrases.csv")
swap("filename: 'liftbook-' + p.pose", "filename: 'ironwood-' + p.pose")

# 2. Photo backup helpers, placed right after phDelete
anchor = 'async function phDelete(id) {'
i = src.index(anchor)
j = src.index('\n', i)
PHOTO_FNS = r'''
/* Photo backups: a separate file (photos are large), restored by Profile -> Restore. */
const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
const b64ToBlob = (s, type) => { const bin = atob(s); const a = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k); return new Blob([a], { type: type || 'image/jpeg' }); };
async function photoBackup() {
  const all = (await pdbTx('readonly', st => st.getAll())) || []; const photos = [];
  for (const p of all) { if (!p || !p.blob) continue; const { blob, ...rest } = p; photos.push({ ...rest, type: blob.type || 'image/jpeg', data: await blobToB64(blob) }); }
  photos.sort((a, b) => (a.t || 0) - (b.t || 0));
  return { app: 'liftbook-photos', version: 1, exportedAt: new Date().toISOString(), photos };
}
async function photoRestore(d) {
  const have = new Set(); try { ((await pdbTx('readonly', st => st.getAllKeys())) || []).forEach(k => have.add(k)); } catch (e) {}
  let n = 0;
  for (const p of (d.photos || [])) {
    if (!p || !p.id || !p.data || have.has(p.id)) continue;
    const { data, type, ...rest } = p;
    await pdbTx('readwrite', st => st.put({ ...rest, blob: b64ToBlob(data, type) })); n++;
  }
  PH.urls.forEach(u => URL.revokeObjectURL(u)); PH.urls.clear(); PH.list = null;
  return n;
}
/* Restore merge: an empty app takes the whole backup; a used app gains only what it lacks. */
function restoreInto(st, d) {
  const m = normalizeMeta(d.meta); const keys = ['meta'];
  const fresh = !Object.keys(st.sessions).length && !Object.keys(st.meta.routines).length && !Object.keys(st.meta.exercises).length;
  if (fresh) {
    const deleted = [...new Set([...(m.deleted || []), ...(st.meta.deleted || [])])];
    st.meta = { ...m, deleted };
  } else {
    Object.assign(st.meta.exercises, m.exercises || {});
    for (const [k, r] of Object.entries(m.routines || {})) if (!st.meta.routines[k]) st.meta.routines[k] = r;
    for (const f of ['exUnit', 'exRest', 'exCat', 'dayMarks', 'challenges']) { st.meta[f] = st.meta[f] || {}; for (const [k, v] of Object.entries(m[f] || {})) if (!(k in st.meta[f])) st.meta[f][k] = v; }
    const bwDays = new Set((st.meta.bw || []).map(x => x.d)); st.meta.bw = (st.meta.bw || []).concat((m.bw || []).filter(x => x && !bwDays.has(x.d)));
    const tIds = new Set((st.meta.timers || []).map(x => x.id)); st.meta.timers = (st.meta.timers || []).concat((m.timers || []).filter(x => x && !tIds.has(x.id)));
  }
  let added = 0;
  for (const [k, s] of Object.entries(d.sessions || {})) if (!st.sessions[k] && !(st.meta.deleted || []).includes(k)) { st.sessions[k] = s; keys.push('s_' + k); added++; }
  return { keys, added, fresh };
}'''
src = src[:j + 1] + PHOTO_FNS.lstrip('\n') + '\n' + src[j + 1:]

# 3. Profile: photo backup button (two steps, so the save happens right on the tap)
swap("  const copyBackup = async () => {",
     r'''  const [phb, setPhb] = useState(null);
  const preparePhotos = async () => { setMsg('Gathering photos…'); try { const d = await photoBackup(); if (!d.photos.length) { setMsg('No progress photos to back up yet.'); return; } setPhb(d); setMsg(''); } catch (e) { setMsg('Couldn’t read the photos on this device.'); } };
  const savePhotos = async () => {
    const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null; const n = phb.photos.length;
    if (!dl) { setMsg('Saving files isn’t available here.'); return; }
    try { await dl.save({ filename: 'ironwood-photos-' + ymd(new Date()) + '.json', data: new Blob([JSON.stringify(phb)], { type: 'application/json' }) }); setMsg(n + ' photo' + (n === 1 ? '' : 's') + ' saved. Restore this file in Ironwood to bring them back.'); setPhb(null); }
    catch (e) { setMsg(e && e.code === 'declined' ? 'Photos backup not saved.' : 'Could not save the file here.'); }
  };
  const copyBackup = async () => {''')
swap('''<button class="btn" onClick=${() => openSheet({ type: 'restore' })}>Restore</button></div>''',
     '''<button class="btn" onClick=${() => openSheet({ type: 'restore' })}>Restore</button></div>
      <div class="row wrap">${phb ? html`<button class="btn primary" onClick=${savePhotos}>Save ${phb.photos.length} photo${phb.photos.length === 1 ? '' : 's'}</button>` : html`<button class="btn" onClick=${preparePhotos}>Prepare photos backup</button>`}</div>
      <p class="note">The backup file has workouts, routines and settings. Progress photos are large, so they go in their own file.</p>''')

# 4. Restore sheet: either backup type, big files straight from the file picker
start = src.index('function RestoreSheet() {')
end = src.index('function ConfirmSheet(', start)
RESTORE = r'''function RestoreSheet() {
  const [text, setText] = useState(''); const [file, setFile] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const onFile = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; setErr('');
    const rd = new FileReader(); rd.onload = () => { const t = String(rd.result || ''); if (t.length > 200000) { setFile({ name: f.name, text: t }); setText(''); } else { setFile(null); setText(t); } }; rd.readAsText(f); };
  const restore = async () => {
    let d; try { d = JSON.parse(file ? file.text : text); } catch (e) { setErr('That isn’t an Ironwood backup. Choose the .json file or paste the full backup text.'); return; }
    if (d && d.app === 'liftbook-photos') {
      setBusy(true); try { const n = await photoRestore(d); closeSheet(); showToast({ kind: 'info', text: n ? n + ' photo' + (n === 1 ? '' : 's') + ' restored' : 'Those photos are already here' }); }
      catch (e) { setErr('Couldn’t save the photos on this device.'); } finally { setBusy(false); } return;
    }
    if (!d || d.app !== 'liftbook' || !d.meta) { setErr('That file isn’t an Ironwood backup.'); return; }
    let r; commit(st => { r = restoreInto(st, d); }, 'meta');
    schedule(r.keys); S.ver++; applyDisplay && applyDisplay(); S.rerender(); closeSheet();
    showToast({ kind: 'info', text: r.fresh ? 'Backup restored' : r.added + ' workout' + (r.added === 1 ? '' : 's') + ' added' });
  };
  return html`<${Sheet} label="Restore backup"><h2>Restore a backup</h2><p class="note" style="margin-bottom:10px">Choose a workout backup or a photos backup. On a fresh install this brings back everything; otherwise it adds what's missing and never overwrites what's here.</p>
    <div class="stack"><label class="btn" for="rs-file">${file ? 'Chosen: ' + file.name : 'Choose backup file'}</label><input id="rs-file" type="file" accept=".json,application/json" hidden onChange=${onFile}/>
      ${file ? null : html`<textarea class="field" id="rs-text" placeholder="…or paste the backup text" value=${text} onInput=${e => { setText(e.target.value); setErr(''); }}></textarea>`}
      ${err ? html`<p class="small down-c" role="alert">${err}</p>` : null}
      <button class="btn primary wide" disabled=${busy || !(file || text.trim())} onClick=${restore}>${busy ? 'Restoring…' : 'Restore'}</button></div><//>`;
}
'''
src = src[:start] + RESTORE + src[end:]

for need in ['function applyDisplay', 'function showToast']:
    if need not in src:
        sys.exit('missing ' + need)
open('app.html', 'w', encoding='utf8').write(src)
print('app.html written', len(src.encode()) // 1024, 'KB')
