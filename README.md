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
| Cô dâu & chú rể | Tên, năm sinh; ảnh trong ngôi nhà "Về chung một nhà" chia làm hai bộ: **ảnh ở thiệp nhà trai** và **ảnh ở thiệp nhà gái** (cô dâu, chú rể riêng từng bộ; ô nhà gái để trống thì dùng lại ảnh nhà trai). Tải lên hoặc **chọn từ thư viện** ảnh đã tải, rồi căn chỉnh tỉ lệ 3:4 |
| Gia đình | Tiêu đề hai bên; thêm, bớt người (vai trò + họ tên) |
| Ngày cưới | Ngày dương lịch, giờ đếm ngược. Thứ và **ngày âm lịch tự tính** (sửa tay được) |
| Địa điểm & lịch trình | Thêm, bớt địa điểm, toạ độ Google Maps, tên lựa chọn khi xác nhận; các mốc giờ, sự kiện chính |
| Lời mời | Lời mời, lời cảm ơn, lời chào trên phong bì |
| Ảnh bìa & nhạc | Ảnh bìa (tải lên), nhạc nền MP3 (tải lên), tên bài |
| Chuyện tình | Thêm, bớt, sắp xếp kỷ niệm (ảnh + chữ) |
| Album | Tải nhiều ảnh cùng lúc, sắp xếp, xoá |
| Mừng cưới | Ảnh QR, ngân hàng, số tài khoản, chủ tài khoản |
| Trò chơi | Số giây mỗi câu đố, **ảnh cho trò lật hình theo từng level** (level 1 chọn 6 ảnh, level 2 chọn 8, level 3 chọn 10; tải lên hoặc chọn từ thư viện; thiếu thì bù bằng ảnh album), toàn bộ câu đố và đáp án |
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

Thiệp là một khung cuộn theo từng sector, mỗi lần vuốt (hoặc nhấn PageDown) trượt tới sector kế tiếp; có chấm điều hướng ở mép phải. Link có `#video`, `#gifts`… mở thẳng tới sector đó.
- Mỗi sector vừa trọn một màn hình (đã kiểm tra ở 360×640, 390×844, 430×932). Thứ tự: bìa, gia đình (kèm buổi tiệc thân mật), ngôi nhà cô dâu chú rể + thẻ nhạc, thẻ mời, đếm ngược + lịch, lịch trình, chuyện tình, album, sổ lưu bút, video lời chúc, trò chơi, hộp mừng cưới, cảm ơn.
- **Chuyện tình** là sector dài 1,75 màn hình: vuốt lần 1 tới đầu sector, vuốt lần 2 trượt xuống cuối sector, lần 3 sang sector sau (tối đa 4 kỷ niệm).
- **Album** (tối đa 48 ảnh) là một sector một màn hình: ảnh xếp thành một mảng khít, to nhỏ khác nhau nhưng giữ nguyên tỉ lệ từng ảnh (không cắt xén), tự trôi chậm từ phải sang trái. Giữ tay (hoặc rê chuột) thì ảnh dừng, kéo / vuốt sang trái hoặc phải để xem nhanh; thả tay ra ảnh lại tự trôi. Chạm nhanh vào ảnh để xem lớn.
- **Lịch trình** là một dòng thời gian gồm các mốc giờ, tự nhóm theo địa điểm (kèm Chỉ đường và thêm vào lịch). Mốc không gắn địa điểm (VD đoàn nhà trai xuất phát) chọn "Không gắn địa điểm".
- **Link nhà trai / nhà gái:** link thường (hoặc `?f=groom`) là thiệp nhà trai, `?f=bride` là thiệp từ nhà gái: cô dâu đứng trước (bên trái) ở bìa, phong bì, gia đình, ngôi nhà, lời cảm ơn và khung video; phần Đại diện gia đình đưa nhà gái lên trước, lời mời đổi sang "lễ vu quy", thẻ "Buổi tiệc thân mật" (thời gian hẹn khách) nổi bật. Mỗi bên chọn riêng sự kiện và tên hiện ở thẻ mời (mặc định Lễ Thành Hôn / Lễ Vu Quy, kèm giờ, địa điểm, chỉ đường) và buổi tiệc thân mật hiện ở phần gia đình, trong mục "Địa điểm & lịch trình" của trang cấu hình. Ghép được với link mời riêng: `https://<tên-miền>/?k=<mã>&f=bride`.
- **Hộp mừng cưới** là một hòm bấm để mở hộp thoại mã QR. Chọn ứng dụng ngân hàng trong trang cấu hình thì bấm vào QR sẽ mở thẳng app đó (qua deeplink VietQR) và chép sẵn số tài khoản.
- **Toàn màn hình:** bấm mở thiệp là chuyển sang toàn màn hình (và khoá hướng dọc nếu trình duyệt cho phép). iPhone Safari không hỗ trợ toàn màn hình cho trang web nên bỏ qua.
- **Phong bì:** bấm vào phong bì hoặc nút "Mở thiệp" đều mở được; nắp mở trước, 0,3 giây sau giấy mời mới trượt lên và nằm trên nắp đã gập.
- **Đĩa than** luôn hiện ở góc dưới bên trái để bật / tắt nhạc nền: đang phát thì đĩa quay, cần đọc đặt lên đĩa và có nốt nhạc bay; tắt thì đĩa đứng yên, cần nhấc lên.
- **Trò chơi** chơi ngay trong sector, có nút "‹ Trò chơi" để quay lại danh sách; link `/tro-choi/...` cũ chuyển về `/#games`.
  - **Vòng quay:** mỗi tài khoản (số điện thoại) có 1 lượt khi tạo; mỗi ngày (giờ Việt Nam, GMT+7) được tặng thêm 1 lượt, dồn tối đa 3. Quay cần xác nhận tham dự. Có lịch sử quay (giờ, giải, mã đổi quà).
  - **Đố vui:** chơi lại nhiều lần, bảng xếp hạng lấy lượt tốt nhất. Đúng từ 8 câu được tặng thêm 1 lượt quay, chỉ nhận một lần cho mỗi tài khoản.
  - **Lật hình:** 3 level, bảng xếp hạng riêng cho từng level: Level 1 có 6 cặp (bàn 4×3), Level 2 có 8 cặp (4×4), Level 3 có 10 cặp (4×5). Ảnh lấy từ các ảnh đầu của album (cần ít nhất 10 ảnh).
- **Chữ và khoảng cách:** tên cô dâu chú rể luôn nằm một dòng (tự co chữ theo chiều ngang). Màn hình thấp (cao dưới 700px) thì cỡ chữ gốc nhỏ lại để mọi sector vẫn vừa một màn hình.
- **Điện thoại nằm ngang** bị chặn: thử khoá hướng dọc (có tác dụng khi thêm thiệp vào màn hình chính, nhờ `manifest`), còn trên trình duyệt thường thì hiện lớp phủ nhắc xoay dọc. Máy tính và máy tính bảng không bị ảnh hưởng.

## Nội dung nhiều dòng

Các ô nội dung trong trang Cấu hình (lời mời, lời cảm ơn, lời chào phong bì, tên và địa chỉ địa điểm, tên sự kiện và tên ở thẻ mời, tiêu đề kỷ niệm, thông tin mừng cưới, câu đố…) cho phép nhấn Enter để xuống dòng; thiệp hiển thị đúng các dòng đã xuống. Riêng tên cô dâu chú rể luôn một dòng. Khi gửi địa chỉ cho Google Maps hoặc file lịch, các dòng được nối lại thành một.

## Sổ lưu bút

Khách để lại lời chúc **công khai** hoặc **riêng tư**. Danh sách hiện 5 lời chúc mới nhất, nút **Xem thêm** mở thêm 5 lời nữa ở dưới; cuộn hết danh sách rồi vuốt tiếp thì sang sector kế tiếp. Lời chúc riêng tư vẫn hiện trên thiệp (tên khách và vệt gradient mờ) nhưng nội dung không bao giờ rời khỏi máy chủ; chỉ bạn đọc được ở `/admin/loi-chuc`.

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

## Video lời chúc

Sector "Video chúc mừng" trong thiệp: thẻ mở đầu, bấm **Bắt đầu ghi lời chúc** thì hiện hộp thoại camera (khung dọc, cao/ngang = 4/3) có xem trước kèm khung đã chọn và nút quay đỏ. Bấm nút đỏ: đếm ngược 3 giây rồi quay; trên nút hiện số giây còn lại và vòng tròn bên ngoài chạy theo thời gian; bấm lần nữa để dừng. Quay xong xem lại rồi gửi. Cuối sector là dải thumbnail các lời chúc video (dựng từ dự án WedMemo, mã ở `src/components/video/`).

- Clip **công khai** ai cũng xem được. Clip **riêng tư** chỉ xem khi bấm **Mở khoá** ở dải thumbnail và nhập mã `WEDMEMO_CODE` trong `.env` (tự khoá lại sau 3 giờ hoặc bấm **Khoá lại**). Sau khi mở khoá có nút xoá (chuyển vào thư mục `trash`).
- Clip chưa gửi được (mất mạng) nằm trong trình duyệt của máy đã ghi và tự gửi lại khi có mạng.
- **Máy ở sảnh:** mở `https://<tên-miền>/wedmemo/kiosk` bằng Chrome/Edge chế độ kiosk, cho phép camera + micro một lần. Có màn hình chào kèm mã QR (trỏ về sector video), chống thoát toàn màn hình, tự về màn hình chào sau 90 giây không ai chạm.
  ```
  chrome --kiosk --autoplay-policy=no-user-gesture-required https://<tên-miền>/wedmemo/kiosk
  ```
- Link cũ `/wedmemo` tự chuyển về `/#video`.
- Dữ liệu lưu ở `<DATA_DIR>/uploads/wedmemo/`, nên `scripts/backup.sh` cũng sao lưu luôn. Firefox ghi ra WebM, iPhone có thể không phát được.

## Sao lưu

```bash
sh scripts/backup.sh            # lưu vào ./backups
```

Script sao lưu cả cơ sở dữ liệu lẫn toàn bộ video lời chúc. Nên chạy trước và sau ngày cưới.
