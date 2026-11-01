// Unit test cho calculator.js — calculateMortgage là hàm pure (không đụng DOM).
// Số liệu kỳ vọng được tính tay để đối chiếu, ví dụ chuẩn:
//   vay 10.000.000₫, lãi 6%/năm (0,5%/tháng), 12 tháng, dư nợ giảm dần, không trả thêm
//   → gốc mỗi tháng = 833.333,33; lãi tháng 1 = 50.000; tổng lãi = 325.000.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { calculateMortgage } = require("../calculator.js");

const approx = (actual, expected, eps = 0.01, msg = "") =>
  assert.ok(
    Math.abs(actual - expected) < eps,
    `${msg} expected ≈ ${expected}, got ${actual}`
  );

const base = {
  propertyPrice: 20_000_000, // LTV 50% → vay 10.000.000
  ltv: 50,
  promoRate: 6, // 0,5%/tháng
  promoPeriod: 12,
  floatingRate: 13, // không chạm tới trong các case dưới trừ case 2 pha
  loanTenure: 1, // 12 tháng
  extraPayment: 0,
  repaymentMethod: "reducing"
};

test("calculateMortgage là hàm được export đúng", () => {
  assert.equal(typeof calculateMortgage, "function");
});

test("dư nợ giảm dần, 1 pha: vay 10tr, lãi 6%/năm, 12 tháng (tính tay)", () => {
  const r = calculateMortgage(base);

  assert.equal(r.loanAmount, 10_000_000);
  assert.equal(r.downPayment, 10_000_000);

  // Gốc mỗi tháng: 10tr/12 = 833.333,33; lãi tháng 1: 10tr × 0,5% = 50.000
  approx(r.m1, 10_000_000 / 12 + 50_000, 0.01, "m1:");

  // Tổng lãi = 0,5% × Σ dư nợ đầu kỳ = 0,5% × 10tr × (12+11+...+1)/12 = 325.000
  approx(r.totalInterest, 325_000, 0.01, "totalInterest:");
  approx(r.totalPaymentToBank, 10_325_000, 0.01, "totalPaymentToBank:");
  // Tổng chi phí = xuống lãi (10tr) + tổng trả ngân hàng (10.325.000)
  approx(r.totalCostOfProperty, 20_325_000, 0.01, "totalCostOfProperty:");

  // Kết thúc đúng hạn, không có pha 2 → m2 = null
  assert.equal(r.payoffMonths, 12);
  assert.equal(r.m2, null);
  assert.equal(r.amortizationSchedule.length, 12);

  // Dòng đầu: gốc 833.333,33, lãi 50.000, dư nợ cuối kỳ 9.166.666,67
  const m1row = r.amortizationSchedule[0];
  approx(m1row.principal, 833_333.3333, 0.01, "row1 principal:");
  approx(m1row.interest, 50_000, 0.01, "row1 interest:");
  approx(m1row.balance, 9_166_666.6667, 0.01, "row1 balance:");
  approx(m1row.payment, m1row.principal + m1row.interest, 1e-6, "row1 payment:");

  // Kỳ cuối: dư nợ = 0, tổng gốc cộng lại đúng 10tr
  assert.ok(Math.abs(r.amortizationSchedule[11].balance) < 1e-6, "kỳ cuối dư nợ = 0");
  const sumPrincipal = r.amortizationSchedule.reduce((s, row) => s + row.principal, 0);
  approx(sumPrincipal, 10_000_000, 0.01, "sum(principal):");
});

test("trả thêm hàng tháng → tất toán sớm đúng số tháng tính tay", () => {
  // extraPayment 5tr: tháng 1 trả gốc 5.833.333,33 (còn dư 4.166.666,67);
  // tháng 2 gốc bị chặn xuống đúng dư nợ → tất toán sau 2 tháng.
  const r = calculateMortgage({ ...base, extraPayment: 5_000_000 });

  assert.equal(r.payoffMonths, 2);
  assert.equal(r.amortizationSchedule.length, 2);

  approx(r.m1, 10_000_000 / 12 + 5_000_000 + 50_000, 0.01, "m1:");
  approx(r.amortizationSchedule[0].balance, 4_166_666.6667, 0.01, "balance sau tháng 1:");

  // Tháng 2: lãi = 4.166.666,67 × 0,5% = 20.833,33; trả = 4.166.666,67 + 20.833,33
  // (tháng 2 vẫn nằm trong pha ưu đãi vì promoPeriod = 12 = tenure → m2 = null)
  approx(r.amortizationSchedule[1].interest, 20_833.3333, 0.01, "interest tháng 2:");
  approx(r.amortizationSchedule[1].payment, 4_187_500, 0.01, "payment tháng 2:");
  assert.equal(r.m2, null);
  assert.ok(Math.abs(r.amortizationSchedule[1].balance) < 1e-6, "tất toán sau tháng 2");

  approx(r.totalInterest, 70_833.3333, 0.01, "totalInterest:");
  approx(r.totalPaymentToBank, 10_070_833.3333, 0.01, "totalPaymentToBank:");
});

test("annuity: trả đều hàng tháng theo công thức đóng dần nợ", () => {
  // Vay 12tr, lãi 12%/năm (1%/tháng), 12 tháng:
  // m = P × r × (1+r)^n / ((1+r)^n − 1) — tính độc lập bằng Math.pow
  const P = 12_000_000, rM = 0.01, n = 12;
  const q = Math.pow(1 + rM, n);
  const expectedM = (P * rM * q) / (q - 1);

  const r = calculateMortgage({
    propertyPrice: 24_000_000,
    ltv: 50,
    promoRate: 12,
    promoPeriod: 12,
    floatingRate: 13,
    loanTenure: 1,
    extraPayment: 0,
    repaymentMethod: "annuity"
  });

  assert.equal(r.loanAmount, P);
  approx(r.m1, expectedM, 0.01, "m1 (kỳ trả đều):");

  // Không trả thêm → mọi kỳ đều bằng nhau
  for (const row of r.amortizationSchedule) {
    approx(row.payment, expectedM, 0.01, "kỳ trả đều:");
  }
  // Tổng gốc đúng bằng số vay, dư nợ cuối kỳ = 0, tổng lãi = 12m − 12tr
  const sumPrincipal = r.amortizationSchedule.reduce((s, row) => s + row.principal, 0);
  approx(sumPrincipal, P, 0.01, "sum(principal):");
  assert.ok(Math.abs(r.amortizationSchedule[11].balance) < 1e-6, "kỳ cuối dư nợ = 0");
  approx(r.totalInterest, 12 * expectedM - P, 0.02, "totalInterest:");
});

test("2 pha lãi suất: ưu đãi 6% (2 tháng) rồi thả nổi 12%", () => {
  // Pha 1 (2 tháng): gốc 833.333,33/tháng; lãi 50.000 rồi 45.833,33.
  // Pha 2 (10 tháng, 1%/tháng): kỳ đầu = 833.333,33 + 8.333.333,33×1% = 916.666,67.
  // Tổng lãi = 95.833,33 + 1% × Σ dư nợ pha 2 (45.833.333,33) = 554.166,67.
  const r = calculateMortgage({
    ...base,
    promoPeriod: 2,
    floatingRate: 12
  });

  approx(r.m1, 883_333.3333, 0.01, "m1 (pha ưu đãi):");
  approx(r.m2, 916_666.6667, 0.01, "m2 (kỳ đầu pha thả nổi):");
  assert.equal(r.payoffMonths, 12);
  assert.equal(r.amortizationSchedule.length, 12);

  approx(r.amortizationSchedule[1].interest, 45_833.3333, 0.01, "lãi tháng 2:");
  approx(r.amortizationSchedule[2].interest, 83_333.3333, 0.01, "lãi tháng 3 (1%):");
  approx(r.totalInterest, 554_166.6667, 0.01, "totalInterest:");
  approx(r.totalPaymentToBank, 10_554_166.6667, 0.01, "totalPaymentToBank:");
});

test("lịch khấu trừ nhất quán: payment = gốc + lãi, dư nợ giảm dần", () => {
  for (const method of ["reducing", "annuity"]) {
    const r = calculateMortgage({ ...base, repaymentMethod: method });
    let prevBalance = Infinity;
    r.amortizationSchedule.forEach(row => {
      approx(row.payment, row.principal + row.interest, 1e-6, `payment row ${row.month} (${method}):`);
      assert.ok(row.balance <= prevBalance + 1e-6, `dư nợ phải giảm dần (${method})`);
      assert.ok(row.balance >= 0, `dư nợ không âm (${method})`);
      prevBalance = row.balance;
    });
    assert.ok(Math.abs(r.amortizationSchedule.at(-1).balance) < 1e-6, `kỳ cuối dư nợ = 0 (${method})`);
  }
});
