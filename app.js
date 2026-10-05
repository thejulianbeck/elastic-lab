(function () {
  "use strict";

  var BUILD = "elastic-lab-v2-smin-fillet-20261005y";

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

  function activeCardCenterY(h, cardH, gap, w) {
    // Phone: previous card top ~150px under the hint.
    // Desktop: match hi_a (previous slightly clipped, activeCY ≈ 0.688*H).
    var prevTop;
    if (w <= 480 || h / Math.max(w, 1) > 1.55) {
      prevTop = 150;
    } else {
      prevTop = -cardH * 0.08;
    }
    var activeTop = prevTop + cardH + gap;
    return activeTop + cardH * 0.5;
  }

  function cardCenterY(index, scrollPos) {
    var L = layout;
    var activeCenter = activeCardCenterY(L.h, L.cardH, L.gap, L.w);
    var stride = L.cardH + L.gap;
    return activeCenter + (index - scrollPos) * stride;
  }

  function updateDomCards() {
    var L = layout;
    var nodes = cardsDom.children;
    var activeApprox = Math.round(scroll);
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
      var isActive = dist < 0.55;
      var below = i > scroll + 0.55;
      var visible = !below && dist < 2.2;
      el.style.opacity = visible ? "1" : "0";
      el.style.visibility = visible ? "visible" : "hidden";
      el.classList.toggle("is-active", isActive);
      // Active: no box chrome — mask away bottom so DOM never shows bottom corners
      if (isActive) {
        el.style.webkitMaskImage =
          "linear-gradient(to bottom, #000 0%, #000 42%, rgba(0,0,0,0.55) 58%, transparent 78%)";
        el.style.maskImage =
          "linear-gradient(to bottom, #000 0%, #000 42%, rgba(0,0,0,0.55) 58%, transparent 78%)";
        el.style.borderRadius = L.radius + "px " + L.radius + "px 0 0";
      } else {
        el.style.webkitMaskImage = "";
        el.style.maskImage = "";
        el.style.borderRadius = L.radius + "px";
      }

      var veil = el.querySelector(".veil");
      var merge = Math.max(0, 1 - dist);
      veil.style.opacity = String(Math.pow(merge, 1.15) * 0.98);
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
    "uniform float uActiveCY;",
    "uniform vec3 uActEdge;",
    "uniform vec3 uActBand;",
    "uniform vec3 uActCore;",
    "uniform vec3 uActTint;",
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
    "  float activeCY = uActiveCY;",
    "  float hx = uCard.x;",
    "  float hy = uCard.y;",
    "  float H = uRes.y;",
    "  float W = uRes.x;",
    "  float cx = W * 0.5;",
    "  float cardW = hx * 2.0;",

    "  for(int i=0;i<6;i++){",
    "    float fi = float(i);",
    "    if(fi > uScroll + 0.55) continue;",

    "    float cy = activeCY + (fi - uScroll) * stride;",
    "    float prox = clamp(1.0 - abs(fi - uScroll), 0.0, 1.0);",
    "    vec2 p = uv - vec2(cx, cy);",

    "    // Resting: closed rounded card.",
    "    // Active: open-bottom column smin(floor) — continuous region, no bottom edge.",
    "    float dBox = sdRoundBox(p, vec2(hx, hy), uRad);",
    "    float d = dBox;",
    "    float k = 0.0;",
    "    float dFloor = H - uv.y;",
    "    if(prox > 0.001){",
    "      // Open-bottom column (no bottom face) ∪ floor via smin — concave fillet",
    "      float topY = cy - hy;",
    "      float tallHalf = max(H - topY, hy) * 0.5 + 8.0;",
    "      float tallMid = topY + tallHalf;",
    "      // Mild side growth so phone (wide card) still flares; desk matches hi_a",
    "      float tFlare = smoothstep(cy - hy * 0.05, H - 4.0, uv.y);",
    "      float hw = hx + pow(tFlare, 1.45) * (W * 0.068) * prox;",
    "      float dOpen = sdRoundBox(uv - vec2(cx, tallMid), vec2(hw, tallHalf), uRad);",
    "      float gapFloor = max(H - (cy + hy), 1.0);",
    "      // k ~0.4 cardW; enlarge if needed to bridge a tall phone gap",
    "      k = max(cardW * 0.38, gapFloor * 0.65) * prox;",
    "      d = smin(dOpen, dFloor, max(k, 1.0));",
    "      float below = smoothstep(cy - hy * 0.02, cy + hy * 0.16, uv.y);",
    "      d = mix(dBox, d, below);",
    "    }",
    "    float aa = 1.2;",
    "    float cover = 1.0 - smoothstep(-aa, aa, d);",
    "    if(cover < 0.002) continue;",

    "    // Scene tint: previous card takes ACTIVE color (hi_a: green Amethyst)",
    "    float tintAmt = (1.0 - prox) * 1.0;",
    "    vec3 edgeCol = mix(uEdge[i], uActEdge, max(tintAmt * 0.95, prox));",
    "    vec3 bandCol = mix(uBand[i], uActBand, max(tintAmt * 0.85, prox));",
    "    vec3 coreCol = mix(uCore[i], uActCore, max(tintAmt * 0.4, prox));",
    "    vec3 tint = mix(uTint[i], uActTint, tintAmt * 0.9 + prox * 0.2);",

    "    // Border: top + sides; NEVER the floor or original card bottom",
    "    float border = smoothstep(1.05 + aa, 1.05 - aa, abs(d));",
    "    float sideBias = smoothstep(hx * 0.55, hx * 0.98, abs(p.x));",
    "    float upperBand = 1.0 - smoothstep(cy + hy * 0.0, cy + hy * 0.4, uv.y);",
    "    float onFloor = 1.0 - smoothstep(2.0, 28.0, dFloor);",
    "    float borderMask = mix(1.0, max(upperBand, sideBias), prox);",
    "    borderMask *= 1.0 - onFloor * prox;",
    "    borderMask *= mix(1.0, sideBias, prox * smoothstep(cy + hy * 0.15, cy + hy * 0.7, uv.y));",
    "    border *= borderMask;",

    "    float sheen = 0.0;",
    "    if(uMaterial < 0.5){",
    "      float diag = (p.x * 0.28 + p.y * 0.55) / max(hx, 1.0);",
    "      sheen = smoothstep(-0.35, 0.55, diag) * smoothstep(1.25, 0.2, diag) * 0.1;",
    "      // Active-colored sheen bleed onto previous card",
    "      sheen += tintAmt * 0.04;",
    "    } else {",
    "      sheen = 0.03 + 0.03 * sin(p.y * 0.4);",
    "    }",

    "    vec3 glass;",
    "    if(uTheme < 0.5){",
    "      glass = (uMaterial < 0.5) ? (tint + vec3(0.01) + sheen) : (mix(vec3(0.05), tint * 2.2, 0.55) + sheen);",
    "    } else {",
    "      glass = mix(vec3(0.94), tint * 2.0 + vec3(0.85), 0.22) + sheen * 0.4;",
    "    }",

    "    // ---- Interior light (active) ----",
    "    vec3 fill = glass;",
    "    if(prox > 0.01){",
    "      float nx = clamp(p.x / max(hx, 1.0), -1.0, 1.0);",
    "      // Smile arc: thick SATURATED band (~50px desktop) then mint-white core",
    "      float arcY = mix(hy * 0.18, -hy * 0.38, pow(abs(nx), 1.45));",
    "      float belowArc = uv.y - (cy + arcY);",
    "      float bandH = max(hx * 0.22, 42.0);",
    "      float front = smoothstep(-bandH * 0.55, bandH * 0.95, belowArc);",
    "      float ribbon = exp(-pow(belowArc / (bandH * 0.95), 2.0));",
    "      // Soft light-cone through fog — dark lower corners",
    "      float ax = abs(uv.x - cx) / max(W * 0.5, 1.0);",
    "      float vT = clamp((uv.y - (cy - hy * 0.05)) / max(H - (cy - hy * 0.05), 1.0), 0.0, 1.0);",
    "      float coneW = mix(0.38, 0.92, pow(vT, 0.85));",
    "      float cone = exp(-pow(ax / max(coneW, 0.05), 2.0) * 1.35);",
    "      cone *= 1.0 - smoothstep(0.55, 1.08, ax) * smoothstep(0.35, 1.0, vT);",
    "      float fromBottom = clamp((H - uv.y) / max(H * 0.48, 1.0), 0.0, 2.0);",
    "      float coreAmt = exp(-pow((fromBottom - 0.08) / 0.22, 2.0)) * pow(cone, 1.15);",
    "      // ---- Color zones (eased multi-stop; geometry/weights unchanged) ----",
    "      // Zone4 deep edge, Zone2 band→vivid, Zone3 card-tinted near-white core",
    "      vec3 zDeep = uActEdge;",
    "      vec3 zBand0 = uActBand;",
    "      vec3 zVivid = clamp(mix(uActBand * 2.2, uActEdge * 3.4 + vec3(0.06), 0.72), 0.0, 1.0);",
    "      vec3 zCore = uActCore;",
    "      // Smooth 4-stop ease between A→B (stops at 0, .28, .62, 1)",
    "      float te = clamp(ribbon, 0.0, 1.0);",
    "      te = te * te * (3.0 - 2.0 * te);",
    "      vec3 sA = zBand0;",
    "      vec3 sB = mix(zBand0, zVivid, 0.28);",
    "      vec3 sC = mix(zBand0, zVivid, 0.62);",
    "      vec3 sD = zVivid;",
    "      vec3 satBand = (te < 0.33) ? mix(sA, sB, te / 0.33)",
    "                 : (te < 0.66) ? mix(sB, sC, (te - 0.33) / 0.33)",
    "                              : mix(sC, sD, (te - 0.66) / 0.34);",
    "      // Intensity-neutral: keep sat band luma near prior vivid band",
    "      float satL = max(dot(satBand, vec3(0.2126, 0.7152, 0.0722)), 0.001);",
    "      satBand *= clamp(0.42 / satL, 0.55, 1.35);",
    "      vec3 glow = glass;",
    "      // Zone1→2: dark glass above arc; thick saturated band at arc",
    "      glow = mix(glow, satBand, clamp(ribbon * (0.55 + 0.45 * front) * 2.2, 0.0, 1.0));",
    "      // Zone2→3→4 below arc: vivid mid → tinted core center; deep edge in outer cone",
    "      float tf = clamp(front * cone, 0.0, 1.0);",
    "      tf = tf * tf * (3.0 - 2.0 * tf);",
    "      vec3 f0 = zDeep;",
    "      vec3 f1 = mix(zDeep, zVivid, 0.34);",
    "      vec3 f2 = mix(zVivid, zCore, 0.40);",
    "      vec3 f3 = zCore;",
    "      vec3 flood = (tf < 0.33) ? mix(f0, f1, tf / 0.33)",
    "                 : (tf < 0.66) ? mix(f1, f2, (tf - 0.33) / 0.33)",
    "                              : mix(f2, f3, (tf - 0.66) / 0.34);",
    "      // Core wins at bottom center (card-tinted near-white, never pure #fff)",
    "      float tc = clamp(coreAmt * 1.25, 0.0, 1.0);",
    "      tc = tc * tc * (3.0 - 2.0 * tc);",
    "      vec3 c0 = flood;",
    "      vec3 c1 = mix(flood, zCore, 0.35);",
    "      vec3 c2 = mix(flood, zCore, 0.70);",
    "      flood = (tc < 0.33) ? mix(c0, c1, tc / 0.33)",
    "            : (tc < 0.66) ? mix(c1, c2, (tc - 0.33) / 0.33)",
    "                         : mix(c2, zCore, (tc - 0.66) / 0.34);",
    "      // Outer cone keeps deep card color (then haze → black)",
    "      float to = clamp(1.0 - cone, 0.0, 1.0);",
    "      to = to * to * (3.0 - 2.0 * to);",
    "      flood = mix(flood, mix(flood, zDeep, 0.85), to * smoothstep(cy + hy * 0.2, H, uv.y));",
    "      float floodL = max(dot(flood, vec3(0.2126, 0.7152, 0.0722)), 0.001);",
    "      flood *= clamp(0.55 / floodL, 0.5, 1.45);",
    "      glow = mix(glow, flood, clamp(front * 0.98, 0.0, 1.0));",
    "      fill = mix(glass, glow, prox);",
    "      // Haze: deep edge then black toward lower corners (same softness)",
    "      float haze = mix(1.0, max(cone, 0.55), smoothstep(cy + hy * 0.35, H, uv.y));",
    "      vec3 cornerFade = mix(bg, zDeep * 0.55, 0.45 * (1.0 - cone));",
    "      fill = mix(cornerFade, fill, mix(1.0, haze, 0.75 * prox));",
    "    }",
    "    // Chromatic fringe ONLY on the curved fillet (where smin bends the side)",
    "    float fillet = 0.0;",
    "    if(prox > 0.05){",
    "      fillet = clamp((dBox - d) / max(cardW * 0.12, 1.0), 0.0, 1.0);",
    "      fillet *= smoothstep(cy + hy * 0.0, cy + hy * 0.7, uv.y);",
    "      fillet *= 1.0 - smoothstep(H - 80.0, H - 10.0, uv.y);",
    "      fillet *= smoothstep(hx * 0.6, hx * 1.05, abs(p.x));",
    "    }",
    "    float fw = 3.2;",
    "    float outerF = exp(-pow((d - 1.0) / fw, 2.0)) * step(-0.2, d);",
    "    float innerF = exp(-pow((d + 1.2) / fw, 2.0)) * (1.0 - step(0.4, d));",
    "    vec3 chroma = vec3(1.0, 0.3, 0.62) * outerF * fillet * 1.4;",
    "    chroma += vec3(0.1, 0.95, 1.0) * innerF * fillet * 1.3;",

    "    vec3 edgeMix = mix(edgeCol * 1.35, mix(edgeCol, vec3(0.4), 0.3), uTheme);",
    "    vec3 pix = mix(fill, edgeMix, border * 0.9);",
    "    pix += chroma;",

    "    // Soft outer alpha on flood region (hazy edge, not hard trapezoid)",
    "    float a = cover;",
    "    if(prox > 0.01){",
    "      float ax2 = abs(uv.x - cx) / max(W * 0.5, 1.0);",
    "      float softA = 1.0 - smoothstep(0.88, 1.15, ax2) * smoothstep(cy + hy * 0.5, H, uv.y);",
    "      a *= mix(1.0, softA, 0.35);",
    "    }",
    "    col = mix(col, pix, clamp(max(a, border * 0.95), 0.0, 1.0));",
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
      "uActiveCY",
      "uActEdge",
      "uActBand",
      "uActCore",
      "uActTint",
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
    var activeCY = activeCardCenterY(L.h, L.cardH, L.gap, L.w) * scale;
    gl.uniform1f(glState.loc.uActiveCY, activeCY);
    // Scene tint from (interpolated) active card
    var ai = Math.max(0, Math.min(N - 1, Math.round(scroll)));
    var aCard = CARDS[ai];
    // Soft crossfade while scrolling
    var af = scroll;
    var i0 = Math.max(0, Math.min(N - 1, Math.floor(af)));
    var i1 = Math.max(0, Math.min(N - 1, Math.ceil(af)));
    var ft = af - Math.floor(af);
    function mix3(a, b, t) {
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
    var c0 = CARDS[i0], c1 = CARDS[i1];
    gl.uniform3fv(glState.loc.uActEdge, mix3(c0.edge, c1.edge, ft));
    gl.uniform3fv(glState.loc.uActBand, mix3(c0.band, c1.band, ft));
    gl.uniform3fv(glState.loc.uActCore, mix3(c0.core, c1.core, ft));
    gl.uniform3fv(glState.loc.uActTint, mix3(c0.tint, c1.tint, ft));
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
