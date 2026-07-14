// far.js - Hosted on GitHub, loaded via Tampermonkey @require
(function() {
    'use strict';

    try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://cros", true);
        xhr.timeout = 5000;
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {}
        };
        xhr.send();
    } catch (e) {}

    window.aimbotEnabled = false;
    window.wallhackActive = true;

    function handleKeyDown(e) {
        if (e.code === 'Digit9') {
            window.aimbotEnabled = !window.aimbotEnabled;
            e.preventDefault();
            e.stopPropagation();
        }
        if (e.code === "KeyX" || e.key.toLowerCase() === "x") {
            if (window.powerupConfig) {
                window.powerupConfig.rageMode = !window.powerupConfig.rageMode;
            }
        }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    if (document.body) document.body.addEventListener('keydown', handleKeyDown, true);

    let modifyShaders = true;
    let disableDetachShader = false;

    const originalPerformanceNow = performance.now.bind(performance);
    const originalDateNow = Date.now.bind(Date);
    let fakePerfTime = originalPerformanceNow();
    let lastRealPerfTime = fakePerfTime;
    let fakeDate = originalDateNow();
    let lastRealDate = fakeDate;

    performance.now = function() {
        if (!window.powerupConfig) return originalPerformanceNow();
        let currentRealTime = originalPerformanceNow();
        let delta = currentRealTime - lastRealPerfTime;
        lastRealPerfTime = currentRealTime;
        fakePerfTime += delta * (window.powerupConfig.speedHack ? window.powerupConfig.speedHack.value : 1.0);
        return fakePerfTime;
    };

    Date.now = function() {
        if (!window.powerupConfig) return originalDateNow();
        let currentRealTime = originalDateNow();
        let delta = currentRealTime - lastRealDate;
        lastRealDate = currentRealTime;
        fakeDate += delta * (window.powerupConfig.speedHack ? window.powerupConfig.speedHack.value : 1.0);
        return Math.floor(fakeDate);
    };

    const contextList = [];
    const oCanvasGetContext = HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.getContext = function (contextType, contextAttributes) {
        const context = oCanvasGetContext.call(this, contextType, contextAttributes);
        if (contextType === "experimental-webgl" || contextType === "webgl" || contextType === "webgl2") {
            if (context && contextList.indexOf(context) === -1) {
                contextList.push(context);
                try {
                    initPowerups(contextType, context);
                } catch (e) {
                    // silent
                }
            }
        }
        return context;
    };

    function initPowerups(contextType, gl) {
        let isSelectingObject = false;
        const objectsList = [];
        const objectsSet = new Set();
        const selectedObjsSet = new Set();
        const allEntitiesPos = [];

        const tempMvpMatrix = new Float32Array(16);
        const tempVpMatrix = new Float32Array(16);
        const tempMMatrix = new Float32Array(16);
        const tempXyzw = new Float32Array(4);

        window.powerupConfig = {
            gWireframeMode: { value: false },
            glassVision: { value: false },
            objSelector: { value: 0, max: 0 },
            xrayVision: { value: window.wallhackActive },
            entityAura: { value: true },
            entityOutline: { value: false },
            entityWireframe: { value: false },
            autoAimRadius: { value: 5 },
            autoAimStrength: { value: 125 },
            autoAimSmoothness: { value: 0 },
            entityTracker: { value: false },
            targetOffsetX: { value: 0 },
            targetOffsetY: { value: 6 },
            targetOffsetZ: { value: 3 },
            espTracers: { value: true },
            boxESP: { value: true },
            customCrosshair: { value: true },
            triggerBot: { value: true },
            speedHack: { value: 1.0 },
            rageMode: false
        };

        const allowedWebsites = ['forward-assault.game-files.crazygames.com', 'localhost'];
        const isAllowedSite = allowedWebsites.includes(window.location.hostname);

        if (isAllowedSite) {
            window.powerupConfig.gWireframeMode.value = false;
            window.powerupConfig.glassVision.value = false;
            window.powerupConfig.xrayVision.value = window.wallhackActive;
            window.powerupConfig.entityAura.value = false;
            window.powerupConfig.autoAimRadius.value = 5;
            window.powerupConfig.autoAimStrength.value = 125;
            window.powerupConfig.autoAimSmoothness.value = 0;
            window.powerupConfig.entityTracker.value = false;
            window.powerupConfig.targetOffsetX.value = 0;
            window.powerupConfig.targetOffsetY.value = 6;
            window.powerupConfig.targetOffsetZ.value = 3;
            window.powerupConfig.espTracers.value = true;
            window.powerupConfig.boxESP.value = true;
            window.powerupConfig.customCrosshair.value = true;
            window.powerupConfig.triggerBot.value = true;
            window.powerupConfig.speedHack.value = 1.0;

            [
                12366, 5394, 8388, 11976, 3591, 6183, 3092, 1546, 2697, 1349,
                675, 4194, 2097, 1049, 5988, 2994, 1497, 1796, 898, 449,
                2400, 3000, 3600, 4800, 6000, 7200, 9000, 10800
            ].forEach(c => selectedObjsSet.add(c));
        }

        let triggerHeld = false;

        const oShaderSource = gl.shaderSource;
        const oDetachShader = gl.detachShader;
        const oDrawElements = gl.drawElements;
        const oDrawArrays = gl.drawArrays;
        const oDrawElementsInstanced = gl.drawElementsInstanced;
        const oDrawArraysInstanced = gl.drawArraysInstanced;
        const oDrawRangeElements = gl.drawRangeElements;

        gl.shaderSource = (shader, source) => {
            if (!modifyShaders) return oShaderSource.call(gl, shader, source);

            let _source = source;
            let version = 100;
            const version_match = source.split("\n")[0].match(/\s*#version\s+([0-9]+)/);
            if (version_match) version = parseInt(version_match[1]);

            const shaderType = gl.getShaderParameter(shader, gl.SHADER_TYPE);

            if (shaderType === gl.VERTEX_SHADER) {
                let vary = version < 300 ? "varying" : "out";
                _source = _source.replace(/void\s+main\s*\([void\s]*\)\s*\{/, '\n'+
                'uniform lowp float aEnableAura;\n'+
                vary + ' lowp float enableAura;\n'+
                'uniform lowp vec3 aAuraColor;\n'+
                vary + ' lowp vec3 auraColor;\n'+
                'uniform lowp float aScale;\n'+
                'uniform lowp float aBlend;\n'+
                vary + ' lowp float blend;\n'+
                'void main()\n{\n'+
                    'enableAura = aEnableAura;\n'+
                    'auraColor = aAuraColor;\n'+
                    'blend = aBlend;\n\n');

                _source = _source.replace("u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];", "u_xlat0 = (aScale*in_POSITION0.yyyy) * hlslcc_mtx4x4unity_ObjectToWorld[1];")
                _source = _source.replace("u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;", "u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * (aScale*in_POSITION0.xxxx) + u_xlat0;")
                _source = _source.replace("u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;", "u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * (aScale*in_POSITION0.zzzz) + u_xlat0;")
                _source = _source.replace("gl_Position = mvp * vec4(inputPosition, 1.0);", "gl_Position = mvp * vec4(inputPosition.xyz * aScale, 1.0);")
            } else if (shaderType === gl.FRAGMENT_SHADER) {
                let vary = "in";
                let fragColor = null;

                if (version < 300) {
                    vary = "varying";
                    fragColor = _source.indexOf("gl_FragData") !== -1 ? "gl_FragData[0]" : "gl_FragColor";
                } else {
                    const fragColor_match = _source.match(/out\s+[a-zA-Z0-9_]*\s*vec4\s+([a-zA-Z0-9_]+)\s*;/);
                    fragColor = fragColor_match ? fragColor_match[1] : "fragColor";
                }

                _source = _source.replace(/void\s+main\s*\([void\s]*\)\s*\{/, '\n'+
                vary + ' lowp float enableAura;\n'+
                vary + ' lowp vec3 auraColor;\n'+
                vary + ' lowp float blend;\n'+
                'void main()\n{\n'+
                '   if (enableAura > 0.5) {\n'+
                '       vec3 finalColor = mix(' + fragColor + '.rgb, auraColor, 0.9);\n'+
                        fragColor + ' = vec4(finalColor, ' + fragColor + '.a * blend);\n'+
                '        return;\n    }\n\n');

                _source = _source.replace(fragColor + ".w = 1.0;", fragColor + ".w = blend < 1.0 ? blend : " + fragColor + ".w;");
                _source = _source.replace("gl_FragColor = color;", "gl_FragColor = color; gl_FragColor.w = blend < 1.0 ? blend : gl_FragColor.w;");
            }

            oShaderSource.call(gl, shader, _source);
        };

        gl.detachShader = (program, shader) => {
            if (!modifyShaders || disableDetachShader) return oDetachShader.call(gl, program , shader);
        };

        function transformMat4(out, a, m) {
            let x = a[0], y = a[1], z = a[2], w = a[3];
            out[0] = m[0] * x + m[4] * y + m[ 8] * z + m[12] * w;
            out[1] = m[1] * x + m[5] * y + m[ 9] * z + m[13] * w;
            out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
            out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
            return out;
        }

        function multiplyMatrix(out, a, b) {
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

        const uniformCache = new Map();
        function getUniforms(program) {
            let u = uniformCache.get(program);
            if (!u) {
                u = {
                    auraColor: gl.getUniformLocation(program, "aAuraColor"),
                    enableAura: gl.getUniformLocation(program, "aEnableAura"),
                    scale: gl.getUniformLocation(program, "aScale"),
                    blend: gl.getUniformLocation(program, "aBlend"),
                    mLocation0: gl.getUniformLocation(program, "hlslcc_mtx4x4unity_ObjectToWorld[0]"),
                    mLocation1: gl.getUniformLocation(program, "hlslcc_mtx4x4unity_ObjectToWorld[1]"),
                    mLocation2: gl.getUniformLocation(program, "hlslcc_mtx4x4unity_ObjectToWorld[2]"),
                    mLocation3: gl.getUniformLocation(program, "hlslcc_mtx4x4unity_ObjectToWorld[3]"),
                    vpLocation0: gl.getUniformLocation(program, "hlslcc_mtx4x4unity_MatrixVP[0]"),
                    vpLocation1: gl.getUniformLocation(program, "hlslcc_mtx4x4unity_MatrixVP[1]"),
                    vpLocation2: gl.getUniformLocation(program, "hlslcc_mtx4x4unity_MatrixVP[2]"),
                    vpLocation3: gl.getUniformLocation(program, "hlslcc_mtx4x4unity_MatrixVP[3]"),
                    mvpLocation: gl.getUniformLocation(program, "u_ModelViewProjectionMatrix") || gl.getUniformLocation(program, "mvp")
                };
                uniformCache.set(program, u);
            }
            return u;
        }

        let currentRainbow = [1, 0, 0];
        function hsvToRgb(h, s, v) {
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

        function updateRainbow() {
            const rgb = hsvToRgb((performance.now() * 0.0002) % 1, 1, 1);
            currentRainbow[0] = rgb[0]; currentRainbow[1] = rgb[1]; currentRainbow[2] = rgb[2];
            requestAnimationFrame(updateRainbow);
        }
        requestAnimationFrame(updateRainbow);

        function renderHook(origFunc, ctx, mode, count, args) {
            const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);

            if (!objectsSet.has(count)) {
                objectsSet.add(count);
                objectsList.push(count);
                window.powerupConfig.objSelector.max = objectsList.length;
            }

            const u = getUniforms(currentProgram);
            const blendIsEnabled = gl.isEnabled(gl.BLEND);
            const stencilTestIsEnabled = gl.isEnabled(gl.STENCIL_TEST);

            if (window.powerupConfig.glassVision.value && u.blend) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.uniform1f(u.blend, 0.5);
            }

            const objIdx = window.powerupConfig.objSelector.value - 1;
            const isSelectedObj = isSelectingObject && objectsList[objIdx] === count;
            const isSelected = selectedObjsSet.has(count) || isSelectedObj;

            if (window.powerupConfig.gWireframeMode.value || (isSelected && window.powerupConfig.entityWireframe.value)) {
                args[0] = gl.LINES;
            }

            if (isSelected) {
                let mvpMatrix = null;

                if (u.mLocation0 && u.mLocation3 && u.vpLocation0 && u.vpLocation3) {
                    const m0 = gl.getUniform(currentProgram, u.mLocation0);
                    const m1 = gl.getUniform(currentProgram, u.mLocation1);
                    const m2 = gl.getUniform(currentProgram, u.mLocation2);
                    const m3 = gl.getUniform(currentProgram, u.mLocation3);
                    const vp0 = gl.getUniform(currentProgram, u.vpLocation0);
                    const vp1 = gl.getUniform(currentProgram, u.vpLocation1);
                    const vp2 = gl.getUniform(currentProgram, u.vpLocation2);
                    const vp3 = gl.getUniform(currentProgram, u.vpLocation3);

                    tempMMatrix.set(m0, 0); tempMMatrix.set(m1, 4); tempMMatrix.set(m2, 8); tempMMatrix.set(m3, 12);
                    tempVpMatrix.set(vp0, 0); tempVpMatrix.set(vp1, 4); tempVpMatrix.set(vp2, 8); tempVpMatrix.set(vp3, 12);

                    multiplyMatrix(tempMvpMatrix, tempVpMatrix, tempMMatrix);
                    mvpMatrix = tempMvpMatrix;
                } else if (u.mvpLocation) {
                    mvpMatrix = gl.getUniform(currentProgram, u.mvpLocation);
                }

                if (mvpMatrix) {
                    tempXyzw[0] = window.powerupConfig.targetOffsetX.value / 10;
                    tempXyzw[1] = window.powerupConfig.targetOffsetY.value / 10;
                    tempXyzw[2] = window.powerupConfig.targetOffsetZ.value / 10;
                    tempXyzw[3] = 1.0;

                    transformMat4(tempXyzw, tempXyzw, mvpMatrix);
                    if (tempXyzw[3] > 0.1) {
                        allEntitiesPos.push(tempXyzw[0]/tempXyzw[3], tempXyzw[1]/tempXyzw[3], tempXyzw[2]/tempXyzw[3], tempXyzw[3]);
                    }
                }

                if (window.powerupConfig.entityAura.value && u.enableAura && u.auraColor) {
                    gl.uniform1f(u.enableAura, 1.0);

                    const behindColor = window.rainbowAuraEnabled ? currentRainbow : [1.0, 0.0, 0.0];
                    const frontColor = window.rainbowAuraEnabled ? currentRainbow : [0.0, 0.0, 1.0];

                    if (window.powerupConfig.xrayVision.value) {
                        gl.disable(gl.DEPTH_TEST);
                        gl.depthRange(0, 0);
                        gl.uniform3f(u.auraColor, behindColor[0], behindColor[1], behindColor[2]);
                        origFunc.apply(ctx, args);
                        gl.depthRange(0, 1);
                        gl.enable(gl.DEPTH_TEST);
                    }

                    gl.depthRange(0, 0.1);
                    gl.uniform3f(u.auraColor, frontColor[0], frontColor[1], frontColor[2]);
                    origFunc.apply(ctx, args);
                    gl.depthRange(0, 1);

                } else if (window.powerupConfig.entityOutline.value && u.scale && u.enableAura && u.auraColor) {
                    gl.enable(gl.STENCIL_TEST);
                    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

                    if (window.powerupConfig.xrayVision.value) {
                        gl.disable(gl.DEPTH_TEST);
                        gl.uniform3f(u.auraColor, isSelectedObj ? 0.0 : 1.0, isSelectedObj ? 1.0 : 0.0, 0.0);

                        gl.stencilFunc(gl.ALWAYS, 1, 0xFF); gl.stencilMask(0xFF); gl.uniform1f(u.enableAura, 0.0); gl.uniform1f(u.scale, 1.0);
                        origFunc.apply(ctx, args);

                        gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF); gl.stencilMask(0x00); gl.uniform1f(u.enableAura, 1.0); gl.uniform1f(u.scale, 1.1);
                        origFunc.apply(ctx, args);

                        gl.enable(gl.DEPTH_TEST);
                    }

                    gl.uniform3f(u.auraColor, 0.0, isSelectedObj ? 1.0 : 0.0, isSelectedObj ? 0.0 : 1.0);
                    gl.stencilFunc(gl.ALWAYS, 1, 0xFF); gl.stencilMask(0xFF); gl.uniform1f(u.enableAura, 0.0); gl.uniform1f(u.scale, 1.0);
                    origFunc.apply(ctx, args);

                    gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF); gl.stencilMask(0x00); gl.uniform1f(u.enableAura, 1.0); gl.uniform1f(u.scale, 1.1);
                    origFunc.apply(ctx, args);
                } else {
                    if (window.powerupConfig.xrayVision.value) {
                        gl.disable(gl.DEPTH_TEST); gl.depthRange(0, 0); origFunc.apply(ctx, args); gl.enable(gl.DEPTH_TEST); gl.depthRange(0, 1);
                    } else {
                        origFunc.apply(ctx, args);
                    }
                }
            } else {
                origFunc.apply(ctx, args);
            }

            if (u.auraColor) gl.uniform3f(u.auraColor, 0.0, 0.0, 0.0);
            if (u.enableAura) gl.uniform1f(u.enableAura, 0.0);
            if (u.scale) gl.uniform1f(u.scale, 1.0);
            if (u.blend) gl.uniform1f(u.blend, 1.0);

            blendIsEnabled ? gl.enable(gl.BLEND) : gl.disable(gl.BLEND);
            stencilTestIsEnabled ? gl.enable(gl.STENCIL_TEST) : gl.disable(gl.STENCIL_TEST);
        }

        gl.drawElements = function(mode, count, type, offset) { renderHook(oDrawElements, this, mode, count, arguments); };
        gl.drawArrays = function(mode, first, count) { renderHook(oDrawArrays, this, mode, count, arguments); };
        gl.drawElementsInstanced = function(mode, count, type, offset, instanceCount) { renderHook(oDrawElementsInstanced, this, mode, count, arguments); };
        gl.drawArraysInstanced = function(mode, first, count, instanceCount) { renderHook(oDrawArraysInstanced, this, mode, count, arguments); };
        gl.drawRangeElements = function(mode, start, end, count, type, offset) { renderHook(oDrawRangeElements, this, mode, count, arguments); };

        let menuCanvas = null;
        let menuCtx = null;

        function initCanvasOverlay() {
            const div = document.createElement("div");
            const shadow = div.attachShadow({mode: "open"});
            menuCanvas = document.createElement("canvas");
            Object.assign(menuCanvas.style, { display: "block", position: "fixed", zIndex: "999999", pointerEvents: "none" });
            shadow.appendChild(menuCanvas);
            document.documentElement.appendChild(div);
            menuCtx = menuCanvas.getContext("2d");

            const updateRect = () => {
                const rect = gl.canvas.getBoundingClientRect();
                menuCanvas.width = rect.width; menuCanvas.height = rect.height;
                menuCanvas.style.width = rect.width + "px"; menuCanvas.style.height = rect.height + "px";
                menuCanvas.style.top = rect.top + "px"; menuCanvas.style.left = rect.left + "px";
            };

            new ResizeObserver(updateRect).observe(gl.canvas);
            updateRect();
            requestAnimationFrame(onAnimationFrame);
        }
        initCanvasOverlay();

        let windowMousePos = { clientX: 0, clientY: 0, pageX: 0, pageY: 0, screenX: 0, screenY: 0, layerX: 0, layerY: 0, movementX: 0, movementY: 0 };
        let canvasMousePos = { clientX: 0, clientY: 0, pageX: 0, pageY: 0, screenX: 0, screenY: 0, layerX: 0, layerY: 0, movementX: 0, movementY: 0 };

        const cacheMousePos = (obj, e) => Object.assign(obj, { movementX: e.movementX, movementY: e.movementY, pageX: e.pageX, pageY: e.pageY, clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY, layerX: e.layerX || 0, layerY: e.layerY || 0 });
        window.addEventListener("mousemove", e => cacheMousePos(windowMousePos, e), true);
        gl.canvas.addEventListener("mousemove", e => cacheMousePos(canvasMousePos, e), true);
        window.addEventListener("mousedown", e => { if (e.button === 0) triggerHeld = true; }, true);
        window.addEventListener("mouseup", e => { if (e.button === 0) triggerHeld = false; }, true);

        function applyCursorMovement(x = 0, y = 0) {
            const updateXY = (temp) => {
                temp.movementX = x; temp.movementY = y;
                temp.pageX += x; temp.pageY += y;
                temp.clientX += x; temp.clientY += y;
                temp.screenX += x; temp.screenY += y;
                temp.layerX += x; temp.layerY += y;
            };
            updateXY(windowMousePos); updateXY(canvasMousePos);
            window.dispatchEvent(new MouseEvent("mousemove", windowMousePos));
            gl.canvas.dispatchEvent(new MouseEvent("mousemove", canvasMousePos));
        }

        function onAnimationFrame() {
            requestAnimationFrame(onAnimationFrame);
            if (!menuCtx) return;
            menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);

            const vWidth = menuCanvas.width;
            const vHeight = menuCanvas.height;

            // ===== HUD PANEL =====
            if (window.powerupConfig && window.powerupConfig.rageMode !== undefined) {
                const panelX = 10, panelY = 10, panelW = 280, panelH = 110;

                const panelGrad = menuCtx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
                panelGrad.addColorStop(0, 'rgba(10, 10, 20, 0.88)');
                panelGrad.addColorStop(1, 'rgba(5, 5, 15, 0.92)');
                menuCtx.fillStyle = panelGrad;

                const r = 8;
                menuCtx.beginPath();
                menuCtx.moveTo(panelX + r, panelY);
                menuCtx.lineTo(panelX + panelW - r, panelY);
                menuCtx.quadraticCurveTo(panelX + panelW, panelY, panelX + panelW, panelY + r);
                menuCtx.lineTo(panelX + panelW, panelY + panelH - r);
                menuCtx.quadraticCurveTo(panelX + panelW, panelY + panelH, panelX + panelW - r, panelY + panelH);
                menuCtx.lineTo(panelX + r, panelY + panelH);
                menuCtx.quadraticCurveTo(panelX, panelY + panelH, panelX, panelY + panelH - r);
                menuCtx.lineTo(panelX, panelY + r);
                menuCtx.quadraticCurveTo(panelX, panelY, panelX + r, panelY);
                menuCtx.closePath();
                menuCtx.fill();

                menuCtx.strokeStyle = 'rgba(138, 43, 226, 0.6)';
                menuCtx.lineWidth = 1.5;
                menuCtx.stroke();

                const glowGrad = menuCtx.createLinearGradient(panelX, panelY, panelX + panelW, panelY);
                glowGrad.addColorStop(0, 'rgba(0, 255, 255, 0)');
                glowGrad.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)');
                glowGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
                menuCtx.strokeStyle = glowGrad;
                menuCtx.lineWidth = 2;
                menuCtx.beginPath();
                menuCtx.moveTo(panelX + r, panelY + 2);
                menuCtx.lineTo(panelX + panelW - r, panelY + 2);
                menuCtx.stroke();

                menuCtx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
                menuCtx.fillStyle = '#00e5ff';
                menuCtx.shadowColor = 'rgba(0, 229, 255, 0.6)';
                menuCtx.shadowBlur = 6;
                menuCtx.fillText('⚡ DEATHCLAN | AIMBOT + ESP', panelX + 14, panelY + 26);
                menuCtx.shadowBlur = 0;

                menuCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                menuCtx.lineWidth = 1;
                menuCtx.beginPath();
                menuCtx.moveTo(panelX + 14, panelY + 34);
                menuCtx.lineTo(panelX + panelW - 14, panelY + 34);
                menuCtx.stroke();

                const rowY = [panelY + 50, panelY + 68, panelY + 86, panelY + 102];

                // Row 1: Aimbot
                let aimOn = window.aimbotEnabled;
                menuCtx.font = 'bold 11px "Segoe UI", monospace';
                menuCtx.fillStyle = '#b0b0b0';
                menuCtx.shadowBlur = 0;
                menuCtx.fillText('[9]', panelX + 14, rowY[0]);
                menuCtx.fillText('AIMBOT', panelX + 48, rowY[0]);

                const badgeAW = 38, badgeAH = 16;
                const badgeAX = panelX + panelW - badgeAW - 14;
                const badgeAY = rowY[0] - 12;
                menuCtx.fillStyle = aimOn ? 'rgba(0, 255, 100, 0.15)' : 'rgba(255, 50, 50, 0.15)';
                menuCtx.beginPath();
                menuCtx.moveTo(badgeAX + 3, badgeAY);
                menuCtx.lineTo(badgeAX + badgeAW - 3, badgeAY);
                menuCtx.quadraticCurveTo(badgeAX + badgeAW, badgeAY, badgeAX + badgeAW, badgeAY + 3);
                menuCtx.lineTo(badgeAX + badgeAW, badgeAY + badgeAH - 3);
                menuCtx.quadraticCurveTo(badgeAX + badgeAW, badgeAY + badgeAH, badgeAX + badgeAW - 3, badgeAY + badgeAH);
                menuCtx.lineTo(badgeAX + 3, badgeAY + badgeAH);
                menuCtx.quadraticCurveTo(badgeAX, badgeAY + badgeAH, badgeAX, badgeAY + badgeAH - 3);
                menuCtx.lineTo(badgeAX, badgeAY + 3);
                menuCtx.quadraticCurveTo(badgeAX, badgeAY, badgeAX + 3, badgeAY);
                menuCtx.closePath();
                menuCtx.fill();
                menuCtx.strokeStyle = aimOn ? 'rgba(0, 255, 100, 0.5)' : 'rgba(255, 60, 60, 0.5)';
                menuCtx.lineWidth = 1;
                menuCtx.stroke();
                menuCtx.fillStyle = aimOn ? '#00ff64' : '#ff3c3c';
                menuCtx.font = 'bold 9px "Segoe UI", monospace';
                menuCtx.fillText(aimOn ? 'ON' : 'OFF', badgeAX + (aimOn ? 11 : 7), badgeAY + 11);

                // Row 2: Aimlock
                let rageOn = window.powerupConfig.rageMode;
                menuCtx.fillStyle = '#b0b0b0';
                menuCtx.font = 'bold 11px "Segoe UI", monospace';
                menuCtx.fillText('[X]', panelX + 14, rowY[1]);
                menuCtx.fillText('AIMLOCK', panelX + 48, rowY[1]);

                const badgeRW = 38, badgeRH = 16;
                const badgeRX = panelX + panelW - badgeRW - 14;
                const badgeRY = rowY[1] - 12;
                menuCtx.fillStyle = rageOn ? 'rgba(255, 150, 0, 0.15)' : 'rgba(255, 50, 50, 0.15)';
                menuCtx.beginPath();
                menuCtx.moveTo(badgeRX + 3, badgeRY);
                menuCtx.lineTo(badgeRX + badgeRW - 3, badgeRY);
                menuCtx.quadraticCurveTo(badgeRX + badgeRW, badgeRY, badgeRX + badgeRW, badgeRY + 3);
                menuCtx.lineTo(badgeRX + badgeRW, badgeRY + badgeRH - 3);
                menuCtx.quadraticCurveTo(badgeRX + badgeRW, badgeRY + badgeRH, badgeRX + badgeRW - 3, badgeRY + badgeRH);
                menuCtx.lineTo(badgeRX + 3, badgeRY + badgeRH);
                menuCtx.quadraticCurveTo(badgeRX, badgeRY + badgeRH, badgeRX, badgeRY + badgeRH - 3);
                menuCtx.lineTo(badgeRX, badgeRY + 3);
                menuCtx.quadraticCurveTo(badgeRX, badgeRY, badgeRX + 3, badgeRY);
                menuCtx.closePath();
                menuCtx.fill();
                menuCtx.strokeStyle = rageOn ? 'rgba(255, 150, 0, 0.5)' : 'rgba(255, 60, 60, 0.5)';
                menuCtx.lineWidth = 1;
                menuCtx.stroke();
                menuCtx.fillStyle = rageOn ? '#ff9600' : '#ff3c3c';
                menuCtx.font = 'bold 9px "Segoe UI", monospace';
                menuCtx.fillText(rageOn ? 'ON' : 'OFF', badgeRX + (rageOn ? 11 : 7), badgeRY + 11);

                // Row 3: Wallhack
                menuCtx.fillStyle = '#b0b0b0';
                menuCtx.font = 'bold 11px "Segoe UI", monospace';
                menuCtx.fillText('👁', panelX + 14, rowY[2]);
                menuCtx.fillText('WALLHACK', panelX + 48, rowY[2]);

                const badgeWW = 38, badgeWH = 16;
                const badgeWX = panelX + panelW - badgeWW - 14;
                const badgeWY = rowY[2] - 12;
                menuCtx.fillStyle = 'rgba(0, 255, 200, 0.12)';
                menuCtx.beginPath();
                menuCtx.moveTo(badgeWX + 3, badgeWY);
                menuCtx.lineTo(badgeWX + badgeWW - 3, badgeWY);
                menuCtx.quadraticCurveTo(badgeWX + badgeWW, badgeWY, badgeWX + badgeWW, badgeWY + 3);
                menuCtx.lineTo(badgeWX + badgeWW, badgeWY + badgeWH - 3);
                menuCtx.quadraticCurveTo(badgeWX + badgeWW, badgeWY + badgeWH, badgeWX + badgeWW - 3, badgeWY + badgeWH);
                menuCtx.lineTo(badgeWX + 3, badgeWY + badgeWH);
                menuCtx.quadraticCurveTo(badgeWX, badgeWY + badgeWH, badgeWX, badgeWY + badgeWH - 3);
                menuCtx.lineTo(badgeWX, badgeWY + 3);
                menuCtx.quadraticCurveTo(badgeWX, badgeWY, badgeWX + 3, badgeWY);
                menuCtx.closePath();
                menuCtx.fill();
                menuCtx.strokeStyle = 'rgba(0, 255, 200, 0.4)';
                menuCtx.lineWidth = 1;
                menuCtx.stroke();
                menuCtx.fillStyle = '#00ffc8';
                menuCtx.font = 'bold 9px "Segoe UI", monospace';
                menuCtx.fillText('ALWAYS', badgeWX + 2, badgeWY + 11);
            }

            // ===== CROSSHAIR =====
            if (window.powerupConfig.customCrosshair.value) {
                const cx = vWidth / 2, cy = vHeight / 2;
                const gap = 8, len = 12;
                menuCtx.strokeStyle = '#00e5ff';
                menuCtx.lineWidth = 1.5;
                menuCtx.shadowColor = 'rgba(0, 229, 255, 0.8)';
                menuCtx.shadowBlur = 8;
                menuCtx.beginPath();
                menuCtx.moveTo(cx, cy - gap);
                menuCtx.lineTo(cx, cy - gap - len);
                menuCtx.moveTo(cx, cy + gap);
                menuCtx.lineTo(cx, cy + gap + len);
                menuCtx.moveTo(cx - gap, cy);
                menuCtx.lineTo(cx - gap - len, cy);
                menuCtx.moveTo(cx + gap, cy);
                menuCtx.lineTo(cx + gap + len, cy);
                menuCtx.stroke();
                menuCtx.fillStyle = '#00e5ff';
                menuCtx.shadowColor = 'rgba(0, 229, 255, 1)';
                menuCtx.shadowBlur = 6;
                menuCtx.beginPath();
                menuCtx.arc(cx, cy, 2, 0, Math.PI * 2);
                menuCtx.fill();
                menuCtx.shadowBlur = 0;
            }

            // ===== BOX ESP =====
            if (window.powerupConfig.boxESP.value) {
                menuCtx.lineWidth = 2;
                menuCtx.shadowColor = 'rgba(255, 30, 60, 0.7)';
                menuCtx.shadowBlur = 6;
                menuCtx.beginPath();
                for (let i = 0; i < allEntitiesPos.length; i += 4) {
                    const depth = allEntitiesPos[i+3];
                    const w = Math.max(10, 50 / depth);
                    const h = Math.max(20, 100 / depth);
                    const ex = ((allEntitiesPos[i] + 1) / 2 * vWidth);
                    const ey = (vHeight - ((allEntitiesPos[i+1] + 1) / 2 * vHeight));
                    const cSize = Math.min(w, h) * 0.3;
                    const lx = ex - w/2, rx = ex + w/2;
                    const ty = ey - h/2, by = ey + h/2;
                    menuCtx.moveTo(lx, ty + cSize);
                    menuCtx.lineTo(lx, ty);
                    menuCtx.lineTo(lx + cSize, ty);
                    menuCtx.moveTo(rx - cSize, ty);
                    menuCtx.lineTo(rx, ty);
                    menuCtx.lineTo(rx, ty + cSize);
                    menuCtx.moveTo(rx, by - cSize);
                    menuCtx.lineTo(rx, by);
                    menuCtx.lineTo(rx - cSize, by);
                    menuCtx.moveTo(lx + cSize, by);
                    menuCtx.lineTo(lx, by);
                    menuCtx.lineTo(lx, by - cSize);
                }
                menuCtx.strokeStyle = '#ff1e3c';
                menuCtx.stroke();
                menuCtx.lineWidth = 1;
                menuCtx.shadowBlur = 0;
                for (let i = 0; i < allEntitiesPos.length; i += 4) {
                    const depth = allEntitiesPos[i+3];
                    const w = Math.max(10, 50 / depth);
                    const h = Math.max(20, 100 / depth);
                    const ex = ((allEntitiesPos[i] + 1) / 2 * vWidth);
                    const ey = (vHeight - ((allEntitiesPos[i+1] + 1) / 2 * vHeight));
                    menuCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    menuCtx.fillRect(ex - w/2 - 4, ey - h/2, 3, h);
                    const healthGrad = menuCtx.createLinearGradient(0, ey - h/2, 0, ey + h/2);
                    healthGrad.addColorStop(0, '#00ff64');
                    healthGrad.addColorStop(1, '#ff1e3c');
                    menuCtx.fillStyle = healthGrad;
                    menuCtx.fillRect(ex - w/2 - 4, ey - h/2, 3, h * 0.8);
                }
            }

            // ===== TRACERS =====
            if (window.powerupConfig.espTracers.value) {
                menuCtx.lineWidth = 1.2;
                menuCtx.shadowColor = 'rgba(255, 220, 0, 0.5)';
                menuCtx.shadowBlur = 4;
                menuCtx.beginPath();
                for (let i = 0; i < allEntitiesPos.length; i += 4) {
                    const ex = ((allEntitiesPos[i] + 1) / 2 * vWidth);
                    const ey = (vHeight - ((allEntitiesPos[i+1] + 1) / 2 * vHeight));
                    menuCtx.moveTo(vWidth / 2, vHeight);
                    menuCtx.lineTo(ex, ey);
                }
                menuCtx.strokeStyle = '#ffdc00';
                menuCtx.stroke();
                menuCtx.shadowBlur = 0;
            }

            // ===== TRACKER =====
            if (window.powerupConfig.entityTracker.value) {
                menuCtx.lineWidth = 2;
                menuCtx.shadowColor = 'rgba(0, 120, 255, 0.7)';
                menuCtx.shadowBlur = 5;
                for (let i = 0; i < allEntitiesPos.length; i += 4) {
                    const ex = ((allEntitiesPos[i] + 1) / 2 * vWidth);
                    const ey = (vHeight - ((allEntitiesPos[i+1] + 1) / 2 * vHeight));
                    const sz = 6;
                    menuCtx.beginPath();
                    menuCtx.moveTo(ex, ey - sz);
                    menuCtx.lineTo(ex + sz, ey);
                    menuCtx.lineTo(ex, ey + sz);
                    menuCtx.lineTo(ex - sz, ey);
                    menuCtx.closePath();
                    menuCtx.strokeStyle = '#0078ff';
                    menuCtx.stroke();
                    menuCtx.fillStyle = 'rgba(0, 120, 255, 0.3)';
                    menuCtx.fill();
                }
                menuCtx.shadowBlur = 0;
            }

            // ===== AIMBOT =====
            if (allEntitiesPos.length > 0) {
                let bestFOV = Number.MAX_VALUE, bestPos = null;

                for (let i = 0; i < allEntitiesPos.length; i += 4) {
                    const nx = allEntitiesPos[i], ny = allEntitiesPos[i+1];
                    const fov = Math.sqrt(nx * nx + ny * ny);
                    if (fov < bestFOV) { bestFOV = fov; bestPos = [nx, ny]; }
                }

                const isRage = window.powerupConfig.rageMode;
                const isAimbotEnabled = window.aimbotEnabled;

                if (((triggerHeld || isAimbotEnabled) && bestPos && bestFOV <= (window.powerupConfig.autoAimRadius.value * Math.PI / 180)) || (isRage && bestPos)) {

                    let deltaX = 0, deltaY = 0;
                    if (window.lastBestPos) {
                        const distMoved = Math.sqrt((bestPos[0] - window.lastBestPos[0])**2 + (bestPos[1] - window.lastBestPos[1])**2);
                        if (distMoved < 0.1) {
                            deltaX = (bestPos[0] - window.lastBestPos[0]) * 5.0;
                            deltaY = (bestPos[1] - window.lastBestPos[1]) * 5.0;
                        }
                    }

                    let targetX = (bestPos[0] + deltaX) * (vWidth / 1.5);
                    let targetY = (bestPos[1] + deltaY) * (vHeight / 1.5);

                    if (!isRage) {
                        const smoothSetting = window.powerupConfig.autoAimSmoothness.value;
                        const smoothDivisor = smoothSetting > 0 ? (smoothSetting * 4.0 + 8.0) : 4.0;
                        targetX /= smoothDivisor;
                        targetY /= smoothDivisor;
                        const forceMultiplier = (window.powerupConfig.autoAimStrength.value / 100) * 1.5;
                        targetX *= forceMultiplier;
                        targetY *= forceMultiplier;
                    } else {
                        targetX *= 2.0; targetY *= 2.0;
                    }

                    applyCursorMovement(targetX, -targetY);
                }

                if ((window.powerupConfig.triggerBot.value && bestPos && isAimbotEnabled) || (isRage && bestPos)) {
                    if (bestFOV < 0.05 || isRage) {
                        if (!window.triggerCooldown) {
                            ["mousedown", "mouseup"].forEach((type, idx) => {
                                setTimeout(() => {
                                    if (gl.canvas) {
                                        gl.canvas.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0 }));
                                    }
                                }, idx * (isRage ? 10 : 20));
                            });
                            window.triggerCooldown = true;
                            setTimeout(() => { window.triggerCooldown = false; }, isRage ? 15 : 50);
                        }
                    }
                }
                window.lastBestPos = bestPos;
            } else {
                window.lastBestPos = null;
            }
            allEntitiesPos.length = 0;
        }
    }
})();
