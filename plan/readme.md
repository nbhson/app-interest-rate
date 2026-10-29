# Plan — app-interest-rate

> Mortgage calculator (vanilla JS + Tailwind CDN + DaisyUI + Highcharts).

## Kết quả Review (audit đợt 1)

| # | Severity | Vị trí | Vấn đề | Fix |
|---|----------|--------|--------|-----|
| 1 | MAJOR | app.js:338-346 | Destroy+rebuild chart Highcharts trên TỪNG lần gõ phím (~50-200ms/lần) | Debounce 250ms cho input listener |
| 2 | MAJOR | app.js:630 | Dark mode không persist → reload mất theme | localStorage + script restore sớm trong `<head>` (chống FOUC) + đồng bộ icon |
| 3 | MAJOR | app.js:143-156 | Tab click dùng `e.target` (có thể là node con) | `e.currentTarget` |
| 4 | MINOR | app.js:570-584 | CSV export: `encodeURI` không escape dấu phẩy + data-URI giới hạn độ dài | Blob + createObjectURL + revoke + escape field chuẩn CSV |
| 5 | MINOR | app.js:512,355,597 | Hardcode 'Dư Nợ'/'Tháng'/nút show-all — bỏ qua i18n | Dùng key `t()` + thêm 2 key mới vào i18n.js |
| 6 | MINOR | app.js:242-253 | `numberToVietnameseWords` hỏng với số < 1.000 (ra " đồng" trống) | Thêm `readSmall()` đọc trăm/chục/đơn vị chuẩn tiếng Việt |
| 7 | MINOR | i18n.js:134-136 | `formatCurrency` hardcode 'vi-VN' | Switch locale theo `currentLang` |
| 8 | MINOR | i18n.js:130-132 | Key thiếu render âm thầm thành key-name | `console.warn` khi thiếu |
| 9 | MINOR | app.js:139 | Hack `dispatchEvent(resize)` để redraw chart | `chart.reflow()` |
| 10 | MINOR | index.html:306 | Search input "Tìm kỳ hạn..." chết hoàn toàn (không id, không listener) | Xóa |
| 11 | MINOR | index.html:62-65 | "Support" footer chết | Xóa |
| 12 | MINOR | index.html:219 | Badge "+12% so với kịch bản A" static, không bao giờ update → misleading | Xóa |
| 13 | MINOR | i18n | Language không persist | localStorage `lang` |

## Trạng thái

- [x] Plan
- [x] Fix #1–#13
- [x] Commit + self-review

## Ghi chú (chưa fix, có chủ ý)

- Tailwind CDN + Highcharts CDN: giữ nguyên vì app là 1 page tĩnh không build step; SRI không áp dụng được cho script config-tailwind. Đã ghi nhận là trade-off.
- `renderMilestones` dùng innerHTML nhưng dữ liệu là số đã qua `formatCurrency` — an toàn, giữ nguyên.

## Review Log

### Vòng 1
- Self-review: `node --check` pass cho cả 3 file JS. Đã rà lại hàm `numberToVietnameseWords` sau 2 lần viết lại: số < 1000 đọc chuẩn ("ba trăm bốn mươi lăm"), số có phần lẻ (<100) thêm "lẻ". CSV: fields bọc ngoặc kép, BOM giữ nguyên cho Excel, revokeObjectURL sau click.

## Round 2 (2026-10-29)

### Findings (audit đợt 2)

| # | Severity | Vị trí | Vấn đề | Xử lý |
|---|----------|--------|--------|-------|
| 1 | BUG (dead feature) | app.js ↔ index.html | Toàn bộ block theme-toggle (#theme-toggle, icon sun/moon, theme-text) KHÔNG tồn tại trong HTML → dark mode có CSS + code nhưng KHÔNG BAO GIỜ bật được | Thêm nút toggle vào header (sun/moon icon + label i18n) — code có sẵn chỉ cần element |
| 2 | FEATURE GAP | app.js | Reload mất toàn bộ tham số 2 kịch bản | Persist A/B + activeTab vào localStorage (`mortgagewise:scenarios:v1`), restore an toàn (validate số/khoảng giá trị) |
| 3 | FEATURE GAP | UX | Không định lượng được lợi ích của "trả thêm hàng tháng" | Banner 💸 insight: so sánh baseline extraPayment=0 → "tất toán sớm N tháng, tiết kiệm M tiền lãi"; tự ẩn khi extra=0 hoặc ở compare mode |
| 4 | BUG | app.js | Tab button KHÔNG bao giờ có style active lúc khởi động (chỉ gán class khi click) + activeTab khôi phục từ prefs nhưng UI không phản ánh | syncTabUI() gọi ở init + khi click |
| 5 | MINOR (i18n) | index.html | ~15 label hardcode tiếng Việt (lãi thả nổi, thời hạn, phương thức trả nợ, chart titles, table headers, "Xuất báo cáo CSV", "vs Scenario B"...) | data-i18n + 25 key mới cho cả en/vi |
| 6 | BUG | index.html | "Tháng (20 năm)" hardcode dưới out-tenure — sai khi tenure=10 hay payoff sớm | out-tenure-note động: `X tháng (Y năm)` theo payoffMonths |
| 7 | BUG | app.js | Ghi chú out-m1 "Giảm dần theo dư nợ" sai khi chọn Annuity (khoản trả cố định) | Đổi text theo repaymentMethod |
| 8 | MINOR | index.html | "$" prefix cho input VNĐ | Đổi "₫" |
| 9 | MINOR | charts | Chart hardcode màu light (#64748b/#1e293b/tooltip trắng) → dark mode chữ on-chart không đọc được | chartPalette() theo data-theme, áp cho cả 4 loại chart; đổi theme → recalculateAll đã có sẵn sẽ re-render đúng màu |
| 10 | MINOR | index.html | Thiếu favicon, theme-color | Inline SVG favicon "₫" + theme-color |
| 11 | UX | compare card | Badge "Optimized / Interest Savvy Selection" là text tĩnh vô nghĩa | Thay bằng diff thực (badge #comp-diff-int đã có) + caption i18n "so với Kịch bản B" |

### Trạng thái Round 2

- [x] Plan
- [x] Features: persist kịch bản (localStorage), theme toggle (sửa dead code), savings insight banner
- [x] UX: i18n toàn bộ label còn lại, dynamic notes (tenure/m1), chart palette theo theme, favicon + theme-color, syncTabUI
- [x] Verify: node --check cả 3 file; cross-check mọi data-i18n key tồn tại trong 2 ngôn ngữ
- [x] Commit + self-review

### Verify Log
- `node --check` OK cho app.js, i18n.js, calculator.js.
- Script check: 40 data-i18n keys trong HTML đều tồn tại trong i18n.js.
- Không build step/test suite; calculator.js không đổi logic (tránh regress công thức round 1 đã review).
