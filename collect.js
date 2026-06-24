/**
 * Splash Page Signal Collector
 * =============================
 */
(function () {
  "use strict";

  var SIGNAL_BACKEND = "https://event.naww.io";
  var SDK_VERSION = "0.1.0";
  var INSTALL_ID_KEY = "id";

  function generateUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      var bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      var hex = Array.from(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20,32)].join("-");
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getOrCreateInstallId() {
    try {
      var existing = localStorage.getItem(INSTALL_ID_KEY);
      if (existing) return existing;
    } catch (e) { }
    var id = generateUUID();
    try { localStorage.setItem(INSTALL_ID_KEY, id); } catch (e) { }
    return id;
  }

  function collectSignals() {
    var s = {};
    try { s.userAgent = navigator.userAgent; } catch (e) { }
    try { s.platform = navigator.platform; } catch (e) { }
    try { s.language = navigator.language; s.languages = Array.from(navigator.languages || []); } catch (e) { }
    try {
      s.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      s.timezoneOffset = new Date().getTimezoneOffset();
    } catch (e) { }
    try { s.screenWidth = screen.width; s.screenHeight = screen.height; s.colorDepth = screen.colorDepth; } catch (e) { }
    try { s.devicePixelRatio = window.devicePixelRatio; } catch (e) { }
    try { s.hardwareConcurrency = navigator.hardwareConcurrency; } catch (e) { }
    try { s.maxTouchPoints = navigator.maxTouchPoints; } catch (e) { }
    try { s.cookieEnabled = navigator.cookieEnabled; } catch (e) { }
    try { if (navigator.deviceMemory) s.deviceMemory = navigator.deviceMemory; } catch (e) { }

    try {
      var t = "__splash_test__";
      localStorage.setItem(t, "1"); localStorage.removeItem(t);
      s.localStorageAvailable = true;
    } catch (e) { s.localStorageAvailable = false; }
    try {
      var t2 = "__splash_test__";
      sessionStorage.setItem(t2, "1"); sessionStorage.removeItem(t2);
      s.sessionStorageAvailable = true;
    } catch (e) { s.sessionStorageAvailable = false; }

    try {
      var canvas = document.createElement("canvas");
      var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        var dbg = gl.getExtension("WEBGL_debug_renderer_info");
        if (dbg) s.webglRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      }
    } catch (e) { }

    try {
      var c = document.createElement("canvas");
      c.width = 240; c.height = 60;
      var ctx = c.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "16px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(5, 5, 150, 25);
        ctx.fillStyle = "#069";
        ctx.fillText("splash-signal", 7, 7);
        var data = c.toDataURL();
        var hash = 0x811c9dc5;
        for (var i = 0; i < data.length; i++) {
          hash ^= data.charCodeAt(i);
          hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        s.canvasHash = (hash >>> 0).toString(16).padStart(8, "0");
      }
    } catch (e) { }

    return s;
  }

  function run() {
    try {
      var signals = collectSignals();
      var browserInstallId = getOrCreateInstallId();

      var payload = {
        sdkVersion: SDK_VERSION,
        collectedAt: new Date().toISOString(),
        browserInstallId: browserInstallId,
        pageUrl: window.location.href,
        referrer: document.referrer || null,
        signals: signals
      };

      fetch(SIGNAL_BACKEND + "/v1/events/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
