(function () {
  "use strict";

  var BUILD = "elastic-lab-v2-sdf-bell-20261005";

  var CARDS = [
    {
      name: "Amethyst",
      digits: "3165",
      edge: [0x3f / 255, 0x16 / 255, 0x86 / 255],
      band: [0x29 / 255, 0x10 / 255, 0x54 / 255],
      core: [0xe7 / 255, 0xcf / 255, 0xfe / 255],
      tint: [0.039, 0.024, 0.067],
      icon: "pyramid",
    },
    {
      name: "Verdant",
      digits: "4282",
      edge: [0x1e / 255, 0x62 / 255, 0x44 / 255],
      band: [0x19 / 255, 0x38 / 255, 0x2b / 255],
      core: [0xcb / 255, 0xff / 255, 0xe6 / 255],
      tint: [0.02, 0.055, 0.04],
      icon: "leaf",
    },
    {
      name: "Ember",
      digits: "5399",
      edge: [0x86 / 255, 0x29 / 255, 0x12 / 255],
      band: [0x4f / 255, 0x1c / 255, 0x14 / 255],
      core: [0xfd / 255, 0xf6 / 255, 0xdb / 255],
      tint: [0.06, 0.03, 0.02],
      icon: "star",
    },
    {
      name: "Glacier",
      digits: "6516",
      edge: [0x1c / 255, 0x5d / 255, 0x80 / 255],
      band: [0x13 / 255, 0x3a / 255, 0x52 / 255],
      core: [0xec / 255, 0xff / 255, 0xff / 255],
      tint: [0.025, 0.045, 0.06],
      icon: "waves",
    },
    {
      name: "Graphite",
      digits: "7633",
      edge: [0x3a / 255, 0x41 / 255, 0x4f / 255],
      band: [0x27 / 255, 0x27 / 255, 0x2f / 255],
      core: [0xf2 / 255, 0xf5 / 255, 0xfc / 255],
      tint: [0.04, 0.042, 0.05],
      icon: "planet",
    },
    {
      name: "Sapphire",
      digits: "8744",
      edge: [0x1b / 255, 0x36 / 255, 0x7b / 255],
      band: [0x19 / 255, 0x24 / 255, 0x3f / 255],
      core: [0xcc / 255, 0xd4 / 255, 0xf0 / 255],
      tint: [0.025, 0.035, 0.07],
      icon: "sunset",
    },
  ];

  var N = CARDS.length;
  var root = document.documentElement;
  var canvas = document.getElementById("gl");
  var cardsDom = document.getElementById("cards-dom");
  var counterEl = document.getElementById("counter");
  var dotsEl = document.getElementById("dots");
  var liveEl = document.getElementById("live");
  var fallback = document.getElementById("fallback");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var scroll = 0;
  var target = 0;
  var vel = 0;
  var dragging = false;
  var pointerId = null;
  var dragStartY = 0;
  var dragStartScroll = 0;
  var wheelLock = 0;
  var lastTs = 0;
  var layout = { w: 0, h: 0, dpr: 1, cardW: 0, cardH: 0, gap: 0, radius: 0 };

  var ICONS = {
    pyramid:
      '<svg viewBox="0 0 24 24"><path d="M12 4 L20 19 H4 Z"/><path d="M12 4 V19"/><path d="M7.5 12.5 H16.5"/></svg>',
    leaf:
      '<svg viewBox="0 0 24 24"><path d="M5 18 C5 10 10 3 19 4 C18 14 12 19 5 18 Z"/><path d="M19 4 C14 10 10 15 7 20"/></svg>',
    star:
      '<svg viewBox="0 0 24 24"><path d="M12 3 L13.2 10.2 L20 12 L13.2 13.8 L12 21 L10.8 13.8 L4 12 L10.8 10.2 Z"/></svg>',
    waves:
      '<svg viewBox="0 0 24 24"><path d="M4 9 C7 6 10 6 13 9 C16 12 19 12 22 9"/><path d="M4 13 C7 10 10 10 13 13 C16 16 19 16 22 13"/><path d="M4 17 C7 14 10 14 13 17 C16 20 19 20 22 17"/></svg>',
    planet:
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10" ry="3.2" transform="rotate(-24 12 12)"/></svg>',
    sunset:
      '<svg viewBox="0 0 24 24"><path d="M12 5 V9"/><path d="M6.2 8.2 L8.5 10.5"/><path d="M17.8 8.2 L15.5 10.5"/><path d="M5 14 H19"/><path d="M7 17 H17"/><path d="M9 20 H15"/><path d="M7 14 A5 5 0 0 1 17 14"/></svg>',
  };

  var CHIP_SVG =
    '<svg viewBox="0 0 40 30">' +
    '<rect x="1" y="1" width="38" height="28" rx="4"/>' +
    '<path d="M1 10 H39 M1 20 H39 M14 1 V29 M26 1 V29"/>' +
    '<rect x="14" y="10" width="12" height="10" rx="1.5"/>' +
    "</svg>";

  /* -------------------- DOM cards & UI -------------------- */
  function buildDom() {
    cardsDom.innerHTML = "";
    dotsEl.innerHTML = "";
    CARDS.forEach(function (c, i) {
      var el = document.createElement("div");
      el.className = "card-dom";
      el.dataset.index = String(i);
      el.innerHTML =
        '<div class="chip">' +
        CHIP_SVG +
        "</div>" +
        '<div class="icon">' +
        ICONS[c.icon] +
        "</div>" +
        '<p class="name">' +
        c.name.toUpperCase() +
        "</p>" +
        '<p class="digits">•••• ' +
        c.digits +
        "</p>" +
        '<div class="veil"></div>';
      cardsDom.appendChild(el);

      var d = document.createElement("span");
      d.setAttribute("aria-label", c.name);
      dotsEl.appendChild(d);
    });

    var list = document.getElementById("fallback-list");
    list.innerHTML = CARDS.map(function (c) {
      return (
        "<li><strong>" +
        c.name.toUpperCase() +
        "</strong><span>•••• " +
        c.digits +
        "</span></li>"
      );
    }).join("");
  }

  function syncChrome() {
    var i = Math.round(target);
    i = Math.max(0, Math.min(N - 1, i));
    var c = CARDS[i];
    var n = String(i + 1).padStart(2, "0");
    counterEl.innerHTML = c.name + " <span>" + n + " / 0" + N + "</span>";
    Array.prototype.forEach.call(dotsEl.children, function (d, idx) {
      if (idx === i) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    });
    if (liveEl && liveEl._last !== i) {
      liveEl._last = i;
      liveEl.textContent = c.name + ", tarjeta " + n + " de 0" + N;
    }
  }

  function syncToggles() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme]"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-theme") === root.dataset.theme ? "true" : "false");
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-material]"), function (b) {
      b.setAttribute(
        "aria-pressed",
        b.getAttribute("data-material") === root.dataset.material ? "true" : "false"
      );
    });
  }

  /* -------------------- Layout -------------------- */
  function computeLayout() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cardW;
    if (w <= 480) cardW = w * 0.86;
    else cardW = Math.min(502, w * 0.392);
    var cardH = cardW / 1.6;
    var gap = cardW * (50 / 502);
    var radius = cardW * (16 / 502);
    layout = { w: w, h: h, dpr: dpr, cardW: cardW, cardH: cardH, gap: gap, radius: radius };
    return layout;
  }

  function cardCenterY(index, scrollPos) {
    // Active card (scrollPos) sits so its rect bottom is near the floor merge zone.
    // From 1280x720 ref: active top ~338, cardH~315 → center ~495.5 ≈ 0.688 * H
    var L = layout;
    var activeCenter = L.h * 0.688;
    var stride = L.cardH + L.gap;
    return activeCenter + (index - scrollPos) * stride;
  }

  function updateDomCards() {
    var L = layout;
    var nodes = cardsDom.children;
    for (var i = 0; i < N; i++) {
      var el = nodes[i];
      var cy = cardCenterY(i, scroll);
      var top = cy - L.cardH * 0.5;
      var left = (L.w - L.cardW) * 0.5;
      el.style.width = L.cardW + "px";
      el.style.height = L.cardH + "px";
      el.style.transform = "translate(" + left + "px," + top + "px)";
      el.style.borderRadius = L.radius + "px";

      var dist = Math.abs(i - scroll);
      var below = i > scroll + 0.55;
      var visible = !below && dist < 2.2;
      el.style.opacity = visible ? "1" : "0";
      el.style.visibility = visible ? "visible" : "hidden";

      var veil = el.querySelector(".veil");
      var merge = Math.max(0, 1 - Math.abs(i - scroll));
      veil.style.opacity = String(Math.pow(merge, 1.35) * 0.7);
    }
  }

  /* -------------------- WebGL -------------------- */
  var VS =
    "attribute vec2 a;\nvoid main(){gl_Position=vec4(a,0.0,1.0);}";

  var FS = [
    "#extension GL_OES_standard_derivatives : enable",
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uScroll;",
    "uniform vec2 uCard;", // half size
    "uniform float uGap;",
    "uniform float uRad;",
    "uniform float uTheme;", // 0 dark 1 light
    "uniform float uMaterial;", // 0 glass 1 metal
    "uniform vec3 uEdge[6];",
    "uniform vec3 uBand[6];",
    "uniform vec3 uCore[6];",
    "uniform vec3 uTint[6];",

    "float sdRoundBox(vec2 p, vec2 b, float r){",
    "  vec2 q = abs(p) - b + r;",
    "  return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r;",
    "}",

    "float smin(float a, float b, float k){",
    "  if(k<=0.0001) return min(a,b);",
    "  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);",
    "  return mix(b, a, h) - k*h*(1.0-h);",
    "}",

    "float smax(float a, float b, float k){",
    "  return -smin(-a, -b, k);",
    "}",

    // screen-space main
    "void main(){",
    "  vec2 frag = gl_FragCoord.xy;",
    "  vec2 uv = vec2(frag.x, uRes.y - frag.y);",
    "  vec3 bg = mix(vec3(0.0), vec3(0.957), uTheme);",
    "  vec3 col = bg;",

    "  float stride = uCard.y*2.0 + uGap;",
    "  float activeCY = uRes.y * 0.688;",
    "  float hx = uCard.x;",
    "  float hy = uCard.y;",

    "  for(int i=0;i<6;i++){",
    "    float fi = float(i);",
    "    if(fi > uScroll + 0.55) continue;",

    "    float cy = activeCY + (fi - uScroll) * stride;",
    "    vec2 p = uv - vec2(uRes.x*0.5, cy);",

    "    float prox = clamp(1.0 - abs(fi - uScroll), 0.0, 1.0);",
    "    float cardBottom = cy + hy;",
    "    float distToFloor = uRes.y - cardBottom;",
    "    float near = smoothstep(hy * 2.0, -hy * 0.4, distToFloor);",

    "    // Polynomial flare matched to reference trumpet + SDF smooth-union with floor",
    "    // Flare starts just above card mid; expand capped to ~ref trumpet",
    "    float y0 = cy - hy * 0.08;",
    "    float tDown = clamp((uv.y - y0) / max(uRes.y - y0, 1.0), 0.0, 1.0);",
    "    float flareT = smoothstep(0.0, 1.0, tDown);",
    "    float maxExp = hx * 0.92;",
    "    float expand = (1.2 * flareT - 0.4 * flareT * flareT) * maxExp * prox * near;",
    "    // Extend box toward floor so active card merges continuously",
    "    float hyExt = mix(hy, (uRes.y - cy) * 0.98, prox * near);",
    "    float dBox = sdRoundBox(p, vec2(hx + max(expand, 0.0), hyExt), uRad);",

    "    float k = mix(0.0, uRes.y * 0.28, prox * prox) * mix(0.2, 1.0, near);",
    "    float dFloor = uRes.y - uv.y;",
    "    float d = dBox;",
    "    if(k > 0.5) d = smin(dBox, dFloor, k);",

    "    if(d > 6.0) continue;",

    "    vec3 edgeCol = uEdge[i];",
    "    vec3 bandCol = uBand[i];",
    "    vec3 coreCol = uCore[i];",
    "    vec3 tint = uTint[i];",

    "    float aa = 1.15;",
    "    float cover = 1.0 - smoothstep(-aa, aa, d);",
    "    float border = smoothstep(1.15 + aa, 1.15 - aa, abs(d));",

    "    float sheen = 0.0;",
    "    if(uMaterial < 0.5){",
    "      float diag = (p.x * 0.3 + p.y * 0.55) / max(hx, 1.0);",
    "      sheen = smoothstep(-0.4, 0.5, diag) * smoothstep(1.3, 0.2, diag) * 0.09;",
    "    } else {",
    "      sheen = 0.03 + 0.03 * sin(p.y * 0.42);",
    "    }",

    "    vec3 baseFill;",
    "    if(uTheme < 0.5){",
    "      baseFill = (uMaterial < 0.5) ? (tint + vec3(0.012) + sheen) : (mix(vec3(0.05), tint*2.0, 0.55) + sheen);",
    "    } else {",
    "      baseFill = mix(vec3(0.94), tint*2.0 + vec3(0.85), 0.2) + sheen*0.4;",
    "    }",

    "    vec3 fill = baseFill;",
    "    if(prox > 0.02 && cover > 0.01){",
    "      float nx = clamp(p.x / (hx + expand * 0.35 + 0.001), -1.0, 1.0);",
    "      // Smile: low at center, high at sides — soft front",
    "      float arcY = mix(hy * 0.18, -hy * 0.52, pow(abs(nx), 1.65));",
    "      float below = uv.y - (cy + arcY);",
    "      float front = smoothstep(-10.0, 42.0, below);",

    "      vec2 origin = vec2(uRes.x * 0.5, uRes.y + hy * 0.2);",
    "      float rx = (uv.x - origin.x) / (hx * 2.55);",
    "      float ry = (uv.y - origin.y) / (hy * 3.4);",
    "      float cone = exp(-dot(vec2(rx,ry), vec2(rx,ry)) * 1.05);",

    "      float fromBottom = clamp((uRes.y - uv.y) / (uRes.y * 0.55), 0.0, 2.5);",
    "      // Peak white ~mid-lower, mint at very bottom (matches ref)",
    "      float corePeak = exp(-pow((fromBottom - 0.22) / 0.28, 2.0));",
    "      float coreAmt = corePeak * cone;",
    "      float midAmt = exp(-fromBottom * fromBottom * 1.85) * cone;",
    "      float bandLine = exp(-pow((below - 8.0) / 32.0, 2.0)) * cone;",

    "      float lit = clamp(midAmt * front * 1.25, 0.0, 1.0) * prox;",
    "      vec3 glow = mix(bandCol * 3.2, edgeCol * 3.4, 0.55);",
    "      glow = mix(glow, coreCol, clamp(coreAmt * 1.05, 0.0, 1.0));",
    "      // Saturated ribbon along smile",
    "      glow = mix(glow, edgeCol * 3.4 + bandCol * 0.5, clamp(bandLine * front * 1.55, 0.0, 1.0));",
    "      glow = mix(glow, mix(coreCol, edgeCol, 0.35), smoothstep(0.18, 0.0, fromBottom) * 0.6);",

    "      fill = mix(baseFill, glow, lit);",
    "      fill += coreCol * coreAmt * 0.28 * prox;",

    "      float corner = smoothstep(0.5, 1.4, abs(rx)) * (1.0 - smoothstep(0.0, 0.45, fromBottom));",
    "      fill = mix(fill, bg * 0.1 + bandCol * 0.08, corner * lit * 0.7);",
    "    }",

    "    // Chromatic fringe — only on flare lips",
    "    float flareZone = 0.0;",
    "    if(prox > 0.05){",
    "      flareZone = smoothstep(0.0, hy * 0.35, p.y) * prox;",
    "      flareZone *= smoothstep(hx * 0.85, hx * 1.05 + expand, abs(p.x));",
    "    }",
    "    float edgeProx = 1.0 - smoothstep(0.0, 3.2, abs(d));",
    "    float outerF = smoothstep(-0.2, 2.5, d) * edgeProx;",
    "    float innerF = smoothstep(1.8, -2.0, d) * edgeProx;",
    "    vec3 chroma = vec3(1.0, 0.32, 0.68) * outerF * flareZone * 1.15;",
    "    chroma += vec3(0.2, 0.95, 1.0) * innerF * flareZone * 1.05;",

    "    vec3 edgeMix = mix(edgeCol * 1.3, mix(edgeCol, vec3(0.4), 0.35), uTheme);",
    "    vec3 pix = mix(fill, edgeMix, border * 0.92);",
    "    pix += chroma;",

    "    col = mix(col, pix, max(cover, border));",
    "  }",

    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n");

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function initGL() {
    var gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return null;
    gl.getExtension("OES_standard_derivatives");
    var vs = compile(gl, gl.VERTEX_SHADER, VS);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "a");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return null;
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    var loc = {};
    [
      "uRes",
      "uScroll",
      "uCard",
      "uGap",
      "uRad",
      "uTheme",
      "uMaterial",
      "uEdge",
      "uBand",
      "uCore",
      "uTint",
    ].forEach(function (name) {
      loc[name] = gl.getUniformLocation(prog, name);
    });

    return { gl: gl, prog: prog, loc: loc };
  }

  var glState = initGL();

  function setColorArray(gl, loc, key) {
    // WebGL1: set each uEdge[i] individually
    for (var i = 0; i < N; i++) {
      var locI = gl.getUniformLocation(glState.prog, key + "[" + i + "]");
      var c = CARDS[i][key === "uEdge" ? "edge" : key === "uBand" ? "band" : key === "uCore" ? "core" : "tint"];
      gl.uniform3fv(locI, c);
    }
  }

  function resize() {
    computeLayout();
    var L = layout;
    canvas.width = Math.round(L.w * L.dpr);
    canvas.height = Math.round(L.h * L.dpr);
    canvas.style.width = L.w + "px";
    canvas.style.height = L.h + "px";
    if (glState) {
      glState.gl.viewport(0, 0, canvas.width, canvas.height);
    }
    updateDomCards();
  }

  function render() {
    if (!glState) return;
    var gl = glState.gl;
    var L = layout;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(glState.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.getParameter(gl.ARRAY_BUFFER_BINDING));
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Draw in CSS pixel space: pass resolution in CSS pixels, but frag coords are in device pixels.
    // Scale: gl_FragCoord is in device pixels, so uRes should be device size and we use that consistently.
    var w = canvas.width;
    var h = canvas.height;
    var scale = L.dpr;
    gl.uniform2f(glState.loc.uRes, w, h);
    gl.uniform1f(glState.loc.uScroll, scroll);
    gl.uniform2f(glState.loc.uCard, (L.cardW * 0.5) * scale, (L.cardH * 0.5) * scale);
    gl.uniform1f(glState.loc.uGap, L.gap * scale);
    gl.uniform1f(glState.loc.uRad, L.radius * scale);
    gl.uniform1f(glState.loc.uTheme, root.dataset.theme === "light" ? 1 : 0);
    gl.uniform1f(glState.loc.uMaterial, root.dataset.material === "metal" ? 1 : 0);
    setColorArray(gl, glState.loc, "uEdge");
    setColorArray(gl, glState.loc, "uBand");
    setColorArray(gl, glState.loc, "uCore");
    setColorArray(gl, glState.loc, "uTint");

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* -------------------- Animation / input -------------------- */
  function goTo(i) {
    target = Math.max(0, Math.min(N - 1, i));
    if (reduced) {
      scroll = target;
      vel = 0;
      syncChrome();
      updateDomCards();
    }
  }

  function onWheel(e) {
    e.preventDefault();
    var now = performance.now();
    if (now < wheelLock) return;
    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    if (e.deltaMode === 2) dy *= layout.h;
    if (Math.abs(dy) < 1) return;
    wheelLock = now + 420;
    goTo(target + (dy > 0 ? 1 : -1));
  }

  function onKey(e) {
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") {
      e.preventDefault();
      goTo(target + 1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") {
      e.preventDefault();
      goTo(target - 1);
    } else if (e.key === "Home") {
      goTo(0);
    } else if (e.key === "End") {
      goTo(N - 1);
    }
  }

  function onPointerDown(e) {
    if (e.target.closest && e.target.closest(".panel")) return;
    dragging = true;
    pointerId = e.pointerId;
    dragStartY = e.clientY;
    dragStartScroll = scroll;
    vel = 0;
    try {
      canvas.setPointerCapture(pointerId);
    } catch (err) {}
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    var dy = e.clientY - dragStartY;
    var stride = layout.cardH + layout.gap;
    scroll = dragStartScroll - dy / stride;
    scroll = Math.max(-0.12, Math.min(N - 1 + 0.12, scroll));
    updateDomCards();
  }

  function onPointerUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    var nearest = Math.round(scroll);
    goTo(nearest);
  }

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    if (!dragging && !reduced) {
      // Critically-ish damped spring, no overshoot: use exponential ease toward target
      var diff = target - scroll;
      // Smooth ease: critically damped approx
      var omega = 11.5;
      var accel = omega * omega * diff - 2 * omega * vel;
      vel += accel * dt;
      scroll += vel * dt;
      if (Math.abs(diff) < 0.0004 && Math.abs(vel) < 0.0004) {
        scroll = target;
        vel = 0;
      }
    } else if (reduced) {
      scroll = target;
      vel = 0;
    }

    syncChrome();
    updateDomCards();
    render();
    requestAnimationFrame(tick);
  }

  /* -------------------- Wire up -------------------- */
  buildDom();
  syncToggles();

  document.querySelectorAll("[data-theme]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      root.dataset.theme = btn.getAttribute("data-theme");
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", root.dataset.theme === "light" ? "#f4f4f5" : "#000000");
      syncToggles();
    });
  });
  document.querySelectorAll("[data-material]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      root.dataset.material = btn.getAttribute("data-material");
      syncToggles();
    });
  });

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKey);
  window.addEventListener("wheel", onWheel, { passive: false });

  var app = document.getElementById("app");
  app.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function (e) {
    reduced = e.matches;
    if (reduced) {
      scroll = target;
      vel = 0;
    }
  });

  resize();

  // Test / debug helpers
  window.__elastic = {
    goTo: goTo,
    get scroll() { return scroll; },
    get target() { return target; },
    setScroll: function (v) { scroll = v; target = Math.round(v); vel = 0; syncChrome(); updateDomCards(); },
    build: BUILD,
    hasGL: !!glState,
  };

  if (!glState) {
    fallback.hidden = false;
    canvas.style.display = "none";
  } else {
    // Expose build marker for publish verification
    document.documentElement.dataset.build = BUILD;
    requestAnimationFrame(tick);
  }
})();
