//Made by Wilhelm Tran alongside ai
//dont remove ts please im begging

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("This extension must run unsandboxed.");
  }

  let remote;
  try {
    remote = require("@electron/remote");
  } catch (e) {
    try { remote = require("electron").remote; } catch (e2) {}
  }

  let blocked = false;
  let muted   = false;
  let activeWins = [];

  const THEMES = {
    xp: {
      titleGrad: "linear-gradient(to bottom, #0A246A, #A6CAF0)",
      titleColor: "#fff",
      titleShadow: "1px 1px #00006B",
      bg: "#ECE9D8",
      borderLight: "#ffffff",
      borderDark: "#848284",
      dotsGrad: "linear-gradient(to bottom, #6080c0, #304898)",
      dotsHover: "linear-gradient(to bottom, #7090d8, #405aac)",
      dotsBorderLight: "#8090d0",
      dotsBorderDark: "#101828",
      closeGrad: "linear-gradient(to bottom, #f0a0a0, #c02020)",
      closeBorderLight: "#ffaaaa",
      closeBorderDark: "#801010",
      menuHoverGrad: "linear-gradient(to right, #1240a8, #1a5fc8)",
      menuDivider: "#848284",
      progressBg: "#c0c0c0",
      progressBar: "linear-gradient(to bottom, #4adf4a, #1a8c1a)",
      titleTextColor: "#000080",
      bodyTextColor: "#000000",
      resizeColor: "#848284",
      icon: "💬",
    },
    cute: {
      titleGrad: "linear-gradient(to bottom, #fe72d0, #f2d3f1)",
      titleColor: "#2a2a2a",
      titleShadow: "none",
      bg: "#f2d3f1",
      borderLight: "#ffffff",
      borderDark: "#fe72d0",
      dotsGrad: "linear-gradient(to bottom, #fe72d0, #d94fb0)",
      dotsHover: "linear-gradient(to bottom, #ff8fd8, #e860c0)",
      dotsBorderLight: "#ffb3e6",
      dotsBorderDark: "#a0308a",
      closeGrad: "linear-gradient(to bottom, #ffb3e6, #fe72d0)",
      closeBorderLight: "#ffd6f0",
      closeBorderDark: "#c050a0",
      menuHoverGrad: "linear-gradient(to right, #fe72d0, #ff99e0)",
      menuDivider: "#fe72d0",
      progressBg: "#f9b8f0",
      progressBar: "linear-gradient(to bottom, #ff99e0, #fe72d0)",
      titleTextColor: "#a0006a",
      bodyTextColor: "#2a2a2a",
      resizeColor: "#fe72d0",
      icon: "🌸",
    }
  };

  let currentTheme = "xp";
  function getTheme() { return THEMES[currentTheme] || THEMES.xp; }

  //corner notification
  let cornerStack = [];
  const CORNER_W = 300;
  const CORNER_PAD = 8;
  const CORNER_GAP = 6;

  function updateCornerPositions() {
    let bottom = CORNER_PAD;
    //bar
    for (let i = cornerStack.length - 1; i >= 0; i--) {
      const el = cornerStack[i];
      if (!document.body.contains(el)) { cornerStack.splice(i, 1); continue; }
      el.style.bottom = bottom + "px";
      el.style.right  = CORNER_PAD + "px";
      bottom += el.offsetHeight + CORNER_GAP;
    }
  }

  function closeAllNotifications() {
    activeWins.forEach(win => { try { win.remove(); } catch(_) {} });
    activeWins = [];
    cornerStack = [];
  }

  function positionForArea(area, W, H) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 10;
    const rnd = (min, max) => Math.floor(Math.random() * (Math.max(min + 1, max) - min)) + min;
    switch (area) {
      case "top-left":     return { left: rnd(pad, vw/2-W-pad),   top: rnd(pad, vh/2-H-pad) };
      case "top-right":    return { left: rnd(vw/2, vw-W-pad),    top: rnd(pad, vh/2-H-pad) };
      case "bottom-left":  return { left: rnd(pad, vw/2-W-pad),   top: rnd(vh/2, vh-H-pad) };
      case "bottom-right": return { left: rnd(vw/2, vw-W-pad),    top: rnd(vh/2, vh-H-pad) };
      case "center":       return { left: Math.floor(vw/2-W/2+rnd(-60,60)), top: Math.floor(vh/2-H/2+rnd(-40,40)) };
      case "top":          return { left: rnd(pad, vw-W-pad),      top: rnd(pad, Math.max(pad+1, vh/3-H)) };
      case "bottom":       return { left: rnd(pad, vw-W-pad),      top: rnd(vh*2/3, vh-H-pad) };
      case "left":         return { left: rnd(pad, Math.max(pad+1, vw/3-W)), top: rnd(pad, vh-H-pad) };
      case "right":        return { left: rnd(vw*2/3, vw-W-pad),   top: rnd(pad, vh-H-pad) };
      default:             return { left: rnd(pad, vw-W-pad),      top: rnd(pad, vh-H-pad) };
    }
  }

  //start move around
  function startWander(el) {
    let vx = (Math.random() - 0.5) * 1.4;
    let vy = (Math.random() - 0.5) * 1.4;
    let x  = parseFloat(el.style.left) || 0;
    let y  = parseFloat(el.style.top)  || 0;
    let alive = true;

    const observer = new MutationObserver(() => {
      if (!document.body.contains(el)) { alive = false; observer.disconnect(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    //pause while drag
    el.__wanderActive = true;

    const step = () => {
      if (!alive || !el.__wanderActive) return;
      const W = el.offsetWidth  || 300;
      const H = el.offsetHeight || 100;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      x += vx;
      y += vy;

      //Bounc
      if (x < 0)      { x = 0;      vx = Math.abs(vx) + Math.random() * 0.3; }
      if (x > vw - W) { x = vw - W; vx = -(Math.abs(vx) + Math.random() * 0.3); }
      if (y < 0)      { y = 0;      vy = Math.abs(vy) + Math.random() * 0.3; }
      if (y > vh - H) { y = vh - H; vy = -(Math.abs(vy) + Math.random() * 0.3); }

      const maxSpeed = 2.5;
      vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));
      vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));

      //go random
      if (Math.random() < 0.02) { vx += (Math.random() - 0.5) * 0.6; }
      if (Math.random() < 0.02) { vy += (Math.random() - 0.5) * 0.6; }

      el.style.left = x + "px";
      el.style.top  = y + "px";

      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function buildWindowHTML(uid, th, escapedTitle, escapedBody, body, ms) {
    const progressHTML = ms > 0
      ? `<div style="height:6px;background:${th.progressBg};border-top:1px solid ${th.borderDark};flex-shrink:0;"><div style="height:100%;background:${th.progressBar};animation:__xpShrink ${ms}ms linear forwards;"></div></div>`
      : `<div style="height:6px;background:${th.progressBg};border-top:1px solid ${th.borderDark};flex-shrink:0;"><div style="height:100%;width:100%;background:${th.borderDark};opacity:0.3;"></div></div>`;

    return `
      <div id="${uid}tb" style="background:${th.titleGrad};padding:3px 4px;display:flex;align-items:center;gap:4px;height:22px;flex-shrink:0;position:relative;cursor:grab;">
        <span style="color:${th.titleColor};font-size:11px;font-weight:bold;flex:1;text-shadow:${th.titleShadow};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapedTitle}</span>
        <div class="__xp-dots" id="${uid}d"><span></span><span></span><span></span></div>
        <div id="${uid}x" style="width:16px;height:14px;background:${th.closeGrad};border-top:1px solid ${th.closeBorderLight};border-left:1px solid ${th.closeBorderLight};border-right:1px solid ${th.closeBorderDark};border-bottom:1px solid ${th.closeBorderDark};color:#fff;font-size:9px;font-weight:bold;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">✕</div>
        <div class="__xp-menu" id="${uid}m">
          <div class="__xp-mi" id="${uid}bl"><span class="__xp-ico"></span> Block notifications</div>
          <div class="__xp-div"></div>
          <div class="__xp-mi" id="${uid}mu"><span class="__xp-ico"></span> Mute (no sounds)</div>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 8px;flex:1;background:${th.bg};overflow:hidden;">
        <span style="font-size:24px;flex-shrink:0;padding-top:2px;">${th.icon}</span>
        <div style="overflow:hidden;flex:1;">
          <div style="font-size:11px;font-weight:bold;color:${th.titleTextColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapedTitle}</div>
          <div class="__xp-body-text" id="${uid}b" style="${(body||'').length>80?'font-size:9.5px;':(body||'').length>60?'font-size:10px;':''}">${escapedBody}</div>
        </div>
      </div>
      ${progressHTML}
      <div class="__xp-resize-corner" id="${uid}rc"></div>
      <div class="__xp-resize-right"  id="${uid}rr"></div>
      <div class="__xp-resize-bottom" id="${uid}rb"></div>
    `;
  }

  function injectStyles(th) {
    if (!document.getElementById("__xpStyles")) {
      const s = document.createElement("style");
      s.id = "__xpStyles";
      document.head.appendChild(s);
    }
    document.getElementById("__xpStyles").textContent = `
      @keyframes __xpShrink{from{width:100%}to{width:0%}}
      @keyframes __xpSlideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
      .__xp-dots{width:16px;height:14px;background:${th.dotsGrad};border-top:1px solid ${th.dotsBorderLight};border-left:1px solid ${th.dotsBorderLight};border-right:1px solid ${th.dotsBorderDark};border-bottom:1px solid ${th.dotsBorderDark};display:flex;align-items:center;justify-content:center;gap:2px;cursor:pointer;flex-shrink:0;pointer-events:all;transition:background 0.1s;}
      .__xp-dots:hover{background:${th.dotsHover};}
      .__xp-dots span{display:block;width:2px;height:2px;background:#fff;border-radius:50%;}
      .__xp-menu{display:none;position:absolute;right:4px;top:22px;background:${th.bg};border-top:1px solid ${th.borderLight};border-left:1px solid ${th.borderLight};border-right:1px solid ${th.borderDark};border-bottom:1px solid ${th.borderDark};z-index:9999999;min-width:175px;box-shadow:2px 2px 5px rgba(0,0,0,.45);}
      .__xp-menu.open{display:block;}
      .__xp-mi{padding:5px 14px;font-size:11px;color:#000;cursor:pointer;white-space:nowrap;pointer-events:all;display:flex;align-items:center;gap:7px;transition:background 0.12s,color 0.12s,padding-left 0.12s;}
      .__xp-mi:hover{background:${th.menuHoverGrad};color:#fff;padding-left:20px;}
      .__xp-mi:hover .__xp-ico{transform:scale(1.2);}
      .__xp-ico{font-size:12px;transition:transform 0.12s;display:inline-block;}
      .__xp-div{height:1px;background:${th.menuDivider};margin:2px 4px;}
      .__xp-body-text{font-size:11px;color:${th.bodyTextColor};overflow:hidden;white-space:normal;word-break:break-word;line-height:1.4;}
      .__xp-resize-corner{position:absolute;bottom:0;right:0;width:14px;height:14px;cursor:se-resize;z-index:10;background:linear-gradient(135deg,transparent 40%,${th.resizeColor} 40%);}
      .__xp-resize-right{position:absolute;top:0;right:0;width:5px;height:100%;cursor:e-resize;z-index:9;}
      .__xp-resize-bottom{position:absolute;bottom:0;left:0;width:100%;height:5px;cursor:s-resize;z-index:9;}
    `;
  }

  function attachWindowBehaviour(win, uid, ms, onRemove) {
    const th = getTheme();
    const titlebar = win.querySelector(`#${uid}tb`);
    const menu  = win.querySelector(`#${uid}m`);
    const dotsB = win.querySelector(`#${uid}d`);
    const closeB= win.querySelector(`#${uid}x`);
    const blBtn = win.querySelector(`#${uid}bl`);
    const muBtn = win.querySelector(`#${uid}mu`);

    // Drag
    let dragging = false, dragOffX = 0, dragOffY = 0;
    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.id === `${uid}x` || e.target.closest(`#${uid}d`) || e.target.closest(`#${uid}m`)) return;
      dragging = true;
      if (win.__wanderActive !== undefined) win.__wanderActive = false; // pause wander while dragging
      dragOffX = e.clientX - win.getBoundingClientRect().left;
      dragOffY = e.clientY - win.getBoundingClientRect().top;
      titlebar.style.cursor = "grabbing";
      e.preventDefault();
    });

    // Resize
    let resizing = false, resizeMode = "";
    let rsX, rsY, rsW, rsH;
    const startResize = (mode) => (e) => {
      resizing = true; resizeMode = mode;
      rsX = e.clientX; rsY = e.clientY;
      rsW = win.offsetWidth; rsH = win.offsetHeight;
      e.preventDefault(); e.stopPropagation();
    };
    win.querySelector(`#${uid}rc`).addEventListener("mousedown", startResize("both"));
    win.querySelector(`#${uid}rr`).addEventListener("mousedown", startResize("width"));
    win.querySelector(`#${uid}rb`).addEventListener("mousedown", startResize("height"));

    document.addEventListener("mousemove", (e) => {
      if (dragging) {
        win.style.left = (e.clientX - dragOffX) + "px";
        win.style.top  = (e.clientY - dragOffY) + "px";
      }
      if (resizing) {
        const dx = e.clientX - rsX, dy = e.clientY - rsY;
        if (resizeMode === "width"  || resizeMode === "both") win.style.width  = Math.max(200, rsW + dx) + "px";
        if (resizeMode === "height" || resizeMode === "both") win.style.height = Math.max(80,  rsH + dy) + "px";
      }
    });
    document.addEventListener("mouseup", () => {
      if (dragging && win.__wanderActive !== undefined) win.__wanderActive = true; // resume wander
      dragging = false; resizing = false;
      titlebar.style.cursor = "grab";
    });

    const removeWin = () => {
      win.__wanderActive = false;
      win.style.transition = "opacity 0.15s";
      win.style.opacity = "0";
      setTimeout(() => {
        win.remove();
        activeWins = activeWins.filter(w => w !== win);
        if (onRemove) onRemove();
      }, 150);
    };

    dotsB.addEventListener("click",  (e) => { e.stopPropagation(); menu.classList.toggle("open"); });
    document.addEventListener("click", () => menu.classList.remove("open"));
    closeB.addEventListener("click", (e) => { e.stopPropagation(); removeWin(); });
    blBtn.addEventListener("click",  (e) => { e.stopPropagation(); blocked = true; menu.classList.remove("open"); removeWin(); });
    muBtn.addEventListener("click",  (e) => { e.stopPropagation(); muted = true; menu.classList.remove("open"); });

    if (ms > 0) setTimeout(() => removeWin(), ms);
  }

  //notification, not pop up 
  function spawnCornerWindow(title, body, duration) {
    if (blocked) return;
    const ms = duration > 0 ? duration : 4000;
    const th = getTheme();
    injectStyles(th);

    const escapedBody  = (body  || "").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const escapedTitle = (title || "").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const uid = "__xpc" + Date.now() + Math.random().toString(36).slice(2);

    const win = document.createElement("div");
    win.style.cssText = `position:fixed;right:${CORNER_PAD}px;bottom:${CORNER_PAD}px;width:${CORNER_W}px;min-width:200px;min-height:80px;background:${th.bg};border-top:2px solid ${th.borderLight};border-left:2px solid ${th.borderLight};border-right:2px solid ${th.borderDark};border-bottom:2px solid ${th.borderDark};z-index:99999999;pointer-events:all;font-family:Tahoma,'MS Sans Serif',sans-serif;box-shadow:3px 3px 8px rgba(0,0,0,0.4);user-select:none;display:flex;flex-direction:column;overflow:hidden;animation:__xpSlideIn 0.2s ease;transition:bottom 0.2s ease;`;
    win.innerHTML = buildWindowHTML(uid, th, escapedTitle, escapedBody, body, ms);

    document.body.appendChild(win);
    activeWins.push(win);
    cornerStack.push(win);
    updateCornerPositions();

    attachWindowBehaviour(win, uid, ms, () => {
      cornerStack = cornerStack.filter(w => w !== win);
      updateCornerPositions();
    });
  }

  //popup moving
  function spawnScatteredWindow(title, body, duration, area, wander) {
    const ms = (duration === 0 || duration < 0) ? 0 : (duration || 8000);
    const th = getTheme();
    injectStyles(th);

    const escapedBody  = (body  || "").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const escapedTitle = (title || "").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const uid = "__xps" + Date.now() + Math.random().toString(36).slice(2);

    const W = 300;
    const H = (body || "").length > 45 ? 110 : 90;
    const pos = positionForArea(area || "anywhere", W, H);

    const win = document.createElement("div");
    win.style.cssText = `position:fixed;left:${Math.max(0,pos.left)}px;top:${Math.max(0,pos.top)}px;width:${W}px;min-width:200px;min-height:80px;background:${th.bg};border-top:2px solid ${th.borderLight};border-left:2px solid ${th.borderLight};border-right:2px solid ${th.borderDark};border-bottom:2px solid ${th.borderDark};z-index:99999999;pointer-events:all;font-family:Tahoma,'MS Sans Serif',sans-serif;box-shadow:3px 3px 8px rgba(0,0,0,0.4);user-select:none;display:flex;flex-direction:column;overflow:hidden;`;
    win.innerHTML = buildWindowHTML(uid, th, escapedTitle, escapedBody, body, ms);

    document.body.appendChild(win);
    activeWins.push(win);

    if (wander) startWander(win);

    attachWindowBehaviour(win, uid, ms, null);
  }

  //Spam content
  const SPAM_SETS = {
    virus: [
      ["CRITICAL THREAT DETECTED — IMMEDIATE ACTION REQUIRED", "Rootkit.BlackMatter.Gen2 has been identified in kernel memory. Core system processes are being overwritten. Shutdown imminent if untreated."],
      ["SYSTEM COMPROMISE ALERT [SEVERITY: CRITICAL]", "Unauthorised remote session active on port 4444. Attacker has elevated privileges. Your files are being exfiltrated right now."],
      ["MEMORY CORRUPTION DETECTED — DO NOT RESTART", "A critical buffer overflow has been triggered in lsass.exe. Windows Security cannot contain this threat. All stored credentials are at risk."],
      ["RANSOMWARE INITIALISING — 00:04:59 REMAINING", "CryptoLocker.V9 has begun encrypting your drive. 3,847 files locked so far. Disconnect from the internet immediately."],
      ["BIOS-LEVEL INFECTION CONFIRMED", "Firmware rootkit detected below OS level. Standard antivirus cannot remove this. Your hardware may be permanently compromised."],
      ["NETWORK INTRUSION — LIVE ATTACKER DETECTED", "An external IP (185.220.101.47) is actively scanning your open ports. Firewall rules have been bypassed. Isolation recommended."],
      ["WINDOWS DEFENDER — QUARANTINE FAILED", "Trojan:Win64/Sirefef.AN could not be contained. The malware has injected itself into explorer.exe and winlogon.exe. System integrity violated."],
      ["KERNEL PANIC — FATAL SYSTEM ERROR 0x000000EF", "Critical process died. CRITICAL_PROCESS_DIED. A required system process terminated unexpectedly. Attempting emergency recovery..."],
      ["DATA WIPE SEQUENCE INITIATED", "Secure erase has been triggered on volumes C:\\ D:\\ and E:\\. This action was not authorised by the current user. Source: REMOTE."],
      ["WEBCAM ACCESS GRANTED TO UNKNOWN PROCESS", "Process svch0st.exe (not svchost) has accessed your camera and microphone without permission. Recording may be in progress."],
      ["CRITICAL SYSTEM BREACH DETECTED", "Kernel memory hooks have been modified by unknown code. Security boundaries no longer enforced. Immediate containment failed."],
      ["RANSOMWARE PROGRESSION UPDATE — 00:02:41 REMAINING", "Encryption routine has escalated privileges. Shadow copies deleted. File recovery unlikely."],
      ["REMOTE SHELL ESTABLISHED", "Attacker has spawned an interactive SYSTEM shell. Commands are being executed in real time."],
      ["SECURITY MODULE FAILURE", "Windows Defender core service has crashed unexpectedly. Tamper protection has been disabled."],
      ["BOOT SECTOR MODIFICATION DETECTED", "Master Boot Record has been altered. Persistent malware will execute before OS startup."],
      ["PRIVILEGE ESCALATION SUCCESSFUL", "Unknown process has gained NT AUTHORITY\\SYSTEM access. Full system control granted."],
      ["DATA EXFILTRATION IN PROGRESS", "Outbound traffic spike detected. Sensitive files are being transferred to remote endpoint."],
      ["ANTI-VIRUS BYPASS CONFIRMED", "Signature scanning evaded using polymorphic payload. Detection probability reduced to 0%."],
      ["SYSTEM RESTORE DISABLED", "All restore points have been deleted. Recovery options severely limited."],
      ["ENCRYPTION KEY GENERATED", "Unique RSA-2048 key created for file locking. Decryption without key is computationally infeasible."],
    ],
    ad: [
      ["YOU WON!", "Click here to claim your FREE OURphone 69 Pro!!!"],
      ["Limited Offer!", "Lose 21kg in 3 days with this ONE weird trick"],
      ["Congratulations!", "You are our 1,000,000th visitor! Claim your prize now!"],
      ["Make $$$", "Work from home! Earn 5000RM/day doing NOTHING!"],
      ["HOT DEAL", "Buy 1 get 3 FREE! Today only! Click NOW!"],
      ["Special Reward", "Your account has been selected for a mystery gift!"],
      ["Singles in your area", "7 people near you want to meet RIGHT NOW"],
      ["SYSTEM ALERT!!!", "Your PC is infected!!! Download DefinitelyACleaner NOW!!!"],
      ["FREE L-BUCKS!!!", "Get 10,000 L-Bucks instantly!! No scam!! Click here!!"],
      ["WARNING!!!", "Your device has 21 viruses!! Tap to remove them FAST!!"],
      ["HOT SINGLES!!!", "People near you are waiting… don't keep them waiting ;)"],
      ["LIMITED TIME!!!", "Claim your FREE gaming PC before stock runs out!!"],
      ["CRYPTO OPPORTUNITY!!!", "Turn $10 into $10,000 overnight with THIS coin!!"],
      ["DOWNLOAD NOW!!!", "Speed up your PC by 300% with this one simple app!!"],
      ["FINAL NOTICE!!!", "Your subscription will expire!!! Renew NOW to avoid loss!!!"],
      ["YOU'VE BEEN SELECTED!!!", "Exclusive reward unlocked for YOU only!!!"],
      ["CLICK FAST!!!", "Offer expires in 00:06:09!!! Don't miss out!!!"],
    ],
    cmd: [
      ["cmd.exe — ADMINISTRATOR", "FATAL: ntoskrnl.exe is unresponsive. Attempting forced process termination... Access Denied. Escalating privileges."],
      ["System32 — Critical Warning", "ERROR 0xC0000005: Memory access violation in C:\\Windows\\System32\\drivers\\ntfs.sys. File system integrity check failed."],
      ["PowerShell — Execution Policy Bypassed", "Invoke-Expression : Script block has been flagged by AMSI. Bypassing... Done. Executing payload from remote host 185.220.101.47..."],
      ["Task Scheduler — SYSTEM", "Scheduled task \\Microsoft\\Windows\\SilentCleanup has been hijacked. Malicious DLL injected: C:\\Users\\Public\\svchost32.dll"],
      ["cmd.exe — Disk Utility", "WARNING: S.M.A.R.T. failure predicted on drive 0. Reallocated sector count critical. Estimated time to failure: 00:07:32"],
      ["Windows Error Reporting", "Application crash: lsass.exe terminated with exit code 0xC0000006. This process handles login authentication. Please do not restart."],
      ["cmd.exe — Network Diagnostics", "Traceroute anomaly: packets rerouted through unrecognised node [185.220.101.47 — TOR exit node]. Your connection may be intercepted."],
      ["cmd.exe — Kernel Debug", "KERNEL_SECURITY_CHECK_FAILURE (0x00000139). Stack buffer overrun detected. System stability compromised."],
      ["Windows Defender — Alert", "Threat detected: Trojan:Win32/Injector. Suspicious code injection attempt blocked."],
      ["Event Viewer — Critical", "Event ID 41: Kernel-Power. Unexpected shutdown detected. Possible hardware instability."],
      ["cmd.exe — Boot Loader", "BOOTMGR corrupted. Attempting recovery from backup sector... FAILED."],
      ["Registry Editor — Warning", "Unauthorized registry key added to startup sequence. Persistence suspected."],
      ["cmd.exe — Driver Manager", "Driver failure detected in disk.sys. Device may stop responding."],
      ["Windows Firewall — Security", "Multiple inbound requests detected from blocked IP range. Possible scanning activity."],
      ["cmd.exe — Memory Manager", "Page fault in nonpaged area. Invalid memory reference encountered."],
      ["Task Manager — Critical", "wininit.exe has stopped responding. System processes at risk."],
      ["cmd.exe — Disk Check", "File index corruption detected. Repair recommended using chkdsk /f."],
      ["System Restore — Failure", "Rollback operation failed. System state inconsistent."],
      ["cmd.exe — Network Stack", "TCP/IP stack reset triggered due to abnormal packet behavior."],
      ["Security Center — Critical", "Firewall service stopped unexpectedly. System exposed."],
      ["cmd.exe — Process Monitor", "Suspicious process duplication detected. Possible process hollowing."],
      ["cmd.exe — CPU Monitor", "CPU usage locked at 100%. Unresponsive threads detected."],
      ["Windows Explorer — Crash", "explorer.exe crashed unexpectedly. Restarting shell instance..."],
      ["cmd.exe — IO Subsystem", "Read/write latency exceeding safe threshold. Disk degradation suspected."],
      ["Remote Desktop — Security", "Repeated authentication failures detected. Lockout policy may trigger."],
      ["cmd.exe — Kernel Trace", "Unhandled exception in kernel mode. Debugging halted."],
      ["Windows Licensing — Error", "License validation failed. System integrity check triggered."],
    ],
  };

  function getAllMessages() {
    return [...SPAM_SETS.virus, ...SPAM_SETS.ad, ...SPAM_SETS.cmd];
  }
  function getPool(type) {
    if (type === "all") return getAllMessages();
    return SPAM_SETS[type] || SPAM_SETS.virus;
  }
  function getSpamMessage(type, index) {
    const pool = getPool(type);
    if (!pool || pool.length === 0) return ["Notice", ""];
    const i = Math.round(Number(index));
    return pool[((i - 1) % pool.length + pool.length) % pool.length];
  }

  function doSpam(type, count, delayMs, area, index, autodismissMs, wander) {
    const pool = getPool(type);
    const useRandom = (index === null || index === undefined || index === "" || isNaN(Number(index)));
    let i = 0;
    const fire = () => {
      if (i >= count || blocked) return;
      const msg = useRandom ? pool[Math.floor(Math.random() * pool.length)] : getSpamMessage(type, index);
      spawnScatteredWindow(msg[0], msg[1], autodismissMs !== undefined ? autodismissMs : 8000, area || "anywhere", wander);
      i++;
      setTimeout(fire, delayMs);
    };
    fire();
  }

  class PopupNotifyExtension {
    getInfo() {
      return {
        id: "popupNotify",
        name: "Notify",
        color1: "#4C97FF",
        color2: "#4280D7",
        color3: "#3373CC",
        blocks: [
          //corner notification
          {
            opcode: "notify",
            blockType: Scratch.BlockType.COMMAND,
            text: "corner popup [TITLE] message [BODY]",
            arguments: {
              TITLE: { type: Scratch.ArgumentType.STRING, defaultValue: "Hey!" },
              BODY:  { type: Scratch.ArgumentType.STRING, defaultValue: "This is a corner notification 🔔" },
            },
          },
          {
            opcode: "notifyTimed",
            blockType: Scratch.BlockType.COMMAND,
            text: "corner popup [TITLE] message [BODY] for [SECS] seconds",
            arguments: {
              TITLE: { type: Scratch.ArgumentType.STRING, defaultValue: "Hey!" },
              BODY:  { type: Scratch.ArgumentType.STRING, defaultValue: "This disappears soon!" },
              SECS:  { type: Scratch.ArgumentType.NUMBER, defaultValue: 4 },
            },
          },
          {
            opcode: "notifyManual",
            blockType: Scratch.BlockType.COMMAND,
            text: "corner popup [TITLE] message [BODY] — stay until closed",
            arguments: {
              TITLE: { type: Scratch.ArgumentType.STRING, defaultValue: "Hey!" },
              BODY:  { type: Scratch.ArgumentType.STRING, defaultValue: "You must close this manually!" },
            },
          },
          {
            opcode: "closeNotification",
            blockType: Scratch.BlockType.COMMAND,
            text: "close all popups",
          },

          {
            opcode: "setTheme",
            blockType: Scratch.BlockType.COMMAND,
            text: "set notification theme to [THEME]",
            arguments: {
              THEME: { type: Scratch.ArgumentType.STRING, menu: "themeMenu", defaultValue: "xp" },
            },
          },

          //custom message
          {
            opcode: "spamPopups",
            blockType: Scratch.BlockType.COMMAND,
            text: "spam [COUNT] [TYPE] popups message [INDEX] every [DELAY] s in [AREA] dismiss [DISMISS] move [WANDER]",
            arguments: {
              COUNT:   { type: Scratch.ArgumentType.NUMBER, defaultValue: 8 },
              TYPE:    { type: Scratch.ArgumentType.STRING, menu: "spamMenu",    defaultValue: "virus" },
              INDEX:   { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              DELAY:   { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.3 },
              AREA:    { type: Scratch.ArgumentType.STRING, menu: "areaMenu",    defaultValue: "anywhere" },
              DISMISS: { type: Scratch.ArgumentType.STRING, menu: "dismissMenu", defaultValue: "timed" },
              WANDER:  { type: Scratch.ArgumentType.STRING, menu: "wanderMenu",  defaultValue: "wander" },
            },
          },
          //spam random bs
          {
            opcode: "spamRandom",
            blockType: Scratch.BlockType.COMMAND,
            text: "spam [COUNT] random [TYPE] popups every [DELAY] s in [AREA] dismiss [DISMISS] move [WANDER]",
            arguments: {
              COUNT:   { type: Scratch.ArgumentType.NUMBER, defaultValue: 8 },
              TYPE:    { type: Scratch.ArgumentType.STRING, menu: "spamMenu",    defaultValue: "all" },
              DELAY:   { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.3 },
              AREA:    { type: Scratch.ArgumentType.STRING, menu: "areaMenu",    defaultValue: "anywhere" },
              DISMISS: { type: Scratch.ArgumentType.STRING, menu: "dismissMenu", defaultValue: "timed" },
              WANDER:  { type: Scratch.ArgumentType.STRING, menu: "wanderMenu",  defaultValue: "wander" },
            },
          },
          {
            opcode: "getMessageCount",
            blockType: Scratch.BlockType.REPORTER,
            text: "number of [TYPE] messages",
            arguments: {
              TYPE: { type: Scratch.ArgumentType.STRING, menu: "spamMenu", defaultValue: "virus" },
            },
          },

          // --- State ---
          {
            opcode: "isBlocked",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "notifications blocked?",
          },
          {
            opcode: "isMuted",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "notifications muted?",
          },
          {
            opcode: "resetSettings",
            blockType: Scratch.BlockType.COMMAND,
            text: "reset notification settings",
          },
        ],
        menus: {
          themeMenu: {
            acceptReporters: false,
            items: [
              { text: "Windows XP", value: "xp" },
              { text: "Cute (pink)", value: "cute" },
            ],
          },
          spamMenu: {
            acceptReporters: false,
            items: [
              { text: "all (random mix)", value: "all"   },
              { text: "virus warning",    value: "virus" },
              { text: "advertisement",   value: "ad"    },
              { text: "cmd prompt",      value: "cmd"   },
            ],
          },
          areaMenu: {
            acceptReporters: true,
            items: [
              { text: "anywhere",     value: "anywhere"      },
              { text: "top-left",     value: "top-left"      },
              { text: "top-right",    value: "top-right"     },
              { text: "bottom-left",  value: "bottom-left"   },
              { text: "bottom-right", value: "bottom-right"  },
              { text: "center",       value: "center"        },
              { text: "top",          value: "top"           },
              { text: "bottom",       value: "bottom"        },
              { text: "left",         value: "left"          },
              { text: "right",        value: "right"         },
            ],
          },
          dismissMenu: {
            acceptReporters: false,
            items: [
              { text: "auto (8s)",   value: "timed"  },
              { text: "manual only", value: "manual" },
            ],
          },
          wanderMenu: {
            acceptReporters: false,
            items: [
              { text: "wander around", value: "wander" },
              { text: "stay still",    value: "still"  },
            ],
          },
        },
      };
    }

    notify(args)       { spawnCornerWindow(args.TITLE, args.BODY, 4000); }
    notifyTimed(args)  { spawnCornerWindow(args.TITLE, args.BODY, Math.max(500, Number(args.SECS) * 1000)); }
    notifyManual(args) { if (!blocked) spawnCornerWindow(args.TITLE, args.BODY, 0); }
    closeNotification(){ closeAllNotifications(); }
    setTheme(args)     { if (THEMES[args.THEME]) currentTheme = args.THEME; }

    spamPopups(args) {
      const autodismiss = args.DISMISS === "manual" ? 0 : 8000;
      const wander = args.WANDER !== "still";
      doSpam(args.TYPE, Math.max(1, Math.round(Number(args.COUNT))), Math.max(50, Number(args.DELAY) * 1000), args.AREA, args.INDEX, autodismiss, wander);
    }
    spamRandom(args) {
      const autodismiss = args.DISMISS === "manual" ? 0 : 8000;
      const wander = args.WANDER !== "still";
      doSpam(args.TYPE, Math.max(1, Math.round(Number(args.COUNT))), Math.max(50, Number(args.DELAY) * 1000), args.AREA, null, autodismiss, wander);
    }
    getMessageCount(args) { return getPool(args.TYPE).length; }

    isBlocked()     { return blocked; }
    isMuted()       { return muted; }
    resetSettings() { blocked = false; muted = false; }
  }

  Scratch.extensions.register(new PopupNotifyExtension());
})(Scratch);