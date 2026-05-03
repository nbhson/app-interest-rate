/**
 * Calculate the mortgage details based on inputs
 */
function calculateMortgage(params) {
  const {
    propertyPrice,
    ltv, // percentage, e.g., 70
    promoRate, // yearly percentage, e.g., 6.5
    promoPeriod, // months, e.g., 12
    floatingRate, // yearly percentage, e.g., 11.5
    loanTenure, // years, e.g., 20
    extraPayment, // monthly extra payment
    repaymentMethod // 'reducing' or 'annuity'
  } = params;

  // Step 1: Calculate loan and equity
  const loanAmount = propertyPrice * (ltv / 100);
  const downPayment = propertyPrice - loanAmount;

  // Step 2: Convert interest rates
  const rPromo = (promoRate / 100) / 12;
  const rFloating = (floatingRate / 100) / 12;
  const totalMonths = loanTenure * 12;

  let remainingBalance = loanAmount;
  let totalInterest = 0;
  let totalPaymentPhase1 = 0;
  let totalPaymentPhase2 = 0;
  let m1 = 0;
  let m2 = 0;

  const amortizationSchedule = [];

  // Step 3: Phase 1 (Promotional period)
  let currentMonth = 0;
  for (let i = 0; i < promoPeriod && currentMonth < totalMonths && remainingBalance > 0; i++) {
    currentMonth++;
    let interestForMonth = remainingBalance * rPromo;
    let principalForMonth = 0;

    if (repaymentMethod === 'reducing') {
      principalForMonth = loanAmount / totalMonths;
    } else {
      // Annuity
      const m = loanAmount * (rPromo * Math.pow(1 + rPromo, totalMonths)) / (Math.pow(1 + rPromo, totalMonths) - 1);
      principalForMonth = m - interestForMonth;
    }

    let actualMonthlyPrincipal = principalForMonth + extraPayment;
    let actualMonthlyPayment = actualMonthlyPrincipal + interestForMonth;

    if (remainingBalance < actualMonthlyPrincipal) {
      actualMonthlyPrincipal = remainingBalance;
      actualMonthlyPayment = actualMonthlyPrincipal + interestForMonth;
    }

    remainingBalance -= actualMonthlyPrincipal;
    totalInterest += interestForMonth;
    totalPaymentPhase1 += actualMonthlyPayment;

    if (currentMonth === 1) m1 = actualMonthlyPayment;

    amortizationSchedule.push({
      month: currentMonth,
      payment: actualMonthlyPayment,
      principal: actualMonthlyPrincipal,
      interest: interestForMonth,
      balance: remainingBalance > 0 ? remainingBalance : 0
    });
  }

  // Step 4 & 5: Phase 2 (Floating rate)
  const remainingMonthsAtStartOfPhase2 = totalMonths - currentMonth;
  if (remainingBalance > 0 && remainingMonthsAtStartOfPhase2 > 0) {
    const loanAtStartOfPhase2 = remainingBalance;
    
    for (let i = 0; i < remainingMonthsAtStartOfPhase2 && remainingBalance > 0; i++) {
      currentMonth++;
      let interestForMonth = remainingBalance * rFloating;
      let principalForMonth = 0;

      if (repaymentMethod === 'reducing') {
        principalForMonth = loanAmount / totalMonths; // Standard practice: constant based on initial loan
      } else {
        // Annuity: recalculate based on remaining balance and remaining months
        const m = loanAtStartOfPhase2 * (rFloating * Math.pow(1 + rFloating, remainingMonthsAtStartOfPhase2)) / (Math.pow(1 + rFloating, remainingMonthsAtStartOfPhase2) - 1);
        principalForMonth = m - interestForMonth;
      }

      let actualMonthlyPrincipal = principalForMonth + extraPayment;
      let actualMonthlyPayment = actualMonthlyPrincipal + interestForMonth;

      if (remainingBalance < actualMonthlyPrincipal) {
        actualMonthlyPrincipal = remainingBalance;
        actualMonthlyPayment = actualMonthlyPrincipal + interestForMonth;
      }

      remainingBalance -= actualMonthlyPrincipal;
      totalInterest += interestForMonth;
      totalPaymentPhase2 += actualMonthlyPayment;

      if (!m2) m2 = actualMonthlyPayment;

      amortizationSchedule.push({
        month: currentMonth,
        payment: actualMonthlyPayment,
        principal: actualMonthlyPrincipal,
        interest: interestForMonth,
        balance: remainingBalance > 0 ? remainingBalance : 0
      });
    }
  } else {
    m2 = 0;
  }

  // Step 6 & 7: Totals
  const totalPaymentToBank = totalPaymentPhase1 + totalPaymentPhase2;
  const totalCostOfProperty = downPayment + totalPaymentToBank;

  return {
    loanAmount,
    downPayment,
    m1,
    m2: m2 || null, // Might be 0 if paid off early
    totalInterest,
    totalPaymentToBank,
    totalCostOfProperty,
    amortizationSchedule,
    payoffMonths: currentMonth
  };
}
