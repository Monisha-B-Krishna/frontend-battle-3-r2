/* ============================================================
   AETHON — format.js
   Feature 2: Financial & Numeric Value Sanitation
   ============================================================ */

const Format = (() => {

  const currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const numberFmt = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  /**
   * Format USD currency — $1,234,567
   */
  function currency(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '$—';
    return currencyFmt.format(Math.max(0, n));
  }

  /**
   * Format percentage — clamped to 2 decimal places
   */
  function percent(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—%';
    // Clamp and fix to exactly 2 decimal places
    const clamped = Math.max(-999.99, Math.min(9999.99, n));
    return clamped.toFixed(2) + '%';
  }

  /**
   * Format plain integer with commas
   */
  function integer(val) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return '—';
    return numberFmt.format(n);
  }

  /**
   * Format large numbers for KPI display (e.g. 1.2M, 45.3K)
   */
  function compact(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000)     return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)         return '$' + (n / 1_000).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }

  /**
   * Format robot count (plain integer, comma separated)
   */
  function robots(val) {
    return integer(val);
  }

  /**
   * Format hours saved
   */
  function hours(val) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return '—';
    if (n >= 1000) return numberFmt.format(n);
    return String(n);
  }

  return { currency, percent, integer, compact, robots, hours };
})();
