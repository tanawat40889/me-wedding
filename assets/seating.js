// ใช้ร่วมกันระหว่างหน้า seats/ (เจ้าหน้าที่) และ find/ (แขก) — ให้ผังตรงกันเสมอ
(() => {
// ซ้าย = เจ้าสาว, ขวา = เจ้าบ่าว (มองจากที่นั่งไปทางเวที)
const SIDES = ["เจ้าสาว", "เจ้าบ่าว"];
// จัดที่นั่งอัตโนมัติตามลำดับในชีต: แถวหน้าสุด (ติดเวที) ก่อน, ในแถวเริ่มจากเก้าอี้ติดทางเดินกลาง
// รายการที่มาหลายคนนั่งติดกันในแถวเดียว ถ้าแถวนั้นเหลือที่ไม่พอจะขึ้นแถวใหม่
// ถ้าฝั่งไหนเก้าอี้ไม่พอ คนที่เหลือจะไปนั่งที่ว่างของอีกฝั่ง (ต่อท้ายแถวหลัง)
const SKIP = "ไม่ต้องขึ้น";
const ICON = { "เจ้าสาว": "👰", "เจ้าบ่าว": "🤵" };
const other = s => s === SIDES[0] ? SIDES[1] : SIDES[0];
function fill(layout, area, list) {
  const { rows, cols } = layout[area.side], left = [];
  for (const g of list) {
    let k = g.seats || 1, r = area.r;
    if (r < rows && k <= cols && cols - area.used[r] < k) r++;
    const mine = [];
    while (k > 0 && r < rows) {
      if (area.used[r] === cols) { r++; continue; }
      const n = Math.min(k, cols - area.used[r]);
      mine.push({ g, area: area.side, r, off: area.used[r], n }); area.used[r] += n; k -= n;
    }
    if (k > 0) { mine.forEach(p => area.used[p.r] -= p.n); left.push(g); continue; }  // ไม่พอ: คืนที่ แล้วไปลองอีกฝั่ง
    area.r = r; area.parts.push(...mine);
  }
  return left;
}
function placeAll(guests, layout) {
  const A = {};
  for (const s of SIDES) A[s] = { side: s, r: 0, used: Array(layout[s].rows).fill(0), parts: [] };
  // คนที่ "ไม่ต้องขึ้น" (คอลัมน์กลุ่มที่ขึ้น) ไม่ต้องมีที่นั่งในผังรับไหว้
  const lists = Object.fromEntries(SIDES.map(s => [s, guests.filter(g => g.side === s && g.grp !== SKIP).sort((a, b) => a.seq - b.seq)]));
  const left = Object.fromEntries(SIDES.map(s => [s, fill(layout, A[s], lists[s])]));
  // คนที่ย้ายไปอีกฝั่ง เริ่มแถวใหม่ ไม่นั่งปนแถวเดียวกับญาติอีกฝั่ง
  const over = SIDES.flatMap(s => {
    if (!left[s].length) return [];
    const a = A[other(s)]; if (a.used[a.r]) a.r++;
    return fill(layout, a, left[s]);
  });
  const where = new Map();
  for (const s of SIDES) for (const p of A[s].parts) { if (!where.has(p.g.id)) where.set(p.g.id, []); where.get(p.g.id).push(p); }
  return { A, over, where };
}
const posOf = (P, g) => (P.where.get(g.id) || []);
const posStr = ps => ps.map(p => `แถว ${p.r + 1} · ที่ ${p.off + 1}${p.n > 1 ? "–" + (p.off + p.n) : ""}`).join(", ");
const areaName = a => `ฝั่ง${a === SIDES[0] ? "ซ้าย" : "ขวา"} (ฝั่ง${a})`;
// คอลัมน์บนจอ: ฝั่งซ้าย (เจ้าสาว) ทางเดินอยู่ทางขวา จึงนับจากขวา
const colStart = (side, cols, off, n) => side === "เจ้าสาว" ? cols - off - n + 1 : off + 1;

window.Seating = { SIDES, SKIP, ICON, other, placeAll, posOf, posStr, areaName, colStart };
})();
