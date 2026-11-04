# Thiệp cưới Quốc Thịnh & Minh Trang

Trang thiệp cưới online, phong cách hoa cúc:

- Phong bì "Mở thiệp" kèm nhạc nền.
- Lịch trình hai địa điểm, bản đồ, chỉ đường, thêm vào lịch.
- Xác nhận tham dự (RSVP).
- Sổ lưu bút và video lời chúc (trang riêng `/wedmemo`, chuyển từ dự án WedMemo).
- Bốn trò chơi có thưởng.
- Hộp mừng cưới.
- Trang quản trị `/admin`.

Công nghệ: Next.js 16, SQLite (`node:sqlite` có sẵn trong Node 26). Khi triển khai, dùng Docker cùng Caddy để tự cấp HTTPS.

## Sửa nội dung: trang Cấu hình thiệp

Mọi nội dung đều chỉnh được ngay trên trình duyệt, không cần sửa code:

1. Vào `https://<tên-miền>/admin`.
2. Nhập **mã quản trị**: giá trị `ADMIN_PASSWORD` trong file `.env`. Mã không được ghi trong code.
3. Trang **Cấu hình thiệp** mở ra.
4. Sửa nội dung rồi bấm **Lưu thay đổi** ở cuối màn hình. Thiệp cập nhật ngay, không cần chạy lại máy chủ.

Bên phải có khung **Xem trước** là thiệp thật, đổi theo từng thay đổi ở bên trái (chưa cần lưu) và tự cuộn tới phần bạn đang chỉnh. Trên điện thoại, bấm **📱 Xem trước** ở thanh dưới.

**Tải ảnh:** chọn ảnh hoặc kéo thả vào ô ảnh, hộp thoại căn chỉnh hiện ra. Kéo ảnh để dời, kéo thanh hoặc cuộn chuột để phóng to, rồi bấm **Cắt và tải lên**. Ảnh được cắt đúng tỉ lệ của ô (chân dung 3:4, ảnh bìa 2:3, chuyện tình và QR vuông) và thu nhỏ trước khi tải. Album cho chọn tỉ lệ từng ảnh, hoặc dùng ảnh gốc.

| Mục | Chỉnh được |
|---|---|
| Cô dâu & chú rể | Tên, năm sinh, ảnh chân dung (tải lên) |
| Gia đình | Tiêu đề hai bên; thêm, bớt người (vai trò + họ tên) |
| Ngày cưới | Ngày dương lịch, giờ đếm ngược. Thứ và **ngày âm lịch tự tính** (sửa tay được) |
| Địa điểm & lịch trình | Thêm, bớt địa điểm, toạ độ Google Maps, tên lựa chọn khi xác nhận; các mốc giờ, sự kiện chính |
| Lời mời | Lời mời, lời cảm ơn, lời chào trên phong bì |
| Ảnh bìa & nhạc | Ảnh bìa (tải lên), nhạc nền MP3 (tải lên), tên bài |
| Chuyện tình | Thêm, bớt, sắp xếp kỷ niệm (ảnh + chữ) |
| Album | Tải nhiều ảnh cùng lúc, sắp xếp, xoá |
| Mừng cưới | Ảnh QR, ngân hàng, số tài khoản, chủ tài khoản |
| Trò chơi | Số giây mỗi câu đố, số cặp lật hình, toàn bộ câu đố và đáp án |
| Hiển thị | Bật / tắt từng phần của thiệp |

Tên cô dâu chú rể và ngày cưới trên khung video ở `/wedmemo` lấy từ trang này.

Giải thưởng vòng quay chỉnh ở trang **Trò chơi** trong khu quản trị.

**Lưu ý về ảnh và nhạc tải lên:**

- Ảnh được tự xoay đúng chiều và thu nhỏ còn tối đa 2000px. Thông tin EXIF bị xoá, gồm cả vị trí GPS chụp ảnh.
- Ảnh được lưu trong volume dữ liệu `wedding_data` nên không mất khi cập nhật code. Dùng ảnh JPG, PNG hoặc WebP; ảnh HEIC của iPhone thường được trình duyệt tự đổi sang JPG.
- Nên dùng ảnh QR xuất từ ứng dụng ngân hàng.
- Toạ độ bản đồ: mở Google Maps, giữ ngón tay lên đúng vị trí nhà, rồi chép dãy số dạng `20.123456, 106.123456`.

Giá trị mặc định ban đầu nằm trong `src/content/wedding.ts` và `src/content/quiz.ts`. Các giá trị này chỉ được dùng cho tới lần lưu đầu tiên.

## Chạy thử trên máy

Cần Node.js 26.

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # chạy test
npm run lint
```

- Mã vào `/admin` đặt trong file `.env.local` (không đưa lên git): `ADMIN_PASSWORD=...`.
- Dữ liệu được lưu trong thư mục `data/`.
- Nếu máy chưa cài `ffmpeg`, video lời chúc giữ nguyên định dạng gốc.

## Triển khai lên VPS (Docker)

### 1. Trỏ tên miền

Tạo bản ghi **A** cho tên miền, trỏ về IP của VPS.

### 2. Cài Docker trên VPS (Ubuntu/Debian)

```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Đưa mã nguồn lên VPS

Dùng git (repo riêng tư) hoặc chép thẳng thư mục:

```bash
scp -r "Weding Pro" user@IP-VPS:~/thiep-cuoi
```

Khi chép bằng `scp`, nên bỏ qua `node_modules` và `.next`.

### 4. Tạo file cấu hình

```bash
cd ~/thiep-cuoi
cp .env.example .env
nano .env            # điền DOMAIN, PUBLIC_SITE_URL, ADMIN_PASSWORD, SESSION_SECRET
```

Tạo `SESSION_SECRET` bằng lệnh `openssl rand -base64 32`.

### 5. Chạy

```bash
docker compose up -d --build
```

Caddy sẽ tự xin chứng chỉ HTTPS. Sau khoảng một phút, mở `https://<tên-miền>` để kiểm tra.

**Cập nhật khi đổi code:** nội dung thiệp sửa trong trang quản trị nên không cần triển khai lại. Chỉ khi đổi code mới cần chép mã mới lên VPS rồi chạy lại `docker compose up -d --build`. Dữ liệu khách nằm trong volume `wedding_data`, nên không bị mất khi cập nhật.

## Thiệp chia sector

Thiệp là một khung cuộn theo từng sector, mỗi lần vuốt (hoặc nhấn PageDown) trượt tới sector kế tiếp; có chấm điều hướng ở mép phải.
- Mỗi sector vừa trọn một màn hình (đã kiểm tra ở 360×640, 390×844, 430×932). Lịch trình tách theo địa điểm.
- **Chuyện tình** và **mỗi chủ đề album** là sector dài 1,75 màn hình: vuốt lần 1 tới đầu sector, vuốt lần 2 trượt xuống cuối sector, lần 3 sang sector sau. Tối đa 4 kỷ niệm, 8 chủ đề album, 8 ảnh mỗi chủ đề.
- **Hộp mừng cưới** là một hòm, bấm vào mới mở hộp thoại mã QR. Chọn ứng dụng ngân hàng trong trang cấu hình thì bấm vào QR sẽ mở thẳng app đó (qua deeplink VietQR) và chép sẵn số tài khoản.
- Màn hình quá thấp (cao dưới 560px, như máy nằm ngang) thì tắt snap, cuộn như trang thường.

## Quản trị (`https://<tên-miền>/admin`)

- **Cấu hình thiệp:** toàn bộ nội dung, ảnh, nhạc, câu đố, bật/tắt các phần (xem mục trên).
- **Khách mời:** dán danh sách tên, mỗi dòng một tên, để tạo link mời riêng (`/?k=...`).
  - Thiệp sẽ hiện "Thân mời: <tên>" và tự điền sẵn form xác nhận.
  - Link chung không kèm tên: `https://<tên-miền>`.
  - Link nhanh kèm tên: `https://<tên-miền>/?to=Anh%20Nam`.
- **Xác nhận:** danh sách khách xác nhận tham dự. Nút **Tải file Excel (CSV)** xuất file mở được bằng Excel với đầy đủ dấu tiếng Việt.
- **Lời chúc:** ẩn, hiện hoặc xoá lời chúc.
- **Video lời chúc (`/wedmemo`):** không nằm trong `/admin`. Xem phần "Video lời chúc" bên dưới.
- **Trò chơi:**
  - Chỉnh giải vòng quay: tên, màu, trọng số, số lượng.
  - Đánh dấu "đã trao quà" theo mã đổi quà.
  - Xem bảng xếp hạng đố vui và lật hình.
- **Quay số:** màn hình bốc số may mắn để chiếu lên TV hoặc máy chiếu tại tiệc.
  - Mỗi khách xác nhận "có tham dự" được cấp một số.
  - Có thể lọc theo sự kiện. Bấm **Toàn màn hình** khi chiếu.

## Video lời chúc (`/wedmemo`)

Chuyển từ dự án WedMemo, giữ nguyên giao diện: quay bằng camera, chọn khung trang trí in thẳng vào video, đếm ngược, chọn 15/30/60 giây, đổi camera.

- Khách quét mã QR (`public/wedmemo/qr.svg`, trỏ về `https://thinhtrang.love/wedmemo`) để quay bằng điện thoại.
- Máy ở sảnh: mở `https://<tên-miền>/wedmemo/kiosk`. Có màn hình chào kèm QR, chống thoát toàn màn hình, tự về màn hình chào sau 90 giây không ai chạm.
  ```
  chrome --kiosk --autoplay-policy=no-user-gesture-required https://<tên-miền>/wedmemo/kiosk
  ```
- Clip **công khai** ai cũng xem được. Clip **riêng tư** chỉ xem khi bấm **Mở khoá** trong thư viện và nhập mã `WEDMEMO_CODE` trong `.env`. Rời thư viện là tự khoá lại.
- Clip chưa gửi được (mất mạng) nằm trong trình duyệt của máy đã ghi và tự gửi lại khi có mạng.
- Xoá trong thư viện (sau khi mở khoá) = chuyển sang `wedmemo/trash/` trong volume dữ liệu.
- Dữ liệu lưu ở `<DATA_DIR>/uploads/wedmemo/`, nên `scripts/backup.sh` cũng sao lưu luôn.
- Firefox ghi ra WebM, iPhone có thể không phát được.

## Sao lưu

```bash
sh scripts/backup.sh            # lưu vào ./backups
```

Script sao lưu cả cơ sở dữ liệu lẫn toàn bộ video lời chúc. Nên chạy trước và sau ngày cưới.
