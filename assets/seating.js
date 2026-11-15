// ใช้ร่วมกันระหว่างหน้า seats/ (เจ้าหน้าที่) และ find/ (แขก) — ให้ผังตรงกันเสมอ
(() => {
// ซ้าย = เจ้าสาว, ขวา = เจ้าบ่าว (มองจากที่นั่งไปทางเวที)
const SIDES = ["เจ้าสาว", "เจ้าบ่าว"];
// จัดที่นั่งอัตโนมัติตามลำดับในชีต: แถวหน้าสุด (ติดเวที) ก่อน, ในแถวเริ่มจากเก้าอี้ติดทางเดินกลาง
// รายการที่มาหลายคนนั่งติดกันในแถวเดียว — ใส่แถวแรกที่ยังมีที่พอ (รายการหลังๆ เติมช่องว่างแถวหน้าได้)
// ถ้าฝั่งไหนเก้าอี้ไม่พอ คนที่เหลือจะไปนั่งอีกฝั่ง โดยเริ่มแถวใหม่ต่อจากญาติฝั่งนั้น
const SKIP = "ไม่ต้องขึ้น";
const ICON = { "เจ้าสาว": "👰", "เจ้าบ่าว": "🤵" };
const other = s => s === SIDES[0] ? SIDES[1] : SIDES[0];
function fill(layout, area, list, start = 0) {
  const { rows, cols } = layout[area.side], left = [];
  for (const g of list) {
    const k = g.seats || 1;
    let r = start;
    if (k <= cols) {
      while (r < rows && cols - area.used[r] < k) r++;
      if (r < rows) { area.parts.push({ g, area: area.side, r, off: area.used[r], n: k }); area.used[r] += k; continue; }
    } else {  // มากกว่า 1 แถว: ใช้แถวว่างที่ติดกัน
      const need = Math.ceil(k / cols);
      while (r + need <= rows && area.used.slice(r, r + need).some(u => u)) r++;
      if (r + need <= rows) {
        for (let x = 0, rest = k; x < need; x++, rest -= cols) {
          const n = Math.min(cols, rest);
          area.parts.push({ g, area: area.side, r: r + x, off: 0, n }); area.used[r + x] = n;
        }
        continue;
      }
    }
    left.push(g);
  }
  return left;
}
function placeAll(guests, layout) {
  const A = {};
  for (const s of SIDES) A[s] = { side: s, used: Array(layout[s].rows).fill(0), parts: [] };
  // คนที่ "ไม่ต้องขึ้น" (คอลัมน์กลุ่มที่ขึ้น) ไม่ต้องมีที่นั่งในผังรับไหว้
  const lists = Object.fromEntries(SIDES.map(s => [s, guests.filter(g => g.side === s && g.grp !== SKIP).sort((a, b) => a.seq - b.seq)]));
  const left = Object.fromEntries(SIDES.map(s => [s, fill(layout, A[s], lists[s])]));
  // คนที่ย้ายไปอีกฝั่ง เริ่มแถวใหม่ ไม่นั่งปนแถวเดียวกับญาติอีกฝั่ง
  const over = SIDES.flatMap(s => {
    if (!left[s].length) return [];
    const a = A[other(s)], last = a.used.reduce((m, u, i) => u ? i : m, -1);
    return fill(layout, a, left[s], last + 1);
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
