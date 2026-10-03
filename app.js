(function () {
  "use strict";

  var SPRING_K = 210;
  var SPRING_C = 14.6;
  var PIXELS = 112;
  var root = document.documentElement;
  var stack = document.getElementById("stack");
  var mount = document.getElementById("beam-mount");
  var canvas = document.getElementById("beam");
  var cssBeam = document.getElementById("beam-css");
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");
  var live = document.getElementById("live");
  var cards = Array.prototype.slice.call(stack.querySelectorAll(".card"));
  var count = cards.length;

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = motionQuery.matches;

  var position = 0;
  var velocity = 0;
  var target = 0;
  var dragging = false;
  var pointerId = null;
  var dragY = 0;
  var dragT = 0;
  var displayVel = 0;
  var announced = -1;
  var wheelAcc = 0;
  var wheelStamp = 0;
  var last = 0;
  var running = true;
  var beamTime = 0;

  var glState = initGL(canvas);
  root.dataset.beam = glState ? "gl" : "css";

  cards.forEach(function (card, index) {
    card.dataset.index = String(index);
    card.setAttribute("aria-hidden", index === 0 ? "false" : "true");
  });

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function cardCopy(card) {
    return (
      card.querySelector(".kicker").textContent +
      ". " +
      card.querySelector("h2").textContent +
      ". " +
      card.querySelector(".body").textContent
    );
  }

  function beamColor(index) {
    return cards[index].getAttribute("data-beam").split(",").map(Number);
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f6f1e8" : "#0c0e13");
    syncToggles();
  }

  function setMaterial(material) {
    root.dataset.material = material;
    syncToggles();
  }

  function syncToggles() {
    var theme = root.dataset.theme;
    var material = root.dataset.material;
    Array.prototype.forEach.call(document.querySelectorAll("[data-set-theme]"), function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-set-theme") === theme ? "true" : "false");
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-set-material]"), function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-set-material") === material ? "true" : "false");
    });
  }

  function activeIndex() {
    if (dragging) return clamp(Math.round(position), 0, count - 1);
    return target;
  }

  function layout(overshoot) {
    var active = activeIndex();
    for (var i = 0; i < count; i++) {
      var rel = i - position;
      var influence = Math.exp(-rel * rel * 4.8);
      var baseY;
      if (rel >= 0) baseY = -54 * (1 - Math.exp(-rel * 1.15));
      else baseY = rel * rel * 180;
      var y = baseY + influence * overshoot * 150;
      var scale = 1 - Math.min(Math.max(rel, 0), 3) * 0.046;
      if (rel < 0) scale = Math.max(0.86, 1 + rel * 0.1);
      if (overshoot > 0) scale *= 1 + influence * overshoot * 0.34;
      var opacity = 1;
      if (rel < 0) opacity = Math.max(0, 1 + rel * 1.35);
      if (rel > 3.1) opacity = Math.max(0, 1 - (rel - 3.1));
      var z = rel < 0 ? 20 : 80 - rel * 8;
      if (i === active) z = 140;
      var card = cards[i];
      card.style.transform =
        "translate(-50%, -50%) translateY(" + y.toFixed(2) + "px) scale(" + scale.toFixed(4) + ")";
      card.style.opacity = String(opacity);
      card.style.zIndex = String(Math.round(z));
      var title = card.querySelector("h2");
      var body = card.querySelector(".body");
      var kicker = card.querySelector(".kicker");
      var on = i === active;
      title.style.opacity = on ? "1" : "0";
      body.style.opacity = on ? "1" : "0";
      kicker.style.opacity = on ? "1" : (rel > 0.18 && rel < 1.4 ? "0.9" : "0");
      card.toggleAttribute("data-active", on);
      card.setAttribute("aria-hidden", on ? "false" : "true");
    }
    placeBeam(cards[active]);
    paintBeam(beamColor(active));
    root.style.setProperty("--glow", cards[active].getAttribute("data-glow"));
    root.style.setProperty("--glow-edge", cards[active].style.getPropertyValue("--beam-css").trim() || cards[active].getAttribute("data-glow"));
    prevBtn.disabled = active <= 0;
    nextBtn.disabled = active >= count - 1;
    if (announced !== active) {
      announced = active;
      live.textContent = cardCopy(cards[active]);
    }
  }

  function placeBeam(card) {
    var stackRect = stack.getBoundingClientRect();
    var rect = card.getBoundingClientRect();
    var width = Math.max(80, rect.width * 0.84);
    var height = Math.max(150, rect.height * 0.92);
    mount.hidden = false;
    mount.style.width = width.toFixed(1) + "px";
    mount.style.height = height.toFixed(1) + "px";
    mount.style.left = (rect.left - stackRect.left + (rect.width - width) / 2).toFixed(1) + "px";
    mount.style.top = (rect.bottom - stackRect.top - 10).toFixed(1) + "px";
  }

  function paintBeam(color) {
    var stretch = reduced ? 1 : 1 + Math.min(Math.abs(displayVel), 6) * 0.09;
    var skew = reduced ? 0 : clamp(displayVel, -6, 6) * 1.1;
    cssBeam.style.setProperty("--beam-css", "rgb(" + color.map(function (c) { return Math.round(c * 255); }).join(",") + ")");
    cssBeam.style.setProperty("--beam-hot", root.dataset.theme === "light" ? cssBeam.style.getPropertyValue("--beam-css") : "rgba(255,255,255,0.86)");
    cssBeam.style.transform = reduced ? "none" : "scaleY(" + stretch.toFixed(3) + ") skewX(" + skew.toFixed(2) + "deg)";
    if (!glState) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = mount.clientWidth || 1;
    var cssH = mount.clientHeight || 1;
    var bw = Math.max(1, Math.round(cssW * dpr));
    var bh = Math.max(1, Math.round(cssH * dpr));
    drawGL(glState, bw, bh, color, reduced ? 0 : displayVel, reduced ? 0 : beamTime, reduced, root.dataset.theme === "dark");
  }

  function stepBy(dir) {
    if (dragging) endDrag(true);
    var next = clamp(target + dir, 0, count - 1);
    if (next === target) {
      if (reduced) return;
      if ((target === 0 && dir < 0) || (target === count - 1 && dir > 0)) {
        velocity += dir * 2.4;
        position += dir * 0.02;
      }
      return;
    }
    target = next;
    if (reduced) {
      position = target;
      velocity = 0;
    } else {
      velocity = clamp(velocity + dir * 1.55, -3.2, 3.2);
    }
  }

  function endDrag(cancel) {
    dragging = false;
    if (pointerId !== null && stack.hasPointerCapture && stack.hasPointerCapture(pointerId)) {
      try { stack.releasePointerCapture(pointerId); } catch (err) { /* already released */ }
    }
    pointerId = null;
    if (cancel) return;
    if (reduced) {
      target = clamp(Math.round(position), 0, count - 1);
      position = target;
      velocity = 0;
      return;
    }
    var dest = Math.round(position);
    if (velocity > 1.25) dest = Math.ceil(position - 1e-4);
    else if (velocity < -1.25) dest = Math.floor(position + 1e-4);
    target = clamp(dest, 0, count - 1);
    velocity = clamp(velocity, -2.7, 2.7);
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    dragY = event.clientY;
    dragT = performance.now();
    velocity = 0;
    try { stack.setPointerCapture(event.pointerId); } catch (err) { /* pointer already gone */ }
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== pointerId) return;
    var now = performance.now();
    var dt = Math.max(0.008, (now - dragT) / 1000);
    var dy = event.clientY - dragY;
    var delta = -dy / PIXELS;
    var max = count - 1;
    if ((position <= 0 && delta < 0) || (position >= max && delta > 0)) delta *= 0.28;
    position = clamp(position + delta, -0.28, max + 0.28);
    velocity = delta / dt;
    dragY = event.clientY;
    dragT = now;
  }

  function onPointerUp(event) {
    if (!dragging || event.pointerId !== pointerId) return;
    endDrag(false);
  }

  function onWheel(event) {
    if (event.ctrlKey) return;
    var bounds = stack.getBoundingClientRect();
    var inside = event.clientX >= bounds.left - 24 && event.clientX <= bounds.right + 24 &&
      event.clientY >= bounds.top - 40 && event.clientY <= bounds.bottom + 80;
    var stage = document.querySelector(".stage").getBoundingClientRect();
    var inColumn = event.clientX >= stage.left && event.clientX <= stage.right;
    if (!inside && !inColumn) return;
    event.preventDefault();
    var now = performance.now();
    if (now - wheelStamp < 520) {
      wheelStamp = now;
      return;
    }
    var scale = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? 400 : 1;
    wheelAcc += event.deltaY * scale;
    if (Math.abs(wheelAcc) < 24) return;
    var dir = Math.sign(wheelAcc);
    wheelAcc = 0;
    wheelStamp = now;
    stepBy(dir);
  }

  function onKey(event) {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      stepBy(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      stepBy(-1);
    }
  }

  function integrate(dt) {
    if (reduced) {
      if (!dragging) {
        position = target;
        velocity = 0;
      }
      displayVel = 0;
      return;
    }
    if (!dragging) {
      var steps = 2;
      var h = dt / steps;
      for (var s = 0; s < steps; s++) {
        var acc = -SPRING_K * (position - target) - SPRING_C * velocity;
        velocity += acc * h;
        position += velocity * h;
      }
      if (Math.abs(position - target) < 0.0007 && Math.abs(velocity) < 0.02) {
        position = target;
        velocity = 0;
      }
    }
    displayVel += (velocity - displayVel) * Math.min(1, dt * 16);
    if (!reduced) beamTime += dt;
  }

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min(0.032, (now - last) / 1000) : 0.016;
    last = now;
    integrate(dt);
    var overshoot = dragging || reduced ? 0 : position - target;
    layout(overshoot);
    requestAnimationFrame(frame);
  }

  stack.addEventListener("pointerdown", onPointerDown);
  stack.addEventListener("pointermove", onPointerMove);
  stack.addEventListener("pointerup", onPointerUp);
  stack.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  prevBtn.addEventListener("click", function () { stepBy(-1); });
  nextBtn.addEventListener("click", function () { stepBy(1); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-set-theme]"), function (btn) {
    btn.addEventListener("click", function () { setTheme(btn.getAttribute("data-set-theme")); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-set-material]"), function (btn) {
    btn.addEventListener("click", function () { setMaterial(btn.getAttribute("data-set-material")); });
  });
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener("change", function () {
      reduced = motionQuery.matches;
      if (reduced) {
        position = target;
        velocity = 0;
        displayVel = 0;
      }
    });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });

  syncToggles();
  stack.classList.add("is-ready");
  last = performance.now();
  requestAnimationFrame(frame);

  function initGL(surface) {
    var gl = surface.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: "low-power"
    });
    if (!gl) return null;
    var vsSource = "attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }";
    var fsSource = [
      "precision mediump float;",
      "uniform vec2 uRes;",
      "uniform float uTime;",
      "uniform float uVel;",
      "uniform vec3 uColor;",
      "uniform float uReduced;",
      "uniform float uDark;",
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / uRes;",
      "  float fromEdge = 1.0 - uv.y;",
      "  float speed = min(abs(uVel), 6.0);",
      "  float amp = uReduced > 0.5 ? 0.0 : min(speed * 0.02, 0.15);",
      "  float phase = uTime * 5.2;",
      "  float wave = sin(fromEdge * 9.0 + phase) * amp * fromEdge;",
      "  wave += sin(fromEdge * 16.0 - phase * 1.35) * amp * 0.45 * fromEdge;",
      "  float shear = uReduced > 0.5 ? 0.0 : clamp(uVel, -6.0, 6.0) * 0.014 * fromEdge;",
      "  float x = uv.x - 0.5 - wave - shear;",
      "  float stretch = uReduced > 0.5 ? 0.9 : 0.86 + speed * 0.13;",
      "  float along = fromEdge / stretch;",
      "  float fade = exp(-along * along * 1.65);",
      "  fade *= smoothstep(1.28, 0.12, along);",
      "  float width = mix(0.2, 0.028, clamp(along, 0.0, 1.0));",
      "  float d = abs(x);",
      "  float glow = exp(-(d * d) / (width * width));",
      "  float core = exp(-(d * d) / (width * width * 0.16));",
      "  float bloom = exp(-(d * d) / (width * width * 4.6));",
      "  float lip = smoothstep(0.1, 0.0, fromEdge) * exp(-(d * d) / 0.012);",
      "  float alpha = (glow * 0.58 + core * 0.9 + bloom * 0.2 + lip * 0.45) * fade;",
      "  vec3 lit = mix(uColor, vec3(1.0), core * 0.5);",
      "  vec3 ink = uColor * (0.82 + core * 0.18);",
      "  vec3 col = uDark > 0.5 ? lit : ink;",
      "  float gain = uDark > 0.5 ? 1.0 : 1.12;",
      "  alpha *= gain;",
      "  if (alpha < 0.004) discard;",
      "  gl_FragColor = vec4(col, alpha);",
      "}"
    ].join("\n");

    function compile(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    var vs = compile(gl.VERTEX_SHADER, vsSource);
    var fs = compile(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return null;
    }
    gl.useProgram(program);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return {
      gl: gl,
      program: program,
      buffer: buffer,
      uRes: gl.getUniformLocation(program, "uRes"),
      uTime: gl.getUniformLocation(program, "uTime"),
      uVel: gl.getUniformLocation(program, "uVel"),
      uColor: gl.getUniformLocation(program, "uColor"),
      uReduced: gl.getUniformLocation(program, "uReduced"),
      uDark: gl.getUniformLocation(program, "uDark")
    };
  }

  function drawGL(state, w, h, color, vel, time, isReduced, isDark) {
    var gl = state.gl;
    if (gl.canvas.width !== w || gl.canvas.height !== h) {
      gl.canvas.width = w;
      gl.canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.useProgram(state.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(state.uRes, w, h);
    gl.uniform1f(state.uTime, time);
    gl.uniform1f(state.uVel, vel);
    gl.uniform3f(state.uColor, color[0], color[1], color[2]);
    gl.uniform1f(state.uReduced, isReduced ? 1 : 0);
    gl.uniform1f(state.uDark, isDark ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
})();
