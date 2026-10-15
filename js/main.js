/* サイトの動き。内容の変更は js/data.js で行う */
(() => {
  "use strict";
  const S = window.SITE || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;

  /* ---------- 日付・年齢 ---------- */
  const [by, bm, bd] = String(S.birthday || "").split("-").map(Number);
  function calcAge() {
    if (!by) return null;
    const now = new Date();
    let year = now.getFullYear();
    const diffDays = (now - new Date(year, bm - 1, bd)) / 864e5;
    if (diffDays > 182) year += 1; // 次の誕生日のほうが近い
    else if (diffDays < -182) year -= 1; // 前回の誕生日のほうが近い
    return year - by;
  }
  const age = S.age ?? calcAge();
  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  /* ---------- テキスト差し込み ---------- */
  const getPath = (p) => p.split(".").reduce((o, k) => (o == null ? o : o[k]), S);
  document.querySelectorAll("[data-bind]").forEach((e) => {
    const v = getPath(e.dataset.bind);
    if (v) e.textContent = v;
    else e.hidden = true;
  });
  document.title = `Happy Birthday ${S.nameEn || S.name || ""}`.trim();

  // 画像（読み込めなければダミー表示）
  function picture(src, label, eager) {
    const box = el("div", "ph");
    const img = new Image();
    img.alt = label || "";
    img.decoding = "async";
    if (!eager) img.loading = "lazy";
    img.addEventListener("error", () => {
      img.remove();
      box.classList.add("ph--empty");
      box.dataset.label = label || "No Image";
    });
    img.src = src;
    box.appendChild(img);
    return box;
  }

  /* ---------- 紙吹雪 ---------- */
  const confetti = (() => {
    const canvas = $("#confetti");
    const ctx = canvas.getContext("2d");
    const colors = ["#ff6b8b", "#ffd166", "#06d6a0", "#4cc9f0", "#b388ff", "#ffffff"];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let parts = [], raf = 0;

    function resize() {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    addEventListener("resize", resize);
    resize();

    // クラッカー：画面の左下・右下から斜め上へ発射
    function cracker(count = 220) {
      if (reduceMotion) count = Math.min(count, 40);
      const w = innerWidth, h = innerHeight;
      for (let i = 0; i < count; i++) {
        const dir = i % 2 === 0 ? 1 : -1; // 1: 左下から右上へ / -1: 右下から左上へ
        parts.push({
          x: dir === 1 ? -10 : w + 10,
          y: h + 10,
          vx: dir * (Math.random() * 9 + 3) * Math.min(w / 400, 1.6),
          vy: -(Math.random() * 12 + 11) * Math.min(h / 700, 1.3),
          size: Math.random() * 6 + 5,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.3,
          tilt: Math.random() * Math.PI * 2,
          color: colors[i % colors.length],
          round: Math.random() < 0.3,
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function burst(count = 160) {
      if (reduceMotion) count = Math.min(count, 40);
      const w = innerWidth, h = innerHeight;
      for (let i = 0; i < count; i++) {
        const fromCenter = i % 2 === 0;
        parts.push({
          x: fromCenter ? w / 2 : Math.random() * w,
          y: fromCenter ? h * 0.55 : -20 - Math.random() * h * 0.6,
          vx: fromCenter ? (Math.random() - 0.5) * 14 : (Math.random() - 0.5) * 2,
          vy: fromCenter ? -Math.random() * 14 - 4 : Math.random() * 2 + 1,
          size: Math.random() * 6 + 5,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.3,
          tilt: Math.random() * Math.PI * 2,
          color: colors[i % colors.length],
          round: Math.random() < 0.3,
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick() {
      const h = innerHeight;
      ctx.clearRect(0, 0, innerWidth, h);
      parts = parts.filter((p) => p.y < h + 30);
      for (const p of parts) {
        p.vy = Math.min(p.vy + 0.18, 3.2);
        p.vx *= 0.985;
        p.tilt += 0.07;
        p.x += p.vx + Math.sin(p.tilt) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.tilt));
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        }
        ctx.restore();
      }
      raf = parts.length ? requestAnimationFrame(tick) : 0;
    }

    return { burst, cracker };
  })();

  /* ---------- ワープ ---------- */
  const warp = (() => {
    const canvas = $("#warp");
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // スマホで重くならないよう解像度は少し控えめに
    const hues = [330, 200, 45, 280];
    const starColor = Object.fromEntries(hues.map((h) => [h, `hsl(${h}, 90%, 85%)`]));

    // ワープ中に流す写真。軽くするため小さく縮めて白フチを付けておく
    // data.js の warpPhotos（ファイル名の一覧）。空ならスライドショーの写真を使う、false なら流さない
    const list = S.warpPhotos === false ? []
      : Array.isArray(S.warpPhotos) && S.warpPhotos.length ? S.warpPhotos.map((src) => ({ src }))
      : S.photos || [];
    const thumbs = [];
    list.forEach((p, i) => {
      const img = new Image();
      img.onload = () => {
        // 写真はトンネルの枠（slideRatio）の形に中央を切り取る（横長などが混ざっても伸びない）
        const [aw, ah] = String(S.slideRatio || "9:16").split(/[:/]/).map(Number);
        const ratio = aw > 0 && ah > 0 ? aw / ah : 9 / 16;
        const tw = 360, th = Math.round(tw / ratio), pad = 10;
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const sw = Math.min(iw, ih * ratio), sh = sw / ratio;
        const cv = document.createElement("canvas");
        cv.width = tw + pad * 2;
        cv.height = th + pad * 2;
        const x = cv.getContext("2d");
        x.fillStyle = "#fff";
        x.fillRect(0, 0, cv.width, cv.height);
        x.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, pad, pad, tw, th);
        thumbs[i] = cv;
      };
      img.src = p.src;
    });
    const duration = S.warpDuration || (list.length ? 5000 : 2400);

    // トンネルの壁に写真を敷きつめ、奥から手前へ流す
    // 丸いトンネルの内側の壁に写真を貼り、奥から手前へ流す
    const NEAR = 0.55, FAR = 3.6; // 奥行きの範囲（焦点距離 = 1 とした倍率）
    const COLS = 12; // 一周に並べる列の数
    let lanes = [], geo = null;
    // 写真の割り当て：直前と同じ写真にならないようにランダムに選ぶ
    const pick = (avoid) => {
      const n = Math.max(thumbs.filter(Boolean).length, 1);
      let k;
      do k = Math.floor(Math.random() * n); while (n > 1 && k === avoid);
      return k;
    };
    function setupTunnel(w, h) {
      const D = Math.max(w, h) * 0.6; // 焦点距離
      const R = Math.hypot(w, h) * 0.4; // トンネルの半径
      const [aw, ah] = String(S.slideRatio || "9:16").split(/[:/]/).map(Number);
      const ratio = aw > 0 && ah > 0 ? aw / ah : 9 / 16; // 写真の横 ÷ 縦
      const size = ((2 * Math.PI * R) / COLS) * 0.88; // 周方向の写真の幅
      lanes = [];
      for (let j = 0; j < COLS; j++) {
        const ang = (j / COLS) * Math.PI * 2;
        const c = Math.cos(ang), s = Math.sin(ang);
        // 左右寄りの列は写真を縦向き、上下寄りの列は奥へ向かう向きに貼る（どちらも上下が正しく見える）
        const side = Math.abs(c) > Math.abs(s);
        const len = side ? size * ratio : size / ratio; // 奥行き方向の長さ
        const period = len * (side ? 1.3 : 1.12);
        const count = Math.ceil(((FAR - NEAR) * D) / period) + 1;
        const off = Math.random() * period; // 列ごとにずらして並びを揃えすぎない
        const tiles = [];
        for (let i = 0; i < count; i++) {
          tiles.push({ z: NEAR * D + len / 2 + i * period + off, k: pick(i ? tiles[i - 1].k : -1) });
        }
        lanes.push({ c, s, side, size, len, span: count * period, tiles });
      }
      geo = { D, R };
    }
    // 写真の (s, t)（左上 0,0 〜 右下 1,1）がトンネルの壁のどこに来るか
    function worldPoint(L, z, s, t) {
      const { R } = geo;
      const tx = -L.s, ty = L.c; // 壁に沿って周方向
      let lat, dep;
      if (L.side) {
        lat = (t - 0.5) * L.size * Math.sign(L.c);
        dep = (L.c > 0 ? 0.5 - s : s - 0.5) * L.len;
      } else {
        lat = (s - 0.5) * L.size * (L.s > 0 ? -1 : 1);
        dep = (L.s > 0 ? 0.5 - t : t - 0.5) * L.len;
      }
      return [R * L.c + tx * lat, R * L.s + ty * lat, z + dep];
    }

    // ---- 写真は WebGL で描く（奥行きのある台形も正確で、縁もなめらか。スマホでも軽い） ----
    // 使えない環境では下の 2D の描き方に切り替える
    const glWrap = document.createElement("div");
    glWrap.className = "warp"; // 星のキャンバスと同じタイミングで表示・非表示
    const glc = document.createElement("canvas");
    glc.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    glWrap.appendChild(glc);
    canvas.parentNode.insertBefore(glWrap, canvas); // 星（光の粒）はその上に重なる
    const gl = (() => {
      try {
        const g = glc.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
        if (!g) return null;
        const sh = (type, src) => {
          const s = g.createShader(type);
          g.shaderSource(s, src);
          g.compileShader(s);
          if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s));
          return s;
        };
        const prog = g.createProgram();
        // w に奥行きを渡すと、テクスチャが遠近どおりに貼られる
        g.attachShader(prog, sh(g.VERTEX_SHADER, `
          attribute vec3 aPos; attribute vec2 aUV; attribute float aA;
          uniform vec2 uScale; varying vec2 vUV; varying float vA;
          void main() {
            gl_Position = vec4(aPos.x * uScale.x, -aPos.y * uScale.y, 0.0, aPos.z);
            vUV = aUV; vA = aA;
          }`));
        g.attachShader(prog, sh(g.FRAGMENT_SHADER, `
          precision mediump float;
          uniform sampler2D uTex; varying vec2 vUV; varying float vA;
          void main() {
            vec4 c = texture2D(uTex, vUV);
            float a = c.a * vA;
            gl_FragColor = vec4(c.rgb * a, a);
          }`));
        g.linkProgram(prog);
        if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(prog));
        g.useProgram(prog);
        const buf = g.createBuffer();
        g.bindBuffer(g.ARRAY_BUFFER, buf);
        const loc = (n) => g.getAttribLocation(prog, n);
        const F = 4;
        [["aPos", 3, 0], ["aUV", 2, 3], ["aA", 1, 5]].forEach(([n, size, off]) => {
          g.enableVertexAttribArray(loc(n));
          g.vertexAttribPointer(loc(n), size, g.FLOAT, false, 6 * F, off * F);
        });
        g.enable(g.BLEND);
        g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
        const aniso = g.getExtension("EXT_texture_filter_anisotropic");
        return { g, uScale: g.getUniformLocation(prog, "uScale"), aniso, tex: new Map() };
      } catch (e) {
        return null;
      }
    })();
    const glDpr = Math.min(window.devicePixelRatio || 1, 2);
    const verts = new Float32Array(6 * 6 * 400);

    // 写真をテクスチャにする（縮小してもちらつかないように 512 四方にしてミップマップを作る）
    function texOf(cv) {
      const { g, tex, aniso } = gl;
      if (tex.has(cv)) return tex.get(cv);
      const pot = document.createElement("canvas");
      pot.width = pot.height = 512;
      pot.getContext("2d").drawImage(cv, 0, 0, 512, 512);
      const t = g.createTexture();
      g.bindTexture(g.TEXTURE_2D, t);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, pot);
      g.generateMipmap(g.TEXTURE_2D);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      if (aniso) g.texParameterf(g.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, g.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      tex.set(cv, t);
      return t;
    }

    function drawGL(all, items, w, h, opacity, D) {
      const { g, uScale } = gl;
      const W = Math.round(w * glDpr), H = Math.round(h * glDpr);
      if (glc.width !== W || glc.height !== H) {
        glc.width = W;
        glc.height = H;
      }
      g.viewport(0, 0, W, H);
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      glc.style.opacity = opacity; // 不透明で描いたものを、まとめて半透明にする
      g.uniform2f(uScale, D / (w / 2), D / (h / 2));

      let count = 0, cur = null;
      const flush = () => {
        if (!count) return;
        g.bindTexture(g.TEXTURE_2D, cur);
        g.bufferData(g.ARRAY_BUFFER, verts.subarray(0, count * 6), g.STREAM_DRAW);
        g.drawArrays(g.TRIANGLES, 0, count);
        count = 0;
      };
      const corner = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
      for (const [L, T] of all) {
        if (T.z - L.len / 2 < 6) continue; // カメラを通り過ぎかけている
        const fade = Math.min(1, (FAR * D - T.z) / (1.4 * D)); // 奥は霞む
        if (fade <= 0.01) continue;
        const t = texOf(items[T.k % items.length]);
        if (t !== cur || count + 6 > verts.length / 6) { flush(); cur = t; }
        for (const [s, u] of corner) {
          const [X, Y, Z] = worldPoint(L, T.z, s, u);
          verts.set([X, Y, Z, s, u, fade], count * 6);
          count++;
        }
      }
      flush();
    }

    // 写真はいったん別のキャンバスに不透明で描き、最後にまとめて半透明で重ねる
    // （帯の継ぎ目の重なりが濃く出ないように）
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");

    function drawPhotos(p, dt, w, h, cx, cy) {
      const items = thumbs.filter(Boolean);
      const n = items.length;
      if (!n || !geo) return;
      const { D } = geo;
      const v = camSpeed(p);
      const intro = Math.min(1, p / 0.12);
      const outro = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1; // 光に包まれて消える
      const opacity = intro * outro * (S.warpPhotoOpacity ?? 0.4);

      const all = [];
      for (const L of lanes) {
        for (const T of L.tiles) {
          T.z -= v * dt;
          if (T.z + L.len / 2 < 6) { T.z += L.span; T.k = pick(T.k); } // 通り過ぎたらいちばん奥へ
          all.push([L, T]);
        }
      }
      if (gl) {
        all.sort((a, b) => b[1].z - a[1].z); // 奥から描く
        drawGL(all, items, w, h, opacity, D);
        return;
      }
      if (opacity <= 0.01) return;
      all.sort((a, b) => b[1].z - a[1].z); // 奥から描く

      if (layer.width !== canvas.width || layer.height !== canvas.height) {
        layer.width = canvas.width;
        layer.height = canvas.height;
      }
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.clearRect(0, 0, w, h);

      for (const [L, T] of all) {
        if (T.z - L.len / 2 < 6) continue; // カメラを通り過ぎかけている
        const fade = Math.min(1, (FAR * D - T.z) / (1.4 * D)); // 奥は霞む
        if (fade <= 0.01) continue;
        const cv = items[T.k % n];
        // 近くの写真は奥行き方向に細い帯に分けて、それぞれ平行四辺形で描く（遠近がつく）
        // 切り抜き（clip）を使わないので、iPhone でも縁がなめらか
        const side = L.side;
        const g = T.z > 1.6 * D ? 1 : 10;
        const GS = side ? g : 1, GT = side ? 1 : g;
        const pts = [];
        for (let j = 0; j <= GT; j++) {
          for (let i = 0; i <= GS; i++) {
            const [X, Y, Z] = worldPoint(L, T.z, i / GS, j / GT);
            pts.push([cx + (X * D) / Z, cy + (Y * D) / Z]);
          }
        }
        const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
        if (Math.min(...xs) > w || Math.max(...xs) < 0 || Math.min(...ys) > h || Math.max(...ys) < 0) continue;

        lctx.globalAlpha = fade;
        const sw = cv.width / GS, sh = cv.height / GT;
        for (let k = 0; k < g; k++) {
          // 帯の四隅（a 左上・b 右上・c 左下・d 右下）
          const a = side ? pts[k] : pts[k * 2];
          const b = side ? pts[k + 1] : pts[k * 2 + 1];
          const c = side ? pts[GS + 1 + k] : pts[(k + 1) * 2];
          const d = side ? pts[GS + 2 + k] : pts[(k + 1) * 2 + 1];
          // 四隅にいちばん近い平行四辺形（ずれを上下左右に均等に分けて段差を目立たなくする）
          const ux = (b[0] - a[0] + d[0] - c[0]) / 2, uy = (b[1] - a[1] + d[1] - c[1]) / 2;
          const vx = (c[0] - a[0] + d[0] - b[0]) / 2, vy = (c[1] - a[1] + d[1] - b[1]) / 2;
          const ox = (a[0] + b[0] + c[0] + d[0]) / 4 - ux / 2 - vx / 2;
          const oy = (a[1] + b[1] + c[1] + d[1]) / 4 - uy / 2 - vy / 2;
          const sx = side ? k * sw : 0, sy = side ? 0 : k * sh;
          // 隣の帯と少し重ねて隙間を消す（最後の帯は重ねない）
          const ex = side && k < g - 1 ? 2 : 0, ey = !side && k < g - 1 ? 2 : 0;
          lctx.save();
          lctx.transform(ux / sw, uy / sw, vx / sh, vy / sh, ox, oy);
          lctx.drawImage(cv, sx, sy, sw + ex, sh + ey, 0, 0, sw + ex, sh + ey);
          lctx.restore();
        }
      }
      lctx.globalAlpha = 1;

      ctx.globalAlpha = opacity;
      ctx.drawImage(layer, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // カメラの進む速さ（写真も光も同じ）。ろうそくの間のゆっくりした漂いから、なめらかに加速
    const IDLE = 0.04;
    const camSpeed = (p) => {
      const e = Math.min(1, p / 0.15);
      return (IDLE + 0.86 * e * e * (3 - 2 * e) + 4 * p * p * p) * geo.D;
    };

    // 星（光の粒）はろうそくの画面からワープまで同じものを使う
    let W = 0, H = 0, cx = 0, cy = 0, stars = [], idleRaf = 0, spawn;
    function init() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2;
      cy = H / 2;
      setupTunnel(W, H);
      // 光の粒をトンネルの中に散らばらせる（写真と同じ空間・同じ速さで流れる）
      const { D, R } = geo;
      spawn = (s, z) => {
        const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * R * 0.95;
        s.x = Math.cos(a) * rr;
        s.y = Math.sin(a) * rr;
        s.z = z;
        s.hue = hues[Math.floor(Math.random() * hues.length)];
        s.ph = Math.random() * Math.PI * 2; // またたきのずれ
        return s;
      };
      stars = Array.from({ length: 320 }, () => spawn({}, NEAR * D + Math.random() * (FAR - NEAR) * D));
    }

    // twinkle: 1 = ろうそくの画面のまたたき、0 = ワープ中（またたかない）
    function drawStars(v, dt, now, twinkle) {
      const { D } = geo;
      const spanZ = (FAR - NEAR) * D;
      const trail = v * 0.08; // 光の尾の長さ（速いほど長い。止まっていれば点）
      ctx.lineCap = "round";
      for (const s of stars) {
        s.z -= v * dt;
        if (s.z < 8) { spawn(s, s.z + spanZ); continue; }
        const tz = s.z + trail;
        const x0 = cx + (s.x * D) / tz, y0 = cy + (s.y * D) / tz;
        const x1 = cx + (s.x * D) / s.z, y1 = cy + (s.y * D) / s.z;
        if (x0 < -50 || x0 > W + 50 || y0 < -50 || y0 > H + 50) continue;
        const tw = 1 - twinkle * 0.45 * (1 + Math.sin(now / 600 + s.ph)) / 2;
        const a = Math.min(1, (FAR * D - s.z) / D) * tw;
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.strokeStyle = starColor[s.hue];
        ctx.lineWidth = Math.min(4, Math.max(0.6, (D / s.z) * 1.2));
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ろうそくの画面：星がまたたきながらゆっくり漂う
    function idle() {
      init();
      let prev = performance.now();
      (function frame(now) {
        const dt = Math.min((now - prev) / 1000, 0.05);
        prev = now;
        ctx.clearRect(0, 0, W, H);
        drawStars(IDLE * geo.D, dt, now, 1);
        idleRaf = requestAnimationFrame(frame);
      })(prev);
    }
    addEventListener("resize", () => { if (idleRaf) init(); });

    function run() {
      // 写真の読み込みが終わってから貼る写真を決め直す（ページを開いた直後はまだ読み込み中のため）
      for (const L of lanes) L.tiles.forEach((T, i) => (T.k = pick(i ? L.tiles[i - 1].k : -1)));
      cancelAnimationFrame(idleRaf);
      idleRaf = 0;
      return new Promise((resolve) => {
        const f = Math.max(W, H) * 0.5;
        const start = performance.now();
        let prev = start;

        (function frame(now) {
          const p = Math.min((now - start) / duration, 1);
          const dt = Math.min((now - prev) / 1000, 0.05); // 画面の書き換え回数に関係なく同じ速さに
          prev = now;
          const v = camSpeed(p);
          ctx.clearRect(0, 0, W, H);

          // 中心の光がふくらむ
          const r = f * (0.15 + p * 1.2);
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          glow.addColorStop(0, `rgba(255, 225, 240, ${(0.15 + 0.6 * p * p) * Math.min(1, p / 0.1)})`);
          glow.addColorStop(1, "rgba(255, 225, 240, 0)");
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, W, H);

          // 写真のトンネル（光の粒はその手前をすり抜ける）
          drawPhotos(p, dt, W, H, cx, cy);
          drawStars(v, dt, now, Math.max(0, 1 - p / 0.15));

          if (p < 1) requestAnimationFrame(frame);
          else resolve();
        })(start);
      });
    }

    idle();
    return { run, duration };
  })();

  /* ---------- 効果音 ---------- */
  const sfx = (() => {
    const files = S.sounds || {};
    const raw = {}; // 差し替え用ファイル（ArrayBuffer）
    const decoded = {};
    let ctx = null;

    // 指定ファイルは先に読み込んでおく（読めなければ合成音を使う）
    Object.entries(files).forEach(([name, src]) => {
      if (!src || S.sound === false) return;
      fetch(src)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then((buf) => (raw[name] = buf))
        .catch(() => {});
    });

    // タップ／クリックの中で呼ぶ必要がある（スマホの自動再生制限のため）
    function unlock() {
      if (S.sound === false) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }

    function noiseBuffer(c, dur) {
      const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }

    // ひゅっ（炎が消える音）
    // 帯域を狭めた風の音を高い方へすばやく滑らせて、短く切る
    function synthBlow(c, t, out) {
      const dur = 0.35;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, dur);
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 6;
      f.frequency.setValueAtTime(900, t);
      f.frequency.exponentialRampToValueAtTime(3200, t + 0.2);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.9, t + 0.1); // ひゅ
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); // っ
      src.connect(f).connect(g).connect(out);
      src.start(t);
      src.stop(t + dur);
    }

    // ポンッ＋キラキラ（控えめなお祝い音）
    function synthPop(c, t, out) {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(700, t);
      o.frequency.exponentialRampToValueAtTime(250, t + 0.1);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.16);

      [1047, 1319, 1568, 2093, 2637].forEach((freq, i) => {
        const st = t + 0.08 + i * 0.07;
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.value = freq;
        const og = c.createGain();
        og.gain.setValueAtTime(0.0001, st);
        og.gain.linearRampToValueAtTime(0.12, st + 0.01);
        og.gain.exponentialRampToValueAtTime(0.001, st + 0.8);
        o.connect(og).connect(out);
        o.start(st);
        o.stop(st + 0.85);
      });
    }

    // Happy Birthday（オルゴール風）。演奏時間（秒）を返す
    function synthSong(c, t, out) {
      const beat = 0.68; // ゆったりめ
      // 最後のフレーズは少しずつテンポを落とす
      const at = (pos) => t + pos * beat + (pos > 18 ? (pos - 18) * (pos - 18) * 0.045 : 0);
      const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
      // メロディは1オクターブ上（高音のオルゴール）
      const G5 = 79, A5 = 81, B5 = 83, C6 = 84, D6 = 86, E6 = 88, F6 = 89, G6 = 91;
      // [拍の位置, 音]
      const melody = [
        [0, G5], [.75, G5], [1, A5], [2, G5], [3, C6], [4, B5],
        [6, G5], [6.75, G5], [7, A5], [8, G5], [9, D6], [10, C6],
        [12, G5], [12.75, G5], [13, G6], [14, E6], [15, C6], [16, B5], [17, A5],
        [18, F6], [18.75, F6], [19, E6], [20, C6], [21, D6], [22, C6],
      ];
      // 伴奏：小節の頭にベース、2・3拍目に和音（オルゴールらしい軽い刻み）
      const C = [60, [64, 67]], G = [55, [62, 65]], F = [53, [65, 69]];
      const chords = [[1, C], [4, G], [7, G], [10, C], [13, C], [16, F], [19, C, 1], [21, G, 0], [22, C, 1]];

      // オルゴールの櫛を弾いた音：澄んだ基音＋高い倍音がすぐ消える
      const tine = (m, st, vol) => {
        const freq = midi(m);
        [[1, vol, 2.2], [1.003, vol * 0.4, 2.2], [2, vol * 0.18, 0.9], [4.16, vol * 0.1, 0.18]].forEach(([mul, v, len]) => {
          const o = c.createOscillator();
          o.type = "sine";
          o.frequency.value = freq * mul;
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, st);
          g.gain.linearRampToValueAtTime(v, st + 0.003);
          g.gain.exponentialRampToValueAtTime(0.0005, st + len);
          o.connect(g).connect(out);
          o.start(st);
          o.stop(st + len + 0.05);
        });
      };

      melody.forEach(([pos, m]) => tine(m, at(pos), 0.16));
      chords.forEach(([pos, [root, dyad], beats = 2]) => {
        tine(root, at(pos), 0.08);
        for (let b = 1; b <= beats; b++) dyad.forEach((m) => tine(m, at(pos + b), 0.045));
      });
      return at(22) - t + 2.4; // 最後の音が鳴り終わるまで
    }

    // ワープ：上がっていく風切り音＋うなり
    const WARP_SEC = 2.4;
    function synthWarp(c, t, out, dur = WARP_SEC) {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, dur);
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 2;
      f.frequency.setValueAtTime(200, t);
      f.frequency.exponentialRampToValueAtTime(4000, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + dur * 0.95);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.3);
      src.connect(f).connect(g).connect(out);
      src.start(t);
      src.stop(t + dur + 0.3);

      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(60, t);
      o.frequency.exponentialRampToValueAtTime(600, t + dur);
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      const og = c.createGain();
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(0.12, t + dur * 0.9);
      og.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.2);
      o.connect(lp).connect(og).connect(out);
      o.start(t);
      o.stop(t + dur + 0.25);
    }

    const synth = { blow: synthBlow, pop: synthPop, song: synthSong, warp: synthWarp };

    // 曲を最後まで流し、終わったら resolve する
    async function playSong() {
      const c = unlock();
      if (!c) return wait(3500);
      await decode(c, "song");
      const out = c.createGain();
      out.gain.value = volumeOf("song");
      out.connect(c.destination);

      if (decoded.song) {
        const src = c.createBufferSource();
        src.buffer = decoded.song;
        src.connect(out);
        src.start();
        return wait(decoded.song.duration * 1000 + 300);
      }
      if (files.song) {
        // index.html を直接開いたときなど、先読みできなかった場合
        const a = new Audio(files.song);
        a.volume = Math.min(volumeOf("song"), 1);
        const ok = await a.play().then(() => true, () => false);
        if (ok) {
          return new Promise((res) => {
            a.addEventListener("ended", res, { once: true });
            a.addEventListener("error", res, { once: true });
          });
        }
      }
      return wait(synthSong(c, c.currentTime + 0.1, out) * 1000);
    }
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));

    // data.js の volumes（未指定は 1）
    const volumeOf = (name) => {
      const v = (S.volumes || {})[name] ?? (name === "fire" ? S.fireVolume : undefined);
      return Math.max(Number(v ?? 1) || 0, 0);
    };

    async function decode(c, name) {
      if (raw[name] && !decoded[name]) {
        try {
          decoded[name] = await c.decodeAudioData(raw[name].slice(0));
        } catch {
          delete raw[name];
        }
      }
      return decoded[name];
    }

    // ループ再生（たき火など）。stopLoop でフェードアウト
    const loops = {};
    async function startLoop(name, volume = volumeOf(name)) {
      const c = unlock();
      if (!c || !files[name] || loops[name]) return;
      const loop = (loops[name] = { stopped: false, stop() { this.stopped = true; } });
      const buf = await decode(c, name);
      if (loop.stopped) return;

      if (buf) {
        const src = c.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), c.currentTime + 1);
        src.connect(g).connect(c.destination);
        src.start();
        loop.stop = () => {
          const t = c.currentTime;
          g.gain.cancelScheduledValues(t);
          g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
          src.stop(t + 0.9);
        };
      } else {
        // index.html を直接開いたときなど、先読みできなかった場合
        const a = new Audio(files[name]);
        a.loop = true;
        a.volume = Math.min(volume, 1);
        a.play().catch(() => {});
        loop.stop = () => {
          const id = setInterval(() => {
            const v = a.volume - 0.05;
            if (v <= 0) {
              a.pause();
              clearInterval(id);
            } else {
              a.volume = v;
            }
          }, 40);
        };
      }
    }
    function stopLoop(name) {
      if (loops[name]) loops[name].stop();
    }

    async function play(name, ...args) {
      const c = unlock();
      if (!c) return;
      await decode(c, name);
      const out = c.createGain();
      out.gain.value = volumeOf(name);
      out.connect(c.destination);
      const fallback = () => synth[name]?.(c, c.currentTime, out, ...args);
      if (decoded[name]) {
        const src = c.createBufferSource();
        src.buffer = decoded[name];
        src.connect(out);
        src.start();
      } else if (files[name]) {
        // index.html を直接開いたときなど、先読みできなかった場合
        const a = new Audio(files[name]);
        a.volume = Math.min(volumeOf(name), 1);
        a.play().catch(fallback);
      } else {
        fallback();
      }
    }

    return { unlock, play, playSong, startLoop, stopLoop };
  })();

  /* ---------- BGM ---------- */
  const audio = $("#bgm");
  const bgmBtn = $("#bgmToggle");
  function playBgm() {
    if (!S.bgm) return;
    audio.src = S.bgm;
    audio.volume = 0.6;
    bgmBtn.hidden = false;
    audio.play().catch(() => {});
  }
  bgmBtn.addEventListener("click", () => (audio.paused ? audio.play() : audio.pause()));
  audio.addEventListener("play", () => bgmBtn.classList.add("is-playing"));
  audio.addEventListener("pause", () => bgmBtn.classList.remove("is-playing"));

  /* ---------- オープニング ---------- */
  const heroEn = $("#heroEn");
  let ci = 0;
  (S.openingTitle || "Happy Birthday").split(" ").forEach((word, wi) => {
    if (wi) heroEn.append(" ");
    const w = el("span", "word");
    [...word].forEach((c) => {
      const s = el("span", "ch", c);
      s.style.setProperty("--i", ci++);
      w.appendChild(s);
    });
    heroEn.appendChild(w);
  });
  // 現れ終わった文字に印を付けて、ぼかしの設定を外す
  heroEn.addEventListener("animationend", (e) => e.target.classList.add("is-done"));

  const ageEl = $("#heroAge");
  if (S.showAge !== false && age > 0) {
    ageEl.append(el("span", "num", age), el("span", "suf", ordinal(age)));
  } else {
    ageEl.hidden = true;
  }

  function countUp() {
    const num = $("#heroAge .num"), suf = $("#heroAge .suf");
    if (!num || reduceMotion) return;
    const start = performance.now() + 3100, dur = 1200;
    num.textContent = "0";
    (function step(t) {
      const p = Math.min(Math.max((t - start) / dur, 0), 1);
      const n = Math.round(age * (1 - Math.pow(1 - p, 3)));
      num.textContent = n;
      suf.textContent = ordinal(n);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  // 1回目のタップで火を灯す（ここで音が鳴らせるようになる）
  let litAt = 0;
  function lightCandle() {
    litAt = Date.now();
    body.classList.add("is-lit");
    sfx.unlock();
    sfx.play("light");
    sfx.startLoop("fire");
  }

  // 2回目のタップで吹き消す
  let opened = false;
  function openSite() {
    if (opened) return;
    opened = true;
    body.classList.add("is-blown");
    sfx.stopLoop("fire");
    sfx.play("blow");
    setTimeout(async () => {
      // ワープ
      if (!reduceMotion) {
        $("#opening").style.setProperty("--warp", `${warp.duration / 1000}s`);
        body.classList.add("is-warping");
        sfx.play("warp", warp.duration / 1000);
        await warp.run();
      }
      // 白く光って画面が明るくなり、Happy Birthday の曲が流れる
      body.classList.add("is-open");
      countUp();
      await sfx.playSong();
      // 曲が終わったらクラッカー → スクロールできるように
      sfx.play(S.sounds?.cracker ? "cracker" : "pop");
      confetti.cracker();
      body.classList.add("is-ready");
      body.classList.remove("is-locked");
      playBgm();
    }, reduceMotion ? 100 : 900);
  }
  function onGate() {
    if (!litAt) lightCandle();
    else if (Date.now() - litAt > 700) openSite(); // 灯った直後の連打では消さない
  }
  $("#gate").addEventListener("click", onGate);
  // PCではEnter / スペースキーでもOK
  addEventListener("keydown", (e) => {
    if (!opened && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onGate();
    }
  });

  /* ---------- プロフィール ---------- */
  const P = S.profile || {};
  const photoBox = $("#profilePhoto");
  if (P.photo) photoBox.appendChild(picture(P.photo, "Photo", true));
  else photoBox.hidden = true;

  const bdEl = $("#profileBirthday");
  if (by) {
    bdEl.textContent = S.showBirthYear === false
      ? `${bm}月${bd}日生まれ`
      : `${by}年${bm}月${bd}日生まれ`;
  } else {
    bdEl.hidden = true;
  }

  const list = $("#profileList");
  (P.items || []).forEach(({ label, value }) => {
    const row = el("div");
    row.append(el("dt", null, label), el("dd", null, value));
    list.appendChild(row);
  });

  /* ---------- 拡大表示 ---------- */
  const lightbox = (() => {
    const box = $("#lightbox"), img = $("img", box), cap = $("p", box);
    img.addEventListener("error", () => (img.hidden = true));
    const api = {
      isOpen: false,
      open(p) {
        img.hidden = false;
        img.src = p.src;
        img.alt = p.title || "";
        cap.textContent = [p.title, p.text].filter(Boolean).join("\n");
        box.hidden = false;
        api.isOpen = true;
      },
      close() {
        box.hidden = true;
        api.isOpen = false;
      },
    };
    box.addEventListener("click", api.close);
    return api;
  })();

  /* ---------- スライドショー ---------- */
  // 写真の縦横比（data.js の slideRatio。例 "9:16"）
  const [rw, rh] = String(S.slideRatio || "9:16").split(/[:/]/).map(Number);

  function setupSlider(section, photos) {
    if (!photos.length) {
      section.hidden = true;
      return;
    }
    const slider = $(".slider", section);
    if (rw > 0 && rh > 0) {
      slider.style.setProperty("--rw", rw);
      slider.style.setProperty("--rh", rh);
    }
    const track = $(".slider__track", section), bar = $(".slider__bar span", section), count = $(".slider__count", section);
    const n = photos.length;

    photos.forEach((p, i) => {
      const fig = el("figure", "slide");
      const frame = el("div", "slide__img");
      frame.appendChild(picture(p.src, p.title || `${i + 1}`, i < 2));
      fig.appendChild(frame);
      if (p.title || p.text) {
        const cap = el("figcaption");
        if (p.title) cap.appendChild(el("p", "slide__title", p.title));
        if (p.text) cap.appendChild(el("p", "slide__text", p.text));
        fig.appendChild(cap);
      }
      fig.addEventListener("click", () => lightbox.open(p));
      track.appendChild(fig);
    });

    let index = 0, lastTouch = 0, visible = false, raf = 0;
    const render = () => {
      count.textContent = `${index + 1} / ${n}`;
      bar.style.width = `${((index + 1) / n) * 100}%`;
    };
    const go = (i) => {
      index = (i + n) % n;
      track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
      render();
    };

    track.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        index = Math.round(track.scrollLeft / track.clientWidth);
        render();
      });
    }, { passive: true });
    ["pointerdown", "touchstart", "wheel"].forEach((t) =>
      track.addEventListener(t, () => (lastTouch = Date.now()), { passive: true })
    );

    // 画面に見えている間だけ自動で進む（触ったら少し止まる）
    new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.5 }).observe(track);
    setInterval(() => {
      if (visible && !lightbox.isOpen && !document.hidden && Date.now() - lastTouch > 6000) go(index + 1);
    }, S.slideInterval || 4000);

    render();
  }

  setupSlider($("#memories"), S.photos || []);
  // 2つ目：data.js の photos2 があればそれ、なければワープで流れる写真
  const warpList = Array.isArray(S.warpPhotos) ? S.warpPhotos.map((src) => ({ src })) : [];
  setupSlider($("#memories2"), S.photos2 || warpList);

  /* ---------- メッセージ ---------- */
  const msgs = S.messages || [];
  if (!msgs.length) {
    $("#messages").hidden = true;
  } else {
    const wrap = $("#messageList");
    msgs.forEach((m) => {
      const card = el("article", "message reveal");
      card.appendChild(el("p", "message__text", m.text));
      if (m.from) card.appendChild(el("p", "message__from", m.from));
      wrap.appendChild(card);
    });
  }

  /* ---------- 締め ---------- */
  $("#celebrate").addEventListener("click", () => {
    sfx.play("pop");
    confetti.burst(160);
  });

  /* ---------- スクロールでふわっと表示 ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((e) => io.observe(e));
})();
