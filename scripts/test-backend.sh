#!/usr/bin/env bash
#
# Test otomatis backend Apps Script — TAHAP 1 checklist.
#
# Usage:
#   ./scripts/test-backend.sh <WEB_APP_URL> <SHARED_SECRET> [CANDIDATE_ID]
#
# Contoh:
#   ./scripts/test-backend.sh \
#     "https://script.google.com/macros/s/XXX/exec" \
#     "your-32-char-secret"
#
# CANDIDATE_ID opsional — kalau dikosongkan, script auto-ambil kandidat
# pertama dari getCandidates. Kalau tab Candidates kosong, isi dulu.
#
# Butuh: curl + (jq ATAU python3) buat parse JSON.

set -u

URL="${1:-}"
SECRET="${2:-}"
CANDIDATE_ID="${3:-}"

if [[ -z "$URL" || -z "$SECRET" ]]; then
  echo "Usage: $0 <WEB_APP_URL> <SHARED_SECRET> [CANDIDATE_ID]" >&2
  exit 2
fi

# ── JSON parser: pakai jq kalau ada, fallback python3 ──────────────
if command -v jq >/dev/null 2>&1; then
  jget() { jq -r "$1" 2>/dev/null; }        # $1 = jq filter, stdin = json
elif command -v python3 >/dev/null 2>&1; then
  # Terjemahkan filter jq sederhana ke python. Kita cuma butuh beberapa path.
  jget() {
    python3 - "$1" <<'PY'
import sys, json
flt = sys.argv[1]
try:
    d = json.load(sys.stdin)
except Exception:
    print(""); sys.exit(0)
def dig(o, path):
    for p in path:
        if p == "": continue
        if isinstance(o, list):
            try: o = o[int(p)]
            except Exception: return ""
        elif isinstance(o, dict):
            o = o.get(p, "")
        else:
            return ""
    return o
# filter bentuk: .a.b.c  atau  .a.b[0].c  atau  .data.tokens|length
if flt.endswith("|length"):
    base = flt[:-len("|length")].strip()
    path = base.lstrip(".").replace("[", ".").replace("]", "").split(".")
    v = dig(d, path)
    print(len(v) if isinstance(v, (list, dict, str)) else 0)
else:
    path = flt.lstrip(".").replace("[", ".").replace("]", "").split(".")
    v = dig(d, path)
    if isinstance(v, (dict, list)):
        print(json.dumps(v))
    else:
        print(v if v is not None else "")
PY
  }
else
  echo "ERROR: butuh 'jq' atau 'python3' buat parse JSON. Install salah satu." >&2
  exit 2
fi

post() {
  # $1 = json body. -L wajib (Apps Script redirect 302).
  curl -sL -X POST "$URL" -H 'Content-Type: application/json' -d "$1"
}

PASS=0
FAIL=0
ok()   { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ FAIL: $1"; echo "     resp: $2"; FAIL=$((FAIL+1)); }

echo "=== Backend test — TAHAP 1 ==="
echo "URL: $URL"
echo

# ── 0. getCandidates + auto-pick candidate id ─────────────────────
echo "[0] getCandidates"
R=$(post "{\"secret\":\"$SECRET\",\"action\":\"getCandidates\"}")
if [[ "$(echo "$R" | jget '.ok')" == "true" ]]; then
  ok "getCandidates ok:true"
else
  bad "getCandidates tidak ok:true" "$R"
fi
if [[ -z "$CANDIDATE_ID" ]]; then
  CANDIDATE_ID="$(echo "$R" | jget '.data[0].id')"
fi
if [[ -z "$CANDIDATE_ID" ]]; then
  echo "  ⚠️  Tab Candidates kosong / tidak ada id. Isi minimal 1 kandidat dulu,"
  echo "      atau kasih CANDIDATE_ID sebagai arg ke-3. Tes castVote di-skip."
fi
echo "  candidate dipakai: '${CANDIDATE_ID:-<none>}'"
echo

# ── 1. generateTokens 2 → ambil T1, T2 ────────────────────────────
echo "[1] generateTokens count=2"
R=$(post "{\"secret\":\"$SECRET\",\"action\":\"generateTokens\",\"count\":2}")
T1="$(echo "$R" | jget '.data.tokens[0]')"
T2="$(echo "$R" | jget '.data.tokens[1]')"
if [[ -n "$T1" && -n "$T2" ]]; then
  ok "dapat 2 token: $T1 $T2"
else
  bad "gagal generate 2 token" "$R"
fi
echo

# ── 2. verifyToken T1 (pertama) → ok:true ─────────────────────────
echo "[2] verifyToken T1 (1x)"
R=$(post "{\"secret\":\"$SECRET\",\"action\":\"verifyToken\",\"token\":\"$T1\"}")
[[ "$(echo "$R" | jget '.ok')" == "true" ]] && ok "ok:true" || bad "harus ok:true" "$R"
echo

# ── 3. verifyToken T1 (kedua) → HARUS masih ok:true ───────────────
echo "[3] verifyToken T1 (2x) — verify tidak boleh menulis"
R=$(post "{\"secret\":\"$SECRET\",\"action\":\"verifyToken\",\"token\":\"$T1\"}")
[[ "$(echo "$R" | jget '.ok')" == "true" ]] && ok "masih ok:true (tidak menulis)" || bad "harus tetap ok:true" "$R"
echo

# ── 4. castVote T1 → ok:true ──────────────────────────────────────
if [[ -n "$CANDIDATE_ID" ]]; then
  echo "[4] castVote T1 → $CANDIDATE_ID"
  R=$(post "{\"secret\":\"$SECRET\",\"action\":\"castVote\",\"token\":\"$T1\",\"candidateId\":\"$CANDIDATE_ID\"}")
  [[ "$(echo "$R" | jget '.ok')" == "true" ]] && ok "ok:true" || bad "harus ok:true" "$R"
  echo

  # ── 5. castVote T1 lagi → USED ──────────────────────────────────
  echo "[5] castVote T1 lagi — harus USED"
  R=$(post "{\"secret\":\"$SECRET\",\"action\":\"castVote\",\"token\":\"$T1\",\"candidateId\":\"$CANDIDATE_ID\"}")
  [[ "$(echo "$R" | jget '.code')" == "USED" ]] && ok "code:USED" || bad "harus code:USED" "$R"
  echo
fi

# ── 6. castVote T2 candidate ngawur → BAD_CANDIDATE ───────────────
echo "[6] castVote T2 candidate ngawur — harus BAD_CANDIDATE"
R=$(post "{\"secret\":\"$SECRET\",\"action\":\"castVote\",\"token\":\"$T2\",\"candidateId\":\"HACKED_XYZ\"}")
[[ "$(echo "$R" | jget '.code')" == "BAD_CANDIDATE" ]] && ok "code:BAD_CANDIDATE (validasi candidate duluan)" || bad "harus code:BAD_CANDIDATE" "$R"
echo

# ── 7. secret salah → UNAUTHORIZED ────────────────────────────────
echo "[7] secret salah — harus UNAUTHORIZED"
R=$(post "{\"secret\":\"wrong-secret\",\"action\":\"getResults\"}")
[[ "$(echo "$R" | jget '.code')" == "UNAUTHORIZED" ]] && ok "code:UNAUTHORIZED" || bad "harus code:UNAUTHORIZED" "$R"
echo

# ── 8. token ngawur → INVALID ─────────────────────────────────────
echo "[8] verifyToken ZZZZZZ — harus INVALID"
R=$(post "{\"secret\":\"$SECRET\",\"action\":\"verifyToken\",\"token\":\"ZZZZZZ\"}")
[[ "$(echo "$R" | jget '.code')" == "INVALID" ]] && ok "code:INVALID" || bad "harus code:INVALID" "$R"
echo

# ── 9. generate 100 → cek unik ────────────────────────────────────
echo "[9] generateTokens count=100 — cek tidak ada duplikat"
R=$(post "{\"secret\":\"$SECRET\",\"action\":\"generateTokens\",\"count\":100}")
if command -v jq >/dev/null 2>&1; then
  CNT=$(echo "$R" | jq -r '.data.tokens | length' 2>/dev/null)
  UNIQ=$(echo "$R" | jq -r '.data.tokens | unique | length' 2>/dev/null)
else
  CNT=$(echo "$R" | jget '.data.tokens|length')
  UNIQ=$(echo "$R" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(len(set(d.get("data",{}).get("tokens",[]))))' 2>/dev/null)
fi
if [[ "$CNT" == "100" && "$UNIQ" == "100" ]]; then
  ok "100 token, semua unik"
else
  bad "count=$CNT unik=$UNIQ (harus 100/100)" "$R"
fi
echo

# ── 10. getResults → ok:true ──────────────────────────────────────
echo "[10] getResults"
R=$(post "{\"secret\":\"$SECRET\",\"action\":\"getResults\"}")
[[ "$(echo "$R" | jget '.ok')" == "true" ]] && ok "ok:true (total=$(echo "$R" | jget '.data.total'))" || bad "harus ok:true" "$R"
echo

# ── 11. getTokenStats → ok:true ───────────────────────────────────
echo "[11] getTokenStats"
R=$(post "{\"secret\":\"$SECRET\",\"action\":\"getTokenStats\"}")
if [[ "$(echo "$R" | jget '.ok')" == "true" ]]; then
  ok "generated=$(echo "$R" | jget '.data.total_generated') used=$(echo "$R" | jget '.data.used') remaining=$(echo "$R" | jget '.data.remaining')"
else
  bad "harus ok:true" "$R"
fi
echo

echo "================================"
echo "PASS: $PASS   FAIL: $FAIL"
[[ "$FAIL" -eq 0 ]] && echo "🎉 Semua hijau — Tahap 1 lolos." || echo "⚠️  Ada yang merah — cek resp di atas."
exit "$FAIL"
