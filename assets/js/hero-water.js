// Hero de Río: el logo sale como un sol sobre el río y el agua lo refleja.
// WebGL2 puro: simulación de ondas en GPU (ping-pong en texturas half-float) + composición
// con reflejo, camino de brillos del sol y ondas que siguen al cursor o al dedo.

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

// Ecuación de onda (esquema de Evan Wallace): r = altura, g = velocidad.
const SIM = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec4 uDrops[6];   // xy = uv, z = fuerza, w = radio en texels
uniform vec2 uSize;
void main() {
  vec4 s = texture(uPrev, vUv);
  float h = s.r, v = s.g;
  float avg = (texture(uPrev, vUv + vec2(uTexel.x, 0.0)).r + texture(uPrev, vUv - vec2(uTexel.x, 0.0)).r +
               texture(uPrev, vUv + vec2(0.0, uTexel.y)).r + texture(uPrev, vUv - vec2(0.0, uTexel.y)).r) * 0.25;
  v += (avg - h) * 2.0;
  v *= 0.986;
  h += v;
  h *= 0.997;
  for (int i = 0; i < 6; i++) {
    vec4 d = uDrops[i];
    if (d.z != 0.0) {
      float r = length((vUv - d.xy) * uSize);
      float k = max(0.0, 1.0 - r / d.w);
      h += d.z * (0.5 - 0.5 * cos(k * 3.14159265));
    }
  }
  o = vec4(h, v, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uImg;
uniform sampler2D uLogo;
uniform sampler2D uSim;
uniform vec2 uRes;
uniform vec2 uImgSize;
uniform float uImgHz;
uniform float uFocusX;
uniform float uHz;
uniform vec2 uSun;
uniform float uSunR;
uniform float uTime;
uniform float uReveal;
uniform float uRise;
uniform float uNeon;
uniform float uFade;
uniform float uHasSim;
uniform float uK;
uniform vec2 uPar;
uniform vec3 uBg;

const float LOGO_K = 1.707;   // media textura del logo (1024 px), medida en radios del logo (300 px)

float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// La foto, encajada para que su línea de costa caiga justo en el horizonte de la pantalla.
vec3 photo(vec2 px) {
  float hzY = uHz * uRes.y;
  float above = max(uRes.y - hzY, 1.0);
  float fx = clamp(uFocusX, 0.2, 0.8);
  float s = max(uRes.x / (2.0 * min(fx, 1.0 - fx) * uImgSize.x), above / (uImgHz * uImgSize.y)) * 1.05;
  float ix = fx * uImgSize.x + (px.x - uRes.x * 0.5 + uPar.x) / s;
  float iy = uImgHz * uImgSize.y - (px.y - hzY + uPar.y) / s;
  return texture(uImg, clamp(vec2(ix, iy) / uImgSize, vec2(0.001), vec2(0.999))).rgb;
}

// Cielo del amanecer + el neón de Río flotando sobre el agua. lightK sube un poco el brillo en el reflejo.
vec3 sky(vec2 px, float lightK) {
  vec3 c = photo(px) * mix(vec3(0.30, 0.36, 0.48), vec3(0.9, 0.88, 0.92), uRise);
  vec2 d = (px - uSun) / uSunR;
  float r = length(d);
  // contraluz cálido detrás del cartel
  c += vec3(1.0, 0.62, 0.36) * exp(-r * r * 0.12) * 0.3 * uRise * lightK;
  vec2 luv = vec2(0.5 + d.x / (2.0 * LOGO_K), 0.5 - d.y / (2.0 * LOGO_K));
  if (luv.x > 0.0 && luv.x < 1.0 && luv.y > 0.0 && luv.y < 1.0) {
    float core = texture(uLogo, luv).a;
    float g1 = textureLod(uLogo, luv, 3.0).a;
    float g2 = textureLod(uLogo, luv, 5.0).a;
    float n = uNeon;
    c *= 1.0 - 0.5 * clamp(g2 * 2.4, 0.0, 1.0) * n;            // el aire alrededor se oscurece: más contraste
    c += vec3(1.0, 0.40, 0.58) * g2 * 1.15 * n * lightK;        // halo ancho, rosa flamenco
    c += vec3(1.0, 0.72, 0.80) * g1 * 0.95 * n * lightK;        // halo cercano
    c = mix(c, vec3(1.0, 0.97, 0.93), clamp(core * (0.22 + 0.85 * n), 0.0, 1.0)); // el tubo
  }
  return c;
}

float waveH(vec2 g, float t) {
  return sin(g.x * 1.7 + g.y * 0.9 + t * 0.8) * 0.45
       + sin(g.x * -2.3 + g.y * 1.6 - t * 1.05) * 0.3
       + sin(g.x * 4.1 - g.y * 2.7 + t * 1.6) * 0.12
       + (vnoise(g * vec2(2.2, 3.4) + vec2(t * 0.35, -t * 0.2)) - 0.5) * 0.9;
}

vec3 water(vec2 px) {
  float hzY = uHz * uRes.y;
  float depth = clamp((hzY - px.y) / max(hzY, 1.0), 0.0, 1.0);
  float z = 1.0 / (depth + 0.04);
  vec2 g = vec2((px.x - uRes.x * 0.5) / uRes.y * z * 1.4, z * 1.4);
  float t = uTime;
  float e = 0.03;
  float h0 = waveH(g, t);
  vec2 n = vec2(h0 - waveH(g + vec2(e, 0.0), t), h0 - waveH(g + vec2(0.0, e), t)) / e;

  vec2 sn = vec2(0.0);
  if (uHasSim > 0.5) {
    float wv = 1.0 - log(1.0 + uK * depth) / log(1.0 + uK);
    vec2 suv = vec2(px.x / uRes.x, wv);
    vec2 st = 1.0 / vec2(textureSize(uSim, 0));
    float a = texture(uSim, suv - vec2(st.x, 0.0)).r;
    float b = texture(uSim, suv + vec2(st.x, 0.0)).r;
    float c2 = texture(uSim, suv - vec2(0.0, st.y)).r;
    float d2 = texture(uSim, suv + vec2(0.0, st.y)).r;
    sn = vec2(a - b, d2 - c2);
  }

  float amp = mix(0.0025, 0.028, depth) * uRes.y;
  vec2 off = n * amp * 0.35 + sn * uRes.y * 1.1;
  vec2 m = vec2(px.x, hzY + (hzY - px.y) * 1.08) + off;
  m.y = max(m.y, hzY + 0.5);
  vec3 refl = sky(m, 1.2);

  vec3 deep = vec3(0.010, 0.048, 0.040);
  float fres = mix(0.95, 0.36, pow(depth, 0.7));
  vec3 c = mix(deep, refl * vec3(0.70, 0.83, 0.81), fres);

  // camino de brillos bajo el sol
  float spread = uSunR * (0.75 + depth * 2.6);
  float dx = (px.x - uSun.x - off.x * 0.5) / spread;
  float above = smoothstep(-1.2, 0.6, (uSun.y - hzY) / uSunR);
  float path = exp(-dx * dx * 1.6) * above;
  float sp = vnoise(g * vec2(7.0, 16.0) + vec2(t * 0.9, -t * 0.5)) * vnoise(g * vec2(19.0, 33.0) - vec2(t * 1.3, t * 0.2));
  float glint = smoothstep(0.30, 0.62, sp) * path;
  c += vec3(1.0, 0.80, 0.82) * glint * (0.5 + depth) * (0.12 + 0.88 * uNeon) * 1.6;

  // crestas donde se tocó el agua
  c += vec3(1.0, 0.86, 0.7) * smoothstep(0.003, 0.03, length(sn)) * 0.16;
  // bruma en la línea de costa
  c = mix(c, refl * 0.9, (1.0 - smoothstep(0.0, 0.035, depth)) * 0.45);
  return c;
}

void main() {
  vec2 px = vUv * uRes;
  float hzY = uHz * uRes.y;
  vec3 col = px.y >= hzY ? sky(px, 1.0) : water(px);

  // intro: la escena se abre desde la línea del horizonte
  float distN = abs(px.y - hzY) / uRes.y;
  float open = uReveal * 1.1;
  col = mix(uBg, col, 1.0 - smoothstep(open - 0.12, open, distN));

  // la línea del loader, que se apaga cuando amanece
  float line = exp(-abs(px.y - hzY) * 0.8) * (1.0 - smoothstep(0.25, 0.9, uRise));
  col += vec3(1.0, 0.82, 0.6) * line * (1.0 - smoothstep(0.0, 0.62, abs(vUv.x - 0.5)) * 0.7);

  vec2 q = vUv - 0.5;
  col *= 1.0 - dot(q * vec2(0.9, 1.25), q) * 0.75;
  col += (hash12(px + fract(uTime * 7.0) * 311.0) - 0.5) * 0.03;
  col = mix(col, uBg, uFade);
  outColor = vec4(col, 1.0);
}`;

const IMG_HZ = 0.565;   // dónde está la línea de la gente en la foto (0 = arriba)
const FOCUS_X = 0.5;
const K = 4.0;          // compresión de perspectiva del espacio de agua

function hexToRGB(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function initHero({ canvas, hero, reduce }) {
  const api = { ok: false, ready: Promise.resolve(), intro() {}, setScroll() {}, render() {} };
  if (new URLSearchParams(location.search).get('gl') === '0') return api;

  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  if (!gl) return api;

  // ---------- programas ----------
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(fsrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsrc));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name.replace('[0]', '')] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  let main, sim;
  try {
    main = program(FRAG);
    sim = program(SIM);
  } catch (err) {
    console.warn('[Río] WebGL no disponible, uso la imagen fija.', err);
    return api;
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // ---------- texturas de simulación (half-float) ----------
  const canFloat = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  let simW = 0, simH = 0, simTex = [], simFbo = [], simIdx = 0, hasSim = false;

  function makeSim(w, h) {
    simTex.forEach((t) => gl.deleteTexture(t));
    simFbo.forEach((f) => gl.deleteFramebuffer(f));
    simTex = []; simFbo = []; hasSim = false;
    if (!canFloat) return;
    for (let i = 0; i < 2; i++) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      simTex.push(tex); simFbo.push(fbo);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    simW = w; simH = h; hasSim = true;
  }

  function imageTexture(img, mips) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  // ---------- estado ----------
  const S = { reveal: reduce ? 1 : 0, rise: reduce ? 1 : 0, neon: reduce ? 1 : 0, scroll: 0, time: 0 };
  const bg = hexToRGB(getComputedStyle(document.documentElement).getPropertyValue('--noche').trim() || '#06110e');
  let W = 0, H = 0, dpr = 1, baseHz = 0.42, imgTex = null, logoTex = null, imgSize = [1, 1];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -1, py: -1, lx: -1, ly: -1, inside: false };
  const drops = [];
  let running = false, visible = true, raf = 0, last = performance.now(), nextAmbient = 0;
  // calidad adaptativa: si la máquina no llega a ~45 fps, se baja la resolución del agua (hasta 2 veces)
  let quality = 1, perfSum = 0, perfN = 0, downgrades = 0;

  function readHz() {
    const v = parseFloat(getComputedStyle(hero).getPropertyValue('--hz'));
    baseHz = 1 - (isFinite(v) ? v : 58) / 100;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.6) * quality;
    const maxPx = 2.6e6;
    if (r.width * r.height * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (r.width * r.height));
    const nw = Math.round(r.width * dpr), nh = Math.round(r.height * dpr);
    readHz();
    if (nw === W && nh === H) return;
    const widthChanged = Math.abs(nw - W) > 2;
    W = canvas.width = nw; H = canvas.height = nh;
    if (widthChanged || !hasSim) {
      const sw = r.width < 700 ? 168 : 256;
      const ratio = ((1 + K) * Math.log(1 + K)) / K;
      const sh = Math.max(64, Math.min(256, Math.round(ratio * baseHz * H * sw / W)));
      makeSim(sw, sh);
    }
    if (!running) draw(0);
  }

  // posición de un punto de pantalla (px css) en el espacio del agua; null si está en el cielo
  function toWater(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const x = (cx - r.left) / r.width;
    const yUp = 1 - (cy - r.top) / r.height;
    const hz = currentHz();
    if (yUp >= hz) return null;
    const depth = Math.min(1, (hz - yUp) / hz);
    const v = 1 - Math.log(1 + K * depth) / Math.log(1 + K);
    return [x, v];
  }

  function currentHz() { return baseHz + S.scroll * (1 - baseHz + 0.18); }

  function addDrop(uv, strength, radius) {
    if (!uv) return;
    drops.push([uv[0], uv[1], strength, radius]);
    if (drops.length > 6) drops.shift();
  }

  // ---------- render ----------
  function step(dt) {
    if (!hasSim) return;
    const flat = new Float32Array(24);
    for (let i = 0; i < 6; i++) {
      const d = drops[i];
      if (d) flat.set(d, i * 4);
    }
    drops.length = 0;
    gl.useProgram(sim.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, simFbo[1 - simIdx]);
    gl.viewport(0, 0, simW, simH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, simTex[simIdx]);
    gl.uniform1i(sim.u.uPrev, 0);
    gl.uniform2f(sim.u.uTexel, 1 / simW, 1 / simH);
    gl.uniform2f(sim.u.uSize, simW, simH);
    gl.uniform4fv(sim.u.uDrops, flat);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    simIdx = 1 - simIdx;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function draw(dt) {
    if (!imgTex || !logoTex) {
      gl.viewport(0, 0, W, H);
      gl.clearColor(bg[0], bg[1], bg[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    const hz = currentHz();
    const hzY = hz * H;
    const R = Math.min(0.125 * H, 0.2 * W);
    // el cartel flota sobre el agua; al principio sube despacio desde el horizonte
    const sunY = hzY + R * (1.25 + 0.6 * S.rise) + Math.sin(S.time * 0.7) * R * 0.03;
    const fade = Math.min(1, Math.max(0, (S.scroll - 0.5) / 0.45));

    gl.useProgram(main.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, imgTex); gl.uniform1i(main.u.uImg, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, logoTex); gl.uniform1i(main.u.uLogo, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, hasSim ? simTex[simIdx] : logoTex); gl.uniform1i(main.u.uSim, 2);
    gl.uniform2f(main.u.uRes, W, H);
    gl.uniform2f(main.u.uImgSize, imgSize[0], imgSize[1]);
    gl.uniform1f(main.u.uImgHz, IMG_HZ);
    gl.uniform1f(main.u.uFocusX, FOCUS_X);
    gl.uniform1f(main.u.uHz, hz);
    gl.uniform2f(main.u.uSun, W * 0.5 + mouse.x * 6 * dpr, sunY - mouse.y * 4 * dpr);
    gl.uniform1f(main.u.uSunR, R);
    gl.uniform1f(main.u.uTime, S.time);
    gl.uniform1f(main.u.uReveal, S.reveal);
    gl.uniform1f(main.u.uRise, S.rise);
    gl.uniform1f(main.u.uNeon, S.neon);
    gl.uniform1f(main.u.uFade, fade);
    gl.uniform1f(main.u.uHasSim, hasSim ? 1 : 0);
    gl.uniform1f(main.u.uK, K);
    gl.uniform2f(main.u.uPar, mouse.x * 14 * dpr, -mouse.y * 8 * dpr);
    gl.uniform3f(main.u.uBg, bg[0], bg[1], bg[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    const raw = (now - last) / 1000;
    const dt = Math.min(0.05, raw);
    last = now;
    S.time += dt;
    if (S.rise > 0.9 && downgrades < 2 && raw < 0.1 && !document.hidden) {
      perfSum += raw; perfN++;
      if (perfN === 90) {
        if (perfSum / perfN > 0.022) { quality *= 0.75; downgrades++; W = 0; resize(); }
        perfSum = 0; perfN = 0;
      }
    }
    mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 3);
    mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 3);

    // el cursor deja ondas a su paso
    if (mouse.inside && mouse.px >= 0) {
      const moved = Math.hypot(mouse.px - mouse.lx, mouse.py - mouse.ly);
      if (mouse.lx >= 0 && moved > 0.5) addDrop(toWater(mouse.px, mouse.py), Math.min(0.045, moved * 0.0016), 5.5);
      mouse.lx = mouse.px; mouse.ly = mouse.py;
    }
    // gotas sueltas: el río nunca está quieto
    if (now > nextAmbient && S.rise > 0.5) {
      addDrop([0.08 + Math.random() * 0.84, 0.05 + Math.random() * 0.8], 0.012 + Math.random() * 0.016, 3 + Math.random() * 3);
      nextAmbient = now + 700 + Math.random() * 1400;
    }
    // dos pasos por cuadro: las ondas viajan más rápido sin perder estabilidad
    step(dt);
    step(dt);
    draw(dt);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // ---------- eventos ----------
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.inside = e.clientY >= r.top && e.clientY <= r.bottom;
    mouse.px = e.clientX; mouse.py = e.clientY;
    mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerleave', () => { mouse.inside = false; mouse.lx = -1; mouse.tx = 0; mouse.ty = 0; });
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    addDrop(toWater(e.clientX, e.clientY), 0.14, 9);
    if (!running) start();
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); hero.classList.remove('has-gl'); });

  let resizeT;
  new ResizeObserver(() => { clearTimeout(resizeT); resizeT = setTimeout(resize, 60); }).observe(canvas);
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 60); });

  // ---------- carga ----------
  api.ok = true;
  hero.classList.add('has-gl');
  resize();
  draw(0);

  // mismo corte que el <link rel="preload"> del HTML, así la foto no se baja dos veces
  const big = matchMedia('(min-width: 901px)').matches;
  api.ready = Promise.all([
    loadImage(big ? 'assets/img/fotos/hero-1778.webp' : 'assets/img/fotos/hero-1042.webp'),
    loadImage('assets/img/brand/logo-neon.png'),
  ]).then(([img, logo]) => {
    imgTex = imageTexture(img, true);
    logoTex = imageTexture(logo, true);
    imgSize = [img.naturalWidth, img.naturalHeight];
    resize();
    draw(0);
  }).catch((err) => {
    console.warn('[Río] No cargó la foto del hero.', err);
    hero.classList.remove('has-gl');
    api.ok = false;
  });

  api.state = S;
  api.start = start;
  api.render = () => draw(0);
  api.intro = () => {
    if (reduce || !window.gsap) {
      S.reveal = 1; S.rise = 1; S.neon = 1; draw(0); start();
      return;
    }
    start();
    const g = window.gsap;
    g.to(S, { reveal: 1, duration: 1.7, ease: 'power2.inOut' });
    g.to(S, { rise: 1, duration: 3, delay: 0.3, ease: 'power2.out' });
    // el neón se prende como uno de verdad: titila y queda
    g.timeline({ delay: 1.05 })
      .to(S, { neon: 0.75, duration: 0.06 })
      .to(S, { neon: 0.05, duration: 0.08 })
      .to(S, { neon: 0.9, duration: 0.05, delay: 0.12 })
      .to(S, { neon: 0.2, duration: 0.05, delay: 0.05 })
      .to(S, { neon: 1, duration: 0.5, delay: 0.18, ease: 'power2.out' });
  };
  api.setScroll = (p) => {
    S.scroll = p;
    if (!running) draw(0);
  };
  return api;
}
