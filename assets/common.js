/* Wspólne helpery dat */
function dateInWarsawISO(offsetDays=0) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const f = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Warsaw', year:'numeric', month:'2-digit', day:'2-digit' });
  const parts = f.formatToParts(now);
  const y = parts.find(p=>p.type==='year')?.value;
  const m = parts.find(p=>p.type==='month')?.value;
  const d = parts.find(p=>p.type==='day')?.value;
  return `${y}-${m}-${d}`;
}
function formatPl(dateStr, { weekday = true, year = true } = {}) {
  const opts = { day:'numeric', month:'long', timeZone:'Europe/Warsaw' };
  if (weekday) opts.weekday = 'long';
  if (year) opts.year = 'numeric';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pl-PL', opts);
}
function nearestSundayISO() {
  const todayStr = dateInWarsawISO(0);
  const base = new Date(todayStr + 'T00:00:00Z');
  const dow = base.getUTCDay();
  const add = (7 - dow) % 7;
  base.setUTCDate(base.getUTCDate() + add);
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth()+1).padStart(2,'0');
  const d = String(base.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function todayInWarsawISO(){ return dateInWarsawISO(0); }
function dateVerbosePl(dateStr){
  const opts = { year:'numeric', month:'long', day:'numeric', timeZone:'Europe/Warsaw' };
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pl-PL', opts);
}

/* Wspólna lista niedziel handlowych 2025–2027 */
const handlowe = [
  "2025-01-26","2025-03-30","2025-04-27","2025-06-29","2025-08-31","2025-12-14","2025-12-21",
  "2026-01-25","2026-03-29","2026-04-26","2026-06-28","2026-08-30","2026-12-06","2026-12-13","2026-12-20",
  "2027-01-31","2027-03-21","2027-04-25","2027-06-27","2027-08-29","2027-12-05","2027-12-12","2027-12-19"
];

/* Inicjalizacja wspólna po załadowaniu DOM */
window.addEventListener('DOMContentLoaded', function(){
  /* Aktualizacja znaczników daty/roku, gdy są na stronie */
  const stamp = new Date().toLocaleDateString('pl-PL', { timeZone:'Europe/Warsaw' });
  const yearText = new Date().toLocaleDateString('pl-PL', { year:'numeric', timeZone:'Europe/Warsaw' });
  const yearSpans = document.querySelectorAll('#year');
  yearSpans.forEach(el => el.textContent = yearText);

  const idList = ['lastUpdatedToday','lastUpdatedTomorrow','lastUpdatedNearest','lastUpdatedUpcoming','lastUpdated'];
  idList.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = `Aktualizacja: ${stamp}`; });

  /* Strona główna (index): render sekcji Dziś/Jutro/Najbliższa + lista */
  const todayStatus = document.getElementById("todayStatus");
  const tomorrowStatus = document.getElementById("tomorrowStatus");
  const nearestSundayStatus = document.getElementById("nearestSundayStatus");
  const nearestSundayDateEl = document.getElementById("nearestSundayDate");
  const list = document.getElementById("list");

  if (todayStatus && tomorrowStatus && nearestSundayStatus && nearestSundayDateEl && list) {
    const todayStr = dateInWarsawISO(0);
    const tomorrowStr = dateInWarsawISO(1);
    const nearestSunStr = nearestSundayISO();

    if (handlowe.includes(todayStr)) {
      todayStatus.textContent = "Tak! Dziś jest niedziela handlowa 🛍️.";
    } else {
      todayStatus.textContent = "Nie, dzisiaj nie ma niedzieli handlowej.";
    }

    if (handlowe.includes(tomorrowStr)) {
      tomorrowStatus.textContent = "Tak — jutro jest niedziela handlowa.";
    } else {
      tomorrowStatus.textContent = "Jutro nie ma niedzieli handlowej.";
    }

    const nearestDatePretty = formatPl(nearestSunStr, { weekday: true, year: false });
    nearestSundayDateEl.textContent = nearestDatePretty;

    if (handlowe.includes(nearestSunStr)) {
      nearestSundayStatus.textContent = (nearestSunStr === todayStr)
        ? "Tak — to dzisiejsza niedziela i jest handlowa."
        : "Tak — nadchodząca niedziela jest handlowa.";
    } else {
      nearestSundayStatus.textContent = (nearestSunStr === todayStr)
        ? "Tak, dzisiejsza niedziela nie jest handlowa."
        : "Nie, nadchodząca niedziela nie jest handlowa.";
    }

    const upcoming = handlowe.filter(date => date > todayStr);
    const nextThree = upcoming.slice(0, 3);

    if (nextThree.length) {
      nextThree.forEach(date => {
        const li = document.createElement("li");
        li.className = "pill";
        li.textContent = formatPl(date, { weekday: true, year: false });
        list.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.className = "pill";
      li.textContent = "Brak nadchodzących niedziel handlowych.";
      list.appendChild(li);
    }

    /* JSON-LD Event + ItemList (jak w oryginale) */
    (function injectNearestSundayEvent(dateISO){
      const schema = {
        "@context":"https://schema.org",
        "@type":"Event",
        "name":"Niedziela handlowa",
        "startDate": dateISO,
        "eventStatus": handlowe.includes(dateISO) ? "https://schema.org/EventScheduled" : "https://schema.org/EventCancelled",
        "location": { "@type":"Place", "name":"Polska" },
        "description":"Informacja, czy najbliższa niedziela w Polsce jest handlowa."
      };
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify(schema);
      document.head.appendChild(s);
    })(nearestSunStr);

    (function injectItemListSchema(dates) {
      if (!dates.length) return;
      const itemList = {
        "@context":"https://schema.org",
        "@type":"ItemList",
        "name":"Najbliższe niedziele handlowe",
        "itemListElement": dates.map((date, i) => ({
          "@type":"ListItem",
          "position": i + 1,
          "item": {
            "@type":"Event",
            "name":"Niedziela handlowa",
            "startDate": date,
            "eventStatus":"https://schema.org/EventScheduled",
            "location":{"@type":"Place","name":"Polska"}
          }
        }))
      };
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify(itemList);
      document.head.appendChild(s);
    })(nextThree);
  }

  /* Strona kalendarza: tabela przyszłych dat */
  const tbody = document.getElementById('calendarTableBody');
  const emptyState = document.getElementById('emptyState');
  if (tbody) {
    const todayStr = todayInWarsawISO();
    const datesSorted = [...handlowe].sort((a,b) => a.localeCompare(b));
    const futureDates = datesSorted.filter(d => d >= todayStr);

    if (!futureDates.length) {
      if (emptyState) emptyState.style.display = 'block';
    } else {
      futureDates.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${dateVerbosePl(d)}</td>`;
        tbody.appendChild(tr);
      });
    }

    (function injectEventsSchema(dates) {
      if (!dates.length) return;
      const itemList = {
        "@context":"https://schema.org",
        "@type":"ItemList",
        "name":"Nadchodzące niedziele handlowe",
        "itemListElement": dates.map((d, i) => ({
          "@type":"ListItem",
          "position": i + 1,
          "item": {
            "@type":"Event",
            "name":"Niedziela handlowa",
            "startDate": d,
            "eventStatus":"https://schema.org/EventScheduled",
            "location":{"@type":"Place","name":"Polska"}
          }
        }))
      };
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify(itemList);
      document.head.appendChild(s);
    })(futureDates);
  }

  /* Inicjalizacja AdSense – tyle razy, ile jest znaczników <ins.adsbygoogle> na stronie */
  try{
    var count = document.querySelectorAll('ins.adsbygoogle').length;
    if (count > 0) {
      window.adsbygoogle = window.adsbygoogle || [];
      for (var i=0; i<count; i++) { adsbygoogle.push({}); }
    }
  }catch(e){}

});

/* Obsługa banera zgód (jak w oryginale) */
(function(){
  const KEY = 'nh_consent_v2';
  const banner = document.getElementById('consentBanner');
  const saved = localStorage.getItem(KEY);
  function hide(){ if (banner) banner.style.display = 'none'; }
  function show(){ if (banner) banner.style.display = 'block'; }
  function setConsent(all){
    if(typeof gtag !== 'function') return;
    if(all){
      gtag('consent', 'update', { 'ad_user_data':'granted','ad_personalization':'granted','ad_storage':'granted','analytics_storage':'granted' });
      localStorage.setItem(KEY, 'all');
    }else{
      gtag('consent', 'update', { 'ad_user_data':'denied','ad_personalization':'denied','ad_storage':'denied','analytics_storage':'denied' });
      localStorage.setItem(KEY, 'necessary');
    }
  }
  if(!saved){ show(); }
  var btnA = document.getElementById('btnAccept');
  var btnR = document.getElementById('btnReject');
  if (btnA) btnA.addEventListener('click', function(){ setConsent(true); hide(); });
  if (btnR) btnR.addEventListener('click', function(){ setConsent(false); hide(); });
})();
