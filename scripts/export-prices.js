// scripts/export-prices.js
//
// Writes data/keepsake-prices.json: Keepsake's Premium prices for every App Store
// storefront, so the pricing section can show visitors their local price.
//
// Needs the App Store Connect CLI (`asc`) to be installed and signed in on this
// machine. It only reads prices. It never changes anything in App Store Connect.
//
// Usage:
//   node scripts/export-prices.js            Refresh data/keepsake-prices.json
//   node scripts/export-prices.js --check    Report whether prices changed, write nothing
//                                            (exit code 1 if they changed)
//
// Re-run after any price change, and as part of the monthly marketing review.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const APP_ID = '6760719322';
const OUTPUT = path.join(__dirname, '..', 'data', 'keepsake-prices.json');
const checkOnly = process.argv.includes('--check');

// Apple identifies storefronts by 3-letter codes; browsers use 2-letter region codes.
const ISO3_TO_ISO2 = Object.fromEntries(`
AFG AF,ALA AX,ALB AL,DZA DZ,ASM AS,AND AD,AGO AO,AIA AI,ATA AQ,ATG AG,ARG AR,ARM AM,ABW AW,AUS AU,AUT AT,AZE AZ,
BHS BS,BHR BH,BGD BD,BRB BB,BLR BY,BEL BE,BLZ BZ,BEN BJ,BMU BM,BTN BT,BOL BO,BES BQ,BIH BA,BWA BW,BVT BV,BRA BR,
IOT IO,BRN BN,BGR BG,BFA BF,BDI BI,CPV CV,KHM KH,CMR CM,CAN CA,CYM KY,CAF CF,TCD TD,CHL CL,CHN CN,CXR CX,CCK CC,
COL CO,COM KM,COG CG,COD CD,COK CK,CRI CR,CIV CI,HRV HR,CUB CU,CUW CW,CYP CY,CZE CZ,DNK DK,DJI DJ,DMA DM,DOM DO,
ECU EC,EGY EG,SLV SV,GNQ GQ,ERI ER,EST EE,SWZ SZ,ETH ET,FLK FK,FRO FO,FJI FJ,FIN FI,FRA FR,GUF GF,PYF PF,ATF TF,
GAB GA,GMB GM,GEO GE,DEU DE,GHA GH,GIB GI,GRC GR,GRL GL,GRD GD,GLP GP,GUM GU,GTM GT,GGY GG,GIN GN,GNB GW,GUY GY,
HTI HT,HMD HM,VAT VA,HND HN,HKG HK,HUN HU,ISL IS,IND IN,IDN ID,IRN IR,IRQ IQ,IRL IE,IMN IM,ISR IL,ITA IT,JAM JM,
JPN JP,JEY JE,JOR JO,KAZ KZ,KEN KE,KIR KI,PRK KP,KOR KR,KWT KW,KGZ KG,LAO LA,LVA LV,LBN LB,LSO LS,LBR LR,LBY LY,
LIE LI,LTU LT,LUX LU,MAC MO,MDG MG,MWI MW,MYS MY,MDV MV,MLI ML,MLT MT,MHL MH,MTQ MQ,MRT MR,MUS MU,MYT YT,MEX MX,
FSM FM,MDA MD,MCO MC,MNG MN,MNE ME,MSR MS,MAR MA,MOZ MZ,MMR MM,NAM NA,NRU NR,NPL NP,NLD NL,NCL NC,NZL NZ,NIC NI,
NER NE,NGA NG,NIU NU,NFK NF,MKD MK,MNP MP,NOR NO,OMN OM,PAK PK,PLW PW,PSE PS,PAN PA,PNG PG,PRY PY,PER PE,PHL PH,
PCN PN,POL PL,PRT PT,PRI PR,QAT QA,REU RE,ROU RO,RUS RU,RWA RW,BLM BL,SHN SH,KNA KN,LCA LC,MAF MF,SPM PM,VCT VC,
WSM WS,SMR SM,STP ST,SAU SA,SEN SN,SRB RS,SYC SC,SLE SL,SGP SG,SXM SX,SVK SK,SVN SI,SLB SB,SOM SO,ZAF ZA,SGS GS,
SSD SS,ESP ES,LKA LK,SDN SD,SUR SR,SJM SJ,SWE SE,CHE CH,SYR SY,TWN TW,TJK TJ,TZA TZ,THA TH,TLS TL,TGO TG,TKL TK,
TON TO,TTO TT,TUN TN,TUR TR,TKM TM,TCA TC,TUV TV,UGA UG,UKR UA,ARE AE,GBR GB,USA US,UMI UM,URY UY,UZB UZ,VUT VU,
VEN VE,VNM VN,VGB VG,VIR VI,WLF WF,ESH EH,YEM YE,ZMB ZM,ZWE ZW,XKS XK
`.split(',').map((pair) => pair.trim()).filter(Boolean).map((pair) => pair.split(/\s+/)));

function asc(args) {
  const output = execFileSync('asc', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(output);
}

function readPrices(subscriptionId) {
  const result = asc(['subscriptions', 'pricing', 'prices', 'list',
    '--subscription-id', subscriptionId, '--resolved', '--paginate', '--output', 'json']);
  return result.prices || [];
}

function main() {
  // Find the monthly and annual subscriptions.
  const summary = asc(['subscriptions', 'pricing', 'summary', '--app', APP_ID, '--output', 'json']);
  const subscriptions = summary.subscriptions || [];
  const monthly = subscriptions.find((s) => s.subscriptionPeriod === 'ONE_MONTH');
  const annual = subscriptions.find((s) => s.subscriptionPeriod === 'ONE_YEAR');

  if (!monthly || !annual) {
    throw new Error('Could not find both the monthly and annual subscriptions.');
  }

  const monthlyPrices = readPrices(monthly.id);
  const annualPrices = readPrices(annual.id);
  const annualByTerritory = new Map(annualPrices.map((p) => [p.territory, p]));

  const regions = {};
  const unmapped = [];

  for (const m of monthlyPrices) {
    const a = annualByTerritory.get(m.territory);
    const code = ISO3_TO_ISO2[m.territory];

    if (!a || m.currency !== a.currency) continue;
    if (!code) { unmapped.push(m.territory); continue; }

    regions[code] = {
      currency: m.currency,
      monthly: Number(m.customerPrice),
      annual: Number(a.customerPrice)
    };
  }

  if (unmapped.length) {
    console.warn(`Skipped storefronts with no 2-letter code: ${unmapped.join(', ')}`);
  }
  if (!regions.US) {
    throw new Error('No US price found. Refusing to write an incomplete file.');
  }

  const sorted = Object.fromEntries(Object.keys(regions).sort().map((k) => [k, regions[k]]));
  const next = { source: 'App Store Connect', regions: sorted };

  // Compare with the existing file (ignoring the date) so we can report changes.
  let previous = {};
  try { previous = JSON.parse(fs.readFileSync(OUTPUT, 'utf8')).regions || {}; } catch { /* first run */ }

  const changed = Object.keys(sorted).filter((k) => JSON.stringify(sorted[k]) !== JSON.stringify(previous[k]));
  const removed = Object.keys(previous).filter((k) => !sorted[k]);

  console.log(`${Object.keys(sorted).length} storefronts. ${changed.length} new or changed, ${removed.length} removed.`);
  changed.slice(0, 20).forEach((k) => console.log(`  ${k}: ${JSON.stringify(previous[k] || null)} -> ${JSON.stringify(sorted[k])}`));

  if (checkOnly) {
    process.exit(changed.length || removed.length ? 1 : 0);
  }

  if (!changed.length && !removed.length) {
    console.log('Prices unchanged. Nothing written.');
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify({ ...next, generated: new Date().toISOString().slice(0, 10) }, null, 2) + '\n');
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT)}`);
}

try {
  main();
} catch (err) {
  console.error('Price export failed:', err.message);
  process.exit(2);
}
