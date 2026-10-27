/**
 * SOUND ENGINE - HỆ THỐNG ÂM THANH & TỔNG HỢP NHẠC NỀN
 * Sử dụng Web Audio API thuần (Offline 100%, không lo bản quyền hay lỗi tải mạng)
 * Hỗ trợ tải tệp MP3/WAV/OGG từ máy tính của giáo viên
 */

const SoundEngine = (() => {
  let audioCtx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;

  // Trạng thái nhạc nền
  let currentPreset = 'upbeat'; // 'upbeat' | 'suspense' | 'chiptune' | 'gentle' | 'none'
  let isPlayingMusic = false;
  let synthLoopTimer = null;
  let synthStep = 0;
  let isPassSfxEnabled = true; // Cho phép bật/tắt riêng tiếng chuyền bóng

  // Custom audio element cho nhạc tải từ máy
  let customAudio = new Audio();
  let customAudioSource = null;
  let customAudioUrl = null;
  let isCustomLoaded = false;
  let customFileName = '';

  // Khởi tạo Audio Context khi người dùng tương tác lần đầu
  function init() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      musicGain = audioCtx.createGain();
      musicGain.gain.setValueAtTime(0.7, audioCtx.currentTime);
      musicGain.connect(masterGain);

      sfxGain = audioCtx.createGain();
      sfxGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
      sfxGain.connect(masterGain);

      // Kết nối custom audio vào context để kiểm soát volume
      try {
        customAudioSource = audioCtx.createMediaElementSource(customAudio);
        customAudioSource.connect(musicGain);
      } catch (e) {
        // Fallback nếu browser chặn
        customAudio.volume = 0.7;
      }

      customAudio.loop = true;
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Set âm lượng tổng (0 - 1)
  function setMasterVolume(val) {
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(parseFloat(val), audioCtx.currentTime);
    }
    customAudio.volume = parseFloat(val);
  }

  // --- BỘ TỔNG HỢP NHẠC BẰNG WEB AUDIO API (SYNTHESIZER) ---

  // Bản nhạc 1: "Vui nhộn lớp học" (Giai điệu tươi vui, nảy số, nhịp điệu nhanh)
  const UPBEAT_NOTES = [
    { note: 523.25, dur: 0.12 }, // C5
    { note: 587.33, dur: 0.12 }, // D5
    { note: 659.25, dur: 0.12 }, // E5
    { note: 783.99, dur: 0.18 }, // G5
    { note: 659.25, dur: 0.12 }, // E5
    { note: 783.99, dur: 0.25 }, // G5
    { note: 880.00, dur: 0.20 }, // A5
    { note: 783.99, dur: 0.25 }, // G5
    { note: 659.25, dur: 0.15 }, // E5
    { note: 523.25, dur: 0.15 }, // C5
    { note: 587.33, dur: 0.25 }, // D5
    { note: 659.25, dur: 0.15 }, // E5
    { note: 587.33, dur: 0.15 }, // D5
    { note: 523.25, dur: 0.35 }  // C5
  ];

  // Bản nhạc 2: "Hồi hộp thót tim" (Bass giòn tan, nhịp tim đập nhanh dần)
  const SUSPENSE_NOTES = [
    { note: 130.81, dur: 0.10 }, // C3
    { note: 138.59, dur: 0.10 }, // C#3
    { note: 130.81, dur: 0.10 }, // C3
    { note: 146.83, dur: 0.12 }, // D3
    { note: 130.81, dur: 0.10 }, // C3
    { note: 155.56, dur: 0.12 }, // Eb3
    { note: 130.81, dur: 0.10 }, // C3
    { note: 174.61, dur: 0.20 }  // F3
  ];

  // Bản nhạc 3: "Hoạt hình Chiptune" (Âm thanh vui nhộn 8-bit game)
  const CHIPTUNE_NOTES = [
    { note: 440.00, dur: 0.12 }, // A4
    { note: 554.37, dur: 0.12 }, // C#5
    { note: 659.25, dur: 0.12 }, // E5
    { note: 880.00, dur: 0.18 }, // A5
    { note: 830.61, dur: 0.12 }, // G#5
    { note: 880.00, dur: 0.12 }, // A5
    { note: 659.25, dur: 0.18 }, // E5
    { note: 554.37, dur: 0.22 }  // C#5
  ];

  // Bản nhạc 4: "Không lời nhẹ nhàng" (Giai điệu êm dịu arpeggio)
  const GENTLE_NOTES = [
    { note: 261.63, dur: 0.25 }, // C4
    { note: 329.63, dur: 0.25 }, // E4
    { note: 392.00, dur: 0.25 }, // G4
    { note: 523.25, dur: 0.35 }, // C5
    { note: 392.00, dur: 0.25 }, // G4
    { note: 329.63, dur: 0.25 }, // E4
    { note: 293.66, dur: 0.25 }, // D4
    { note: 349.23, dur: 0.25 }, // F4
    { note: 440.00, dur: 0.25 }, // A4
    { note: 587.33, dur: 0.35 }  // D5
  ];

  function playSynthNote(freq, dur, type = 'sine') {
    if (!audioCtx || !isPlayingMusic) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

    osc.connect(gain);
    gain.connect(musicGain);

    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function startSynthLoop() {
    stopSynthLoop();
    synthStep = 0;

    let notes = UPBEAT_NOTES;
    let waveType = 'triangle';

    if (currentPreset === 'suspense') {
      notes = SUSPENSE_NOTES;
      waveType = 'sawtooth';
    } else if (currentPreset === 'chiptune') {
      notes = CHIPTUNE_NOTES;
      waveType = 'square';
    } else if (currentPreset === 'gentle') {
      notes = GENTLE_NOTES;
      waveType = 'sine';
    }

    function tick() {
      if (!isPlayingMusic) return;

      const item = notes[synthStep];
      playSynthNote(item.note, item.dur, waveType);

      synthStep = (synthStep + 1) % notes.length;
      synthLoopTimer = setTimeout(tick, item.dur * 1000 + 40);
    }

    tick();
  }

  function stopSynthLoop() {
    if (synthLoopTimer) {
      clearTimeout(synthLoopTimer);
      synthLoopTimer = null;
    }
  }

  // --- ĐIỀU KHIỂN PHÁT NHẠC TỔNG THỂ ---

  function startMusic() {
    init();
    isPlayingMusic = true;

    if (currentPreset === 'custom' && isCustomLoaded) {
      customAudio.currentTime = 0;
      customAudio.play().catch(e => {
        console.warn('Lỗi tự động phát nhạc tải lên:', e);
      });
    } else if (currentPreset !== 'none') {
      startSynthLoop();
    }
  }

  function stopMusic() {
    isPlayingMusic = false;
    stopSynthLoop();
    if (customAudio && !customAudio.paused) {
      customAudio.pause();
    }
  }

  function setPreset(presetName) {
    currentPreset = presetName;
    if (isPlayingMusic) {
      stopMusic();
      startMusic();
    }
  }

  function getPreset() {
    return currentPreset;
  }

  // Tải tệp âm thanh của giáo viên
  function loadCustomAudioFile(file, onSuccess, onError) {
    init();
    if (!file) return;

    if (customAudioUrl) {
      URL.revokeObjectURL(customAudioUrl);
    }

    customAudioUrl = URL.createObjectURL(file);
    customFileName = file.name;
    customAudio.src = customAudioUrl;

    customAudio.oncanplaythrough = () => {
      isCustomLoaded = true;
      currentPreset = 'custom';
      if (onSuccess) onSuccess(file.name);
    };

    customAudio.onerror = () => {
      isCustomLoaded = false;
      if (onError) onError('Không thể đọc tệp âm thanh này!');
    };

    customAudio.load();
  }

  function playCustomPreview() {
    init();
    if (isCustomLoaded) {
      customAudio.currentTime = 0;
      customAudio.play();
    }
  }

  function pauseCustomPreview() {
    if (isCustomLoaded) {
      customAudio.pause();
    }
  }

  // --- HIỆU ỨNG ÂM THANH (SFX) ---

  // Tiếng bóng chuyền: Vui nhộn, nảy tưng bừng "boing-pop"
  function sfxPass() {
    if (!isPassSfxEnabled) return; // Nếu giáo viên tắt tiếng bóng thì bỏ qua để không lẫn vào nhạc
    init();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    const now = audioCtx.currentTime;

    // Pitch sweep từ 300Hz lên 600Hz rồi rớt xuống nhẹ
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Tiếng nhạc dừng & bóng phanh lại: "Ding/Brake"
  function sfxStop() {
    init();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Tiếng chúc mừng học sinh trả bài (Fanfare Tadaaa!)
  function sfxCelebrate() {
    init();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    // Hợp âm Đô trưởng vui mừng: C5 -> E5 -> G5 -> C6
    const chords = [
      { f: 523.25, t: 0.00, d: 0.15 },
      { f: 659.25, t: 0.12, d: 0.15 },
      { f: 783.99, t: 0.24, d: 0.18 },
      { f: 1046.50, t: 0.38, d: 0.65 }
    ];

    chords.forEach(c => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, now + c.t);

      gain.gain.setValueAtTime(0.01, now + c.t);
      gain.gain.linearRampToValueAtTime(0.3, now + c.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + c.d);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(now + c.t);
      osc.stop(now + c.t + c.d);
    });
  }

  // Tiếng click nút
  function sfxClick() {
    init();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  function setPassSfxEnabled(enabled) {
    isPassSfxEnabled = !!enabled;
  }

  function getPassSfxEnabled() {
    return isPassSfxEnabled;
  }

  return {
    init,
    startMusic,
    stopMusic,
    setPreset,
    getPreset,
    setMasterVolume,
    setPassSfxEnabled,
    getPassSfxEnabled,
    loadCustomAudioFile,
    playCustomPreview,
    pauseCustomPreview,
    sfxPass,
    sfxStop,
    sfxCelebrate,
    sfxClick,
    get customFileName() { return customFileName; }
  };
})();

