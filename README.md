# cullroom

> **Cull with your client live. Photos never leave your laptop.**

A browser-to-browser photo culling session tool. The photographer opens `host.html`, drags in JPEG preview exports, and shares a link. The client opens the link and both browse, flag, and reject photos together in real time — all P2P, nothing uploaded anywhere.

---

## Pitch

Traditional culling workflows:
1. Export proofs → upload to gallery service → wait → client emails picks → manually import back to Lightroom.

With cullroom:
1. Open `host.html` → drag proofs → share link → cull together live → export CSV → import to Lightroom. Done in one sitting.

---

## Quick Start

```
# No install, no build step — just open the files.
# Both machines must be on the same LAN (or accessible internet) for P2P to work.

# 1. Photographer: open host.html in Chrome/Firefox/Safari
file:///path/to/cullroom/host.html

# 2. Drag your JPEG proof exports onto the drop zone
# 3. Share the generated room link with your client
# 4. Client opens the link — the grid appears within seconds
# 5. Both flag/reject photos in real time
# 6. Photographer clicks "Export CSV" when done
```

> **HTTPS note:** PeerJS requires a secure context. For local use, `file://` works.
> For remote clients, serve files over HTTPS (e.g., `npx serve -l 443 --ssl-cert cert.pem --ssl-key key.pem .`).

---

## Controls

| Key / Action       | Effect                              |
|--------------------|-------------------------------------|
| `F`                | Flag (select) current photo         |
| `X`                | Reject current photo                |
| `U`                | Clear mark                          |
| `←` / `→`          | Navigate in lightbox                |
| `Esc`              | Close lightbox                      |
| Click thumbnail    | Open lightbox                       |
| Right-click grid   | Context mark menu                   |

---

## Architecture

```
host.html (PeerJS Peer, room code = Peer ID)
   ├── client-1  DataConnection (serialization: json)
   ├── client-2  DataConnection
   └── client-3  DataConnection  (max 3 per v1 spec)
```

**Message protocol:**

| Direction       | Type              | Payload                                      |
|-----------------|-------------------|----------------------------------------------|
| Host → Client   | `hello`           | `{version, total, isFree, studioName, marks}`|
| Host → Client   | `thumb-batch`     | `{batch:[{id,filename,thumb}], total}`       |
| Host → Client   | `index-ready`     | —                                            |
| Host → Client   | `preview-data`    | `{id, data: dataURL}`                        |
| Host → Client   | `preview-error`   | `{id, msg}`                                  |
| Host → Client   | `mark`            | `{id, mark, role, ts}`                       |
| Host → Client   | `follow`          | `{id}`                                       |
| Host → Client   | `error`           | `{msg}`                                      |
| Client → Host   | `preview-req`     | `{id}`                                       |
| Client → Host   | `mark`            | `{id, mark, ts}`                             |

**Thumbnail pipeline:** Files → `<img>` → `<canvas>` (max 320 px) → JPEG dataURL (quality 0.7)

**Preview pipeline:** File → `<img>` → `<canvas>` (max 1600 px) → JPEG dataURL (quality 0.85) — served lazily on client request.

**State sync:** last-write-wins on timestamp. Marks stored in `localStorage` under `cr.*`:

```
cr.roomCode   — persisted room code (reclaim on host refresh)
cr.marks      — JSON map of {id → {mark, role, ts}}
cr.session    — JSON {id, photos:[{id,filename}]}
cr.proKey     — JSON license string
```

---

## Lightroom Import Workflow

After the culling session, export from cullroom:

1. Click **Export CSV** on the host — saves `cullroom-export.csv`
2. Open Lightroom Classic and select the target folder in the Library module.
3. Use **LR/Transporter** (free plugin) to import the CSV and set Pick / Rejected flags from the `mark` column.
4. Filter the Library by Pick Flag to see the client's selects.

**Recommended workflow:**
```
1. cullroom Export CSV → cullroom-export.csv
2. Open Lightroom Classic → select the target folder
3. Use LR/Transporter (free plugin) to read the CSV and apply Pick flags:
   - "flag" marks → Set Pick Flag
   - "reject" marks → Set Rejected Flag
4. In Library module, filter by Pick Flag to see the client's selects
```

---

## Resilience

- **Host refresh:** Room code persists via `localStorage`. Drag the same folder again — cullroom matches files by filename and restores all marks.
- **Client disconnect:** Client auto-reconnects every 3 s. On rejoin, host sends full current state.
- **Network loss:** Marks are safe on the host (localStorage). Clients get a full resync on reconnect.

---

## Pro License

Free tier limits: **50 photos per session**, "powered by cullroom" badge on client view.

Pro unlocks: unlimited photos, badge removed, studio name + logo on client view.

### Activating a Pro License

1. Receive your `cullroom-license.json` file from the store.
2. On `host.html`, click **Pro Key** and paste the JSON content.
3. Studio branding appears on connected clients immediately.

### Generating Licenses (Developers)

```bash
# Arguments: "<StudioName>" "<PhotographerName>" [maxPhotos]
#   StudioName       — branding shown on the client view
#   PhotographerName — license holder's name
node keygen.js "Smith Photography" "Jane Smith" 99999 > cullroom-license.json
```

---

## Known Limits

| Limit | Notes |
|-------|-------|
| **LAN strongly recommended** | WebRTC P2P works on LAN without NAT issues. Over internet, TURN relay is needed if both sides are behind symmetric NAT. PeerJS uses its own STUN; add a TURN server in the `Peer()` config for reliable internet sessions. |
| **File handles on host refresh** | `File` objects can't be persisted. After refresh, re-drag the same folder; marks are restored from localStorage. |
| **Max 3 clients** | v1 star topology: 1 host + 3 clients. |
| **Browsers** | Chrome 113+, Firefox 130+, Safari 17+ (WebCrypto Ed25519 + WebRTC required). |
| **Free tier** | 50 photos max. Photos 51+ are shown as locked tiles until pro key is applied. |
| **Session co-location** | One host session at a time (browser tab). |
| **No RAW** | JPEG previews only. Export proofs from Lightroom at ≤2000 px long edge before importing. |
| **LAN speed target** | 300 photos: client grid usable < 10 s; full preview < 2 s per image. |
