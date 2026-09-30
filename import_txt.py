#!/usr/bin/env python3
# แปลงไฟล์ข้อความ -> songs.js   ใช้: python3 import_txt.py love-songs.txt
# รูปแบบ: บรรทัดชื่อเพลง / "Youtube: ลิงก์" / "เนื้อเพลง: ..." ต่อด้วยบรรทัดเนื้อเพลง / เว้นบรรทัดว่างคั่นเพลง
# ศิลปิน/วัย/ระดับ ดึงจาก songs-meta.json (จับคู่ด้วยชื่อเพลง)
import json, re, sys, pathlib

here = pathlib.Path(__file__).parent
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else here / "love-songs.txt")
norm = lambda s: re.sub(r"\s+", "", s)
meta = {norm(m["title"]): m for m in json.loads((here / "songs-meta.json").read_text(encoding="utf-8"))}

songs, cur = [], None
for raw in src.read_text(encoding="utf-8").replace("\r", "").split("\n"):
    line = raw.strip()
    if not line:
        if cur and cur["_lyr"]: cur = None
        continue
    m = re.match(r"(?i)youtube\s*:\s*(\S+)", line)
    l = re.match(r"เนื้อเพลง\s*:\s*(.*)", line)
    if m and cur: cur["yt"] = m.group(1)
    elif l and cur:
        cur["_lyr"] = True
        if l.group(1): cur["lines"].append(l.group(1))
    elif cur and cur["_lyr"]: cur["lines"].append(line)
    else:
        cur = {"title": line, "yt": "", "lines": [], "_lyr": False}
        songs.append(cur)

out = []
for s in songs:
    mt = meta.get(norm(s["title"]), {})
    if not mt: print(f"! '{s['title']}' ไม่มีใน songs-meta.json → ใช้ค่าเริ่มต้น")
    lines = [p.strip() for x in s["lines"] for p in re.split(r"\s{2,}", x) if p.strip()]
    if not lines: print(f"! '{s['title']}' ไม่มีเนื้อเพลง")
    out.append({"title": mt.get("title", s["title"]), "artist": mt.get("artist", ""), "gen": mt.get("gen", "วัยทำงาน"),
                "level": mt.get("level", "กลาง"), "lang": mt.get("lang", "th-TH"),
                "lyrics": "\n".join(lines), "yt": s["yt"] or mt.get("yt", "")})

dst = here / "songs.js"
dst.write_text(f"// สร้างจาก {src.name} ด้วย import_txt.py\nwindow.SONGS = " + json.dumps(out, ensure_ascii=False, indent=1)
               + ";\n", encoding="utf-8")
print(f"✓ {len(out)} เพลง → songs.js ({sum(1 for o in out if o['lyrics'])} เพลงมีเนื้อ)")
