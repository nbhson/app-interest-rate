# Interest Rate — Mortgage Calculator 🏠

[![CI](https://github.com/nbhson/app-interest-rate/actions/workflows/ci.yml/badge.svg)](https://github.com/nbhson/app-interest-rate/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Máy tính vay mua nhà (mortgage calculator) viết bằng **vanilla JS + Tailwind (precompiled) + DaisyUI + Highcharts**.

## Tính năng

- Tính khoản trả hàng tháng, tổng lãi, lịch trả nợ
- Biểu đồ Highcharts trực quan (gốc/lãi theo thời gian)
- Nhiều tab so sánh kịch bản vay
- Xuất dữ liệu ra CSV chuẩn (Blob + escape đúng chuẩn)
- Dark mode persist qua `localStorage` (không bị nháy khi reload)

## Chạy

Không cần build — mở trực tiếp `index.html` trong trình duyệt:

```bash
open index.html
```

Lưu ý: cần kết nối Internet vì DaisyUI/Highcharts load qua CDN (Tailwind đã được precompile local qua `tailwind.css`).

## Cấu trúc

```
index.html      # Trang chính
app.js          # Logic chính: tính toán, chart, tab, dark mode
calculator.js   # Hàm tính mortgage thuần (dễ test)
i18n.js         # Đa ngôn ngữ
styles.css      # Style bổ sung
tailwind.css    # Tailwind utilities precompiled (input.css + tailwind.config.js để regenerate)
```

## License

[MIT](LICENSE)
