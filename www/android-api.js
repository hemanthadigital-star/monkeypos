if (!Object.fromEntries) Object.fromEntries = function(it) {
  const o = {};
  for (const [k, v] of it) o[k] = v;
  return o;
};
if (!Array.prototype.flatMap) Array.prototype.flatMap = function(f, t) {
  return this.reduce((a, x, i) => a.concat(f.call(t, x, i, this)), []);
};
if (!String.prototype.trimStart) String.prototype.trimStart = function() {
  return this.replace(/^\s+/, "");
};
if (!Element.prototype.replaceWith) Element.prototype.replaceWith = function(n) {
  const p = this.parentNode;
  if (p) p.replaceChild(typeof n == "string" ? document.createTextNode(n) : n, this);
};
(function() {
  const show = (m) => {
    const d = document.createElement("pre");
    d.style.cssText = "position:fixed;z-index:99999;left:0;right:0;bottom:0;max-height:60%;overflow:auto;background:#400;color:#fff;font:12px monospace;margin:0;padding:8px;white-space:pre-wrap";
    d.textContent = m;
    (document.body || document.documentElement).appendChild(d);
  };
  window.addEventListener("error", (e) => show("ERROR: " + e.message + " (" + String(e.filename || "").split("/").pop() + ":" + e.lineno + ")"));
  window.addEventListener("unhandledrejection", (e) => show("ERROR: " + (e.reason && e.reason.message || e.reason)));
})();
(function() {
  const P = window.Capacitor && Capacitor.registerPlugin ? Capacitor.registerPlugin("Monkey") : null;
  const q = async (s) => (await P.sql({ stmts: s })).results;
  const SCHEMA = [
    "create table if not exists users(id integer primary key,name text,user text unique,pass text,role text,perms text)",
    "create table if not exists items(id integer primary key,name text,cat text,price real,stock real,track integer,barcode text,img text,cost real,minq real)",
    "create table if not exists orders(id integer primary key,type text,tbl text,status text,disc real,sub real,d real,svc real,total real,created integer,paid_at integer,pay text,user text,payer text,x text)",
    "create table if not exists lines(order_id integer,item_id integer,name text,cat text,price real,qty real,sent real,cost real)",
    "create index if not exists ix_lines on lines(order_id)",
    "create table if not exists meta(k text primary key,v text)"
  ];
  const ready = P ? q(SCHEMA.map((x) => ({ q: x }))) : Promise.resolve();
  const FF = { Poppins: "'Poppins',sans-serif", Arial: "Arial,sans-serif", Montserrat: "'Montserrat',sans-serif", Consolas: "Consolas,monospace" };
  let FONTCSS = null;
  const cssFor = (s, size) => {
    var _a, _b;
    return "body{margin:0;color:#000;background:#fff;font-family:".concat(FF[s.font] || FF.Arial, ";font-size:").concat(size == "A4" ? s.fsA || 13 : size == "56mm" ? Math.max(7, (s.fs || 12) - 2) : s.fs || 12, "px;line-height:1.3;box-sizing:border-box;padding:").concat(size == "A4" ? (_a = s.mgA) != null ? _a : 14 : (_b = s.mg) != null ? _b : 3, "mm}body.s80{width:80mm}body.s56{width:56mm}body.sA4{line-height:1.4}.c{text-align:center}table{width:100%;border-collapse:collapse}td,th{padding:2px 1px;vertical-align:top;text-align:left}.rt{text-align:right}hr{border:0;border-top:1px dashed #000;margin:5px 0}.big{font-size:1.4em;font-weight:700}body.sA4 td,body.sA4 th{border-bottom:1px solid #ddd;padding:5px}img{display:block;margin:0 auto}.bad{color:#b00}");
  };
  const b64 = (u) => {
    let s = "";
    for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
    return btoa(s);
  };
  async function toEscpos(html, cols, dots) {
    const root = document.createElement("div");
    root.innerHTML = html;
    const o = [], push = (...a) => o.push(...a);
    const txt = (s) => {
      for (const ch of s) {
        const c = ch.charCodeAt(0);
        o.push(c < 256 ? c : 63);
      }
    };
    const line = (s, al = 0, big = false) => {
      push(27, 97, al, 29, 33, big ? 17 : 0);
      txt(s);
      push(10);
      if (big) push(29, 33, 0);
    };
    const wrap = (s, w) => {
      const r = [];
      for (let p of s.split("\n")) {
        while (p.length > w) {
          let i = p.lastIndexOf(" ", w);
          if (i <= 0) i = w;
          r.push(p.slice(0, i));
          p = p.slice(i).trimStart();
        }
        r.push(p);
      }
      return r;
    };
    const T = (n) => {
      const c = n.cloneNode(true);
      c.querySelectorAll("br").forEach((b) => b.replaceWith("\n"));
      return c.textContent.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
    };
    async function rast(src) {
      const im = new Image();
      await new Promise((r) => {
        im.onload = r;
        im.onerror = r;
        im.src = src;
      });
      if (!im.width) return;
      const W = Math.min(dots >> 1, 240) & ~7, H = Math.round(im.height * W / im.width), c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, W, H);
      g.drawImage(im, 0, 0, W, H);
      const d = g.getImageData(0, 0, W, H).data, bw = W / 8;
      push(27, 97, 1, 29, 118, 48, 0, bw & 255, bw >> 8, H & 255, H >> 8);
      for (let y = 0; y < H; y++) for (let x = 0; x < bw; x++) {
        let b = 0;
        for (let k = 0; k < 8; k++) {
          const i = (y * W + x * 8 + k) * 4;
          if ((d[i] + d[i + 1] + d[i + 2]) / 3 < 128) b |= 128 >> k;
        }
        o.push(b);
      }
    }
    push(27, 64);
    let buf = "";
    const flush = () => {
      const t = buf.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
      buf = "";
      if (t) wrap(t, cols).forEach((l) => line(l));
    };
    const BLK = /^(DIV|TABLE|HR|H[1-6]|P|IMG)$/;
    for (const n of root.childNodes) {
      if (n.nodeType == 3) {
        buf += n.textContent;
        continue;
      }
      if (n.nodeType != 1) continue;
      const tg = n.tagName, cl = n.classList;
      if (tg == "BR") {
        buf += "\n";
        continue;
      }
      if (!BLK.test(tg)) {
        buf += n.textContent;
        continue;
      }
      flush();
      if (tg == "IMG" || n.querySelector("img")) {
        await rast((tg == "IMG" ? n : n.querySelector("img")).src);
        continue;
      }
      if (tg == "HR") {
        line("-".repeat(cols));
        continue;
      }
      if (tg == "TABLE") {
        for (const tr of n.rows) {
          const t = [...tr.cells].map(T);
          if (tr.querySelector("td.big")) {
            wrap(t.join(" "), cols >> 1).forEach((l) => line(l, 0, true));
            continue;
          }
          const big2 = tr.classList.contains("big"), w = big2 ? cols >> 1 : cols;
          if (t.length == 1) {
            wrap(t[0], w).forEach((l) => line(l, 0, big2));
            continue;
          }
          const right = t[t.length - 1], L = wrap(t.slice(0, -1).join(" "), Math.max(8, w - right.length - 1));
          L.forEach((l, i) => i == L.length - 1 ? line(l + " ".repeat(Math.max(1, w - l.length - right.length)) + right, 0, big2) : line(l, 0, big2));
        }
        continue;
      }
      const al = cl.contains("c") || /^H[1-6]$/.test(tg) ? 1 : 0, big = cl.contains("big") || tg == "H2";
      wrap(T(n), big ? cols >> 1 : cols).forEach((l) => line(l, al, big));
    }
    flush();
    push(27, 100, 4, 29, 86, 66, 0);
    return Uint8Array.from(o);
  }
  window.__toEscpos = toEscpos;
  window.api = {
    async load() {
      await ready;
      const [u] = await q([{ q: "select * from users" }]);
      if (!u.length) return null;
      const [mt, ls, os, it] = await q([{ q: "select * from meta" }, { q: "select * from lines" }, { q: "select * from orders" }, { q: "select * from items" }]);
      const m = Object.fromEntries(mt.map((r) => [r.k, JSON.parse(r.v)])), by = {};
      ls.forEach((l) => (by[l.order_id] = by[l.order_id] || []).push({ id: l.item_id, name: l.name, cat: l.cat, price: l.price, qty: l.qty, sent: l.sent, cost: l.cost || 0 }));
      const orders = os.map((o) => ({ id: o.id, type: o.type, table: o.tbl, status: o.status, disc: o.disc, sub: o.sub, d: o.d, svc: o.svc, total: o.total, created: o.created, paidAt: o.paid_at, pay: o.pay, user: o.user, payer: o.payer, ...JSON.parse(o.x || "{}"), lines: by[o.id] || [] }));
      return { kv: m, users: u.map((r) => ({ ...r, perms: r.perms ? JSON.parse(r.perms) : null })), items: it.map((i) => ({ ...i, track: !!i.track })), orders, set: m.set, seq: m.seq, iseq: m.iseq, useq: m.useq };
    },
    async saveMeta(s) {
      await ready;
      const st = [{ q: "delete from users" }, { q: "delete from items" }];
      s.users.forEach((u) => st.push({ q: "insert into users(id,name,user,pass,role,perms) values(?,?,?,?,?,?)", p: [u.id, u.name, u.user, u.pass, u.role, JSON.stringify(u.perms || null)] }));
      s.items.forEach((i) => {
        var _a, _b;
        return st.push({ q: "insert into items(id,name,cat,price,stock,track,barcode,img,cost,minq) values(?,?,?,?,?,?,?,?,?,?)", p: [i.id, i.name, i.cat, i.price, (_a = i.stock) != null ? _a : 0, i.track ? 1 : 0, i.barcode || "", i.img || "", i.cost || 0, (_b = i.minq) != null ? _b : 5] });
      });
      ["set", "seq", "iseq", "useq"].forEach((k) => st.push({ q: "insert or replace into meta values(?,?)", p: [k, JSON.stringify(s[k])] }));
      await q(st);
    },
    async saveOrder(o) {
      await ready;
      const st = [{ q: "insert or replace into orders(id,type,tbl,status,disc,sub,d,svc,total,created,paid_at,pay,user,payer,x) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", p: [o.id, o.type, o.table || "", o.status, o.disc || 0, o.sub || 0, o.d || 0, o.svc || 0, o.total || 0, o.created, o.paidAt || null, o.pay || null, o.user, o.payer || null, JSON.stringify({ cust: o.cust || "", settled: !!o.settled, settledAt: o.settledAt || 0, useTax: !!o.useTax, tax: o.tax || 0, taxName: o.taxName || "", taxRate: o.taxRate || 0, pays: o.pays || [] })] }, { q: "delete from lines where order_id=?", p: [o.id] }];
      o.lines.forEach((l) => st.push({ q: "insert into lines(order_id,item_id,name,cat,price,qty,sent,cost) values(?,?,?,?,?,?,?,?)", p: [o.id, l.id, l.name, l.cat, l.price, l.qty, l.sent || 0, l.cost || 0] }));
      await q(st);
    },
    async delOrder(id) {
      await ready;
      await q([{ q: "delete from lines where order_id=?", p: [id] }, { q: "delete from orders where id=?", p: [id] }]);
    },
    async kv(k, v) {
      await ready;
      await q([{ q: "insert or replace into meta values(?,?)", p: [k, JSON.stringify(v)] }]);
    },
    async printers() {
      const r = await P.btList();
      return r.devices;
    },
    async out({ html, size, name, pdf, set }) {
      if (pdf || size == "A4") {
        if (FONTCSS === null) FONTCSS = await fetch("fonts.css").then((r) => r.text()).catch(() => "");
        const doc = '<meta charset="utf-8"><style>'.concat(FONTCSS).concat(cssFor(set, size), '</style><body class="s').concat(size.replace("mm", ""), '">').concat(html);
        try {
          await P.printHtml({ html: doc, name: name || "document" });
          return { msg: 'Choose "Save as PDF" or a printer' };
        } catch (e) {
          return { msg: "Print error: " + (e.message || e) };
        }
      }
      if (!set.printer) return { msg: "Select a Bluetooth printer in Settings" };
      try {
        const by = await toEscpos(html, size == "56mm" ? 32 : 48, size == "56mm" ? 384 : 576);
        await P.btPrint({ address: set.printer, data: b64(by) });
        return { msg: "Sent to printer" };
      } catch (e) {
        return { msg: "Printer error: " + (e.message || e) };
      }
    },
    async drawer(s) {
      const a = s.printer || (typeof db !== "undefined" ? db.set.printer : "");
      if (!s.drawer || s.drawer == "none") return { msg: "Cash drawer is turned off in Settings" };
      if (!a) return { msg: "Select a Bluetooth printer first" };
      try {
        await P.btPrint({ address: a, data: b64(Uint8Array.from([27, 112, 0, 25, 250])) });
        return { msg: "Drawer opened" };
      } catch (e) {
        return { msg: "Drawer error: " + (e.message || e) };
      }
    },
    async backup() {
      await ready;
      const T = ["users", "items", "orders", "lines", "meta"], r = await q(T.map((t) => ({ q: "select * from " + t }))), d = {};
      T.forEach((t, i) => d[t] = r[i]);
      try {
        await P.shareText({ name: "monkey-backup-" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + ".json", text: JSON.stringify(d) });
        return { msg: "Choose where to save the backup" };
      } catch (e) {
        return { msg: "Backup error: " + (e.message || e) };
      }
    },
    async restore(f) {
      if (!f) return;
      try {
        const d = JSON.parse(await f.text()), T = ["users", "items", "orders", "lines", "meta"];
        if (!d.users || !d.items) throw 0;
        const st = T.map((t) => ({ q: "delete from " + t }));
        T.forEach((t) => (d[t] || []).forEach((r) => {
          const c = Object.keys(r);
          st.push({ q: "insert into ".concat(t, "(").concat(c.join(","), ") values(").concat(c.map(() => "?").join(","), ")"), p: c.map((k) => r[k]) });
        }));
        await q(st);
        location.reload();
      } catch (e) {
        alert("Invalid backup file");
      }
    }
  };
})();
