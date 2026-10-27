/**
 * GAME CORE LOGIC - TRÒ CHƠI CHUYỀN BÓNG GỌI HỌC SINH TRẢ BÀI
 * Thiết kế cho lớp học Việt Nam, công bằng, mượt mà và trực quan
 */

const BallGame = (() => {
  // Key lưu trữ trong LocalStorage
  const STORAGE_KEYS = {
    STUDENTS: 'ball_game_students_v2',
    SETTINGS: 'ball_game_settings_v2',
    ROUND_HISTORY: 'ball_game_round_history_v2',
    CALLED_LIST: 'ball_game_called_list_v2'
  };

  // Danh sách mẫu học sinh ban đầu (nếu chưa có dữ liệu)
  const DEFAULT_STUDENTS = [
    'Nguyễn Văn An',
    'Trần Thị Bình',
    'Lê Minh Cường',
    'Phạm Thu Hà',
    'Hoàng Đức Anh',
    'Vũ Thảo Vy',
    'Đặng Gia Bảo',
    'Bùi Phương Linh',
    'Đỗ Tuấn Kiệt',
    'Ngô Diệu Hương',
    'Dương Quốc Hưng',
    'Mai Ánh Tuyết'
  ];

  // Trạng thái hệ thống
  let students = [];
  let calledHistoryInRound = []; // Danh sách học sinh đã gọi ở vòng này
  let currentStudentIndex = 0;
  let isRunning = false;
  let isStopping = false;
  let moveInterval = null;
  let autoStopTimer = null;
  let currentStepSpeed = 200; // ms mỗi bước chuyền
  let lastPickedStudent = null;

  // Cài đặt trò chơi
  let settings = {
    mode: 'no_repeat', // 'no_repeat' (không trùng) | 'random' (ngẫu nhiên hoàn toàn)
    stopMode: 'manual', // 'manual' (giáo viên bấm dừng) | 'auto_10' | 'auto_15' | 'auto_20' | 'auto_30'
    musicPreset: 'upbeat',
    volume: 0.8,
    enablePassSfx: true // Bật/Tắt âm thanh chuyền bóng
  };

  // Khởi tạo ứng dụng
  function init() {
    loadSettings();
    loadStudents();
    bindEvents();
    renderPlayfield();
    updateStatsBar();

    // Lắng nghe thay đổi kích thước cửa sổ để vẽ lại vị trí nhân vật
    window.addEventListener('resize', debounce(() => {
      renderPlayfield();
      positionBallAtCurrent();
    }, 250));
  }

  // --- LƯU TRỮ VÀ DỮ LIỆU ---

  function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        settings = { ...settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Lỗi đọc cài đặt:', e);
      }
    }
    // Cập nhật giao diện cài đặt
    const modeSelect = document.getElementById('select-game-mode');
    if (modeSelect) modeSelect.value = settings.mode;

    const stopModeSelect = document.getElementById('select-stop-mode');
    if (stopModeSelect) stopModeSelect.value = settings.stopMode;

    const musicSelect = document.getElementById('select-music-preset');
    if (musicSelect) musicSelect.value = settings.musicPreset;

    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) volumeSlider.value = settings.volume;

    // Cập nhật trạng thái âm thanh chuyền bóng
    if (typeof settings.enablePassSfx === 'undefined') {
      settings.enablePassSfx = true;
    }
    SoundEngine.setPassSfxEnabled(settings.enablePassSfx);
    updatePassSfxUI();

    SoundEngine.setPreset(settings.musicPreset);
    SoundEngine.setMasterVolume(settings.volume);
  }

  function updatePassSfxUI() {
    const iconEl = document.getElementById('pass-sfx-icon');
    const textEl = document.getElementById('pass-sfx-text');
    const checkEl = document.getElementById('check-enable-pass-sfx');

    if (iconEl) iconEl.textContent = settings.enablePassSfx ? '🔊' : '🔇';
    if (textEl) textEl.textContent = settings.enablePassSfx ? 'Tiếng bóng: BẬT' : 'Tiếng bóng: TẮT';
    if (checkEl) checkEl.checked = settings.enablePassSfx;
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  function loadStudents() {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      try {
        students = JSON.parse(saved);
      } catch (e) {
        console.error('Lỗi đọc danh sách học sinh:', e);
        students = [];
      }
    }

    // Nếu chưa có học sinh nào, tạo từ danh sách mẫu
    if (!students || students.length === 0) {
      students = DEFAULT_STUDENTS.map((name, index) => ({
        id: 'std_' + Date.now() + '_' + index,
        name: name,
        avatarConfig: AvatarEngine.generateConfig(name + index),
        callCount: 0,
        isCalled: false
      }));
      saveStudents();
    }

    loadCalledHistory();
  }

  function saveStudents() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  function loadCalledHistory() {
    const saved = localStorage.getItem(STORAGE_KEYS.CALLED_LIST);
    if (saved) {
      try {
        calledHistoryInRound = JSON.parse(saved);
      } catch (e) {
        calledHistoryInRound = [];
      }
    } else {
      calledHistoryInRound = [];
    }

    // Nếu trong danh sách học sinh có em isCalled = true mà chưa có trong calledHistory, tự động bổ sung
    const calledStudents = students.filter(s => s.isCalled);
    if (calledStudents.length > 0 && calledHistoryInRound.length === 0) {
      calledStudents.forEach((cs, i) => {
        calledHistoryInRound.push({
          id: cs.id,
          name: cs.name,
          avatarConfig: cs.avatarConfig,
          time: 'Đã gọi',
          turn: i + 1
        });
      });
      saveCalledHistory();
    }
  }

  function saveCalledHistory() {
    localStorage.setItem(STORAGE_KEYS.CALLED_LIST, JSON.stringify(calledHistoryInRound));
  }

  // --- QUẢN LÝ HỌC SINH (CRUD) ---

  function addStudent(name) {
    name = (name || '').trim();
    if (!name) return { success: false, message: 'Vui lòng nhập tên học sinh!' };

    const exists = students.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      const confirmAdd = confirm(`Học sinh "${name}" đã có trong danh sách. Bạn có chắc muốn thêm tiếp không?`);
      if (!confirmAdd) return { success: false, message: 'Đã hủy thêm học sinh trùng tên.' };
    }

    const newStudent = {
      id: 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name,
      avatarConfig: AvatarEngine.generateConfig(name + Date.now()),
      callCount: 0,
      isCalled: false
    };

    students.push(newStudent);
    saveStudents();
    renderPlayfield();
    updateStatsBar();
    renderStudentListModal();
    return { success: true };
  }

  function addBulkStudents(rawText) {
    if (!rawText || !rawText.trim()) return 0;

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    let count = 0;

    lines.forEach((lineName, idx) => {
      // Loại bỏ số thứ tự ở đầu ví dụ "1. Nguyễn Văn A" hoặc "1/ Nguyễn Văn A"
      const cleanName = lineName.replace(/^[\d\s.\-_/)]+/, '').trim();
      if (cleanName) {
        students.push({
          id: 'std_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 3),
          name: cleanName,
          avatarConfig: AvatarEngine.generateConfig(cleanName + idx),
          callCount: 0,
          isCalled: false
        });
        count++;
      }
    });

    if (count > 0) {
      saveStudents();
      renderPlayfield();
      updateStatsBar();
      renderStudentListModal();
    }
    return count;
  }

  function updateStudentName(id, newName) {
    const student = students.find(s => s.id === id);
    if (student && newName.trim()) {
      student.name = newName.trim();
      saveStudents();
      renderPlayfield();
      renderStudentListModal();
    }
  }

  function randomizeAvatar(id) {
    const student = students.find(s => s.id === id);
    if (student) {
      student.avatarConfig = AvatarEngine.generateConfig(Date.now().toString());
      saveStudents();
      renderPlayfield();
      renderStudentListModal();
    }
  }

  function removeStudent(id) {
    const index = students.findIndex(s => s.id === id);
    if (index !== -1) {
      students.splice(index, 1);
      if (currentStudentIndex >= students.length) {
        currentStudentIndex = Math.max(0, students.length - 1);
      }
      saveStudents();
      renderPlayfield();
      updateStatsBar();
      renderStudentListModal();
    }
  }

  function clearAllStudents() {
    if (confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ danh sách học sinh hiện tại không?')) {
      students = [];
      saveStudents();
      renderPlayfield();
      updateStatsBar();
      renderStudentListModal();
    }
  }

  function resetCurrentRound() {
    students.forEach(s => s.isCalled = false);
    calledHistoryInRound = [];
    saveStudents();
    saveCalledHistory();
    renderPlayfield();
    updateStatsBar();
    renderCalledListModal();
    alert('Đã làm mới vòng chơi! Tất cả học sinh đều sẵn sàng tham gia lượt mới.');
  }

  // --- XUẤT / NHẬP CSV ---

  function exportToCSV() {
    if (students.length === 0) {
      alert('Danh sách đang trống, không có gì để xuất!');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM để Excel hiển thị đúng tiếng Việt có dấu
    csvContent += 'STT,Họ và tên,Số lần đã trả bài\n';

    students.forEach((s, idx) => {
      const safeName = s.name.replace(/"/g, '""');
      csvContent += `${idx + 1},"${safeName}",${s.callCount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_lop_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function importFromCSV(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      let count = 0;

      lines.forEach((line, idx) => {
        // Bỏ qua dòng tiêu đề nếu có
        if (idx === 0 && (line.toLowerCase().includes('họ và tên') || line.toLowerCase().includes('stt'))) {
          return;
        }

        // Tách theo dấu phẩy hoặc tab
        const parts = line.split(/[,;\t]/);
        let name = '';
        if (parts.length >= 2 && !isNaN(parts[0])) {
          name = parts[1].replace(/^["']|["']$/g, '').trim();
        } else {
          name = parts[0].replace(/^["']|["']$/g, '').trim();
        }

        if (name && name.length > 1) {
          students.push({
            id: 'std_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 3),
            name: name,
            avatarConfig: AvatarEngine.generateConfig(name + idx),
            callCount: 0,
            isCalled: false
          });
          count++;
        }
      });

      if (count > 0) {
        saveStudents();
        renderPlayfield();
        updateStatsBar();
        renderStudentListModal();
        alert(`Đã nhập thành công ${count} học sinh vào danh sách!`);
      } else {
        alert('Không tìm thấy dữ liệu học sinh hợp lệ trong tệp!');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  // --- TÍNH TOÁN BỐ CỤC VÀ VẼ SÂN CHƠI ---

  function renderPlayfield() {
    const container = document.getElementById('playfield-container');
    const stage = document.getElementById('students-stage');
    const emptyState = document.getElementById('empty-state');
    const ballEl = document.getElementById('game-ball');

    if (!container || !stage) return;

    // Nếu không có học sinh
    if (students.length === 0) {
      stage.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (ballEl) ballEl.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (ballEl) ballEl.style.display = 'flex';

    stage.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;
    const total = students.length;

    // Tính toán toạ độ cho từng học sinh
    // Sử dụng elip linh hoạt theo kích thước sân chơi, có khoảng đệm an toàn trên dưới
    const isFullscreen = document.body.classList.contains('fullscreen-mode') || !!document.fullscreenElement;
    const padY = isFullscreen ? 85 : 75;
    const padX = isFullscreen ? 100 : 85;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = Math.max(120, width / 2 - padX);
    const radiusY = Math.max(90, height / 2 - padY);

    students.forEach((student, index) => {
      let x = centerX;
      let y = centerY;

      if (total === 1) {
        x = centerX;
        y = centerY;
      } else if (total <= 20) {
        // Vòng elip đơn
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        x = centerX + radiusX * Math.cos(angle);
        y = centerY + radiusY * Math.sin(angle);
      } else {
        // 2 vòng elip đồng tâm (vòng trong & vòng ngoài) nếu lớp đông từ 21 - 45 em
        const isOuter = index % 2 === 0;
        const outerCount = Math.ceil(total / 2);
        const innerCount = total - outerCount;
        
        if (isOuter) {
          const outerIndex = index / 2;
          const angle = (outerIndex / outerCount) * 2 * Math.PI - Math.PI / 2;
          x = centerX + radiusX * Math.cos(angle);
          y = centerY + radiusY * Math.sin(angle);
        } else {
          const innerIndex = Math.floor(index / 2);
          const angle = (innerIndex / innerCount) * 2 * Math.PI - Math.PI / 2 + 0.15;
          x = centerX + (radiusX * 0.65) * Math.cos(angle);
          y = centerY + (radiusY * 0.65) * Math.sin(angle);
        }
      }

      // Tạo phần tử DOM
      const node = document.createElement('div');
      node.className = `student-node ${student.isCalled ? 'already-called' : ''}`;
      node.id = `student-node-${index}`;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.dataset.index = index;

      // Xác định trạng thái SVG
      let state = 'idle';
      if (index === currentStudentIndex && isRunning) {
        state = 'holding';
      }

      // Huy hiệu nếu học sinh đã được gọi trong vòng
      const calledBadgeHtml = student.isCalled ? `<div class="student-called-badge">✓ Đã gọi</div>` : '';

      node.innerHTML = `
        ${calledBadgeHtml}
        <div class="student-avatar-box">
          ${AvatarEngine.renderSVG(student.avatarConfig, state)}
        </div>
        <div class="student-name-tag" title="${student.name}">${student.name}</div>
      `;

      // Bấm vào học sinh để xem hoặc chọn
      node.addEventListener('click', () => {
        if (!isRunning) {
          currentStudentIndex = index;
          positionBallAtCurrent();
          highlightCurrentStudent();
        }
      });

      stage.appendChild(node);
    });

    positionBallAtCurrent();
    highlightCurrentStudent();
  }

  // Đặt vị trí quả bóng tại học sinh hiện tại
  function positionBallAtCurrent() {
    const ballEl = document.getElementById('game-ball');
    const ballShadow = document.getElementById('ball-shadow');
    const node = document.getElementById(`student-node-${currentStudentIndex}`);

    if (!ballEl || !node) return;

    const x = parseFloat(node.style.left);
    const y = parseFloat(node.style.top);

    // Bóng ở vị trí tay của học sinh (nhỉnh hơn tâm một chút)
    ballEl.style.left = `${x}px`;
    ballEl.style.top = `${y - 10}px`;

    if (ballShadow) {
      ballShadow.style.left = `${x}px`;
      ballShadow.style.top = `${y + 40}px`;
    }
  }

  // Cập nhật trạng thái hiển thị của học sinh hiện tại
  function highlightCurrentStudent() {
    document.querySelectorAll('.student-node').forEach((node, idx) => {
      node.classList.remove('has-ball');
      const avatarBox = node.querySelector('.student-avatar-box');
      if (avatarBox && students[idx]) {
        const student = students[idx];
        const state = (idx === currentStudentIndex && isRunning) ? 'holding' : 'idle';
        avatarBox.innerHTML = AvatarEngine.renderSVG(student.avatarConfig, state);
      }
    });

    const currentNode = document.getElementById(`student-node-${currentStudentIndex}`);
    if (currentNode) {
      currentNode.classList.add('has-ball');
      const avatarBox = currentNode.querySelector('.student-avatar-box');
      if (avatarBox && students[currentStudentIndex]) {
        avatarBox.innerHTML = AvatarEngine.renderSVG(students[currentStudentIndex].avatarConfig, 'holding');
      }
    }
  }

  // --- LOGIC DI CHUYỂN BÓNG VÀ ĐIỀU KHIỂN CHÍNH ---

  function startGame() {
    if (isRunning) return;
    if (students.length < 2) {
      alert('Cần ít nhất 2 học sinh trong danh sách để bắt đầu trò chơi chuyền bóng!');
      return;
    }

    // Kiểm tra danh sách học sinh đủ điều kiện
    const eligibleStudents = getEligibleStudents();
    if (eligibleStudents.length === 0) {
      const confirmReset = confirm('Tất cả học sinh trong lớp đều đã được gọi trả bài ở vòng này!\nBạn có muốn làm mới vòng chơi để bắt đầu tiếp không?');
      if (confirmReset) {
        resetCurrentRound();
      }
      return;
    }

    // Đóng popup nếu đang mở
    closeWinnerModal();
    ConfettiEngine.stop();

    isRunning = true;
    isStopping = false;
    currentStepSpeed = 220;

    // Cập nhật giao diện nút bấm
    updateButtonsState(true);

    // Phát nhạc
    SoundEngine.startMusic();

    // Bắt đầu nhịp chuyền bóng
    runBallLoop();

    // Nếu cài đặt chế độ tự động dừng
    if (settings.stopMode.startsWith('auto_')) {
      const seconds = parseInt(settings.stopMode.replace('auto_', '')) || 15;
      autoStopTimer = setTimeout(() => {
        if (isRunning && !isStopping) {
          triggerStop();
        }
      }, seconds * 1000);
    }
  }

  function runBallLoop() {
    if (!isRunning) return;

    // Chuyền bóng sang học sinh kế tiếp
    const prevIndex = currentStudentIndex;
    currentStudentIndex = (currentStudentIndex + 1) % students.length;

    // Hoạt ảnh chuyền: học sinh cũ vung tay chuyền, bóng bay, học sinh mới đón
    animateBallPass(prevIndex, currentStudentIndex, () => {
      if (isRunning && !isStopping) {
        moveInterval = setTimeout(runBallLoop, currentStepSpeed);
      }
    });
  }

  // Hoạt ảnh bóng bay mượt mà từ người A sang người B
  function animateBallPass(fromIndex, toIndex, onComplete) {
    const fromNode = document.getElementById(`student-node-${fromIndex}`);
    const toNode = document.getElementById(`student-node-${toIndex}`);
    const ballEl = document.getElementById('game-ball');
    const ballShadow = document.getElementById('ball-shadow');

    if (!fromNode || !toNode || !ballEl) {
      if (onComplete) onComplete();
      return;
    }

    // Đổi avatar người chuyền sang trạng thái 'passing'
    const fromAvatarBox = fromNode.querySelector('.student-avatar-box');
    if (fromAvatarBox && students[fromIndex]) {
      fromAvatarBox.innerHTML = AvatarEngine.renderSVG(students[fromIndex].avatarConfig, 'passing');
    }

    fromNode.classList.remove('has-ball');
    toNode.classList.add('has-ball');

    const startX = parseFloat(fromNode.style.left);
    const startY = parseFloat(fromNode.style.top) - 10;
    const endX = parseFloat(toNode.style.left);
    const endY = parseFloat(toNode.style.top) - 10;

    // Phát âm thanh tiếng bóng nảy/chuyền vui nhộn
    SoundEngine.sfxPass();

    const startTime = performance.now();
    const duration = currentStepSpeed;

    function stepAnimation(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Easing mượt
      const t = progress;
      const curX = startX + (endX - startX) * t;
      // Tạo độ võng / bay vòng cung parabol nhẹ cho quả bóng
      const arc = Math.sin(t * Math.PI) * 24;
      const curY = (startY + (endY - startY) * t) - arc;

      ballEl.style.left = `${curX}px`;
      ballEl.style.top = `${curY}px`;

      if (ballShadow) {
        ballShadow.style.left = `${curX}px`;
        ballShadow.style.top = `${startY + (endY - startY) * t + 40}px`;
      }

      if (progress < 1) {
        requestAnimationFrame(stepAnimation);
      } else {
        // Đã đến nơi
        const toAvatarBox = toNode.querySelector('.student-avatar-box');
        if (toAvatarBox && students[toIndex]) {
          toAvatarBox.innerHTML = AvatarEngine.renderSVG(students[toIndex].avatarConfig, 'holding');
        }
        if (onComplete) onComplete();
      }
    }

    requestAnimationFrame(stepAnimation);
  }

  // KÍCH HOẠT DỪNG VÀ CHỌN HỌC SINH CÔNG BẰNG (DELAY CHỈ TỪ 2 ĐẾN 4 BẠN)
  function triggerStop() {
    if (!isRunning || isStopping) return;

    isStopping = true;
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }

    // Dừng nhạc nền & phát tiếng phanh nhẹ
    SoundEngine.stopMusic();
    SoundEngine.sfxStop();

    const eligible = getEligibleStudents();
    if (eligible.length === 0) return;

    const total = students.length;
    // Giới hạn số bước delay sau khi bấm dừng: CHỈ TỪ 2 ĐẾN 4 BẠN
    const maxSteps = Math.min(4, Math.max(1, total - 1));
    const minSteps = Math.min(2, maxSteps);

    let chosenSteps = 2;
    let chosenTarget = null;

    if (settings.mode === 'no_repeat') {
      // Tìm các bạn ở khoảng cách từ 2 đến 4 bước chưa được gọi
      const candidates = [];
      for (let s = minSteps; s <= maxSteps; s++) {
        const idx = (currentStudentIndex + s) % total;
        if (!students[idx].isCalled) {
          candidates.push({ steps: s, student: students[idx] });
        }
      }

      if (candidates.length > 0) {
        // Chọn ngẫu nhiên 1 bạn trong các bạn chưa gọi ở khoảng 2-4 bước
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        chosenSteps = picked.steps;
        chosenTarget = picked.student;
      } else {
        // Nếu các bạn ở bước 2-4 đều đã được gọi trước đó (thường chỉ ở cuối vòng):
        // Chọn 1 bạn chưa gọi bất kỳ và đưa bạn đó vào khoảng cách 2-4 bước
        const randomEligible = eligible[Math.floor(Math.random() * eligible.length)];
        chosenSteps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
        const targetFieldIdx = (currentStudentIndex + chosenSteps) % total;

        const currentArrayIdx = students.findIndex(s => s.id === randomEligible.id);
        if (currentArrayIdx !== -1 && currentArrayIdx !== targetFieldIdx) {
          const temp = students[targetFieldIdx];
          students[targetFieldIdx] = students[currentArrayIdx];
          students[currentArrayIdx] = temp;
          saveStudents();
          renderPlayfield();
        }
        chosenTarget = students[targetFieldIdx];
      }
    } else {
      // Chế độ ngẫu nhiên hoàn toàn: chọn ngẫu nhiên số bước delay từ 2 đến 4 bạn
      chosenSteps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
      const targetIdx = (currentStudentIndex + chosenSteps) % total;
      chosenTarget = students[targetIdx];
    }

    // Bắt đầu hãm phanh với tốc độ chậm dần vừa phải (tổng thời gian chỉ ~1.2s - 1.5s)
    currentStepSpeed = 220;
    decelerateToTarget(chosenSteps, chosenTarget);
  }

  // Quá trình hãm phanh bóng giảm tốc đến đích (delay 2-4 bạn)
  function decelerateToTarget(remainingSteps, chosenTarget) {
    if (remainingSteps <= 0) {
      finishSelection(chosenTarget);
      return;
    }

    // Nhịp hãm phanh chậm dần: 220ms -> 340ms -> 480ms -> 600ms
    currentStepSpeed = Math.min(620, currentStepSpeed + 120);

    const prevIndex = currentStudentIndex;
    currentStudentIndex = (currentStudentIndex + 1) % students.length;

    animateBallPass(prevIndex, currentStudentIndex, () => {
      decelerateToTarget(remainingSteps - 1, chosenTarget);
    });
  }

  // KẾT THÚC LƯỢT: CÔNG BỐ KẾT QUẢ
  function finishSelection(student) {
    isRunning = false;
    isStopping = false;
    lastPickedStudent = student;

    // Cập nhật trạng thái học sinh
    student.callCount = (student.callCount || 0) + 1;
    if (settings.mode === 'no_repeat') {
      student.isCalled = true;
    }

    // Ghi nhận vào danh sách đã gọi của vòng này
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    calledHistoryInRound.unshift({
      id: student.id,
      name: student.name,
      avatarConfig: student.avatarConfig,
      time: nowStr,
      turn: calledHistoryInRound.length + 1
    });

    saveStudents();
    saveCalledHistory();
    updateStatsBar();

    // Làm nổi bật học sinh được chọn trên sân chơi
    const winnerNode = document.getElementById(`student-node-${currentStudentIndex}`);
    if (winnerNode) {
      winnerNode.classList.add('selected-winner');
      const avatarBox = winnerNode.querySelector('.student-avatar-box');
      if (avatarBox) {
        avatarBox.innerHTML = AvatarEngine.renderSVG(student.avatarConfig, 'celebrate');
      }
    }

    // Cập nhật giao diện nút điều khiển
    updateButtonsState(false);

    // Âm thanh vinh danh & Pháo giấy sau 400ms
    setTimeout(() => {
      SoundEngine.sfxCelebrate();
      ConfettiEngine.shoot(4500);
      showWinnerModal(student);
    }, 450);
  }

  // Lấy danh sách học sinh hợp lệ cho lượt hiện tại
  function getEligibleStudents() {
    if (settings.mode === 'no_repeat') {
      const uncalled = students.filter(s => !s.isCalled);
      return uncalled.length > 0 ? uncalled : [];
    }
    return students;
  }

  // Hoàn tác học sinh vừa được chọn (nếu giáo viên bấm chọn nhầm)
  function undoLastPick() {
    if (!lastPickedStudent) return;

    if (confirm(`Bạn muốn hủy kết quả vừa chọn của bạn "${lastPickedStudent.name}" chứ?`)) {
      lastPickedStudent.callCount = Math.max(0, lastPickedStudent.callCount - 1);
      lastPickedStudent.isCalled = false;

      // Xóa khỏi danh sách đã gọi
      const cIdx = calledHistoryInRound.findIndex(c => c.id === lastPickedStudent.id);
      if (cIdx !== -1) {
        calledHistoryInRound.splice(cIdx, 1);
      }

      saveStudents();
      saveCalledHistory();
      renderPlayfield();
      updateStatsBar();
      renderCalledListModal();
      closeWinnerModal();
      lastPickedStudent = null;
    }
  }

  // --- GIAO DIỆN & MODAL ---

  function updateButtonsState(running) {
    const btnStart = document.getElementById('btn-start-game');
    const btnStop = document.getElementById('btn-stop-game');
    const btnNext = document.getElementById('btn-next-turn');

    if (btnStart) {
      btnStart.disabled = running;
      btnStart.style.display = running ? 'none' : 'inline-flex';
    }
    if (btnStop) {
      btnStop.disabled = !running;
      btnStop.style.display = running ? 'inline-flex' : 'none';
    }
    if (btnNext) {
      btnNext.disabled = running;
    }
  }

  function updateStatsBar() {
    const totalEl = document.getElementById('stat-total-students');
    const uncalledEl = document.getElementById('stat-uncalled-students');
    const calledEl = document.getElementById('stat-called-students');
    const headerBadgeEl = document.getElementById('header-called-badge');
    const modalCountEl = document.getElementById('called-modal-count');

    const total = students.length;
    const called = students.filter(s => s.isCalled).length;
    const uncalled = total - called;

    if (totalEl) totalEl.textContent = total;
    if (uncalledEl) uncalledEl.textContent = uncalled;
    if (calledEl) calledEl.textContent = called;
    if (headerBadgeEl) headerBadgeEl.textContent = called;
    if (modalCountEl) modalCountEl.textContent = called;
  }

  // Render danh sách học sinh đã bị gọi trong vòng hiện tại
  function renderCalledListModal() {
    const container = document.getElementById('called-list-container');
    if (!container) return;

    container.innerHTML = '';

    // Lọc danh sách học sinh đang có cờ isCalled = true
    const currentCalledStudents = students.filter(s => s.isCalled);

    if (currentCalledStudents.length === 0) {
      container.innerHTML = `
        <div class="called-empty-box">
          <div class="icon">✨</div>
          <div style="font-size: 15px; font-weight: 700; color: #1e293b;">Chưa có bạn nào bị gọi ở vòng này!</div>
          <p style="font-size: 13px; margin-top: 4px;">Hãy bấm nút Bắt đầu chuyền bóng để gọi bạn đầu tiên lên bảng nhé.</p>
        </div>
      `;
      return;
    }

    // Hiển thị theo danh sách calledHistoryInRound (hoặc currentCalledStudents)
    // Ưu tiên theo thứ tự trong calledHistoryInRound
    const listToDisplay = [];
    calledHistoryInRound.forEach(item => {
      const student = students.find(s => s.id === item.id);
      if (student && student.isCalled) {
        listToDisplay.push({
          ...item,
          studentRef: student
        });
      }
    });

    // Nếu có em nào isCalled mà chưa có trong history
    currentCalledStudents.forEach(cs => {
      if (!listToDisplay.some(item => item.id === cs.id)) {
        listToDisplay.push({
          id: cs.id,
          name: cs.name,
          avatarConfig: cs.avatarConfig,
          time: 'Đã gọi',
          turn: listToDisplay.length + 1,
          studentRef: cs
        });
      }
    });

    listToDisplay.forEach((item, idx) => {
      const isLatest = (idx === 0);
      const card = document.createElement('div');
      card.className = `called-item-card ${isLatest ? 'latest' : ''}`;
      card.innerHTML = `
        <div class="called-item-left">
          <div class="called-turn-tag ${isLatest ? 'latest' : ''}">
            ${isLatest ? 'Mới nhất' : `Lượt #${item.turn || (listToDisplay.length - idx)}`}
          </div>
          <div class="called-item-avatar">
            ${AvatarEngine.renderSVG(item.avatarConfig, isLatest ? 'celebrate' : 'idle')}
          </div>
          <div class="called-item-info">
            <div class="called-item-name">${item.name}</div>
            <div class="called-item-time">Thời điểm gọi: ${item.time || 'Vừa xong'} | Đã trả bài: ${item.studentRef.callCount || 1} lần</div>
          </div>
        </div>
        <div>
          <button class="btn btn-secondary btn-icon" onclick="BallGame.returnToRound('${item.id}')" title="Cho bạn này tham gia lại vòng chơi này">
            <span>↩️</span> Cho chơi lại
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Cho phép 1 học sinh đã gọi được tham gia lại vòng chơi
  function returnToRound(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (confirm(`Cho bạn "${student.name}" quay trở lại danh sách chưa gọi của vòng này chứ?`)) {
      student.isCalled = false;
      student.callCount = Math.max(0, student.callCount - 1);

      // Gỡ khỏi calledHistoryInRound
      const cIdx = calledHistoryInRound.findIndex(c => c.id === studentId);
      if (cIdx !== -1) {
        calledHistoryInRound.splice(cIdx, 1);
      }

      saveStudents();
      saveCalledHistory();
      renderPlayfield();
      updateStatsBar();
      renderCalledListModal();
    }
  }

  function showWinnerModal(student) {
    const modal = document.getElementById('winner-modal');
    const nameEl = document.getElementById('winner-name');
    const avatarEl = document.getElementById('winner-avatar');
    const countEl = document.getElementById('winner-call-count');
    const remainEl = document.getElementById('winner-uncalled-count');

    if (!modal) return;

    if (nameEl) nameEl.textContent = student.name;
    if (avatarEl) avatarEl.innerHTML = AvatarEngine.renderSVG(student.avatarConfig, 'celebrate');
    if (countEl) countEl.textContent = student.callCount;

    const uncalled = students.filter(s => !s.isCalled).length;
    if (remainEl) remainEl.textContent = uncalled;

    modal.classList.add('active');
  }

  function closeWinnerModal() {
    const modal = document.getElementById('winner-modal');
    if (modal) modal.classList.remove('active');
  }

  // Modal quản lý danh sách học sinh
  function renderStudentListModal() {
    const tbody = document.getElementById('student-list-rows');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (students.length === 0) {
      tbody.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">Chưa có học sinh nào trong danh sách.</div>';
      return;
    }

    students.forEach((s, idx) => {
      const row = document.createElement('div');
      row.className = 'student-row';
      row.innerHTML = `
        <div class="student-row-info">
          <div class="student-row-avatar">
            ${AvatarEngine.renderSVG(s.avatarConfig, 'idle')}
          </div>
          <div>
            <div class="student-row-name">${idx + 1}. ${s.name}</div>
            <div style="font-size: 11px; color: #64748b;">Đã gọi: ${s.callCount || 0} lần | ${s.isCalled ? 'Đã gọi lượt này' : 'Chưa gọi'}</div>
          </div>
        </div>
        <div class="student-row-actions">
          <button class="btn btn-secondary btn-icon" onclick="BallGame.handleEditName('${s.id}')" title="Sửa tên">✏️</button>
          <button class="btn btn-secondary btn-icon" onclick="BallGame.randomizeAvatar('${s.id}')" title="Đổi nhân vật hoạt hình">🎨</button>
          <button class="btn btn-danger btn-icon" onclick="BallGame.removeStudent('${s.id}')" title="Xóa học sinh">🗑️</button>
        </div>
      `;
      tbody.appendChild(row);
    });
  }

  function handleEditName(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const newName = prompt('Nhập tên mới cho học sinh:', student.name);
    if (newName && newName.trim()) {
      updateStudentName(id, newName.trim());
    }
  }

  // --- CÀI ĐẶT TOÀN MÀN HÌNH (MÁY CHIẾU) ---

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        document.body.classList.add('fullscreen-mode');
        const fsBtn = document.getElementById('btn-fullscreen');
        if (fsBtn) fsBtn.innerHTML = '<span>🗗</span> Thoát toàn màn hình';
      }).catch(err => {
        alert(`Không thể chuyển chế độ toàn màn hình: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        document.body.classList.remove('fullscreen-mode');
        const fsBtn = document.getElementById('btn-fullscreen');
        if (fsBtn) fsBtn.innerHTML = '<span>📺</span> Toàn màn hình máy chiếu';
      });
    }
  }

  // --- SỰ KIỆN GIAO DIỆN (BIND EVENTS) ---

  function bindEvents() {
    // Nút Bắt đầu
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        SoundEngine.sfxClick();
        startGame();
      });
    }

    // Nút Dừng
    const btnStop = document.getElementById('btn-stop-game');
    if (btnStop) {
      btnStop.addEventListener('click', () => {
        SoundEngine.sfxClick();
        triggerStop();
      });
    }

    // Nút Gọi người tiếp theo / Lượt mới
    const btnNext = document.getElementById('btn-next-turn');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        SoundEngine.sfxClick();
        closeWinnerModal();
        startGame();
      });
    }

    // Nút Hoàn tác / Chọn lại
    const btnUndo = document.getElementById('btn-undo-pick');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        SoundEngine.sfxClick();
        undoLastPick();
      });
    }

    // Nút Toàn màn hình
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        SoundEngine.sfxClick();
        toggleFullscreen();
      });
    }

    // Lắng nghe phím ESC hoặc thoát fullscreen
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen-mode');
        const fsBtn = document.getElementById('btn-fullscreen');
        if (fsBtn) fsBtn.innerHTML = '<span>📺</span> Toàn màn hình máy chiếu';
      }
    });

    // Modal Danh sách học sinh
    const btnOpenList = document.getElementById('btn-open-student-modal');
    const modalList = document.getElementById('student-modal');
    const btnCloseList = document.getElementById('btn-close-student-modal');

    if (btnOpenList && modalList) {
      btnOpenList.addEventListener('click', () => {
        SoundEngine.sfxClick();
        renderStudentListModal();
        modalList.classList.add('active');
      });
    }
    if (btnCloseList && modalList) {
      btnCloseList.addEventListener('click', () => {
        modalList.classList.remove('active');
      });
    }

    // Modal Cài đặt âm thanh & trò chơi
    const btnOpenSettings = document.getElementById('btn-open-settings-modal');
    const modalSettings = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings-modal');

    if (btnOpenSettings && modalSettings) {
      btnOpenSettings.addEventListener('click', () => {
        SoundEngine.sfxClick();
        modalSettings.classList.add('active');
      });
    }
    if (btnCloseSettings && modalSettings) {
      btnCloseSettings.addEventListener('click', () => {
        modalSettings.classList.remove('active');
      });
    }

    // Modal Danh sách học sinh đã gọi ở vòng này
    const btnOpenCalled = document.getElementById('btn-open-called-modal');
    const chipOpenCalled = document.getElementById('chip-called-students');
    const modalCalled = document.getElementById('called-modal');
    const btnCloseCalled = document.getElementById('btn-close-called-modal');
    const btnCalledReset = document.getElementById('btn-called-reset-round');

    const openCalledModal = () => {
      SoundEngine.sfxClick();
      renderCalledListModal();
      if (modalCalled) modalCalled.classList.add('active');
    };

    if (btnOpenCalled) {
      btnOpenCalled.addEventListener('click', openCalledModal);
    }
    if (chipOpenCalled) {
      chipOpenCalled.addEventListener('click', openCalledModal);
    }
    if (btnCloseCalled && modalCalled) {
      btnCloseCalled.addEventListener('click', () => {
        modalCalled.classList.remove('active');
      });
    }
    if (btnCalledReset) {
      btnCalledReset.addEventListener('click', () => {
        resetCurrentRound();
      });
    }

    // Đóng Modal kết quả
    const btnWinnerClose = document.getElementById('btn-winner-close');
    const btnWinnerNext = document.getElementById('btn-winner-next');
    const btnWinnerOpenCalled = document.getElementById('btn-winner-open-called');

    if (btnWinnerClose) {
      btnWinnerClose.addEventListener('click', () => {
        closeWinnerModal();
      });
    }
    if (btnWinnerNext) {
      btnWinnerNext.addEventListener('click', () => {
        closeWinnerModal();
        startGame();
      });
    }
    if (btnWinnerOpenCalled) {
      btnWinnerOpenCalled.addEventListener('click', () => {
        closeWinnerModal();
        openCalledModal();
      });
    }

    // Thêm 1 học sinh
    const btnAddSingle = document.getElementById('btn-add-single-student');
    const inputSingle = document.getElementById('input-single-name');
    if (btnAddSingle && inputSingle) {
      const doAdd = () => {
        const res = addStudent(inputSingle.value);
        if (res.success) {
          inputSingle.value = '';
          inputSingle.focus();
        } else if (res.message) {
          alert(res.message);
        }
      };
      btnAddSingle.addEventListener('click', doAdd);
      inputSingle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doAdd();
      });
    }

    // Nhập hàng loạt
    const btnAddBulk = document.getElementById('btn-add-bulk-students');
    const textareaBulk = document.getElementById('textarea-bulk-names');
    if (btnAddBulk && textareaBulk) {
      btnAddBulk.addEventListener('click', () => {
        const count = addBulkStudents(textareaBulk.value);
        if (count > 0) {
          alert(`Đã thêm thành công ${count} học sinh vào lớp!`);
          textareaBulk.value = '';
        } else {
          alert('Vui lòng dán danh sách tên học sinh (mỗi dòng một tên)!');
        }
      });
    }

    // Xuất CSV
    const btnExport = document.getElementById('btn-export-csv');
    if (btnExport) {
      btnExport.addEventListener('click', exportToCSV);
    }

    // Nhập CSV
    const fileCsvInput = document.getElementById('input-import-csv');
    if (fileCsvInput) {
      fileCsvInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          importFromCSV(e.target.files[0]);
          e.target.value = '';
        }
      });
    }

    // Nạp lại danh sách mẫu
    const btnLoadSample = document.getElementById('btn-load-sample-students');
    if (btnLoadSample) {
      btnLoadSample.addEventListener('click', () => {
        if (confirm('Bạn có muốn nạp lại danh sách học sinh mẫu lớp học Việt Nam không?')) {
          students = DEFAULT_STUDENTS.map((name, index) => ({
            id: 'std_' + Date.now() + '_' + index,
            name: name,
            avatarConfig: AvatarEngine.generateConfig(name + index),
            callCount: 0,
            isCalled: false
          }));
          saveStudents();
          renderPlayfield();
          updateStatsBar();
          renderStudentListModal();
        }
      });
    }

    // Xóa toàn bộ
    const btnClearAll = document.getElementById('btn-clear-all-students');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', clearAllStudents);
    }

    // Làm mới vòng chơi
    const btnResetRound = document.getElementById('btn-reset-round');
    if (btnResetRound) {
      btnResetRound.addEventListener('click', resetCurrentRound);
    }

    // Chọn chế độ chơi (Không trùng / Ngẫu nhiên)
    const selectMode = document.getElementById('select-game-mode');
    if (selectMode) {
      selectMode.addEventListener('change', (e) => {
        settings.mode = e.target.value;
        saveSettings();
        renderPlayfield();
        updateStatsBar();
      });
    }

    // Chọn chế độ dừng
    const selectStopMode = document.getElementById('select-stop-mode');
    if (selectStopMode) {
      selectStopMode.addEventListener('change', (e) => {
        settings.stopMode = e.target.value;
        saveSettings();
      });
    }

    // Chọn nhạc mẫu
    const selectMusic = document.getElementById('select-music-preset');
    if (selectMusic) {
      selectMusic.addEventListener('change', (e) => {
        settings.musicPreset = e.target.value;
        SoundEngine.setPreset(settings.musicPreset);
        saveSettings();
      });
    }

    // Tải file nhạc của giáo viên
    const audioFileInput = document.getElementById('custom-audio-input');
    const audioFileNameEl = document.getElementById('custom-audio-name');
    const btnPlayPreview = document.getElementById('btn-play-preview');
    const btnPausePreview = document.getElementById('btn-pause-preview');

    if (audioFileInput) {
      audioFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          SoundEngine.loadCustomAudioFile(file, (fileName) => {
            if (audioFileNameEl) audioFileNameEl.textContent = `Tệp đã chọn: ${fileName}`;
            if (selectMusic) selectMusic.value = 'custom';
            settings.musicPreset = 'custom';
            saveSettings();
          }, (err) => {
            alert(err);
          });
        }
      });
    }

    if (btnPlayPreview) {
      btnPlayPreview.addEventListener('click', () => {
        SoundEngine.playCustomPreview();
      });
    }
    if (btnPausePreview) {
      btnPausePreview.addEventListener('click', () => {
        SoundEngine.pauseCustomPreview();
      });
    }

    // Điều chỉnh âm lượng
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        settings.volume = parseFloat(e.target.value);
        SoundEngine.setMasterVolume(settings.volume);
        saveSettings();
      });
    }

    // Bật/Tắt âm thanh chuyền bóng (để không lẫn vào tiếng nhạc)
    const btnTogglePassSfx = document.getElementById('btn-toggle-pass-sfx');
    const checkEnablePassSfx = document.getElementById('check-enable-pass-sfx');

    const togglePassSfx = (newVal) => {
      settings.enablePassSfx = (typeof newVal === 'boolean') ? newVal : !settings.enablePassSfx;
      SoundEngine.setPassSfxEnabled(settings.enablePassSfx);
      updatePassSfxUI();
      saveSettings();
      SoundEngine.sfxClick();
    };

    if (btnTogglePassSfx) {
      btnTogglePassSfx.addEventListener('click', () => togglePassSfx());
    }
    if (checkEnablePassSfx) {
      checkEnablePassSfx.addEventListener('change', (e) => togglePassSfx(e.target.checked));
    }

    // Tab trong modal học sinh
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabTarget = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        const activeContent = document.getElementById(`tab-content-${tabTarget}`);
        if (activeContent) activeContent.style.display = 'block';
      });
    });
  }

  // Tiện ích chống dội debounce
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Khởi động khi tải xong trang
  window.addEventListener('DOMContentLoaded', init);

  return {
    init,
    startGame,
    triggerStop,
    addStudent,
    addBulkStudents,
    updateStudentName,
    randomizeAvatar,
    removeStudent,
    handleEditName,
    toggleFullscreen,
    returnToRound,
    renderCalledListModal
  };
})();

