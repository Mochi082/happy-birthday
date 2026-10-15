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

    return { burst };
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

    const synth = { blow: synthBlow, pop: synthPop };

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

    async function play(name) {
      const c = unlock();
      if (!c) return;
      await decode(c, name);
      const out = c.createGain();
      out.gain.value = volumeOf(name);
      out.connect(c.destination);
      const fallback = () => synth[name]?.(c, c.currentTime, out);
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

    return { unlock, play, startLoop, stopLoop };
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

  const ageEl = $("#heroAge");
  if (S.showAge !== false && age > 0) {
    ageEl.append(el("span", "num", age), el("span", "suf", ordinal(age)));
  } else {
    ageEl.hidden = true;
  }

  function countUp() {
    const num = $("#heroAge .num"), suf = $("#heroAge .suf");
    if (!num || reduceMotion) return;
    const start = performance.now() + 2000, dur = 1200;
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
    playBgm();
    setTimeout(() => {
      body.classList.add("is-open");
      sfx.play("pop");
      confetti.burst(180);
      countUp();
      setTimeout(() => body.classList.remove("is-locked"), 1500);
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
  const photos = S.photos || [];
  // 写真の縦横比（data.js の slideRatio。例 "9:16"）
  const [rw, rh] = String(S.slideRatio || "9:16").split(/[:/]/).map(Number);
  if (rw > 0 && rh > 0) {
    const slider = $(".slider");
    slider.style.setProperty("--rw", rw);
    slider.style.setProperty("--rh", rh);
  }
  if (!photos.length) {
    $("#memories").hidden = true;
  } else {
    const track = $("#sliderTrack"), bar = $("#sliderBar"), count = $("#sliderCount");
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
