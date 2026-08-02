import json
import subprocess
import time

CANISTER = "xqhu5-zaaaa-aaaal-qxfmq-cai"
IDENTITY = "marcin-import-temp"
OWNER_PRINCIPAL = "svjs2-qat2k-cppo7-hwhyk-ve7cq-c5ahd-w6c4l-yswuo-fc2ms-qpb6f-2qe"

with open("/home/marcin/writerstudio-backup.json") as f:
    data = json.load(f)

def esc(s):
    s = s.replace("\\", "\\\\")
    s = s.replace('"', '\\"')
    s = s.replace("\n", "\\n")
    s = s.replace("\r", "\\r")
    s = s.replace("\t", "\\t")
    return s

def call(method, arg):
    with open("/tmp/_import_arg.txt", "w", encoding="utf-8") as f:
        f.write(arg)
    cmd = ["dfx", "canister", "--network", "ic", "call", CANISTER, method,
           "--argument-file", "/tmp/_import_arg.txt", "--identity", IDENTITY]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    except subprocess.TimeoutExpired:
        print("  TIMEOUT calling " + method)
        return False
    time.sleep(0.3)
    if result.returncode != 0:
        print("  ERROR calling " + method + ": " + result.stderr)
        return False
    return True

def call_query(method):
    cmd = ["dfx", "canister", "--network", "ic", "call", CANISTER, method,
           "--identity", IDENTITY, "--query"]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return result.stdout

def parse_ids(text_blob, field_name):
    marker = field_name + " = vec {"
    idx = text_blob.find(marker)
    if idx == -1:
        return set()
    start = idx + len(marker)
    end = text_blob.find("}", start)
    chunk = text_blob[start:end]
    ids = set()
    for part in chunk.replace("_", "").split(";"):
        part = part.strip()
        if part:
            num_str = part.split(":")[0].strip()
            if num_str.isdigit():
                ids.add(int(num_str))
    return ids

print("Fetching existing IDs from canister...")
raw = call_query("adminGetAllIds")
existing = {}
existing["books"] = parse_ids(raw, "books")
existing["chapters"] = parse_ids(raw, "chapters")
existing["analyses"] = parse_ids(raw, "analyses")
existing["annotations"] = parse_ids(raw, "annotations")
existing["comments"] = parse_ids(raw, "comments")
existing["chatMessages"] = parse_ids(raw, "chatMessages")
existing["chatArchives"] = parse_ids(raw, "chatArchives")
existing["chatSessions"] = parse_ids(raw, "chatSessions")
existing["chatSessionMessages"] = parse_ids(raw, "chatSessionMessages")
for k in existing:
    print(k + "=" + str(len(existing[k])))
counters = {}
skipped = {}
for k in existing:
    counters[k] = 0
    skipped[k] = 0

for b in data["books"]:
    book = b["book"]
    bid = int(book["id"])
    if bid in existing["books"]:
        skipped["books"] += 1
    else:
        title = esc(book["title"])
        desc = esc(book.get("description", ""))
        cat = esc(book.get("category", ""))
        age = esc(book.get("ageCategory", ""))
        author_summary = esc(book.get("authorSummary", ""))
        key_context = esc(book.get("keyContext", ""))
        themes = esc(book.get("themes", ""))
        characters = esc(book.get("characters", ""))
        updated_at = book.get("updatedAt", "0")
        arg = '(record { id = ' + str(bid) + ' : nat; ownerId = principal "' + OWNER_PRINCIPAL + '"; title = "' + title + '"; description = "' + desc + '"; category = "' + cat + '"; ageCategory = "' + age + '"; authorSummary = "' + author_summary + '"; keyContext = "' + key_context + '"; themes = "' + themes + '"; characters = "' + characters + '"; updatedAt = ' + str(updated_at) + ' : int; })'
        print("Importing book: " + book["title"])
        if call("adminImportBook", arg):
            counters["books"] += 1

    for ch in b.get("chapters", []):
        cid = int(ch["id"])
        if cid in existing["chapters"]:
            skipped["chapters"] += 1
            continue
        arg = '(record { id = ' + str(cid) + ' : nat; bookId = ' + str(ch["bookId"]) + ' : nat; sessionId = "' + esc(ch.get("sessionId","")) + '"; title = "' + esc(ch["title"]) + '"; content = "' + esc(ch["content"]) + '"; orderIndex = ' + str(ch["orderIndex"]) + ' : nat; wordCount = ' + str(ch["wordCount"]) + ' : nat; charCount = ' + str(ch["charCount"]) + ' : nat; indentLeft = ' + str(ch["indentLeft"]) + ' : nat; indentRight = ' + str(ch["indentRight"]) + ' : nat; indentFirstLine = ' + str(ch["indentFirstLine"]) + ' : nat; createdAt = ' + str(ch["createdAt"]) + ' : int; updatedAt = ' + str(ch["updatedAt"]) + ' : int; })'
        if call("adminImportChapter", arg):
            counters["chapters"] += 1

    for an in b.get("analyses", []):
        aid = int(an["id"])
        if aid in existing["analyses"]:
            skipped["analyses"] += 1
            continue
        chapter_id = ('opt (' + str(an["chapterId"]) + ' : nat)') if an.get("chapterId") is not None else "null"
        arg = '(record { id = ' + str(aid) + ' : nat; bookId = ' + str(an["bookId"]) + ' : nat; chapterId = ' + chapter_id + '; analysisType = "' + esc(an["analysisType"]) + '"; provider = "' + esc(an.get("provider","")) + '"; resultContent = "' + esc(an["resultContent"]) + '"; createdAt = ' + str(an["createdAt"]) + ' : int; })'
        if call("adminImportAnalysis", arg):
            counters["analyses"] += 1

    for ann in b.get("annotations", []):
        annid = int(ann["id"])
        if annid in existing["annotations"]:
            skipped["annotations"] += 1
            continue
        alt = ('opt "' + esc(ann["alternativeProposal"]) + '"') if ann.get("alternativeProposal") else "null"
        arg = '(record { id = ' + str(annid) + ' : nat; analysisId = ' + str(ann["analysisId"]) + ' : nat; text = "' + esc(ann["text"]) + '"; color = "' + esc(ann["color"]) + '"; explanation = "' + esc(ann["explanation"]) + '"; proposal = "' + esc(ann["proposal"]) + '"; alternativeProposal = ' + alt + '; approved = ' + ("true" if ann["approved"] else "false") + '; })'
        if call("adminImportAnnotation", arg):
            counters["annotations"] += 1

    for c in b.get("comments", []):
        cmid = int(c["id"])
        if cmid in existing["comments"]:
            skipped["comments"] += 1
            continue
        arg = '(record { id = ' + str(cmid) + ' : nat; chapterId = ' + str(c["chapterId"]) + ' : nat; anchorText = "' + esc(c.get("anchorText","")) + '"; content = "' + esc(c["content"]) + '"; createdAt = ' + str(c["createdAt"]) + ' : int; })'
        if call("adminImportComment", arg):
            counters["comments"] += 1

    for m in b.get("chatMessages", []):
        mid = int(m["id"])
        if mid in existing["chatMessages"]:
            skipped["chatMessages"] += 1
            continue
        arg = '(record { id = ' + str(mid) + ' : nat; bookId = ' + str(m.get("bookId", book["id"])) + ' : nat; sessionId = "' + esc(m.get("sessionId","")) + '"; role = "' + esc(m["role"]) + '"; content = "' + esc(m["content"]) + '"; provider = "' + esc(m.get("provider","")) + '"; createdAt = ' + str(m["createdAt"]) + ' : int; })'
        if call("adminImportChatMessage", arg):
            counters["chatMessages"] += 1

    for m in b.get("chatMessages", []):
        mid = int(m["id"])
        if mid in existing["chatMessages"]:
            skipped["chatMessages"] += 1
            continue
        arg = '(record { id = ' + str(mid) + ' : nat; bookId = ' + str(m.get("bookId", book["id"])) + ' : nat; sessionId = "' + esc(m.get("sessionId","")) + '"; role = "' + esc(m["role"]) + '"; content = "' + esc(m["content"]) + '"; provider = "' + esc(m.get("provider","")) + '"; createdAt = ' + str(m["createdAt"]) + ' : int; })'
        if call("adminImportChatMessage", arg):
            counters["chatMessages"] += 1

    for a in b.get("chatArchives", []):
        aaid = int(a["id"])
        if aaid in existing["chatArchives"]:
            skipped["chatArchives"] += 1
            continue
        arg = '(record { id = ' + str(aaid) + ' : nat; bookId = ' + str(a["bookId"]) + ' : nat; sessionId = "' + esc(a.get("sessionId","")) + '"; title = "' + esc(a["title"]) + '"; summary = "' + esc(a["summary"]) + '"; createdAt = ' + str(a["createdAt"]) + ' : int; updatedAt = ' + str(a["updatedAt"]) + ' : int; })'
        if call("adminImportChatArchive", arg):
            counters["chatArchives"] += 1

    for s in b.get("chatSessions", []):
        sid = int(s["id"])
        if sid in existing["chatSessions"]:
            skipped["chatSessions"] += 1
            continue
        arg = '(record { id = ' + str(sid) + ' : nat; chapterId = ' + str(s["chapterId"]) + ' : nat; title = "' + esc(s["title"]) + '"; createdAt = ' + str(s["createdAt"]) + ' : int; })'
        if call("adminImportChatSession", arg):
            counters["chatSessions"] += 1

    for sm in b.get("chatSessionMessages", []):
        smid = int(sm["id"])
        if smid in existing["chatSessionMessages"]:
            skipped["chatSessionMessages"] += 1
            continue
        arg = '(record { id = ' + str(smid) + ' : nat; sessionId = ' + str(sm["sessionId"]) + ' : nat; role = "' + esc(sm["role"]) + '"; content = "' + esc(sm["content"]) + '"; createdAt = ' + str(sm["createdAt"]) + ' : int; })'
        if call("adminImportChatSessionMessage", arg):
            counters["chatSessionMessages"] += 1

print()
print("=== SUMMARY (incremental) ===")
for k in counters:
    print(k + ": imported=" + str(counters[k]) + " skipped=" + str(skipped[k]))
