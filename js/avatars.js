/**
 * AVATAR ENGINE - HỆ THỐNG TẠO NHÂN VẬT HOẠT HÌNH HỌC SINH VIỆT NAM (SVG)
 * Thiết kế phong cách Chibi dễ thương, thuần vector SVG, tải tức thì không phụ thuộc internet.
 */

const AvatarEngine = (() => {
  // Bảng màu & tùy chọn phong phú
  const SKIN_TONES = ['#fcd5b5', '#fde2cd', '#f7be95', '#ffe0bd', '#f3ba89'];
  const HAIR_COLORS = ['#222222', '#2d221c', '#3c2415', '#1a1a1a', '#443121'];
  const SHIRT_COLORS = ['#ffffff', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const ACCESSORIES = ['none', 'glasses_round', 'glasses_square', 'hairpin_flower', 'cap', 'headband', 'red_scarf'];

  // Danh mục kiểu tóc
  const HAIR_STYLES = [
    'boy_short',      // Tóc ngắn gọn gàng nam
    'boy_spiky',      // Tóc vuốt nhẹ
    'boy_curly',      // Tóc hơi xoăn
    'girl_ponytail',  // Tóc buộc đuôi ngựa
    'girl_twintails', // Tóc 2 chùm cột nơ
    'girl_bob',       // Tóc ngắn bob mái ngố
    'girl_long',      // Tóc dài buông xõa
    'unisex_parted'   // Tóc rẽ ngôi hiện đại
  ];

  /**
   * Tạo cấu hình nhân vật ngẫu nhiên hoặc dựa trên hạt giống (seed)
   */
  function generateConfig(seedStr = '') {
    let hash = 0;
    if (seedStr) {
      for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
      }
      hash = Math.abs(hash);
    } else {
      hash = Math.floor(Math.random() * 1000000);
    }

    const gender = hash % 2 === 0 ? 'boy' : 'girl';
    const hairPool = gender === 'boy' 
      ? ['boy_short', 'boy_spiky', 'boy_curly', 'unisex_parted']
      : ['girl_ponytail', 'girl_twintails', 'girl_bob', 'girl_long'];

    const hairStyle = hairPool[hash % hairPool.length];
    const hairColor = HAIR_COLORS[(hash >> 2) % HAIR_COLORS.length];
    const skinTone = SKIN_TONES[(hash >> 4) % SKIN_TONES.length];
    const shirtColor = SHIRT_COLORS[(hash >> 6) % SHIRT_COLORS.length];
    const hasRedScarf = ((hash >> 8) % 3 === 0); // 1/3 có khăn quàng đỏ Đội viên
    const accessory = ACCESSORIES[(hash >> 10) % ACCESSORIES.length];

    return {
      gender,
      hairStyle,
      hairColor,
      skinTone,
      shirtColor,
      hasRedScarf,
      accessory
    };
  }

  /**
   * Vẽ SVG nhân vật theo cấu hình và trạng thái
   * @param {Object} cfg Cấu hình nhân vật
   * @param {string} state 'idle' | 'holding' | 'passing' | 'celebrate'
   */
  function renderSVG(cfg, state = 'idle') {
    const { hairStyle, hairColor, skinTone, shirtColor, hasRedScarf, accessory } = cfg;

    // Vị trí cánh tay theo trạng thái
    let leftArm = '';
    let rightArm = '';
    let mouth = '';
    let eyes = '';

    if (state === 'celebrate') {
      // 2 tay giơ cao ăn mừng
      leftArm = `<path d="M 32 68 Q 20 52 14 36" stroke="${skinTone}" stroke-width="8" stroke-linecap="round" fill="none"/>
                 <circle cx="14" cy="35" r="4.5" fill="${skinTone}"/>`;
      rightArm = `<path d="M 68 68 Q 80 52 86 36" stroke="${skinTone}" stroke-width="8" stroke-linecap="round" fill="none"/>
                  <circle cx="86" cy="35" r="4.5" fill="${skinTone}"/>`;
      // Mắt cười tít hình trăng khuyết
      eyes = `
        <path d="M 39 42 Q 44 37 49 42" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M 51 42 Q 56 37 61 42" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <circle cx="37" cy="46" r="3" fill="#ff7f7f" opacity="0.6"/>
        <circle cx="63" cy="46" r="3" fill="#ff7f7f" opacity="0.6"/>
      `;
      // Miệng cười to hạnh phúc
      mouth = `<path d="M 43 47 Q 50 56 57 47 Z" fill="#e11d48"/>`;
    } else if (state === 'holding') {
      // 2 tay giơ ra phía trước đón và ôm bóng
      leftArm = `<path d="M 32 68 Q 38 60 44 64" stroke="${skinTone}" stroke-width="8" stroke-linecap="round" fill="none"/>
                 <circle cx="44" cy="64" r="4.5" fill="${skinTone}"/>`;
      rightArm = `<path d="M 68 68 Q 62 60 56 64" stroke="${skinTone}" stroke-width="8" stroke-linecap="round" fill="none"/>
                  <circle cx="56" cy="64" r="4.5" fill="${skinTone}"/>`;
      // Mắt to tròn hào hứng
      eyes = `
        <circle cx="43" cy="41" r="4" fill="#222"/>
        <circle cx="41.5" cy="39.5" r="1.5" fill="#fff"/>
        <circle cx="57" cy="41" r="4" fill="#222"/>
        <circle cx="55.5" cy="39.5" r="1.5" fill="#fff"/>
        <circle cx="37" cy="46" r="3" fill="#f472b6" opacity="0.5"/>
        <circle cx="63" cy="46" r="3" fill="#f472b6" opacity="0.5"/>
      `;
      // Miệng chữ O ngạc nhiên vui mừng
      mouth = `<ellipse cx="50" cy="49" rx="3.5" ry="4" fill="#e11d48"/>`;
    } else if (state === 'passing') {
      // 1 tay vung chuyền bóng, 1 tay lùi lại
      leftArm = `<path d="M 32 68 Q 24 72 20 78" stroke="${skinTone}" stroke-width="8" stroke-linecap="round" fill="none"/>
                 <circle cx="20" cy="78" r="4.5" fill="${skinTone}"/>`;
      rightArm = `<path d="M 68 68 Q 78 60 88 56" stroke="${skinTone}" stroke-width="8" stroke-linecap="round" fill="none"/>
                  <circle cx="88" cy="56" r="4.5" fill="${skinTone}"/>`;
      // Mắt nháy tinh nghịch
      eyes = `
        <path d="M 39 41 Q 44 38 49 41" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <circle cx="57" cy="41" r="4" fill="#222"/>
        <circle cx="55.5" cy="39.5" r="1.5" fill="#fff"/>
        <circle cx="37" cy="46" r="3" fill="#ff7f7f" opacity="0.5"/>
        <circle cx="63" cy="46" r="3" fill="#ff7f7f" opacity="0.5"/>
      `;
      mouth = `<path d="M 45 47 Q 50 52 55 48" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    } else {
      // IDLE - Đứng chờ thoải mái
      leftArm = `<path d="M 32 68 Q 26 76 26 84" stroke="${skinTone}" stroke-width="8" stroke-linecap="round" fill="none"/>
                 <circle cx="26" cy="84" r="4.5" fill="${skinTone}"/>`;
      rightArm = `<path d="M 68 68 Q 74 76 74 84" stroke="${skinTone}" stroke-width="8" stroke-linecap="round" fill="none"/>
                  <circle cx="74" cy="84" r="4.5" fill="${skinTone}"/>`;
      // Mắt dễ thương
      eyes = `
        <circle cx="43" cy="42" r="3.5" fill="#222"/>
        <circle cx="42" cy="40.5" r="1.2" fill="#fff"/>
        <circle cx="57" cy="42" r="3.5" fill="#222"/>
        <circle cx="56" cy="40.5" r="1.2" fill="#fff"/>
        <circle cx="38" cy="46" r="3" fill="#f87171" opacity="0.4"/>
        <circle cx="62" cy="46" r="3" fill="#f87171" opacity="0.4"/>
      `;
      mouth = `<path d="M 45 48 Q 50 53 55 48" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }

    // Tóc phía sau (nếu là tóc dài hoặc 2 chùm)
    let backHair = '';
    if (hairStyle === 'girl_twintails') {
      backHair = `
        <ellipse cx="23" cy="48" rx="8" ry="14" fill="${hairColor}" transform="rotate(-15 23 48)"/>
        <ellipse cx="77" cy="48" rx="8" ry="14" fill="${hairColor}" transform="rotate(15 77 48)"/>
        <circle cx="27" cy="38" r="4" fill="#ec4899"/>
        <circle cx="73" cy="38" r="4" fill="#ec4899"/>
      `;
    } else if (hairStyle === 'girl_long') {
      backHair = `
        <path d="M 30 40 Q 22 65 24 80 Q 50 82 76 80 Q 78 65 70 40 Z" fill="${hairColor}"/>
      `;
    } else if (hairStyle === 'girl_ponytail') {
      backHair = `
        <path d="M 65 28 Q 85 24 88 42 Q 80 50 72 38 Z" fill="${hairColor}"/>
        <circle cx="66" cy="30" r="3.5" fill="#3b82f6"/>
      `;
    }

    // Tóc phía trước
    let frontHair = '';
    switch (hairStyle) {
      case 'boy_spiky':
        frontHair = `
          <path d="M 28 35 Q 32 15 50 16 Q 68 15 72 35 C 68 28 60 25 50 25 C 40 25 32 28 28 35 Z" fill="${hairColor}"/>
          <path d="M 45 16 L 50 9 L 55 16 Z" fill="${hairColor}"/>
          <path d="M 36 19 L 41 12 L 44 20 Z" fill="${hairColor}"/>
          <path d="M 56 20 L 59 12 L 64 19 Z" fill="${hairColor}"/>
        `;
        break;
      case 'boy_curly':
        frontHair = `
          <circle cx="34" cy="24" r="8" fill="${hairColor}"/>
          <circle cx="44" cy="20" r="9" fill="${hairColor}"/>
          <circle cx="56" cy="20" r="9" fill="${hairColor}"/>
          <circle cx="66" cy="24" r="8" fill="${hairColor}"/>
          <path d="M 30 32 Q 50 25 70 32 C 65 26 55 24 50 24 C 45 24 35 26 30 32 Z" fill="${hairColor}"/>
        `;
        break;
      case 'girl_bob':
        frontHair = `
          <path d="M 27 38 C 26 22 36 17 50 17 C 64 17 74 22 73 38 C 73 45 71 52 68 54 C 67 44 65 32 50 32 C 35 32 33 44 32 54 C 29 52 27 45 27 38 Z" fill="${hairColor}"/>
        `;
        break;
      case 'unisex_parted':
        frontHair = `
          <path d="M 28 34 C 28 20 40 17 50 17 C 60 17 72 20 72 34 C 65 27 58 27 52 30 C 46 25 36 26 28 34 Z" fill="${hairColor}"/>
        `;
        break;
      case 'boy_short':
      default:
        frontHair = `
          <path d="M 28 35 C 28 20 38 18 50 18 C 62 18 72 20 72 35 C 66 28 58 28 52 32 C 46 28 36 29 28 35 Z" fill="${hairColor}"/>
        `;
        break;
    }

    // Phụ kiện
    let accessorySVG = '';
    if (accessory === 'glasses_round') {
      accessorySVG = `
        <circle cx="43" cy="42" r="6" stroke="#475569" stroke-width="2" fill="none"/>
        <circle cx="57" cy="42" r="6" stroke="#475569" stroke-width="2" fill="none"/>
        <line x1="49" y1="42" x2="51" y2="42" stroke="#475569" stroke-width="2"/>
        <line x1="37" y1="42" x2="33" y2="41" stroke="#475569" stroke-width="1.5"/>
        <line x1="63" y1="42" x2="67" y2="41" stroke="#475569" stroke-width="1.5"/>
      `;
    } else if (accessory === 'glasses_square') {
      accessorySVG = `
        <rect x="36" y="37" width="13" height="10" rx="2" stroke="#1e293b" stroke-width="2" fill="none"/>
        <rect x="51" y="37" width="13" height="10" rx="2" stroke="#1e293b" stroke-width="2" fill="none"/>
        <line x1="49" y1="41" x2="51" y2="41" stroke="#1e293b" stroke-width="2"/>
      `;
    } else if (accessory === 'cap') {
      accessorySVG = `
        <path d="M 30 26 Q 50 12 70 26 Z" fill="#ef4444"/>
        <ellipse cx="62" cy="26" rx="14" ry="3.5" fill="#dc2626"/>
      `;
    } else if (accessory === 'hairpin_flower') {
      accessorySVG = `
        <circle cx="68" cy="30" r="4" fill="#fbbf24"/>
        <circle cx="68" cy="30" r="1.5" fill="#f59e0b"/>
      `;
    }

    // Khăn quàng đỏ học sinh Việt Nam
    let redScarfSVG = '';
    if (hasRedScarf) {
      redScarfSVG = `
        <path d="M 44 59 L 50 63 L 56 59 L 52 74 L 48 74 Z" fill="#dc2626"/>
        <path d="M 46 60 Q 50 63 54 60 L 51 64 Z" fill="#b91c1c"/>
      `;
    }

    // Thân áo & chân
    return `
      <svg viewBox="0 0 100 100" class="student-avatar-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity="0.15"/>
          </filter>
        </defs>

        <!-- Bóng đổ dưới chân -->
        <ellipse cx="50" cy="94" rx="24" ry="4.5" fill="rgba(0,0,0,0.12)"/>

        <!-- Tóc phía sau -->
        ${backHair}

        <!-- 2 Chân / Quần -->
        <rect x="40" y="80" width="8" height="12" rx="3" fill="#1e3a8a"/>
        <rect x="52" y="80" width="8" height="12" rx="3" fill="#1e3a8a"/>
        <!-- Giày -->
        <ellipse cx="43" cy="92" rx="5" ry="2.5" fill="#334155"/>
        <ellipse cx="57" cy="92" rx="5" ry="2.5" fill="#334155"/>

        <!-- Cánh tay phía sau (nếu có) -->
        ${leftArm}
        ${rightArm}

        <!-- Thân áo -->
        <path d="M 33 60 C 33 58 37 57 50 57 C 63 57 67 58 67 60 L 65 82 C 65 83 63 84 50 84 C 37 84 35 83 35 82 Z" 
              fill="${shirtColor}" filter="url(#shadow)"/>
        <!-- Cổ áo sơ mi / đồng phục -->
        <path d="M 43 57 L 50 64 L 46 64 Z" fill="#e2e8f0"/>
        <path d="M 57 57 L 50 64 L 54 64 Z" fill="#e2e8f0"/>

        <!-- Khăn quàng đỏ -->
        ${redScarfSVG}

        <!-- Cổ & Khuôn mặt -->
        <rect x="46" y="52" width="8" height="7" fill="${skinTone}"/>
        <ellipse cx="50" cy="43" rx="19" ry="17" fill="${skinTone}"/>

        <!-- Tai -->
        <circle cx="31" cy="43" r="3.5" fill="${skinTone}"/>
        <circle cx="69" cy="43" r="3.5" fill="${skinTone}"/>

        <!-- Mắt & Miệng -->
        ${eyes}
        ${mouth}

        <!-- Tóc phía trước -->
        ${frontHair}

        <!-- Phụ kiện -->
        ${accessorySVG}
      </svg>
    `;
  }

  return {
    generateConfig,
    renderSVG,
    SKIN_TONES,
    HAIR_COLORS,
    SHIRT_COLORS,
    HAIR_STYLES,
    ACCESSORIES
  };
})();

