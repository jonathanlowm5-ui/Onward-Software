/*
 * promoAutoTranslate — best-effort auto-translation of common promotion wording
 * (titles / descriptions) into the player's language, so banners like
 * "2ND DEPOSIT BONUS / 100% UP TO ₱1,980 / +25 FREE SPINS" localise themselves
 * without the admin having to type every language. Numbers, %, and currency
 * amounts are left untouched. Admin-provided i18n translations always win over
 * this (see localizePromo); this only fills the gap when none was entered.
 *
 * It is phrase-based (not a full MT engine): it swaps known casino promo phrases.
 * Unknown wording is left as-is.
 */

const LANGS = ['zh', 'id', 'ms', 'th', 'vi', 'hi', 'ko', 'ja', 'es', 'pt'];

// Longest / most-specific phrases first so multi-word matches win.
const PHRASES = [
  ['weekly cashback', { zh: '每周返现', id: 'Cashback Mingguan', ms: 'Pulangan Tunai Mingguan', th: 'เงินคืนรายสัปดาห์', vi: 'Hoàn tiền hàng tuần', hi: 'साप्ताहिक कैशबैक', ko: '주간 캐시백', ja: '週間キャッシュバック', es: 'Reembolso semanal', pt: 'Reembolso semanal' }],
  ['daily cashback', { zh: '每日返现', id: 'Cashback Harian', ms: 'Pulangan Tunai Harian', th: 'เงินคืนรายวัน', vi: 'Hoàn tiền hàng ngày', hi: 'दैनिक कैशबैक', ko: '일일 캐시백', ja: 'デイリーキャッシュバック', es: 'Reembolso diario', pt: 'Reembolso diário' }],
  ['1st deposit bonus', { zh: '首存奖金', id: 'Bonus Deposit Pertama', ms: 'Bonus Deposit Pertama', th: 'โบนัสเงินฝากครั้งแรก', vi: 'Thưởng nạp lần 1', hi: 'पहली डिपॉज़िट बोनस', ko: '첫 입금 보너스', ja: '初回入金ボーナス', es: 'Bono de primer depósito', pt: 'Bônus de primeiro depósito' }],
  ['first deposit bonus', { zh: '首存奖金', id: 'Bonus Deposit Pertama', ms: 'Bonus Deposit Pertama', th: 'โบนัสเงินฝากครั้งแรก', vi: 'Thưởng nạp lần 1', hi: 'पहली डिपॉज़िट बोनस', ko: '첫 입금 보너스', ja: '初回入金ボーナス', es: 'Bono de primer depósito', pt: 'Bônus de primeiro depósito' }],
  ['2nd deposit bonus', { zh: '第二次存款奖金', id: 'Bonus Deposit Kedua', ms: 'Bonus Deposit Kedua', th: 'โบนัสเงินฝากครั้งที่ 2', vi: 'Thưởng nạp lần 2', hi: 'दूसरी डिपॉज़िट बोनस', ko: '두 번째 입금 보너스', ja: '2回目入金ボーナス', es: 'Bono de segundo depósito', pt: 'Bônus de segundo depósito' }],
  ['3rd deposit bonus', { zh: '第三次存款奖金', id: 'Bonus Deposit Ketiga', ms: 'Bonus Deposit Ketiga', th: 'โบนัสเงินฝากครั้งที่ 3', vi: 'Thưởng nạp lần 3', hi: 'तीसरी डिपॉज़िट बोनस', ko: '세 번째 입금 보너스', ja: '3回目入金ボーナス', es: 'Bono de tercer depósito', pt: 'Bônus de terceiro depósito' }],
  ['4th deposit bonus', { zh: '第四次存款奖金', id: 'Bonus Deposit Keempat', ms: 'Bonus Deposit Keempat', th: 'โบนัสเงินฝากครั้งที่ 4', vi: 'Thưởng nạp lần 4', hi: 'चौथी डिपॉज़िट बोनस', ko: '네 번째 입금 보너스', ja: '4回目入金ボーナス', es: 'Bono de cuarto depósito', pt: 'Bônus de quarto depósito' }],
  ['welcome bonus', { zh: '欢迎奖金', id: 'Bonus Selamat Datang', ms: 'Bonus Selamat Datang', th: 'โบนัสต้อนรับ', vi: 'Thưởng chào mừng', hi: 'स्वागत बोनस', ko: '웰컴 보너스', ja: 'ウェルカムボーナス', es: 'Bono de bienvenida', pt: 'Bônus de boas-vindas' }],
  ['reload bonus', { zh: '充值奖金', id: 'Bonus Isi Ulang', ms: 'Bonus Tambah Nilai', th: 'โบนัสเติมเงิน', vi: 'Thưởng nạp lại', hi: 'रीलोड बोनस', ko: '리로드 보너스', ja: 'リロードボーナス', es: 'Bono de recarga', pt: 'Bônus de recarga' }],
  ['deposit bonus', { zh: '存款奖金', id: 'Bonus Deposit', ms: 'Bonus Deposit', th: 'โบนัสเงินฝาก', vi: 'Thưởng nạp tiền', hi: 'डिपॉज़िट बोनस', ko: '입금 보너스', ja: '入金ボーナス', es: 'Bono de depósito', pt: 'Bônus de depósito' }],
  ['free spins', { zh: '免费旋转', id: 'Putaran Gratis', ms: 'Pusingan Percuma', th: 'ฟรีสปิน', vi: 'Vòng quay miễn phí', hi: 'फ्री स्पिन', ko: '무료 스핀', ja: 'フリースピン', es: 'Giros gratis', pt: 'Rodadas grátis' }],
  ['free spin', { zh: '免费旋转', id: 'Putaran Gratis', ms: 'Pusingan Percuma', th: 'ฟรีสปิน', vi: 'Vòng quay miễn phí', hi: 'फ्री स्पिन', ko: '무료 스핀', ja: 'フリースピン', es: 'Giro gratis', pt: 'Rodada grátis' }],
  ['up to', { zh: '高达', id: 'hingga', ms: 'sehingga', th: 'สูงสุด', vi: 'lên đến', hi: 'तक', ko: '최대', ja: '最大', es: 'hasta', pt: 'até' }],
  ['cashback', { zh: '返现', id: 'Cashback', ms: 'Pulangan Tunai', th: 'เงินคืน', vi: 'Hoàn tiền', hi: 'कैशबैक', ko: '캐시백', ja: 'キャッシュバック', es: 'Reembolso', pt: 'Reembolso' }],
  ['reload', { zh: '充值', id: 'Isi Ulang', ms: 'Tambah Nilai', th: 'เติมเงิน', vi: 'Nạp lại', hi: 'रीलोड', ko: '리로드', ja: 'リロード', es: 'Recarga', pt: 'Recarga' }],
  ['weekly', { zh: '每周', id: 'Mingguan', ms: 'Mingguan', th: 'รายสัปดาห์', vi: 'Hàng tuần', hi: 'साप्ताहिक', ko: '주간', ja: '週間', es: 'Semanal', pt: 'Semanal' }],
  ['daily', { zh: '每日', id: 'Harian', ms: 'Harian', th: 'รายวัน', vi: 'Hàng ngày', hi: 'दैनिक', ko: '일일', ja: 'デイリー', es: 'Diario', pt: 'Diário' }],
  ['bonus', { zh: '奖金', id: 'Bonus', ms: 'Bonus', th: 'โบนัส', vi: 'Thưởng', hi: 'बोनस', ko: '보너스', ja: 'ボーナス', es: 'Bono', pt: 'Bônus' }],
  ['deposit', { zh: '存款', id: 'Deposit', ms: 'Deposit', th: 'เงินฝาก', vi: 'Nạp tiền', hi: 'डिपॉज़िट', ko: '입금', ja: '入金', es: 'Depósito', pt: 'Depósito' }],
  ['spins', { zh: '旋转', id: 'Putaran', ms: 'Pusingan', th: 'สปิน', vi: 'Vòng quay', hi: 'स्पिन', ko: '스핀', ja: 'スピン', es: 'Giros', pt: 'Rodadas' }],
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const COMPILED = PHRASES.map(([en, tr]) => [new RegExp(`\\b${escape(en)}\\b`, 'gi'), tr]);

export function autoTranslatePromo(text, lang) {
  if (!text || lang === 'en' || !LANGS.includes(lang)) return text;
  let out = String(text);
  for (const [re, tr] of COMPILED) {
    const t = tr[lang];
    if (!t) continue;
    out = out.replace(re, (m) => (m === m.toUpperCase() ? t.toUpperCase() : t));
  }
  return out;
}

export default autoTranslatePromo;
