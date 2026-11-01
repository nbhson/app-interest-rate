/** Tailwind config dùng để precompile tailwind.css (thay cho Tailwind Play CDN).
 *  Source scan: index.html + app.js + i18n.js (bao gồm cả class set runtime trong JS).
 *  Cấu hình extend colors copy từ tailwind.config inline cũ trong index.html.
 *
 *  Regenerate:
 *    npx tailwindcss@3.4.17 -c tailwind.config.js -i input.css -o tailwind.css
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js",
    "./i18n.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // indigo-600
        'primary-focus': '#4338ca', // indigo-700
        success: '#10b981', // emerald-500
        error: '#ef4444', // red-500
      }
    }
  }
}
