// Sidebar menu hierarchy, extracted verbatim from Onward_Admin.html (MENU).
const MENU=[
 {label:"Overview"},
 {link:{id:"dashboard",ic:"📊",t:"Dashboard"}},
 {link:{id:"analytics",ic:"📈",t:"Analytics"}},
 {cat:"Players",ic:"👥",id:"players",sub:[
   {id:"all-players",ic:"👥",t:"All Players"},
   {id:"online-players",ic:"🟢",t:"Online Players"},
   {id:"kyc",ic:"🪪",t:"KYC"},
   {id:"vip",ic:"💎",t:"VIP Level"}]},
 {cat:"Finance",ic:"💰",id:"finance",sub:[
   {id:"deposits",ic:"💳",t:"Deposits"},
   {id:"withdrawals",ic:"💸",t:"Withdrawals"},
   {id:"transactions",ic:"📒",t:"Transactions"},
   {id:"bonuses",ic:"🎁",t:"Bonuses"},
   {id:"bank",ic:"🏦",t:"Bank"}]},
 {cat:"Games",ic:"🎮",id:"games",sub:[
   {id:"game-list",ic:"🎰",t:"Game List"},
   {id:"live-bets",ic:"🎲",t:"Live Bets"},
   {id:"providers",ic:"🔌",t:"Providers"},
   {id:"sports",ic:"⚽",t:"Sports Control"},
   {id:"lottery",ic:"🎱",t:"Lottery"}]},
 {cat:"Promotions",ic:"📣",id:"promo",sub:[
   {id:"promotions",ic:"📣",t:"Promotions"},
   {id:"tournament",ic:"🏆",t:"Tournament"},
   {id:"mission",ic:"🎯",t:"Mission"},
   {id:"voucher",ic:"🎫",t:"Voucher"}]},
 {cat:"Marketing",ic:"📢",id:"marketing",sub:[
   {id:"sms",ic:"💬",t:"SMS Campaign"},
   {id:"email",ic:"✉️",t:"Email Campaign"},
   {id:"push",ic:"🔔",t:"Push Notification"},
   {id:"ads",ic:"📣",t:"Ads Marketing"}]},
 {cat:"Agent",ic:"🧑‍💼",id:"agent",sub:[
   {id:"agent-report",ic:"📊",t:"Agent Dashboard"},
   {id:"agent-approval",ic:"✅",t:"Agent Approval"},
   {id:"agent-list",ic:"👥",t:"Agent List"},
   {id:"commission",ic:"💰",t:"Commission"},
   {id:"agent-players",ic:"🎮",t:"Agent Players"}]},
 {cat:"Affiliate",ic:"🤝",id:"affiliate",sub:[
   {id:"aff-data",ic:"🤝",t:"Affiliate Data"},
   {id:"referral-tree",ic:"🌳",t:"Referral Tree"},
   {id:"comm-tiers",ic:"🏆",t:"Commission Tiers"},
   {id:"referral-links",ic:"🔗",t:"Referral Links"},
   {id:"payout-history",ic:"💸",t:"Payout History"}]},
 {cat:"App",ic:"📱",id:"app",sub:[
   {id:"pwa",ic:"📱",t:"PWA"},
   {id:"apk",ic:"📦",t:"APK"}]},
 {cat:"CMS",ic:"🖥️",id:"cms",sub:[
   {id:"popout",ic:"📢",t:"Popout Announcement"},
   {id:"floating",ic:"🖼️",t:"Floating Image"},
   {id:"notification",ic:"🔔",t:"Notification"},
   {id:"page-links",ic:"🔗",t:"Page Links"},
   {id:"cs",ic:"🎧",t:"Customer Service"},
   {id:"site-settings",ic:"⚙️",t:"Site Settings"},
   {id:"web-settings",ic:"🌐",t:"Web Settings"}]},
 {cat:"Reports",ic:"📊",id:"reports",sub:[
   {id:"web-stat",ic:"🌐",t:"Web Statistic"},
   {id:"retention",ic:"📉",t:"Retention Statistic"},
   {id:"provider-report",ic:"🎮",t:"Provider Report"},
   {id:"winloss",ic:"📊",t:"Win/Loss Report"},
   {id:"otp-report",ic:"🔑",t:"OTP Report"},
   {id:"ads-eval",ic:"📣",t:"Ads Evaluation"},
   {id:"day-retention",ic:"📅",t:"Day Retention"}]},
 {cat:"System",ic:"⚙️",id:"system",sub:[
   {id:"security",ic:"🔒",t:"Security"},
   {id:"admin",ic:"👨‍💼",t:"Admin"},
   {id:"audit",ic:"📋",t:"Audit Logs"}]},
 {cat:"Developer",ic:"🛠️",id:"developer",sub:[
   {id:"dev-tools",ic:"🔧",t:"Dev Tools"},
   {id:"games-api",ic:"🎮",t:"Games API"},
   {id:"payment-adhoc",ic:"💳",t:"Payment Adhoc"},
   {id:"web-design",ic:"🎨",t:"Website Design"}]}
];

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2200)}
function tbl(cols,rows){return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
const bOk=t=>`<span class="badge ok">${t}</span>`,bPend=t=>`<span class="badge pend">${t}</span>`,bBad=t=>`<span class="badge bad">${t}</span>`,bInfo=t=>`<span class="badge info">${t}</span>`;
const act=(t,c='')=>`<button class="mini-btn ${c}" onclick="toast('${t} — demo action')">${t}</button>`;
const search=(p)=>`<div class="toolbar"><input placeholder="${p}"><select><option>All Status</option><option>Active</option><option>Pending</option><option>Blocked</option></select><button class="mini-btn gold">🔍 Search</button></div>`;

/* ---------- VIEW BUILDERS ---------- */

export default MENU;
