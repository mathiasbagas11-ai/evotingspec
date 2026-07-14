/**
 * E-VOTING WEB APP — TAHAP 1 (BACKEND)
 * Model: Token Cetak + Cabut Acak (No Email, No Registration)
 *
 * Response format seragam: { ok: boolean, data?: any, code?: string }
 * Semua mutasi data (castVote, generateTokens) WAJIB pakai LockService.
 */

const PROPS = PropertiesService.getScriptProperties();
const SHARED_SECRET = PROPS.getProperty('SHARED_SECRET');
const SS = SpreadsheetApp.openById(PROPS.getProperty('SHEET_ID'));

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1
const TZ = 'Asia/Jakarta';

// ─────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SHARED_SECRET) return json({ ok: false, code: 'UNAUTHORIZED' });

    switch (body.action) {
      case 'getCandidates':  return json(getCandidates());
      case 'verifyToken':    return json(verifyToken(body.token));
      case 'castVote':       return json(castVote(body.token, body.candidateId));
      case 'generateTokens': return json(generateTokens(body.count));
      case 'getResults':     return json(getResults());
      case 'getTokenStats':  return json(getTokenStats());
      default:               return json({ ok: false, code: 'INVALID' });
    }
  } catch (err) {
    return json({ ok: false, code: 'INVALID', error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function today() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Ambil sheet by name. Kalau tidak ada -> lempar error (ketangkep di doPost).
 */
function sheet(name) {
  const sh = SS.getSheetByName(name);
  if (!sh) throw new Error('Sheet not found: ' + name);
  return sh;
}

/**
 * Baca semua data di bawah header (row 1). Return array of rows (array).
 * Kalau cuma ada header / kosong -> return [].
 */
function readRows(sh) {
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  return sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
}

// ─────────────────────────────────────────────────────────────
// getCandidates() — read-only, no lock
// ─────────────────────────────────────────────────────────────

function getCandidates() {
  // Kolom: id | name | photo_url | vision | age | education
  // age & education opsional — kalau kolomnya belum ada di Sheet, tetap
  // aman (r[4]/r[5] undefined -> string kosong).
  const rows = readRows(sheet('Candidates'));
  const data = rows
    .filter(function (r) { return String(r[0]).trim() !== ''; })
    .map(function (r) {
      return {
        id: String(r[0]).trim(),
        name: String(r[1]),
        photo_url: String(r[2]),
        vision: String(r[3]),
        age: r[4] === undefined || r[4] === '' ? '' : String(r[4]),
        education: r[5] === undefined || r[5] === '' ? '' : String(r[5]),
      };
    });
  return { ok: true, data: data };
}

// ─────────────────────────────────────────────────────────────
// verifyToken(token) — read-only, NO LOCK, NO WRITE
// ─────────────────────────────────────────────────────────────

function verifyToken(token) {
  token = String(token).trim().toUpperCase();

  // Kolom Tokens: token | is_used | created_at | used_date
  const rows = readRows(sheet('Tokens'));
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toUpperCase() === token) {
      const isUsed = rows[i][1] === true || String(rows[i][1]).toUpperCase() === 'TRUE';
      if (isUsed) return { ok: false, code: 'USED' };
      return { ok: true };
    }
  }
  return { ok: false, code: 'INVALID' };
}

// ─────────────────────────────────────────────────────────────
// castVote(token, candidateId) — WAJIB PAKAI LOCK
// ─────────────────────────────────────────────────────────────

function castVote(token, candidateId) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, code: 'LOCK_TIMEOUT' };

  try {
    token = String(token).trim().toUpperCase();

    // 1. Validasi candidateId ADA di tab Candidates (JANGAN percaya client)
    const candSheet = sheet('Candidates');
    const candRows = readRows(candSheet);
    let candidateExists = false;
    for (let i = 0; i < candRows.length; i++) {
      if (String(candRows[i][0]).trim() === String(candidateId).trim()) {
        candidateExists = true;
        break;
      }
    }
    if (!candidateExists) return { ok: false, code: 'BAD_CANDIDATE' };

    // 2. Cari row token di tab Tokens
    const tokenSheet = sheet('Tokens');
    const tokenRows = readRows(tokenSheet);
    let rowIndex = -1; // index dalam array (0-based, relatif ke data)
    for (let i = 0; i < tokenRows.length; i++) {
      if (String(tokenRows[i][0]).trim().toUpperCase() === token) {
        rowIndex = i;
        break;
      }
    }
    if (rowIndex === -1) return { ok: false, code: 'INVALID' };

    const isUsed = tokenRows[rowIndex][1] === true ||
                   String(tokenRows[rowIndex][1]).toUpperCase() === 'TRUE';
    if (isUsed) return { ok: false, code: 'USED' };

    // 3. Set is_used = TRUE, used_date = today()   <-- MARK DULU
    //    Sheet row = data index + 2 (header di row 1, data mulai row 2)
    const sheetRow = rowIndex + 2;
    tokenSheet.getRange(sheetRow, 2).setValue(true);       // is_used
    tokenSheet.getRange(sheetRow, 4).setValue(today());    // used_date

    // 4. FORCE WRITE
    SpreadsheetApp.flush();

    // 5. Append ke Votes: [vote_id, candidate_id, vote_date]
    //    Kolom Votes: vote_id | candidate_id | vote_date (TIDAK ADA token, TIDAK ADA jam)
    sheet('Votes').appendRow([Utilities.getUuid(), String(candidateId).trim(), today()]);

    // 6. return ok
    return { ok: true };
  } finally {
    lock.releaseLock(); // WAJIB di finally
  }
}

// ─────────────────────────────────────────────────────────────
// generateTokens(count) — pakai lock
// ─────────────────────────────────────────────────────────────

function generateTokens(count) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, code: 'LOCK_TIMEOUT' };

  try {
    // Cap count maksimal 500 per call
    let n = parseInt(count, 10);
    if (isNaN(n) || n < 1) n = 0;
    if (n > 500) n = 500;
    if (n === 0) return { ok: true, data: { tokens: [] } };

    const tokenSheet = sheet('Tokens');

    // Load semua token existing ke Set dulu (untuk cek collision)
    const existingRows = readRows(tokenSheet);
    const existing = {};
    for (let i = 0; i < existingRows.length; i++) {
      existing[String(existingRows[i][0]).trim().toUpperCase()] = true;
    }

    const created = today();
    const newTokens = [];
    const seen = {}; // cegah duplikat dalam batch ini juga

    let guard = 0;
    const maxGuard = n * 1000 + 10000; // safety net anti infinite loop
    while (newTokens.length < n && guard < maxGuard) {
      guard++;
      const t = randomToken();
      if (existing[t] || seen[t]) continue;
      seen[t] = true;
      newTokens.push(t);
    }

    // Batch append (satu setValues, bukan loop appendRow)
    // Row: token | is_used(FALSE) | created_at | used_date(kosong)
    const values = newTokens.map(function (t) {
      return [t, false, created, ''];
    });

    if (values.length > 0) {
      const startRow = tokenSheet.getLastRow() + 1;
      tokenSheet.getRange(startRow, 1, values.length, 4).setValues(values);
      SpreadsheetApp.flush();
    }

    return { ok: true, data: { tokens: newTokens } };
  } finally {
    lock.releaseLock();
  }
}

function randomToken() {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return s;
}

// ─────────────────────────────────────────────────────────────
// getResults() — read-only
// ─────────────────────────────────────────────────────────────

function getResults() {
  // Kandidat dengan 0 vote tetap muncul.
  const candRows = readRows(sheet('Candidates'));
  const results = [];
  const indexById = {};
  candRows
    .filter(function (r) { return String(r[0]).trim() !== ''; })
    .forEach(function (r) {
      const id = String(r[0]).trim();
      indexById[id] = results.length;
      results.push({ candidate_id: id, name: String(r[1]), count: 0 });
    });

  // Kolom Votes: vote_id | candidate_id | vote_date
  const voteRows = readRows(sheet('Votes'));
  let total = 0;
  for (let i = 0; i < voteRows.length; i++) {
    const cid = String(voteRows[i][1]).trim();
    if (cid === '') continue;
    total++;
    if (indexById.hasOwnProperty(cid)) {
      results[indexById[cid]].count++;
    }
    // vote untuk kandidat yang tidak ada di tab Candidates tetap dihitung di total
  }

  return { ok: true, data: { total: total, results: results } };
}

// ─────────────────────────────────────────────────────────────
// getTokenStats() — read-only. Monitoring hari-H.
// ─────────────────────────────────────────────────────────────

function getTokenStats() {
  const rows = readRows(sheet('Tokens'));
  let totalGenerated = 0;
  let used = 0;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === '') continue;
    totalGenerated++;
    const isUsed = rows[i][1] === true || String(rows[i][1]).toUpperCase() === 'TRUE';
    if (isUsed) used++;
  }
  return {
    ok: true,
    data: {
      total_generated: totalGenerated,
      used: used,
      remaining: totalGenerated - used,
    },
  };
}
