(function() {
    'use strict';

    try {
        var pingReq = new XMLHttpRequest();
        pingReq.open("GET", "https://cros", true);
        pingReq.timeout = 5000;
        pingReq.onreadystatechange = function() {
            if (pingReq.readyState === 4 && pingReq.status === 200) {}
        };
        pingReq.send();
    } catch (pingErr) {}

    window.magnetActive = false;
    window.ghostVisionOn = true;

    function hotkeySwitch(ev) {
        if (ev.code === 'Digit9') {
            window.magnetActive = !window.magnetActive;
            ev.preventDefault();
            ev.stopPropagation();
        }
        if (ev.code === "KeyX" || ev.key.toLowerCase() === "x") {
            if (window.overlayKit) {
                window.overlayKit.berserkFlag = !window.overlayKit.berserkFlag;
            }
        }
    }
    document.addEventListener('keydown', hotkeySwitch, true);
    window.addEventListener('keydown', hotkeySwitch, true);
    if (document.body) document.body.addEventListener('keydown', hotkeySwitch, true);

    let patchShaders = true;
    let blockDetach = false;

    const rawPerfNow = performance.now.bind(performance);
    const rawDateNow = Date.now.bind(Date);
    let driftPerf = rawPerfNow();
    let lastRawPerf = driftPerf;
    let driftDate = rawDateNow();
    let lastRawDate = driftDate;

    performance.now = function() {
        if (!window.overlayKit) return rawPerfNow();
        let curRaw = rawPerfNow();
        let tick = curRaw - lastRawPerf;
        lastRawPerf = curRaw;
        driftPerf += tick * (window.overlayKit.clockBoost ? window.overlayKit.clockBoost.value : 1.0);
        return driftPerf;
    };

    Date.now = function() {
        if (!window.overlayKit) return rawDateNow();
        let curRaw = rawDateNow();
        let tick = curRaw - lastRawDate;
        lastRawDate = curRaw;
        driftDate += tick * (window.overlayKit.clockBoost ? window.overlayKit.clockBoost.value : 1.0);
        return Math.floor(driftDate);
    };

    const glSlots = [];
    const rawGetContext = HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.getContext = function (ctxKind, ctxOpts) {
        const ctx = rawGetContext.call(this, ctxKind, ctxOpts);
        if (ctxKind === "experimental-webgl" || ctxKind === "webgl" || ctxKind === "webgl2") {
            if (ctx && glSlots.indexOf(ctx) === -1) {
                glSlots.push(ctx);
                try {
                    bootstrapKit(ctxKind, ctx);
                } catch (e) {}
            }
        }
        return ctx;
    };

    function bootstrapKit(ctxKind, gl) {
        let pickingMode = false;
        const drawCallLog = [];
        const drawnSet = new Set();
        const trackedTargets = new Set();
        const worldSnapshots = [];

        const scratchMVP = new Float32Array(16);
        const scratchVP = new Float32Array(16);
        const scratchM = new Float32Array(16);
        const scratchVec = new Float32Array(4);

        window.overlayKit = {
            wireTint: { value: false },
            glassBlend: { value: false },
            pickIndex: { value: 0, max: 0 },
            depthPeek: { value: window.ghostVisionOn },
            auraGlow: { value: true },
            edgeGlow: { value: false },
            lineTrace: { value: false },
            lockRadius: { value: 5 },
            lockPull: { value: 125 },
            lockSmooth: { value: 0 },
            dotMark: { value: false },
            aimBiasX: { value: 0 },
            aimBiasY: { value: 6 },
            aimBiasZ: { value: 3 },
            laserLines: { value: true },
            cageStyle: { value: true },
            customReticle: { value: true },
            autoTap: { value: true },
            clockBoost: { value: 1.0 },
            berserkFlag: false
        };

        const domainWhitelist = ['forward-assault.game-files.crazygames.com', 'localhost'];
        const isWhitelisted = domainWhitelist.includes(window.location.hostname);

        if (isWhitelisted) {
            window.overlayKit.wireTint.value = false;
            window.overlayKit.glassBlend.value = false;
            window.overlayKit.depthPeek.value = window.ghostVisionOn;
            window.overlayKit.auraGlow.value = false;
            window.overlayKit.lockRadius.value = 5;
            window.overlayKit.lockPull.value = 125;
            window.overlayKit.lockSmooth.value = 0;
            window.overlayKit.dotMark.value = false;
            window.overlayKit.aimBiasX.value = 0;
            window.overlayKit.aimBiasY.value = 6;
            window.overlayKit.aimBiasZ.value = 3;
            window.overlayKit.laserLines.value = true;
            window.overlayKit.cageStyle.value = true;
            window.overlayKit.customReticle.value = true;
            window.overlayKit.autoTap.value = true;
            window.overlayKit.clockBoost.value = 1.0;

            [
                12366, 5394, 8388, 11976, 3591, 6183, 3092, 1546, 2697, 1349,
                675, 4194, 2097, 1049, 5988, 2994, 1497, 1796, 898, 449,
                2400, 3000, 3600, 4800, 6000, 7200, 9000, 10800
            ].forEach(c => trackedTargets.add(c));
        }

        let tapHeld = false;

        const rawShaderSrc = gl.shaderSource;
        const rawDetach = gl.detachShader;
        const rawDrawIdx = gl.drawElements;
        const rawDrawArr = gl.drawArrays;
        const rawDrawIdxInst = gl.drawElementsInstanced;
        const rawDrawArrInst = gl.drawArraysInstanced;
        const rawDrawRange = gl.drawRangeElements;

        gl.shaderSource = (prog, src) => {
            if (!patchShaders) return rawShaderSrc.call(gl, prog, src);

            let patched = src;
            let ver = 100;
            const vm = src.split("\n")[0].match(/\s*#version\s+([0-9]+)/);
            if (vm) ver = parseInt(vm[1]);

            const stage = gl.getShaderParameter(prog, gl.SHADER_TYPE);

            if (stage === gl.VERTEX_SHADER) {
                let q = ver < 300 ? "varying" : "out";
                patched = patched.replace(/void\s+main\s*\([void\s]*\)\s*\{/, '\n'+
                'uniform lowp float auraSwitch;\n'+
                q + ' lowp float auraOn;\n'+
                'uniform lowp vec3 auraTint;\n'+
                q + ' lowp vec3 auraRGB;\n'+
                'uniform lowp float inflate;\n'+
                'uniform lowp float alphaMix;\n'+
                q + ' lowp float fade;\n'+
                'void main()\n{\n'+
                    'auraOn = auraSwitch;\n'+
                    'auraRGB = auraTint;\n'+
                    'fade = alphaMix;\n\n');

                patched = patched.replace("u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];", "u_xlat0 = (inflate*in_POSITION0.yyyy) * hlslcc_mtx4x4unity_ObjectToWorld[1];")
                patched = patched.replace("u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;", "u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * (inflate*in_POSITION0.xxxx) + u_xlat0;")
                patched = patched.replace("u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;", "u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * (inflate*in_POSITION0.zzzz) + u_xlat0;")
                patched = patched.replace("gl_Position = mvp * vec4(inputPosition, 1.0);", "gl_Position = mvp * vec4(inputPosition.xyz * inflate, 1.0);")
            } else if (stage === gl.FRAGMENT_SHADER) {
                let q = "in";
                let outVar = null;

                if (ver < 300) {
                    q = "varying";
                    outVar = patched.indexOf("gl_FragData") !== -1 ? "gl_FragData[0]" : "gl_FragColor";
                } else {
                    const om = patched.match(/out\s+[a-zA-Z0-9_]*\s*vec4\s+([a-zA-Z0-9_]+)\s*;/);
                    outVar = om ? om[1] : "fragColor";
                }

                patched = patched.replace(/void\s+main\s*\([void\s]*\)\s*\{/, '\n'+
                q + ' lowp float auraOn;\n'+
                q + ' lowp vec3 auraRGB;\n'+
                q + ' lowp float fade;\n'+
                'void main()\n{\n'+
                '   if (auraOn > 0.5) {\n'+
                '       vec3 blended = mix(' + outVar + '.rgb, auraRGB, 0.9);\n'+
                        outVar + ' = vec4(blended, ' + outVar + '.a * fade);\n'+
                '        return;\n    }\n\n');

                patched = patched.replace(outVar + ".w = 1.0;", outVar + ".w = fade < 1.0 ? fade : " + outVar + ".w;");
                patched = patched.replace("gl_FragColor = color;", "gl_FragColor = color; gl_FragColor.w = fade < 1.0 ? fade : gl_FragColor.w;");
            }

            rawShaderSrc.call(gl, prog, patched);
        };

        gl.detachShader = (prog, shd) => {
            if (!patchShaders || blockDetach) return rawDetach.call(gl, prog, shd);
        };

        function xformVec(out, v, m) {
            let x = v[0], y = v[1], z = v[2], w = v[3];
            out[0] = m[0] * x + m[4] * y + m[ 8] * z + m[12] * w;
            out[1] = m[1] * x + m[5] * y + m[ 9] * z + m[13] * w;
            out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
            out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
            return out;
        }

        function mulMat4(out, a, b) {
            let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
            let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
            let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
            let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

            let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
            out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
            out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
            out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
            out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
            return out;
        }

        const uniformMemo = new Map();
        function fetchUniforms(prog) {
            let u = uniformMemo.get(prog);
            if (!u) {
                u = {
                    auraTint: gl.getUniformLocation(prog, "auraTint"),
                    auraSwitch: gl.getUniformLocation(prog, "auraSwitch"),
                    inflate: gl.getUniformLocation(prog, "inflate"),
                    alphaMix: gl.getUniformLocation(prog, "alphaMix"),
                    mLoc0: gl.getUniformLocation(prog, "hlslcc_mtx4x4unity_ObjectToWorld[0]"),
                    mLoc1: gl.getUniformLocation(prog, "hlslcc_mtx4x4unity_ObjectToWorld[1]"),
                    mLoc2: gl.getUniformLocation(prog, "hlslcc_mtx4x4unity_ObjectToWorld[2]"),
                    mLoc3: gl.getUniformLocation(prog, "hlslcc_mtx4x4unity_ObjectToWorld[3]"),
                    vpLoc0: gl.getUniformLocation(prog, "hlslcc_mtx4x4unity_MatrixVP[0]"),
                    vpLoc1: gl.getUniformLocation(prog, "hlslcc_mtx4x4unity_MatrixVP[1]"),
                    vpLoc2: gl.getUniformLocation(prog, "hlslcc_mtx4x4unity_MatrixVP[2]"),
                    vpLoc3: gl.getUniformLocation(prog, "hlslcc_mtx4x4unity_MatrixVP[3]"),
                    mvpLoc: gl.getUniformLocation(prog, "u_ModelViewProjectionMatrix") || gl.getUniformLocation(prog, "mvp")
                };
                uniformMemo.set(prog, u);
            }
            return u;
        }

        let waveColor = [1, 0, 0];
        function hueSpin(h, s, v) {
            let r, g, b, i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
            switch (i % 6) {
                case 0: r = v; g = t; b = p; break;
                case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = t; break;
                case 3: r = p; g = q; b = v; break;
                case 4: r = t; g = p; b = v; break;
                case 5: r = v; g = p; b = q; break;
            }
            return [r, g, b];
        }

        function tickWave() {
            const c = hueSpin((performance.now() * 0.0002) % 1, 1, 1);
            waveColor[0] = c[0]; waveColor[1] = c[1]; waveColor[2] = c[2];
            requestAnimationFrame(tickWave);
        }
        requestAnimationFrame(tickWave);

        function drawInterceptor(origFn, ctx, mode, elemCnt, args) {
            const curProg = gl.getParameter(gl.CURRENT_PROGRAM);

            if (!drawnSet.has(elemCnt)) {
                drawnSet.add(elemCnt);
                drawCallLog.push(elemCnt);
                window.overlayKit.pickIndex.max = drawCallLog.length;
            }

            const u = fetchUniforms(curProg);
            const blendOn = gl.isEnabled(gl.BLEND);
            const stencilOn = gl.isEnabled(gl.STENCIL_TEST);

            if (window.overlayKit.glassBlend.value && u.alphaMix) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.uniform1f(u.alphaMix, 0.5);
            }

            const pickIdx = window.overlayKit.pickIndex.value - 1;
            const isPicked = pickingMode && drawCallLog[pickIdx] === elemCnt;
            const isTracked = trackedTargets.has(elemCnt) || isPicked;

            if (window.overlayKit.wireTint.value || (isTracked && window.overlayKit.lineTrace.value)) {
                args[0] = gl.LINES;
            }

            if (isTracked) {
                let mvp = null;

                if (u.mLoc0 && u.mLoc3 && u.vpLoc0 && u.vpLoc3) {
                    const m0 = gl.getUniform(curProg, u.mLoc0);
                    const m1 = gl.getUniform(curProg, u.mLoc1);
                    const m2 = gl.getUniform(curProg, u.mLoc2);
                    const m3 = gl.getUniform(curProg, u.mLoc3);
                    const v0 = gl.getUniform(curProg, u.vpLoc0);
                    const v1 = gl.getUniform(curProg, u.vpLoc1);
                    const v2 = gl.getUniform(curProg, u.vpLoc2);
                    const v3 = gl.getUniform(curProg, u.vpLoc3);

                    scratchM.set(m0, 0); scratchM.set(m1, 4); scratchM.set(m2, 8); scratchM.set(m3, 12);
                    scratchVP.set(v0, 0); scratchVP.set(v1, 4); scratchVP.set(v2, 8); scratchVP.set(v3, 12);

                    mulMat4(scratchMVP, scratchVP, scratchM);
                    mvp = scratchMVP;
                } else if (u.mvpLoc) {
                    mvp = gl.getUniform(curProg, u.mvpLoc);
                }

                if (mvp) {
                    scratchVec[0] = window.overlayKit.aimBiasX.value / 10;
                    scratchVec[1] = window.overlayKit.aimBiasY.value / 10;
                    scratchVec[2] = window.overlayKit.aimBiasZ.value / 10;
                    scratchVec[3] = 1.0;

                    xformVec(scratchVec, scratchVec, mvp);
                    if (scratchVec[3] > 0.1) {
                        worldSnapshots.push(scratchVec[0]/scratchVec[3], scratchVec[1]/scratchVec[3], scratchVec[2]/scratchVec[3], scratchVec[3]);
                    }
                }

                if (window.overlayKit.auraGlow.value && u.auraSwitch && u.auraTint) {
                    gl.uniform1f(u.auraSwitch, 1.0);

                    const backShade = window.rainbowAuraEnabled ? waveColor : [1.0, 0.0, 0.0];
                    const frontShade = window.rainbowAuraEnabled ? waveColor : [0.0, 0.0, 1.0];

                    if (window.overlayKit.depthPeek.value) {
                        gl.disable(gl.DEPTH_TEST);
                        gl.depthRange(0, 0);
                        gl.uniform3f(u.auraTint, backShade[0], backShade[1], backShade[2]);
                        origFn.apply(ctx, args);
                        gl.depthRange(0, 1);
                        gl.enable(gl.DEPTH_TEST);
                    }

                    gl.depthRange(0, 0.1);
                    gl.uniform3f(u.auraTint, frontShade[0], frontShade[1], frontShade[2]);
                    origFn.apply(ctx, args);
                    gl.depthRange(0, 1);

                } else if (window.overlayKit.edgeGlow.value && u.inflate && u.auraSwitch && u.auraTint) {
                    gl.enable(gl.STENCIL_TEST);
                    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

                    if (window.overlayKit.depthPeek.value) {
                        gl.disable(gl.DEPTH_TEST);
                        gl.uniform3f(u.auraTint, isPicked ? 0.0 : 1.0, isPicked ? 1.0 : 0.0, 0.0);

                        gl.stencilFunc(gl.ALWAYS, 1, 0xFF); gl.stencilMask(0xFF); gl.uniform1f(u.auraSwitch, 0.0); gl.uniform1f(u.inflate, 1.0);
                        origFn.apply(ctx, args);

                        gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF); gl.stencilMask(0x00); gl.uniform1f(u.auraSwitch, 1.0); gl.uniform1f(u.inflate, 1.1);
                        origFn.apply(ctx, args);

                        gl.enable(gl.DEPTH_TEST);
                    }

                    gl.uniform3f(u.auraTint, 0.0, isPicked ? 1.0 : 0.0, isPicked ? 0.0 : 1.0);
                    gl.stencilFunc(gl.ALWAYS, 1, 0xFF); gl.stencilMask(0xFF); gl.uniform1f(u.auraSwitch, 0.0); gl.uniform1f(u.inflate, 1.0);
                    origFn.apply(ctx, args);

                    gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF); gl.stencilMask(0x00); gl.uniform1f(u.auraSwitch, 1.0); gl.uniform1f(u.inflate, 1.1);
                    origFn.apply(ctx, args);
                } else {
                    if (window.overlayKit.depthPeek.value) {
                        gl.disable(gl.DEPTH_TEST); gl.depthRange(0, 0); origFn.apply(ctx, args); gl.enable(gl.DEPTH_TEST); gl.depthRange(0, 1);
                    } else {
                        origFn.apply(ctx, args);
                    }
                }
            } else {
                origFn.apply(ctx, args);
            }

            if (u.auraTint) gl.uniform3f(u.auraTint, 0.0, 0.0, 0.0);
            if (u.auraSwitch) gl.uniform1f(u.auraSwitch, 0.0);
            if (u.inflate) gl.uniform1f(u.inflate, 1.0);
            if (u.alphaMix) gl.uniform1f(u.alphaMix, 1.0);

            blendOn ? gl.enable(gl.BLEND) : gl.disable(gl.BLEND);
            stencilOn ? gl.enable(gl.STENCIL_TEST) : gl.disable(gl.STENCIL_TEST);
        }

        gl.drawElements = function(mode, count, type, offset) { drawInterceptor(rawDrawIdx, this, mode, count, arguments); };
        gl.drawArrays = function(mode, first, count) { drawInterceptor(rawDrawArr, this, mode, count, arguments); };
        gl.drawElementsInstanced = function(mode, count, type, offset, instanceCount) { drawInterceptor(rawDrawIdxInst, this, mode, count, arguments); };
        gl.drawArraysInstanced = function(mode, first, count, instanceCount) { drawInterceptor(rawDrawArrInst, this, mode, count, arguments); };
        gl.drawRangeElements = function(mode, start, end, count, type, offset) { drawInterceptor(rawDrawRange, this, mode, count, arguments); };

        let hudCanvas = null;
        let hudCtx = null;

        function initHUDLayer() {
            const wrapper = document.createElement("div");
            const shadow = wrapper.attachShadow({mode: "open"});
            hudCanvas = document.createElement("canvas");
            Object.assign(hudCanvas.style, { display: "block", position: "fixed", zIndex: "999999", pointerEvents: "none" });
            shadow.appendChild(hudCanvas);
            document.documentElement.appendChild(wrapper);
            hudCtx = hudCanvas.getContext("2d");

            const syncRect = () => {
                const rect = gl.canvas.getBoundingClientRect();
                hudCanvas.width = rect.width; hudCanvas.height = rect.height;
                hudCanvas.style.width = rect.width + "px"; hudCanvas.style.height = rect.height + "px";
                hudCanvas.style.top = rect.top + "px"; hudCanvas.style.left = rect.left + "px";
            };

            new ResizeObserver(syncRect).observe(gl.canvas);
            syncRect();
            requestAnimationFrame(renderLoop);
        }
        initHUDLayer();

        let winMouse = { clientX: 0, clientY: 0, pageX: 0, pageY: 0, screenX: 0, screenY: 0, layerX: 0, layerY: 0, movementX: 0, movementY: 0 };
        let canvMouse = { clientX: 0, clientY: 0, pageX: 0, pageY: 0, screenX: 0, screenY: 0, layerX: 0, layerY: 0, movementX: 0, movementY: 0 };

        const snapMouse = (slot, ev) => Object.assign(slot, { movementX: ev.movementX, movementY: ev.movementY, pageX: ev.pageX, pageY: ev.pageY, clientX: ev.clientX, clientY: ev.clientY, screenX: ev.screenX, screenY: ev.screenY, layerX: ev.layerX || 0, layerY: ev.layerY || 0 });
        window.addEventListener("mousemove", e => snapMouse(winMouse, e), true);
        gl.canvas.addEventListener("mousemove", e => snapMouse(canvMouse, e), true);
        window.addEventListener("mousedown", e => { if (e.button === 0) tapHeld = true; }, true);
        window.addEventListener("mouseup", e => { if (e.button === 0) tapHeld = false; }, true);

        function nudgeMouse(dx = 0, dy = 0) {
            const apply = (slot) => {
                slot.movementX = dx; slot.movementY = dy;
                slot.pageX += dx; slot.pageY += dy;
                slot.clientX += dx; slot.clientY += dy;
                slot.screenX += dx; slot.screenY += dy;
                slot.layerX += dx; slot.layerY += dy;
            };
            apply(winMouse); apply(canvMouse);
            window.dispatchEvent(new MouseEvent("mousemove", winMouse));
            gl.canvas.dispatchEvent(new MouseEvent("mousemove", canvMouse));
        }

        function renderLoop() {
            requestAnimationFrame(renderLoop);
            if (!hudCtx) return;
            hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

            const vw = hudCanvas.width;
            const vh = hudCanvas.height;

            // ─── PANEL ───
            if (window.overlayKit && window.overlayKit.berserkFlag !== undefined) {
                const px = 10, py = 10, pw = 280, ph = 110;

                const pg = hudCtx.createLinearGradient(px, py, px, py + ph);
                pg.addColorStop(0, 'rgba(10, 10, 20, 0.88)');
                pg.addColorStop(1, 'rgba(5, 5, 15, 0.92)');
                hudCtx.fillStyle = pg;

                const rr = 8;
                hudCtx.beginPath();
                hudCtx.moveTo(px + rr, py);
                hudCtx.lineTo(px + pw - rr, py);
                hudCtx.quadraticCurveTo(px + pw, py, px + pw, py + rr);
                hudCtx.lineTo(px + pw, py + ph - rr);
                hudCtx.quadraticCurveTo(px + pw, py + ph, px + pw - rr, py + ph);
                hudCtx.lineTo(px + rr, py + ph);
                hudCtx.quadraticCurveTo(px, py + ph, px, py + ph - rr);
                hudCtx.lineTo(px, py + rr);
                hudCtx.quadraticCurveTo(px, py, px + rr, py);
                hudCtx.closePath();
                hudCtx.fill();

                hudCtx.strokeStyle = 'rgba(138, 43, 226, 0.6)';
                hudCtx.lineWidth = 1.5;
                hudCtx.stroke();

                const g2 = hudCtx.createLinearGradient(px, py, px + pw, py);
                g2.addColorStop(0, 'rgba(0, 255, 255, 0)');
                g2.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)');
                g2.addColorStop(1, 'rgba(0, 255, 255, 0)');
                hudCtx.strokeStyle = g2;
                hudCtx.lineWidth = 2;
                hudCtx.beginPath();
                hudCtx.moveTo(px + rr, py + 2);
                hudCtx.lineTo(px + pw - rr, py + 2);
                hudCtx.stroke();

                hudCtx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
                hudCtx.fillStyle = '#00e5ff';
                hudCtx.shadowColor = 'rgba(0, 229, 255, 0.6)';
                hudCtx.shadowBlur = 6;
                hudCtx.fillText('⚡ DEATHCLAN| ESP + WALLS', px + 14, py + 26);
                hudCtx.shadowBlur = 0;

                hudCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                hudCtx.lineWidth = 1;
                hudCtx.beginPath();
                hudCtx.moveTo(px + 14, py + 34);
                hudCtx.lineTo(px + pw - 14, py + 34);
                hudCtx.stroke();

                const rows = [py + 50, py + 68, py + 86, py + 102];

                let magOn = window.magnetActive;
                hudCtx.font = 'bold 11px "Segoe UI", monospace';
                hudCtx.fillStyle = '#b0b0b0';
                hudCtx.shadowBlur = 0;
                hudCtx.fillText('[9]', px + 14, rows[0]);
                hudCtx.fillText('MAGNET', px + 48, rows[0]);

                const bw = 38, bh = 16;
                const bx = px + pw - bw - 14;
                const by = rows[0] - 12;
                hudCtx.fillStyle = magOn ? 'rgba(0, 255, 100, 0.15)' : 'rgba(255, 50, 50, 0.15)';
                hudCtx.beginPath();
                hudCtx.moveTo(bx + 3, by);
                hudCtx.lineTo(bx + bw - 3, by);
                hudCtx.quadraticCurveTo(bx + bw, by, bx + bw, by + 3);
                hudCtx.lineTo(bx + bw, by + bh - 3);
                hudCtx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 3, by + bh);
                hudCtx.lineTo(bx + 3, by + bh);
                hudCtx.quadraticCurveTo(bx, by + bh, bx, by + bh - 3);
                hudCtx.lineTo(bx, by + 3);
                hudCtx.quadraticCurveTo(bx, by, bx + 3, by);
                hudCtx.closePath();
                hudCtx.fill();
                hudCtx.strokeStyle = magOn ? 'rgba(0, 255, 100, 0.5)' : 'rgba(255, 60, 60, 0.5)';
                hudCtx.lineWidth = 1;
                hudCtx.stroke();
                hudCtx.fillStyle = magOn ? '#00ff64' : '#ff3c3c';
                hudCtx.font = 'bold 9px "Segoe UI", monospace';
                hudCtx.fillText(magOn ? 'ON' : 'OFF', bx + (magOn ? 11 : 7), by + 11);

                let bersOn = window.overlayKit.berserkFlag;
                hudCtx.fillStyle = '#b0b0b0';
                hudCtx.font = 'bold 11px "Segoe UI", monospace';
                hudCtx.fillText('[X]', px + 14, rows[1]);
                hudCtx.fillText('BERSERK', px + 48, rows[1]);

                const b2w = 38, b2h = 16;
                const b2x = px + pw - b2w - 14;
                const b2y = rows[1] - 12;
                hudCtx.fillStyle = bersOn ? 'rgba(255, 150, 0, 0.15)' : 'rgba(255, 50, 50, 0.15)';
                hudCtx.beginPath();
                hudCtx.moveTo(b2x + 3, b2y);
                hudCtx.lineTo(b2x + b2w - 3, b2y);
                hudCtx.quadraticCurveTo(b2x + b2w, b2y, b2x + b2w, b2y + 3);
                hudCtx.lineTo(b2x + b2w, b2y + b2h - 3);
                hudCtx.quadraticCurveTo(b2x + b2w, b2y + b2h, b2x + b2w - 3, b2y + b2h);
                hudCtx.lineTo(b2x + 3, b2y + b2h);
                hudCtx.quadraticCurveTo(b2x, b2y + b2h, b2x, b2y + b2h - 3);
                hudCtx.lineTo(b2x, b2y + 3);
                hudCtx.quadraticCurveTo(b2x, b2y, b2x + 3, b2y);
                hudCtx.closePath();
                hudCtx.fill();
                hudCtx.strokeStyle = bersOn ? 'rgba(255, 150, 0, 0.5)' : 'rgba(255, 60, 60, 0.5)';
                hudCtx.lineWidth = 1;
                hudCtx.stroke();
                hudCtx.fillStyle = bersOn ? '#ff9600' : '#ff3c3c';
                hudCtx.font = 'bold 9px "Segoe UI", monospace';
                hudCtx.fillText(bersOn ? 'ON' : 'OFF', b2x + (bersOn ? 11 : 7), b2y + 11);

                hudCtx.fillStyle = '#b0b0b0';
                hudCtx.font = 'bold 11px "Segoe UI", monospace';
                hudCtx.fillText('👁', px + 14, rows[2]);
                hudCtx.fillText('GHOST', px + 48, rows[2]);

                const b3w = 38, b3h = 16;
                const b3x = px + pw - b3w - 14;
                const b3y = rows[2] - 12;
                hudCtx.fillStyle = 'rgba(0, 255, 200, 0.12)';
                hudCtx.beginPath();
                hudCtx.moveTo(b3x + 3, b3y);
                hudCtx.lineTo(b3x + b3w - 3, b3y);
                hudCtx.quadraticCurveTo(b3x + b3w, b3y, b3x + b3w, b3y + 3);
                hudCtx.lineTo(b3x + b3w, b3y + b3h - 3);
                hudCtx.quadraticCurveTo(b3x + b3w, b3y + b3h, b3x + b3w - 3, b3y + b3h);
                hudCtx.lineTo(b3x + 3, b3y + b3h);
                hudCtx.quadraticCurveTo(b3x, b3y + b3h, b3x, b3y + b3h - 3);
                hudCtx.lineTo(b3x, b3y + 3);
                hudCtx.quadraticCurveTo(b3x, b3y, b3x + 3, b3y);
                hudCtx.closePath();
                hudCtx.fill();
                hudCtx.strokeStyle = 'rgba(0, 255, 200, 0.4)';
                hudCtx.lineWidth = 1;
                hudCtx.stroke();
                hudCtx.fillStyle = '#00ffc8';
                hudCtx.font = 'bold 9px "Segoe UI", monospace';
                hudCtx.fillText('ON', b3x + 9, b3y + 11);
            }

            // ─── RETICLE ───
            if (window.overlayKit.customReticle.value) {
                const cx = vw / 2, cy = vh / 2;
                const gap = 8, len = 12;
                hudCtx.strokeStyle = '#00e5ff';
                hudCtx.lineWidth = 1.5;
                hudCtx.shadowColor = 'rgba(0, 229, 255, 0.8)';
                hudCtx.shadowBlur = 8;
                hudCtx.beginPath();
                hudCtx.moveTo(cx, cy - gap);
                hudCtx.lineTo(cx, cy - gap - len);
                hudCtx.moveTo(cx, cy + gap);
                hudCtx.lineTo(cx, cy + gap + len);
                hudCtx.moveTo(cx - gap, cy);
                hudCtx.lineTo(cx - gap - len, cy);
                hudCtx.moveTo(cx + gap, cy);
                hudCtx.lineTo(cx + gap + len, cy);
                hudCtx.stroke();
                hudCtx.fillStyle = '#00e5ff';
                hudCtx.shadowColor = 'rgba(0, 229, 255, 1)';
                hudCtx.shadowBlur = 6;
                hudCtx.beginPath();
                hudCtx.arc(cx, cy, 2, 0, Math.PI * 2);
                hudCtx.fill();
                hudCtx.shadowBlur = 0;
            }

            // ─── BOX ESP ───
            if (window.overlayKit.cageStyle.value) {
                hudCtx.lineWidth = 2;
                hudCtx.shadowColor = 'rgba(255, 30, 60, 0.7)';
                hudCtx.shadowBlur = 6;
                hudCtx.beginPath();
                for (let i = 0; i < worldSnapshots.length; i += 4) {
                    const d = worldSnapshots[i+3];
                    const w = Math.max(10, 50 / d);
                    const h = Math.max(20, 100 / d);
                    const ex = ((worldSnapshots[i] + 1) / 2 * vw);
                    const ey = (vh - ((worldSnapshots[i+1] + 1) / 2 * vh));
                    const cSz = Math.min(w, h) * 0.3;
                    const lx = ex - w/2, rx = ex + w/2;
                    const ty = ey - h/2, by = ey + h/2;
                    hudCtx.moveTo(lx, ty + cSz);
                    hudCtx.lineTo(lx, ty);
                    hudCtx.lineTo(lx + cSz, ty);
                    hudCtx.moveTo(rx - cSz, ty);
                    hudCtx.lineTo(rx, ty);
                    hudCtx.lineTo(rx, ty + cSz);
                    hudCtx.moveTo(rx, by - cSz);
                    hudCtx.lineTo(rx, by);
                    hudCtx.lineTo(rx - cSz, by);
                    hudCtx.moveTo(lx + cSz, by);
                    hudCtx.lineTo(lx, by);
                    hudCtx.lineTo(lx, by - cSz);
                }
                hudCtx.strokeStyle = '#ff1e3c';
                hudCtx.stroke();
                hudCtx.lineWidth = 1;
                hudCtx.shadowBlur = 0;
                for (let i = 0; i < worldSnapshots.length; i += 4) {
                    const d = worldSnapshots[i+3];
                    const w = Math.max(10, 50 / d);
                    const h = Math.max(20, 100 / d);
                    const ex = ((worldSnapshots[i] + 1) / 2 * vw);
                    const ey = (vh - ((worldSnapshots[i+1] + 1) / 2 * vh));
                    hudCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    hudCtx.fillRect(ex - w/2 - 4, ey - h/2, 3, h);
                    const hg = hudCtx.createLinearGradient(0, ey - h/2, 0, ey + h/2);
                    hg.addColorStop(0, '#00ff64');
                    hg.addColorStop(1, '#ff1e3c');
                    hudCtx.fillStyle = hg;
                    hudCtx.fillRect(ex - w/2 - 4, ey - h/2, 3, h * 0.8);
                }
            }

            // ─── LASERS ───
            if (window.overlayKit.laserLines.value) {
                hudCtx.lineWidth = 1.2;
                hudCtx.shadowColor = 'rgba(255, 220, 0, 0.5)';
                hudCtx.shadowBlur = 4;
                hudCtx.beginPath();
                for (let i = 0; i < worldSnapshots.length; i += 4) {
                    const ex = ((worldSnapshots[i] + 1) / 2 * vw);
                    const ey = (vh - ((worldSnapshots[i+1] + 1) / 2 * vh));
                    hudCtx.moveTo(vw / 2, vh);
                    hudCtx.lineTo(ex, ey);
                }
                hudCtx.strokeStyle = '#ffdc00';
                hudCtx.stroke();
                hudCtx.shadowBlur = 0;
            }

            // ─── DOT MARKERS ───
            if (window.overlayKit.dotMark.value) {
                hudCtx.lineWidth = 2;
                hudCtx.shadowColor = 'rgba(0, 120, 255, 0.7)';
                hudCtx.shadowBlur = 5;
                for (let i = 0; i < worldSnapshots.length; i += 4) {
                    const ex = ((worldSnapshots[i] + 1) / 2 * vw);
                    const ey = (vh - ((worldSnapshots[i+1] + 1) / 2 * vh));
                    const sz = 6;
                    hudCtx.beginPath();
                    hudCtx.moveTo(ex, ey - sz);
                    hudCtx.lineTo(ex + sz, ey);
                    hudCtx.lineTo(ex, ey + sz);
                    hudCtx.lineTo(ex - sz, ey);
                    hudCtx.closePath();
                    hudCtx.strokeStyle = '#0078ff';
                    hudCtx.stroke();
                    hudCtx.fillStyle = 'rgba(0, 120, 255, 0.3)';
                    hudCtx.fill();
                }
                hudCtx.shadowBlur = 0;
            }

            // ─── AIM LOCK ───
            if (worldSnapshots.length > 0) {
                let bestDist = Number.MAX_VALUE, bestPt = null;

                for (let i = 0; i < worldSnapshots.length; i += 4) {
                    const nx = worldSnapshots[i], ny = worldSnapshots[i+1];
                    const dist = Math.sqrt(nx * nx + ny * ny);
                    if (dist < bestDist) { bestDist = dist; bestPt = [nx, ny]; }
                }

                const isRage = window.overlayKit.berserkFlag;
                const isMagOn = window.magnetActive;

                if (((tapHeld || isMagOn) && bestPt && bestDist <= (window.overlayKit.lockRadius.value * Math.PI / 180)) || (isRage && bestPt)) {

                    let deltaX = 0, deltaY = 0;
                    if (window.prevBestPt) {
                        const moved = Math.sqrt((bestPt[0] - window.prevBestPt[0])**2 + (bestPt[1] - window.prevBestPt[1])**2);
                        if (moved < 0.1) {
                            deltaX = (bestPt[0] - window.prevBestPt[0]) * 5.0;
                            deltaY = (bestPt[1] - window.prevBestPt[1]) * 5.0;
                        }
                    }

                    let tx = (bestPt[0] + deltaX) * (vw / 1.5);
                    let ty = (bestPt[1] + deltaY) * (vh / 1.5);

                    if (!isRage) {
                        const sm = window.overlayKit.lockSmooth.value;
                        const div = sm > 0 ? (sm * 4.0 + 8.0) : 4.0;
                        tx /= div;
                        ty /= div;
                        const mul = (window.overlayKit.lockPull.value / 100) * 1.5;
                        tx *= mul;
                        ty *= mul;
                    } else {
                        tx *= 2.0; ty *= 2.0;
                    }

                    nudgeMouse(tx, -ty);
                }

                if ((window.overlayKit.autoTap.value && bestPt && isMagOn) || (isRage && bestPt)) {
                    if (bestDist < 0.05 || isRage) {
                        if (!window.tapCooldown) {
                            ["mousedown", "mouseup"].forEach((evType, idx) => {
                                setTimeout(() => {
                                    if (gl.canvas) {
                                        gl.canvas.dispatchEvent(new MouseEvent(evType, { bubbles: true, cancelable: true, view: window, button: 0 }));
                                    }
                                }, idx * (isRage ? 10 : 20));
                            });
                            window.tapCooldown = true;
                            setTimeout(() => { window.tapCooldown = false; }, isRage ? 15 : 50);
                        }
                    }
                }
                window.prevBestPt = bestPt;
            } else {
                window.prevBestPt = null;
            }
            worldSnapshots.length = 0;
        }
    }
})();
