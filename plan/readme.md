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
