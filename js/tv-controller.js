/**
 * TRIAMDOD 10 — Retro Fishbowl CRT TV (ทีวีตู้ปลา) & Vintage Tape Controller
 * Features:
 * - 3 Historic Channels: TRIAMDOD 8, TRIAMDOD 7, TRIAMDOD 6
 * - CRT static white noise burst & high-voltage hum on channel switch & power-on
 * - Tactile TV power on/off button with convex screen power-down collapse
 * - Channel +/- navigation buttons and tap-to-switch on the curved glass
 * - Synced with 3-tier cassette stack and Archive Tape Spoiler
 */

(function() {
  'use strict';

  const ARCHIVE_CHANNELS = [
    {
      channelLabel: "CH 10 // TD 10",
      title: "TRIAMDOD 10 : BEDROOM AUDIO & Z9 x DIEOUT",
      isMystery: true,
      imageSrc: "assets/archive/td-archive-8.jpg",
      subline: "ศิลปินรับเชิญ: Bedroom Audio และ Z9 x DIEOUT",
      sp: "ARENA 2570",
      tag: "GUEST SPOILER"
    },
    {
      channelLabel: "CH 08 // TD 8",
      title: "TRIAMDOD 8 : SCRUBB",
      isMystery: false,
      imageSrc: "assets/archive/td-archive-8.jpg",
      subline: "คอนเสิร์ตเตรียมโดด 8 • ศิลปินรับเชิญ Scrubb",
      sp: "VHF-HI 4:3",
      tag: "GUEST: SCRUBB"
    },
    {
      channelLabel: "CH 07 // TD 7",
      title: "TRIAMDOD 7 : MEAN & SAFEPLANET",
      isMystery: false,
      imageSrc: "assets/archive/td-archive-7.jpg",
      subline: "คอนเสิร์ตเตรียมโดด 7 • ศิลปินรับเชิญ MEAN และ Safeplanet",
      sp: "SP 0:19:42",
      tag: "GUEST: MEAN/SAFE"
    },
    {
      channelLabel: "CH 06 // TD 6",
      title: "TRIAMDOD 6 : SEASON FIVE & DEPT",
      isMystery: false,
      imageSrc: "assets/archive/td-archive-6.jpg",
      subline: "คอนเสิร์ตเตรียมโดด 6 • ศิลปินรับเชิญ Season Five และ Dept",
      sp: "EP 0:14:08",
      tag: "GUEST: SEASON5/DEPT"
    }
  ];

  const MYSTERY_FONTS = [
    "'Space Grotesk', sans-serif",
    "'Impact', 'Arial Black', sans-serif",
    "'Courier New', Courier, monospace",
    "'Georgia', serif",
    "'Arial Black', sans-serif",
    "'Trebuchet MS', sans-serif",
    "'Times New Roman', serif",
    "'Lucida Console', Monaco, monospace",
    "'Comic Sans MS', cursive",
    "'Copperplate', fantasy",
    "'Brush Script MT', cursive",
    "'IBM Plex Sans Thai', sans-serif"
  ];

  let fontInterval = null;
  let fontIndex = 0;

  function startFontCycling() {
    stopFontCycling();
    const symbol = document.getElementById('mysteryFontSymbol');
    if (!symbol) return;
    fontInterval = setInterval(() => {
      fontIndex = (fontIndex + 1) % MYSTERY_FONTS.length;
      symbol.style.fontFamily = MYSTERY_FONTS[fontIndex];
    }, 240);
  }

  function stopFontCycling() {
    if (fontInterval) {
      clearInterval(fontInterval);
      fontInterval = null;
    }
  }

  const crtImage = document.getElementById('crtImage');
  const screen = document.getElementById('tvScreen');
  const glitch = document.getElementById('crtGlitch');
  const canvas = document.getElementById('noiseCanvas');
  const channelLabel = document.getElementById('osdChannel');
  const title = document.getElementById('osdTitle');
  const status = document.getElementById('osdStatus');
  const osdSp = document.querySelector('.osd-sp');
  const osdAudioTag = document.getElementById('osdAudioTag');
  const powerLed = document.getElementById('powerLed');
  const tapes = document.querySelectorAll('.tape-item');
  const spoilers = document.querySelectorAll('.spoiler-item');
  const hasObserver = 'IntersectionObserver' in window;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const performance = window.TD_Performance;

  let currentChannel = 0;
  let powered = true;
  let visible = !hasObserver;
  let noiseFrame = null;
  let noiseTimeout = null;
  let powerTimeout = null;
  let lastNoiseFrame = null;
  let context = null;
  let noiseImage = null;
  let pixels = null;

  const isLightweight = () => !!performance?.isLightweight();
  const dialogOpen = () => !!performance?.isDialogOpen();

  function stopStatic() {
    clearTimeout(noiseTimeout);
    noiseTimeout = null;
    if (noiseFrame !== null) cancelAnimationFrame(noiseFrame);
    noiseFrame = null;
    lastNoiseFrame = null;
    canvas?.classList.remove('visible');
    glitch?.classList.remove('glitch-active');
  }

  function drawStatic(timestamp) {
    if (timestamp === undefined || lastNoiseFrame === null || timestamp - lastNoiseFrame >= 1000 / 30) {
      if (pixels && context) {
        for (let i = 0; i < pixels.length; i++) {
          pixels[i] = Math.random() < 0.5 ? 0xffffffff : 0xff101010;
        }
        context.putImageData(noiseImage, 0, 0);
      }
      lastNoiseFrame = timestamp ?? null;
    }
    if (!isLightweight()) noiseFrame = requestAnimationFrame(drawStatic);
  }

  function triggerStaticBurst(duration = 240) {
    if (!canvas || !powered || !visible || document.hidden || dialogOpen() || reducedMotion?.matches) return;
    if (!context) {
      context = canvas.getContext('2d');
      if (!context) return;
      canvas.width = 160;
      canvas.height = 120;
      noiseImage = context.createImageData(160, 120);
      pixels = new Uint32Array(noiseImage.data.buffer);
    }
    clearTimeout(noiseTimeout);
    canvas.classList.add('visible');
    glitch?.classList.add('glitch-active');
    window.TD_Audio?.playCRTStaticHum?.();
    if (noiseFrame === null) drawStatic();
    noiseTimeout = setTimeout(stopStatic, duration);
  }

  function updateDisplay() {
    if (!screen) return;
    screen.setAttribute('aria-disabled', String(!powered));
    screen.setAttribute('aria-label', !powered ? 'ทีวีปิดอยู่' : `ช่อง ${ARCHIVE_CHANNELS[currentChannel].title} (คลิกเพื่อเปลี่ยนช่อง)`);
  }

  function switchChannel(index, soundEffect = true) {
    currentChannel = (index + ARCHIVE_CHANNELS.length) % ARCHIVE_CHANNELS.length;
    const channel = ARCHIVE_CHANNELS[currentChannel];

    if (channelLabel) channelLabel.textContent = channel.channelLabel;
    if (title) title.textContent = channel.title;
    if (osdSp && channel.sp) osdSp.textContent = channel.sp;
    if (osdAudioTag && channel.tag) osdAudioTag.textContent = channel.tag;
    if (status) status.textContent = powered ? (channel.isMystery ? 'LIVE ●' : 'REC ●') : 'OFF';

    const mysteryView = document.getElementById('crtMysteryView');

    if (channel.isMystery) {
      if (crtImage) crtImage.style.display = 'none';
      if (mysteryView) {
        mysteryView.style.display = powered ? 'flex' : 'none';
        if (powered && !document.hidden && visible) startFontCycling();
      }
    } else {
      stopFontCycling();
      if (mysteryView) mysteryView.style.display = 'none';
      if (crtImage) {
        crtImage.style.display = powered ? 'block' : 'none';
        crtImage.classList.add('channel-switch');
        crtImage.src = channel.imageSrc;
        crtImage.alt = channel.title;
        setTimeout(() => {
          crtImage.classList.remove('channel-switch');
        }, 260);
      }
    }

    tapes.forEach((tape, i) => tape.classList.toggle('active-tape', i === currentChannel));
    spoilers.forEach(item => item.classList.toggle('active', Number(item.dataset.tape) === currentChannel));

    if (soundEffect) {
      window.TD_Audio?.playCassetteClickSound?.();
      triggerStaticBurst(260);
    }

    updateDisplay();
  }

  // Tape Stack Click & Keyboard
  tapes.forEach((tape, index) => {
    tape.addEventListener('click', () => switchChannel(index));
    tape.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        switchChannel(index);
      }
    });
  });

  // Archive Tape Spoiler Buttons Click
  spoilers.forEach(item => {
    item.addEventListener('click', () => switchChannel(Number(item.dataset.tape)));
  });

  // Power Button
  document.getElementById('powerBtn')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    powered = !powered;
    clearTimeout(powerTimeout);
    window.TD_Audio?.playCassetteClickSound?.();
    powerLed?.classList.toggle('off', !powered);
    const channel = ARCHIVE_CHANNELS[currentChannel];
    if (status) status.textContent = powered ? (channel?.isMystery ? 'LIVE ●' : 'REC ●') : 'OFF';

    const mysteryView = document.getElementById('crtMysteryView');

    if (screen) {
      screen.classList.remove('crt-turning-on', 'crt-turning-off');
      screen.classList.toggle('power-off', !powered);
      if (!reducedMotion?.matches) {
        screen.classList.add(powered ? 'crt-turning-on' : 'crt-turning-off');
        powerTimeout = setTimeout(() => screen.classList.remove('crt-turning-on', 'crt-turning-off'), 400);
      }
    }

    if (!powered) {
      stopFontCycling();
      if (mysteryView) mysteryView.style.display = 'none';
      if (crtImage) crtImage.style.display = 'none';
    } else {
      if (channel.isMystery) {
        if (crtImage) crtImage.style.display = 'none';
        if (mysteryView) {
          mysteryView.style.display = 'flex';
          startFontCycling();
        }
      } else {
        if (mysteryView) mysteryView.style.display = 'none';
        if (crtImage) crtImage.style.display = 'block';
      }
      triggerStaticBurst(300);
    }
    updateDisplay();
  });

  // Prev / Next Channel Buttons
  for (const [id, direction] of [['prevChBtn', -1], ['nextChBtn', 1]]) {
    document.getElementById(id)?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      switchChannel(currentChannel + direction);
    });
  }

  // Click on Screen to Cycle Channel
  function onScreenClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!powered) return;
    switchChannel(currentChannel + 1);
  }

  screen?.addEventListener('click', onScreenClick);
  screen?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') onScreenClick(event);
  });

  // Performance / Intersection
  const stage = document.getElementById('stageSection');
  if (stage && hasObserver) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) stopFontCycling();
      else if (powered && ARCHIVE_CHANNELS[currentChannel]?.isMystery) startFontCycling();
    }, { rootMargin: '0px' }).observe(stage);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopFontCycling();
    else if (powered && ARCHIVE_CHANNELS[currentChannel]?.isMystery && visible) startFontCycling();
  });

  // Initial setup
  switchChannel(0, false);
  window.TD_TV = { switchChannel, triggerStaticBurst };
})();
