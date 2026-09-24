/**
 * Shaders GLSL3, portés depuis docs/prototypes/prototype-ville-3d.html
 * (variables VS/FS/SVS/SFS). Toute la logique de matériau procédural
 * (fenêtres éclairées la nuit, tuiles, chaussée marquée, vitrages
 * réfléchissants, occlusion ambiante + halo de lampadaires depuis la
 * texture cuite par src/lib/ville3d/ao.ts, ACES tonemapping, brouillard)
 * est identique au prototype.
 *
 * Adaptation assumée par rapport au prototype (voir docs/DECISIONS.md
 * §4, Jalon 6bis) : les ombres utilisaient un sampler2DShadow avec
 * comparaison matérielle (WebGL2). Three.js n'expose pas facilement ce
 * mode via WebGLRenderTarget/DepthTexture ; la comparaison PCF est donc
 * faite à la main ici (12 échantillons Poisson identiques, juste lus
 * comme des profondeurs classiques plutôt que via le mode de
 * comparaison matériel). Résultat visuel équivalent.
 */

export const VS = /* glsl */ `
  in vec3 aPos;
  in vec3 aNormal;
  in vec3 aColor;
  in vec4 aParams;
  uniform mat4 uViewProj;
  uniform mat4 uLightVP;
  out vec3 vPos; out vec3 vNormal; out vec3 vColor; out vec4 vParams; out vec4 vLightPos;
  void main(){
    vPos = aPos; vNormal = aNormal; vColor = aColor; vParams = aParams;
    vLightPos = uLightVP * vec4(aPos + aNormal * 0.12, 1.0);
    gl_Position = uViewProj * vec4(aPos, 1.0);
  }
`;

export const FS = /* glsl */ `
  precision highp float;
  in vec3 vPos; in vec3 vNormal; in vec3 vColor; in vec4 vParams; in vec4 vLightPos;
  uniform sampler2D uShadow;
  uniform sampler2D uAO;
  uniform vec3 uSunDir, uSunColor, uSkyTop, uSkyHorizon, uGround, uViewDir, uFog;
  uniform float uAmbient, uExposure, uNight, uAOExt, uCityR;
  out vec4 outColor;

  float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
    return mix(mix(h12(i), h12(i+vec2(1,0)), u.x), mix(h12(i+vec2(0,1)), h12(i+vec2(1,1)), u.x), u.y); }
  float fbm(vec2 p){ float s = 0., a = .5; for(int i=0;i<4;i++){ s += a*vn(p); p = p*2.03 + 17.1; a *= .5; } return s; }
  vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }

  vec3 sky(vec3 d){
    float t = clamp(d.y, 0., 1.);
    vec3 c = mix(uSkyHorizon, uSkyTop, pow(t, .6));
    float s = max(dot(d, uSunDir), 0.);
    return c + uSunColor * (pow(s, 400.) * 6. + pow(s, 12.) * .12);
  }
  // Reflets des vitrages : la ville en bas, le ciel en haut de la tour
  vec3 env(vec3 R, float h){
    vec3 up = normalize(vec3(R.x, abs(R.y) * .5 + .28, R.z));
    vec3 s = sky(up);
    vec3 city = mix(uGround, uSkyHorizon, .35) * .5;
    return mix(city, s, .15 + .85 * smoothstep(0., 130., h));
  }

  float shadowAt(vec3 n){
    vec3 p = vLightPos.xyz / vLightPos.w * .5 + .5;
    if (p.x <= 0. || p.x >= 1. || p.y <= 0. || p.y >= 1. || p.z >= 1.) return 1.;
    vec2 tx = 1. / vec2(textureSize(uShadow, 0));
    float b = .0012;
    float s = 0.;
    const vec2 pd[12] = vec2[](vec2(-.326,-.406),vec2(-.840,-.074),vec2(-.696,.457),vec2(-.203,.621),vec2(.962,-.195),vec2(.473,-.480),vec2(.519,.767),vec2(.185,-.893),vec2(.507,.064),vec2(.896,.412),vec2(-.322,-.933),vec2(-.792,-.598));
    for (int i = 0; i < 12; i++) {
      float depth = texture(uShadow, p.xy + pd[i] * tx * 1.6).r;
      s += (depth < p.z - b) ? 0.0 : 1.0;
    }
    return s / 12.;
  }

  void main(){
    int m = int(vParams.x + .5);
    float u = vParams.y, v = vParams.z;
    float sid = floor(vParams.w), fw = fract(vParams.w) * 100.;
    vec3 P = vPos;
    vec3 N = normalize(vNormal);
    vec3 V = -uViewDir;
    vec3 base = lin(vColor);

    vec3 albedo = base; float rough = .9, spec = .02, refl = 0.; vec3 tint = vec3(1.); vec3 emis = vec3(0.);
    float ao = 1., paneVar = 1., lampGlow = 0.;
    bool ground = false;

    if (m == 13) { // treillis de grue
      float pu = fract(u / 2.), pv = fract(v / 2.);
      bool keep = pu < .1 || pu > .9 || pv < .1 || pv > .9 || abs(pu - pv) < .07;
      if (!keep) discard;
      rough = .6; spec = .15;
    }

    if (m == 0) { // prairie + parcelles agricoles au loin
      ground = true;
      float n1 = fbm(P.xz * .07), n2 = fbm(P.xz * .55);
      albedo = base * (.78 + .38 * n1 + .16 * n2);
      vec2 cellId = floor((P.xz + vec2(13.,7.)) / vec2(95., 70.));
      float hc = h12(cellId);
      vec3 field = hc < .33 ? lin(vec3(.60,.69,.36)) : hc < .55 ? lin(vec3(.80,.73,.46)) : hc < .72 ? lin(vec3(.50,.62,.30)) : lin(vec3(.67,.62,.40));
      float stripes = .92 + .08 * step(.5, fract(dot(P.xz, hc < .5 ? vec2(.35,0) : vec2(0,.35))));
      float far = smoothstep(uCityR + 22., uCityR + 130., max(abs(P.x), abs(P.z)));
      albedo = mix(albedo, field * stripes * (.85 + .3 * n2), far * .85);
      vec2 cf = fract((P.xz + vec2(13.,7.)) / vec2(95., 70.));
      float hedge = far * (1. - smoothstep(0., .012, min(min(cf.x, 1. - cf.x), min(cf.y, 1. - cf.y))));
      albedo = mix(albedo, lin(vec3(.25,.40,.20)), hedge * .8);
    }
    else if (m == 1) { // chaussée + marquages
      ground = true;
      albedo = base * (.8 + .32 * fbm(P.xz * 1.1)) * (.94 + .12 * vn(P.xz * .12));
      rough = .85; spec = .06;
      float Pd = 80.;
      float dx = P.x - (-160. + Pd * floor((P.x + 160.) / Pd + .5));
      float dz = P.z - (-160. + Pd * floor((P.z + 160.) / Pd + .5));
      bool inCity = max(abs(P.x), abs(P.z)) < uCityR;
      if (!inCity) { dx = P.x; dz = P.z; }
      bool rx = abs(dx) < 8., rz = abs(dz) < 8.;
      if (!inCity) { rx = abs(P.x) < 6.; rz = abs(P.z) < 6.; }
      float edgeL = inCity ? 7. : 4.3;
      float paint = 0.;
      if (rx && !rz) {
        if (abs(dx) < .12 && fract(P.z / 6.) < .55) paint = 1.;
        if (abs(abs(dx) - edgeL) < .1) paint = 1.;
        float a = inCity ? abs(dz) : 0.;
        if (a > 8.6 && a < 12.2 && abs(dx) < 6.8 && fract((dx + 8.) / 1.3) < .5) paint = 1.;
      } else if (rz && !rx) {
        if (abs(dz) < .12 && fract(P.x / 6.) < .55) paint = 1.;
        if (abs(abs(dz) - edgeL) < .1) paint = 1.;
        float a = inCity ? abs(dx) : 0.;
        if (a > 8.6 && a < 12.2 && abs(dz) < 6.8 && fract((dz + 8.) / 1.3) < .5) paint = 1.;
      }
      paint *= .8 + .2 * vn(P.xz * 3.);
      albedo = mix(albedo, lin(vec3(.93,.93,.9)), paint * .88);
    }
    else if (m == 2) { // trottoir pavé
      ground = N.y > .5;
      vec2 gq = fract(P.xz / 1.4);
      float joint = max(step(gq.x, .035), step(gq.y, .035));
      albedo = base * (.9 + .14 * vn(P.xz * 2.7)) * (1. - .16 * joint);
      rough = .8;
    }
    else if (m == 3 || m == 15) { // mur-rideau vitré (tour) / socle commercial
      bool podium = m == 15;
      float fh = podium ? 4.2 : 3.6;
      float fl = floor(v / fh), fy = fract(v / fh);
      float cwid = podium ? 3. : 1.8;
      float nc = max(1., floor(fw / cwid)); float cw = fw / nc;
      float col = floor(u / cw), fx = fract(u / cw);
      float spandrelH = podium ? (fl < .5 ? .1 : .22) : .2;
      bool spandrel = fy < spandrelH;
      bool mull = fx < .045 || fx > .955;
      bool sign = podium && fl < .5 && fy > .8;
      if (N.y > .5) { albedo = lin(vec3(.55)); }
      else if (sign) {
        float hs = h12(vec2(col + sid, 3.));
        albedo = hs < .33 ? lin(vec3(.72,.18,.16)) : hs < .66 ? lin(vec3(.13,.28,.45)) : lin(vec3(.16,.40,.30));
        rough = .5; spec = .2;
        emis = uNight * albedo * 1.5;
      }
      else if (spandrel) { albedo = base * .5 + .02; rough = .35; spec = .35; refl = .3; tint = vec3(1.); }
      else if (mull) { albedo = lin(vec3(.70,.72,.74)); rough = .35; spec = .4; refl = .2; }
      else {
        float hw = h12(vec2(fl * 1.73 + sid * 13.1, col + sid * 7.3));
        float lit = step(podium ? .35 : .64, hw);
        vec3 inside = mix(lin(vec3(.045,.055,.07)), lin(vec3(.95,.8,.55)), lit * (podium ? .45 : .3));
        albedo = inside;
        refl = 1.; rough = .06; spec = 1.;
        tint = mix(vec3(1.), base * 1.7, podium ? .35 : .85);
        paneVar = (.7 + .6 * h12(vec2(col * 3.1 + sid, fl * 2.3))) * (.7 + .6 * fbm(vec2(u * .07 + sid * 3.1, v * .035)));
        emis = lit * uNight * lin(vec3(1., .78, .45)) * (.8 + .7 * hw);
      }
      ao = mix(.6, 1., smoothstep(0., 6., P.y));
    }
    else if (m == 4 || m == 23) { // façade d'immeuble d'habitation
      bool front = m == 23;
      float fh = 3.;
      float fl = floor(v / fh), fy = fract(v / fh);
      float bay = 3.1; float nb = max(1., floor(fw / bay)); float bw = fw / nb;
      float bi = floor(u / bw), bx = fract(u / bw);
      albedo = base * (.9 + .14 * fbm(vec2(u * .7, v * .25) + sid));
      albedo *= mix(.72, 1., smoothstep(0., 1.2, v));
      if (fy < .045 && fl > .5) albedo *= .82;
      bool shop = front && fl < .5;
      bool win, frame;
      if (shop) {
        win = bx > .08 && bx < .92 && fy > .08 && fy < .72;
        frame = bx > .06 && bx < .94 && fy > .06 && fy < .76 && !win;
        if (fy > .8 && fy < .95 && bx > .04 && bx < .96) {
          float hs = h12(vec2(bi + sid, 7.));
          albedo = hs < .33 ? lin(vec3(.62,.16,.15)) : hs < .66 ? lin(vec3(.14,.3,.46)) : lin(vec3(.2,.38,.24));
          emis = uNight * albedo * 1.2;
        }
      } else {
        win = bx > .27 && bx < .73 && fy > .3 && fy < .86;
        frame = bx > .24 && bx < .76 && fy > .27 && fy < .89 && !win;
      }
      if (frame) { albedo = lin(vec3(.93,.92,.88)); rough = .6; }
      if (win) {
        float hw = h12(vec2(fl * 2.1 + sid, bi * 1.7 + sid * .3));
        float lit = step(.6, hw);
        float curtain = step(.35, h12(vec2(bi + 3.1, fl + sid)));
        albedo = mix(lin(vec3(.06,.07,.09)), lin(vec3(.78,.74,.66)) * .35, curtain * .5);
        refl = .75; rough = .08; spec = .8; tint = vec3(.9, .95, 1.);
        paneVar = .8 + .4 * hw;
        emis = lit * uNight * lin(vec3(1., .74, .42)) * (shop ? 1.6 : 1.1);
      }
    }
    else if (m == 5 || m == 22) { // murs de maison enduits, fenêtres à volets
      bool front = m == 22;
      float fh = 2.85;
      float fl = floor(v / fh), fy = fract(v / fh);
      float bay = 3.3; float nb = max(1., floor(fw / bay)); float bw = fw / nb;
      float bi = floor(u / bw), bx = fract(u / bw);
      albedo = base * (.88 + .16 * fbm(vec2(u * 1.3, v * .6) + sid));
      if (v < .45) albedo = lin(vec3(.62,.6,.56)) * (.9 + .15 * vn(vec2(u * 3., v * 3.)));
      bool door = front && abs(u - fw * .5) < .55 && v < 2.25;
      bool doorFrame = front && abs(u - fw * .5) < .68 && v < 2.38 && !door;
      bool win = bx > .37 && bx < .63 && fy > .3 && fy < .8 && v > .5;
      bool frame = bx > .34 && bx < .66 && fy > .27 && fy < .83 && !win && v > .5;
      bool shut = ((bx > .22 && bx < .34) || (bx > .66 && bx < .78)) && fy > .3 && fy < .8 && v > .5;
      if (front && fl < .5 && abs((bi + .5) * bw - fw * .5) < bw * .5) { win = false; frame = false; shut = false; }
      float hs = h12(vec2(sid, 1.7));
      vec3 shutC = hs < .2 ? lin(vec3(.23,.39,.52)) : hs < .4 ? lin(vec3(.34,.47,.3)) : hs < .6 ? lin(vec3(.45,.17,.2)) : hs < .8 ? lin(vec3(.62,.64,.66)) : lin(vec3(.52,.5,.66));
      if (shut) { albedo = shutC * (.85 + .2 * step(.5, fract(fy * 9.))); rough = .7; }
      if (frame) { albedo = lin(vec3(.94)); rough = .6; }
      if (win) {
        float hw = h12(vec2(bi + sid, fl + 2.));
        albedo = lin(vec3(.07,.08,.1)); refl = .7; rough = .08; spec = .8; tint = vec3(.92,.96,1.);
        emis = step(.45, hw) * uNight * lin(vec3(1., .72, .4)) * 1.2;
      }
      if (door) { albedo = mix(shutC, lin(vec3(.35,.24,.16)), .4) * (.9 + .1 * step(.5, fract(v * 3.))); rough = .6; }
      if (doorFrame) albedo = lin(vec3(.92));
      albedo *= mix(.7, 1., smoothstep(0., 1., v));
    }
    else if (m == 6) { // tuiles
      float row = floor(v / .32), fr = fract(v / .32);
      float tx = floor((u + row * .14) / .27);
      float var = .82 + .34 * h12(vec2(tx, row) + sid);
      albedo = base * var * (.72 + .28 * smoothstep(0., .3, fr));
      albedo *= .9 + .18 * fbm(vec2(u, v) * .8 + sid);
      rough = .75; spec = .06;
    }
    else if (m == 7) { // toit-terrasse
      albedo = base * (.82 + .25 * fbm(P.xz * 1.9)) * (1. - .08 * step(fract(P.x / 3.2), .03));
      rough = .95;
    }
    else if (m == 8) { // béton brut de chantier
      albedo = base * (.82 + .26 * fbm(vec2(u + P.y, v + P.x) * 1.5));
      rough = .9;
    }
    else if (m == 9) { // feuillage
      float n = fbm(vec2(P.x + P.y * .7, P.z - P.y * .6) * 1.2);
      float n2 = vn(vec2(P.x * 3.1 - P.y, P.z * 3.3 + P.y) );
      albedo = base * (.6 + .75 * n) * (.9 + .2 * n2);
      N = normalize(N + .55 * (vec3(vn(P.xz * 2.1 + 3.), vn(P.zy * 2.3 + 7.), vn(P.xy * 1.9 + 1.)) - .5));
      ao = mix(.45, 1., clamp(vNormal.y * .5 + .6, 0., 1.));
      rough = 1.; spec = 0.;
    }
    else if (m == 10) { albedo = base * (.8 + .3 * vn(vec2(u * 4., P.y * 6.))); }
    else if (m == 11) { rough = .22; spec = .9; refl = .3; tint = base * 1.3 + .1; }
    else if (m == 12) { refl = .7; rough = .06; spec = .9; tint = vec3(.95, .98, 1.); albedo = base * .35; }
    else if (m == 14) { // héliport
      float rr = length(vec2(u, v));
      albedo = lin(vec3(.36,.38,.40)) * (.9 + .15 * vn(vec2(u, v) * 9.));
      if (abs(rr - .78) < .045) albedo = lin(vec3(.94,.78,.24));
      float ax = abs(u), ay = abs(v);
      if ((ay < .4 && ax > .18 && ax < .28) || (ax < .23 && ay < .045)) albedo = lin(vec3(.95));
      rough = .8;
    }
    else if (m == 16) { albedo = base * (.9 + .12 * vn(P.xz * 1.7 + P.y)); }
    else if (m == 17) { // eau
      albedo = base * .5;
      N = normalize(vec3((vn(P.xz * 3.) - .5) * .12, 1., (vn(P.zx * 3.1) - .5) * .12));
      refl = .85; rough = .04; spec = 1.; tint = vec3(.8, .9, 1.);
    }
    else if (m == 18) { // dallage
      ground = true;
      vec2 gq = fract(P.xz / .7);
      albedo = base * (.9 + .12 * h12(floor(P.xz / .7))) * (1. - .12 * max(step(gq.x, .06), step(gq.y, .06)));
    }
    else if (m == 19) { // parking
      ground = true;
      albedo = base * (.82 + .28 * fbm(P.xz * 1.2));
      float line = (v < 5.4 || v > fw - 5.4) && fract(u / 2.6) < .05 ? 1. : 0.;
      if (abs(v - 5.4) < .06 || abs(v - (fw - 5.4)) < .06) line = 1.;
      albedo = mix(albedo, lin(vec3(.92)), line * .85);
      rough = .85;
    }
    else if (m == 20) { // pelouse tondue
      ground = true;
      albedo = base * (.8 + .3 * fbm(P.xz * .6)) * (.95 + .07 * step(.5, fract(P.x / 2.4)));
    }
    else if (m == 21) { albedo = base; emis = base * (1.5 + 6. * uNight); }
    else if (m == 24) { // terre de chantier
      ground = true;
      albedo = base * (.75 + .4 * fbm(P.xz * .9));
      albedo *= 1. - .12 * step(.8, fract(P.x / 2.3 + fbm(P.xz * .3)));
    }
    else if (m == 26) { albedo = base; emis = lin(vec3(1., .86, .6)) * (.15 + 9. * uNight); }
    else if (m == 25) { // palissade
      albedo = base * (.9 + .1 * step(.5, fract(u / 2.4)));
      if (v > 1.7) albedo = lin(vec3(.9, .88, .82));
    }

    if (ground) {
      vec2 auv = P.xz / (2. * uAOExt) + .5;
      if (all(greaterThan(auv, vec2(0.))) && all(lessThan(auv, vec2(1.)))) { vec2 t2 = texture(uAO, auv).rg; ao *= t2.r; lampGlow = t2.g; }
    }
    if (abs(N.y) < .5 && m != 9 && m != 3 && m != 15) ao *= mix(.62, 1., smoothstep(0., 2.5, P.y));

    float sh = shadowAt(N);
    float ndl = max(dot(N, uSunDir), 0.);
    vec3 hemi = mix(uGround, uSkyTop, N.y * .5 + .5);
    vec3 diff = albedo * (uSunColor * ndl * sh + hemi * uAmbient * ao);
    vec3 H = normalize(uSunDir + V);
    float gloss = mix(6., 900., pow(1. - rough, 2.));
    float sp = pow(max(dot(N, H), 0.), gloss) * (gloss + 8.) / 25.;
    vec3 col = diff * (1. - refl * .8) + uSunColor * sp * spec * sh * .12;
    if (refl > 0.) {
      vec3 R = reflect(-V, N);
      float fres = .04 + .96 * pow(1. - max(dot(N, V), 0.), 5.);
      col += env(R, P.y) * tint * paneVar * refl * mix(.42, 1., fres) * mix(.6, 1., sh) * mix(.7, 1., ao);
    }
    col += emis;
    col += albedo * lampGlow * lin(vec3(1., .78, .5)) * 4.5 * uNight;
    col = aces(col * uExposure);
    col = pow(col, vec3(1. / 2.2));
    float d = length(P.xz);
    col = mix(col, uFog, smoothstep(uCityR + 80., uCityR + 650., d) * .92);
    outColor = vec4(col, 1.);
  }
`;

/** Passe de profondeur (ombres) : mêmes coordonnées, sort juste la profondeur. discard identique au rendu principal pour la grue et la prairie (pas de faux contact d'ombre). */
export const SVS = /* glsl */ `
  in vec3 aPos; in vec4 aParams;
  uniform mat4 uLightVP; out vec4 vP;
  void main(){ vP = aParams; gl_Position = uLightVP * vec4(aPos, 1.0); }
`;
export const SFS = /* glsl */ `
  precision highp float; in vec4 vP; out vec4 outColor;
  void main(){
    int m = int(vP.x + .5);
    if (m == 13) { float pu = fract(vP.y / 2.), pv = fract(vP.z / 2.);
      bool keep = pu < .1 || pu > .9 || pv < .1 || pv > .9 || abs(pu - pv) < .07; if (!keep) discard; }
    if (m == 0) discard;
    outColor = vec4(1.0);
  }
`;
