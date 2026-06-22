/*
 * promoTerms.js — builds the numbered Terms & Conditions for a promotion.
 *
 * Lines 1–6 are auto-filled from the promotion package (min deposit, currency,
 * type, rollover) so they always match whatever the admin configured. Lines
 * 7–12 are fixed legal terms that never change.
 *
 * Kept in sync with onward-react/src/utils/promoTerms.js so the admin preview
 * matches the player Promo Detail modal exactly.
 */

function digits(value, fallback) {
  const m = String(value ?? '').match(/\d[\d,]*(?:\.\d+)?/);
  return m ? m[0].replace(/,/g, '') : String(fallback);
}

export function buildPromoTerms(promo = {}) {
  const p = promo || {};
  const minDep = digits(p.minDeposit ?? p.md, 100);
  const currency = String(p.currency || 'PHP').toUpperCase();
  const rollover = digits(p.wager ?? p.rollover, 15);
  const firstDepositOnly = /welcome|first/i.test(String(p.type || '')) || p.firstDepositOnly;

  return [
    'THIS PROMOTION IS AVAILABLE FOR ALL ONWARD MEMBERS.',
    `A MINIMUM DEPOSIT OF ${minDep} ${currency} IS REQUIRED FOR THIS PROMOTION.`,
    `THIS PROMOTION IS AVAILABLE FOR ${currency} CURRENCY MEMBERS ONLY.`,
    firstDepositOnly
      ? 'MEMBERS CAN RECEIVE THIS SPECIAL PROMOTION ONLY WHEN MAKING THEIR FIRST DEPOSIT. PLEASE SELECT THE PRODUCT PACKAGE THAT YOU WANT TO PLAY TO REQUEST.'
      : 'PLEASE SELECT THE PRODUCT PACKAGE THAT YOU WANT TO PLAY TO REQUEST.',
    `BONUS CREDITS REQUIRE A ${rollover}X ROLLOVER.`,
    'BONUS CREDITS ARE ONLY APPLICABLE FOR SLOT GAMES ONLY.',
    "REBATES WILL NOT BE CALCULATED TOGETHER WITH THE ROLLOVER AMOUNT GENERATED FROM THIS BONUS. HOWEVER, THE ROLLOVER REQUIREMENT WILL BE CONSIDERED COMPLETED IF THE MEMBER'S ACCOUNT BALANCE IS $1 OR LESS. PLEASE CONTACT CUSTOMER SERVICE TO CANCEL YOUR ROLLOVER CONDITIONS.",
    'MEMBERS CAN ONLY RECEIVE ONE BONUS PER ACCOUNT. REQUESTS FOR ADDITIONAL BONUSES ARE ONLY POSSIBLE IF ALL PREVIOUS REQUIREMENTS HAVE BEEN MET.',
    'IF ANY PLAYER DOES NOT RECEIVE THE BONUS CREDIT, PLEASE CONTACT OUR CUSTOMER SERVICE PROMPTLY.',
    'BONUSES AND WINNINGS WILL BE VOID IF THE BETTING AND BONUS REQUIREMENTS ARE NOT FULFILLED WITHIN 30 DAYS OF RECEIVING THE BONUS.',
    'ONLY ONE IP ADDRESS IS ALLOWED TO CLAIM THIS BONUS. IF MORE THAN ONE ACCOUNT IS FOUND USING THE SAME IP ADDRESS, ALL BONUS CREDITS MAY BE CONFISCATED. ONWARD RESERVES THE RIGHT TO WITHHOLD AND CANCEL ALL WINNINGS.',
    'ONWARD RESERVES THE RIGHT TO MODIFY, CHANGE, OR TERMINATE THIS PROMOTION WITHOUT PRIOR NOTICE.',
  ];
}

export default buildPromoTerms;
