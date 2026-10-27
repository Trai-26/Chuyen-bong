# ⚽ CHUYỀN BÓNG – NHẠC DỪNG, AI TRẢ BÀI?
> **Website trò chơi tương tác gọi học sinh trả bài sinh động, công bằng và vui nhộn dành cho giáo viên Việt Nam.**

---

## 🌟 Giới thiệu tổng quan

Ứng dụng mô phỏng hoạt động trò chơi dân gian / hoạt náo lớp học **"Chuyền bóng theo nhạc"**:
- Quả bóng hoạt hình di chuyển liên tục, nảy nhịp nhàng qua từng bạn học sinh trên sân trường.
- Mỗi học sinh có một **nhân vật hoạt hình Chibi 2D độc nhất** (áo đồng phục, khăn quàng đỏ, các kiểu tóc, kính mắt, nụ cười tinh nghịch).
- Khi nhạc dừng hoặc giáo viên bấm **"Dừng nhạc và chọn"**, quả bóng chậm dần và dừng lại đúng học sinh được chọn.
- Pháo giấy bắn rực rỡ kèm tiếng nhạc chúc mừng vinh danh học sinh lên bảng trả lời câu hỏi!

---

## 🚀 Cách mở và sử dụng website

### Cách 1: Mở trực tiếp (Không cần cài đặt bất kỳ phần mềm nào)
1. Vào thư mục dự án: `d:\Dự án trò chơi\App trò chơi gọi trả bài`.
2. Nhấp đúp chuột vào tệp `index.html`.
3. Trình duyệt web (Google Chrome, Microsoft Edge, Cốc Cốc, Firefox) sẽ mở website lên ngay lập tức.
4. **Không cần kết nối internet!** Ứng dụng chạy hoàn toàn offline 100%.

### Cách 2: Chạy qua Live Server / Localhost (Tùy chọn)
Nếu bạn có Node.js hoặc Python:
```bash
# Bằng Python
python -m http.server 8080

# Hoặc mở trực tiếp file index.html
```
Sau đó truy cập: `http://localhost:8080`.

---

## 🎮 Hướng dẫn chi tiết dành cho giáo viên

### Bước 1: Quản lý danh sách học sinh
- Nhấn nút **"👥 Danh sách học sinh"** ở góc trên màn hình.
- **Dán danh sách cả lớp từ Excel / Word**: Chọn tab *"📝 Nhập hàng loạt"*, dán danh sách tên học sinh (mỗi em một dòng) rồi bấm *"Thêm tất cả vào lớp"*.
- Hệ thống tự động lọc bỏ số thứ tự thừa, gán ngay nhân vật hoạt hình Chibi dễ thương cho từng em.
- **Lưu trữ tự động**: Toàn bộ danh sách được lưu vào bộ nhớ trình duyệt (LocalStorage). Khi tắt máy mở lại, danh sách vẫn còn nguyên.
- **Xuất / Nhập CSV**: Giáo viên có thể bấm *"Xuất tệp CSV"* để lưu danh sách lớp ra máy tính, hoặc *"Nhập từ CSV/TXT"* khi đổi giữa các lớp học khác nhau.

### Bước 2: Chọn nhạc và chế độ chơi
- **Chọn nhạc**: Nhấn nút **"🎵 Chọn nhạc & Cài đặt"**:
  - Chọn các bản nhạc mẫu tổng hợp qua Web Audio API (Vui nhộn, Hồi hộp kịch tính, Hoạt hình Chiptune 8-bit, Không lời nhẹ nhàng).
  - Hoặc **Tải tệp âm thanh MP3/WAV/OGG từ máy tính của giáo viên** và nghe thử.
  - Có thể chọn *"Không sử dụng nhạc"* nếu lớp học cần sự yên tĩnh.
- **Chế độ gọi**:
  - 🎯 *Không trùng (Khuyên dùng)*: Mỗi học sinh chỉ được gọi 1 lần trong 1 vòng. Khi tất cả các em đều đã được gọi, hệ thống sẽ thông báo hoàn thành vòng và cho phép làm mới vòng chơi.
  - 🎲 *Ngẫu nhiên hoàn toàn*: Mỗi lượt quay chọn ngẫu nhiên độc lập trong cả lớp.
- **Cách dừng**:
  - 🖐️ *Giáo viên bấm dừng*: Giáo viên chủ động bấm nút đỏ khi muốn dừng.
  - ⏱️ *Tự động dừng*: Hẹn giờ 10s, 15s, 20s hoặc 30s.

### Bước 3: Tổ chức trò chơi trên lớp
1. Bấm nút **"📺 Toàn màn hình máy chiếu"** (hoặc phím F11) để phóng to tối đa cho cả lớp cùng quan sát.
2. Bấm nút xanh to bản **"▶️ BẮT ĐẦU CHUYỀN BÓNG"**: Nhạc nền nổi lên, quả bóng bay chuyền qua từng học sinh kèm âm thanh nảy vui nhộn.
3. Khi muốn dừng, bấm **"🛑 DỪNG NHẠC VÀ CHỌN"**: Quả bóng từ từ hãm phanh chậm dần và dừng lại ngay trước một bạn học sinh.
4. Màn hình xuất hiện bảng vinh danh với pháo hoa giấy rực rỡ, Avatar Chibi giơ 2 tay ăn mừng kèm tên bạn học sinh được gọi cực to rõ.
5. Sau khi bạn trả lời bài xong, bấm **"🚀 Đã trả lời xong! Gọi bạn tiếp"** để tiếp tục lượt tiếp theo mà không cần tải lại trang.
6. **Xem danh sách đã gọi trong vòng**: Bấm vào nút **"📋 Đã gọi vòng này"** ở góc trên hoặc chip **"✅ Đã gọi lượt này"** để xem danh sách chi tiết các bạn đã trả bài (kèm thứ tự lượt gọi, thời gian, và nút cho bạn chơi lại nếu muốn).
7. Nếu lỡ bấm nhầm: Luôn có nút **"↩️ Chọn lại / Hoàn tác"** để giáo viên điều chỉnh kịp thời.

---

## 🆕 Các cải tiến mới nhất
1. **Dừng bóng dứt khoát (Delay chuẩn 2 - 4 bạn)**: Sau khi giáo viên bấm "Dừng nhạc và chọn", bóng chỉ chuyền tiếp từ **2 đến 4 bạn học sinh** rồi dừng hẳn (thời gian hãm phanh chỉ khoảng ~1.2s - 1.5s). Khắc phục triệt để hiện tượng phải đợi lâu khi lớp đông học sinh.
2. **Tuỳ chọn Bật / Tắt tiếng bóng chuyền**: Bổ sung nút bấm trực tiếp trên thanh điều khiển (`🔊 Tiếng bóng: BẬT/TẮT`) và trong cài đặt. Giáo viên có thể tắt tiếng *"boing/bụp"* mỗi khi bóng nảy để nghe nhạc nền rõ ràng, không bị lẫn tiếng.
3. **Khắc phục che khuất ở chế độ toàn màn hình**: Thiết kế lại bố cục Flexbox thông minh cho chế độ máy chiếu, bảng điều khiển nằm gọn gàng bên dưới chân trang, sân chơi có khoảng đệm an toàn tự động co giãn 100% không bị che lấp bất kỳ học sinh nào.
4. **Hiển thị đầy đủ Họ và Tên**: Thẻ tên học sinh được mở rộng, tự động ngắt dòng hợp lý, đảm bảo hiển thị trọn vẹn cả Họ, Tên đệm và Tên chính (không còn bị cắt dấu 3 chấm `...`).
5. **Khu vực quản lý danh sách đã gọi trong vòng**:
   - Thêm nút **"📋 Đã gọi vòng này"** trên thanh tiêu đề và chip đếm tương tác trên thanh trạng thái.
   - Hộp thoại danh sách chi tiết hiển thị thứ tự các lượt gọi (Lượt 1, Lượt 2...), thời điểm gọi, avatar hoạt hình.
   - Cho phép giáo viên hoàn tác riêng từng học sinh để tham gia lại vòng chơi hoặc làm mới lại toàn bộ vòng.
   - Gắn huy hiệu xanh `✓ Đã gọi` trực tiếp trên đầu nhân vật ở sân chơi để cả lớp dễ dàng theo dõi.

---

## 🛠️ Cấu trúc mã nguồn

```
d:\Dự án trò chơi\App trò chơi gọi trả bài\
├── index.html          # Giao diện chính HTML5, bố cục sân chơi, bảng điều khiển, modal
├── README.md           # Tài liệu hướng dẫn sử dụng chi tiết
├── css/
│   └── style.css       # Toàn bộ CSS giao diện hoạt hình, layout sân cỏ elip, responsive & fullscreen
└── js/
    ├── avatars.js      # Hệ thống vector SVG tạo hàng trăm biến thể nhân vật Chibi học sinh Việt Nam
    ├── audio.js        # Web Audio API Synthesizer (tổng hợp 4 bản nhạc nền + hiệu ứng SFX + upload MP3)
    ├── confetti.js     # Hiệu ứng pháo giấy Canvas 60fps mượt mà
    └── game.js         # Logic cốt lõi: chuyền bóng, hãm phanh chọn công bằng, LocalStorage, CSV
```

---

## ✨ Điểm nổi bật về mặt kỹ thuật & trải nghiệm
- **100% Offline & Độc lập**: Không cần backend, không cần cài thư viện ngoài (npm), không lo mất mạng hay lỗi chặn tải file.
- **Thuật toán công bằng tuyệt đối**: Kết quả lựa chọn được quyết định ngẫu nhiên hợp lệ và độc lập với tốc độ tải trang hay độ trễ âm thanh. Bóng luôn dừng chính xác 100% tại nhân vật được chọn.
- **Avatar Chibi thân thiện Việt Nam**: Có khăn quàng đỏ Đội viên, đồng phục sơ mi học sinh, biểu cảm đa dạng thay đổi theo trạng thái (chờ, ôm bóng, vung tay chuyền, nhảy mừng).
- **Tối ưu máy chiếu lớp học**: Chế độ Fullscreen tỷ lệ 16:9, độ tương phản cao, phông chữ lớn dễ đọc từ cuối lớp học.

#   C h u y e n - b o n g  
 