#!/usr/bin/env node
/**
 * Deterministic collector for the Website Revenue Leak Scorecard.
 *
 *   node collect.mjs --url https://example.com --client "Example Co." \
 *     --city "San Diego" --service plumbing --max-pages 12
 *
 * Writes:
 *   <out>/audit.json              signals + V2 check skeleton (nulls need judgment)
 *   <out>/evidence/{d,m}-NN-*.png screenshots
 *   <out>/lighthouse-mobile-1..n.json
 *   <out>/site-map.json           page map and conversion paths
 *   <out>/paths.json              non-destructive call/text/form/book traces
 *   <out>/run.json                manifest
 *
 * It never submits a form, places a call, books an appointment, sends a message,
 * or logs in. It may click a Book Now control once to detect a scheduler iframe;
 * no appointment is selected.
 */

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const COLLECTOR_VERSION = "2.0.0";

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36";

const HELP = `Website Revenue Leak Scorecard collector ${COLLECTOR_VERSION}

Usage:
  node collect.mjs --url <url> [options]

Required:
  --url <url>              Public HTTPS or HTTP URL to audit

Recommended:
  --client <name>          Business name for the audit metadata
  --city <city>            Target city or market
  --trade <trade>          Trade, e.g. plumbing, hvac, roofing
  --service <service>      Primary service term, e.g. roofing or plumbing
  --slug <slug>            Short output slug (default: hostname)
  --max-pages <n>          Pages to crawl, default 5 (use 10-14 for a full audit)
  --lh-runs <n>            Lighthouse mobile runs, default 3 (median LCP is used)

Optional:
  --config <json>          Configuration file (languages, optional modules)
  --language <codes>       Comma-separated preferred languages, e.g. en,es
  --out <dir>              Output directory (default: .audit/<slug>/<run-id>)
  --run-id <id>            Run id (default: YYYY-MM-DDTHHMM)
  --wait <ms>              Settle wait per page, default 7000
  --max-height <px>        Full-page screenshot cap, default 7000
  --skip-lighthouse        Skip Lighthouse and leave RL-MOB-01 for manual review
  --help                   Show this help

Non-destructive by default:
  No form submission, call, text, booking, account creation, or payment.
  A Book Now control may be clicked once to detect a scheduler iframe.

Examples:
  node collect.mjs --url https://example.com --client "Example Co." --city "San Diego" --service plumbing
  node collect.mjs --url https://example.com --config config/market.json --max-pages 12 --lh-runs 3
`;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (v === undefined || v.startsWith("--")) return true;
  return v;
}

const has = (name) => process.argv.includes(`--${name}`);

if (has("help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const URL_ = arg("url");
if (!URL_) {
  console.error("error: --url is required\n");
  console.error(HELP);
  process.exit(2);
}
try {
  const parsed = new URL(URL_);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("URL must start with http:// or https://");
} catch (error) {
  console.error(`error: invalid --url: ${error.message}`);
  process.exit(2);
}

const SITE_SLUG = arg(
  "slug",
  (() => {
    try {
      return new URL(URL_).hostname.replace(/^www\./, "").replace(/\./g, "-");
    } catch {
      return "site";
    }
  })()
);
const localDate = (now = new Date()) =>
  new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const localRunId = (now = new Date()) =>
  new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace(/:/g, "");
const RUN_ID = arg("run-id", localRunId());
const OUT = arg("out", path.join(".audit", SITE_SLUG, RUN_ID));
const CITY = arg("city", "");
const TRADE = arg("trade", "");
const SERVICE = arg("service", "");
const numeric = (name, fallback, minimum) => {
  const value = Number(arg(name, fallback));
  return Number.isFinite(value) && value >= minimum ? Math.floor(value) : fallback;
};
const MAX_PAGES = numeric("max-pages", 5, 1);
const WAIT_MS = numeric("wait", 7000, 1000);
const SKIP_LH = Boolean(arg("skip-lighthouse", false));
const LH_RUNS = numeric("lh-runs", 3, 1);
const MAX_HEIGHT = numeric("max-height", 7000, 1000);

function loadConfiguration() {
  const configPath = arg("config");
  let config = {
    preferredLanguages: ["en"],
    optionalChecks: {
      sms: false,
      chat_callback: false,
      after_hours: true,
      licensing: true,
    },
    excludedChecks: [],
  };
  if (configPath && configPath !== true) {
    try {
      const loaded = JSON.parse(fs.readFileSync(path.resolve(configPath), "utf8"));
      config = {
        ...config,
        ...loaded,
        optionalChecks: { ...config.optionalChecks, ...(loaded.optionalChecks || {}) },
      };
    } catch (error) {
      console.error(`error: could not read --config ${configPath}: ${error.message}`);
      process.exit(2);
    }
  }
  const languages = arg("language");
  if (languages && languages !== true) {
    config.preferredLanguages = String(languages)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (config.preferredLanguages.length > 1 && config.optionalChecks.language_access === undefined) {
    config.optionalChecks.language_access = true;
  }
  return config;
}


const OUT_DIR = path.resolve(OUT);
const EVIDENCE = path.join(OUT_DIR, "evidence");
fs.mkdirSync(EVIDENCE, { recursive: true });

const RUBRIC = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "..", "references", "rubric.json"), "utf8"));
const CONFIG = loadConfiguration();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, "0");
const slug = (u) => {
  try {
    const p = new URL(u).pathname.replace(/\/+$/, "");
    if (!p || p === "") return "home";
    return p.split("/").filter(Boolean).pop().replace(/[^a-z0-9-]+/gi, "-").slice(0, 30);
  } catch {
    return "page";
  }
};

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error("Chrome not found. Set CHROME_PATH to a Chrome/Chromium binary.");
}

async function waitForChrome(port, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error(`Chrome did not answer on port ${port}`);
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        pending.get(m.id)(m);
        pending.delete(m.id);
      }
    });
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () => {
      const send = (method, params = {}) =>
        new Promise((res, rej) => {
          const i = ++id;
          pending.set(i, (msg) => {
            if (msg.error) rej(new Error(`${method}: ${msg.error.message}`));
            else res(msg.result);
          });
          ws.send(JSON.stringify({ id: i, method, params }));
        });
      resolve({ ws, send });
    });
  });
}

async function evaluate(send, expression) {
  const res = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    const d = res.exceptionDetails;
    const msg = d.exception?.description || d.exception?.value || d.text || "page evaluation failed";
    throw new Error(msg);
  }
  return res.result?.value;
}

const SIGNALS = `(() => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== "hidden" && s.display !== "none";
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const txt = (el) => (el.innerText || "").trim().replace(/\\s+/g, " ").slice(0, 120);
  const links = [...document.querySelectorAll("a")].filter(vis).map((a) => {
    const r = rect(a);
    return { t: txt(a), h: a.getAttribute("href") || "", x: r.x, y: r.y, w: r.w, height: r.h };
  }).filter((l) => l.t || l.h);

  const tel = links.filter((l) => l.h.startsWith("tel:"));
  const sms = links.filter((l) => l.h.startsWith("sms:"));
  const social = /facebook|instagram|twitter|linkedin|youtube|yelp|google|maps|tiktok/i;
  const book = links.filter((l) => !social.test(l.h) && /book|estimate|schedule|appointment|quote/i.test(l.t + " " + l.h));
  const bookAll = [...document.querySelectorAll("a[href]")].map((a) => ({ t: txt(a), h: a.getAttribute("href") || "" }))
    .filter((l) => !social.test(l.h) && /book|estimate|schedule|appointment|quote/i.test(l.t + " " + l.h));

  const forms = [...document.forms].map((f) => {
    const fields = [...f.querySelectorAll("input,select,textarea")].map((i) => {
      const labelEl = (i.labels && i.labels[0]) || (i.id ? document.querySelector('label[for="' + i.id + '"]') : null);
      return {
        type: i.type,
        name: i.name,
        placeholder: i.placeholder,
        required: !!i.required,
        autocomplete: i.getAttribute("autocomplete") || "",
        hasLabel: !!((labelEl && (labelEl.innerText || "").trim()) || i.getAttribute("aria-label") || i.getAttribute("aria-labelledby")),
        visible: vis(i),
      };
    });
    const submit = [...f.querySelectorAll('button[type="submit"],input[type="submit"],button')].filter(vis);
    return {
      action: f.getAttribute("action") || "",
      method: (f.getAttribute("method") || "get").toLowerCase(),
      fields,
      submitVisible: submit.length > 0,
      submitCount: submit.length,
    };
  });
  const visibleFields = forms.flatMap((f) => f.fields).filter((f) => f.visible && !["hidden", "submit"].includes(f.type));
  const inputTypes = [...new Set(visibleFields.map((f) => f.type))];
  const autocompleteCount = visibleFields.filter((f) => f.autocomplete).length;
  const labelCount = visibleFields.filter((f) => f.hasLabel).length;


  const schema = [];
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    if (o["@type"]) schema.push(...(Array.isArray(o["@type"]) ? o["@type"] : [o["@type"]]));
    for (const v of Object.values(o)) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") walk(v);
    }
  };
  [...document.querySelectorAll('script[type="application/ld+json"]')].forEach((s) => {
    try { walk(JSON.parse(s.textContent)); } catch {}
  });

  const header = document.querySelector("header") || document.body;
  const hEls = [...header.querySelectorAll("a,button,[role='button'],img")].filter(vis)
    .map((el) => ({ el, r: el.getBoundingClientRect() }));
  let headerOverlaps = 0;
  for (let i = 0; i < hEls.length; i++) {
    for (let j = i + 1; j < hEls.length; j++) {
      const a = hEls[i], b = hEls[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ix = Math.max(0, Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left));
      const iy = Math.max(0, Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top));
      const overlap = ix * iy;
      const smaller = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
      if (overlap > 0.2 * smaller && a.r.width > 10 && b.r.width > 10) headerOverlaps++;
    }
  }

  const fixed = [...document.querySelectorAll("*")].filter((el) => {
    const s = getComputedStyle(el);
    return (s.position === "fixed" || s.position === "sticky") && vis(el);
  }).map((el) => ({
    tag: el.tagName, id: el.id, text: txt(el),
    links: [...el.querySelectorAll("a")].filter(vis).map((a) => ({ t: txt(a), h: a.getAttribute("href") || "" }))
  })).filter((f) => f.links.length || f.text).slice(0, 12);

  const tapEls = [...document.querySelectorAll("header a, header button, nav a, nav button, [role='button'], .MOBILE_ACTIONS_MENU a, .MOBILE_ACTIONS_MENU button")].filter(vis);
  const smallTargets = tapEls.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width < 44 || r.height < 44;
  }).length;

  const p = [...document.querySelectorAll("p")].find(vis);
  const bodyText = document.body.innerText.replace(/\\s+/g, " ").trim();
  const html = document.documentElement.innerHTML.slice(0, 250000);
  const scriptText = [...document.scripts].map((s) => s.src || "").join(" ") + " " + html;
  const analytics = [];
  const analyticsPatterns = [
    ["ga4", /gtag\\(|googletagmanager\\.com\\/gtag|google-analytics\\.com\\/g\\/collect/i],
    ["gtm", /googletagmanager\\.com\\/gtm\\.js|GTM-[A-Z0-9]+/i],
    ["google_ads", /googleadservices\\.com|AW-\\d{6,}/i],
    ["meta_pixel", /connect\\.facebook\\.net|fbq\\(/i],
    ["hotjar", /hotjar\\.com/i],
    ["clarity", /clarity\\.ms/i],
    ["matomo", /matomo|piwik/i],
    ["plausible", /plausible\\.io/i],
  ];
  for (const [name, re] of analyticsPatterns) if (re.test(scriptText)) analytics.push(name);

  const chatWidgets = [];
  const chatPatterns = [
    ["tawk", /tawk\\.to/i],
    ["drift", /drift\\.com/i],
    ["intercom", /intercom/i],
    ["livechat", /livechat|livechatinc/i],
    ["podium", /podium\\.com/i],
    ["olark", /olark/i],
    ["crisp", /crisp\\.chat/i],
    ["zendesk", /zendesk|zopim/i],
    ["hubspot", /hubspot/i],
    ["servicetitan", /servicetitan/i],
  ];
  for (const [name, re] of chatPatterns) if (re.test(scriptText)) chatWidgets.push(name);
  const hreflang = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute("hreflang"));
  const spanishLinks = links.filter((l) => /(^|\\/)es(\\/|$)/i.test(l.h) || /espa[nñ]ol/i.test(l.t));
  const ctaAboveFold = links.filter((l) => l.y < innerHeight && /call|book|estimate|quote|schedule|contact/i.test(l.t + " " + l.h)).slice(0, 6);
  const aboveFold = [...document.querySelectorAll("h1,h2,h3,p,a,button")].filter(vis).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.top < innerHeight && r.left < innerWidth && r.width > 20;
  }).map((el) => txt(el)).filter(Boolean).slice(0, 20);
  const clipped = [...document.querySelectorAll("h1,h2,h3,p,li,form,input,button")].filter(vis).filter((el) => {
    const r = el.getBoundingClientRect();
    return txt(el).length > 0 && r.left < innerWidth - 2 && r.right > innerWidth + 4 && r.width > 20;
  }).map((el) => ({ tag: el.tagName, text: txt(el).slice(0, 60), right: Math.round(el.getBoundingClientRect().right) })).slice(0, 10);

  const ratingMatch = bodyText.match(/([0-5](?:\\.\\d)?)\\s*(?:stars?|\\/\\s*5)/i);
  const reviewCountMatch = bodyText.match(/(\\d[\\d,]*)\\+?\\s*(?:reviews?|ratings?)/i);
  const externalReviewLink = links.find((l) => /google\\.com\\/maps|g\\.page|yelp\\.com|facebook\\.com\\/.*reviews|trustpilot/i.test(l.h));
  const phoneHits = [...new Set((bodyText.match(/(?:\\+?1[\\s.-]?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}/g) || []))].slice(0, 6);
  const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
  const robotsMeta = document.querySelector('meta[name="robots"]')?.content || "";
  const hasHours = /(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\\s*[-–]\\s*(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*|\\d{1,2}\\s*(?:am|pm)\\s*[-–]\\s*\\d{1,2}\\s*(?:am|pm)|open\\s+24|24\\/7/i.test(bodyText);
  const hasEmergency = /emergency|after[- ]hours|24\\/7|same[- ]day|urgent/i.test(bodyText);
  const hasResponsePromise = /(?:within|in)\\s+\\d+\\s*(?:min|minutes|hour|hours)|call\\s*back|response\\s*time|we(?:'| wi)ll (?:call|text|contact)/i.test(bodyText);
  const hasLicensing = /licen[cs]e|insured|bonded|certified|manufacturer/i.test(bodyText);
  const hasVideo = /<video|youtube\\.com\\/embed|player\\.vimeo|wistia/i.test(html);
  const hasTiers = /\\b(?:standard|premium|vip|package|tier)\\b/i.test(bodyText);
  const hasPriority = /\\b(?:priority|same[- ]day|expedited)\\b/i.test(bodyText);
  const hasPriceList = /\\b(?:pricing|price list|our prices|starting at|starting from)\\b/i.test(bodyText);
  const hasLeadMagnet = /\\b(?:inspection|checklist|guide|free estimate|free quote)\\b/i.test(bodyText);
  const hasReferral = /\\b(?:refer|referral|friend)\\b/i.test(bodyText);
  const navLinks = [...document.querySelectorAll("nav a, header a")].filter(vis).map((a) => ({ t: txt(a), h: a.getAttribute("href") || "" })).slice(0, 40);

  return {
    url: location.href,
    title: document.title,
    meta: document.querySelector('meta[name="description"]')?.content || "",
    h1: [...document.querySelectorAll("h1")].map(txt),
    h2: [...document.querySelectorAll("h2")].map(txt).slice(0, 20),
    lang: document.documentElement.lang || "",
    canonical,
    robotsMeta,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.content || "",
    innerWidth, innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    bodyFont: p ? getComputedStyle(p).fontSize : "",
    bodyText: bodyText.slice(0, 5000),
    links: links.slice(0, 160),
    navLinks,
    tel, sms, book, bookAll,
    phoneHits,
    forms,
    inputTypes,
    autocompleteCount,
    labelCount,
    visibleFieldCount: visibleFields.length,
    schema: [...new Set(schema)],
    reviewWidget: !!document.querySelector('[class*="review"],[id*="review"],iframe[src*="review"],script[src*="review"]'),
    rating: ratingMatch ? ratingMatch[1] : "",
    reviewCount: reviewCountMatch ? reviewCountMatch[1] : "",
    externalReviewLink: externalReviewLink ? externalReviewLink.h : "",
    gbpLink: links.find((l) => /google\\.com\\/maps|g\\.page|business\\.google/i.test(l.h))?.h || "",
    analytics,
    chatWidgets,
    fixed,
    headerOverlaps,
    smallTargets,
    ctaAboveFold,
    aboveFold,
    clipped,
    spanishText: /espa[nñ]ol|se habla|hablamos espa/i.test(bodyText),
    spanishLinks: spanishLinks.slice(0, 10),
    hreflang,
    images: document.querySelectorAll("img").length,
    lazyImages: document.querySelectorAll('img[loading="lazy"]').length,
    priceHits: [...new Set((bodyText.match(/\\$\\s?\\d[\\d,]*/g) || []))].slice(0, 12),
    hasFinancing: /financ|monthly payment|payment plan|\b0%\s*(apr|financ|interest)/i.test(bodyText),
    hasWarranty: /warrant|guarantee/i.test(bodyText),
    hasReviews: /review|testimonial|rating/i.test(bodyText),
    hasMembership: /maintenance|membership|annual plan/i.test(bodyText),
    hasHours,
    hasEmergency,
    hasResponsePromise,
    hasLicensing,
    hasVideo,
    hasTiers,
    hasPriority,
    hasPriceList,
    hasLeadMagnet,
    hasReferral,
    htmlLength: html.length,
    jsErrors: (window.__auditErrors || []).slice(0, 20),
  };
})()`;

async function discoverPages(url, maxPages) {
  const origin = new URL(url).origin;
  const found = [];
  const add = (u) => {
    try {
      const x = new URL(u, url);
      if (x.origin !== origin) return;
      if (!/^https?:$/.test(x.protocol)) return;
      if (/\.(png|jpe?g|webp|gif|svg|pdf|zip|mp4|mp3|css|js|ico|xml)$/i.test(x.pathname)) return;
      x.hash = "";
      if (!found.includes(x.href)) found.push(x.href);
    } catch {}
  };

  add(url);

  for (const sm of ["/sitemap.xml", "/pages-sitemap.xml"]) {
    try {
      const r = await fetch(new URL(sm, url));
      if (!r.ok) continue;
      const xml = await r.text();
      const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      const childSitemaps = locs.filter((l) => l.endsWith(".xml"));
      locs.filter((l) => !l.endsWith(".xml")).forEach(add);
      for (const child of childSitemaps.slice(0, 3)) {
        try {
          if (new URL(child).origin !== origin) continue;
          const cr = await fetch(child);
          const cxml = await cr.text();
          [...cxml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).forEach(add);
        } catch {}
      }
    } catch {}
  }

  try {
    const r = await fetch(url);
    const html = await r.text();
    for (const m of html.matchAll(/href=["']([^"'#]+)["']/g)) add(m[1]);
  } catch {}

  const priority = (u) => {
    const url = new URL(u);
    const s = url.pathname.toLowerCase().replace(/\.(?:html?|php|aspx?)$/, "");
    const segs = s.split("/").filter(Boolean);
    let score = 0;
    if (/\/blog\//.test(s)) score -= 10;
    if (segs.length > 2) score -= 4;
    if (segs[0] && segs[0].length > 30) score -= 4;
    if (/^\/(financing|reviews|special-offers|offers|areas-served|service-areas|faqs?|frequently-asked-questions|guarantees?|warrant(y|ies)|membership|maintenance-plans?|smartmember|free-quote|quote|estimate)\/?$/.test(s)) score += 9;
    if (/^\/(why-lloyd|about|about-us|testimonials|pricing|specials|all-locations|locations)\/?$/.test(s)) score += 7;
    if (/^\/(ants|roaches|mosquitoes|spiders|bees-wasps|rodents|termites|bed-bugs|fleas|termite-control|pest-control)\/?$/.test(s)) score += 8;
    if (SERVICE) {
      const stem = SERVICE.toLowerCase().replace(/(ing|ers?|s)$/i, "");
      if (stem && s.includes(stem)) score += 3;
    }
    if (/^\/termite-control\/[^/]+\/?$/.test(s)) score += 6;
    if (/^\/(plumbing|heating|cooling|hvac|electrical|drain|sewer|water-heater|indoor-air-quality)\/?$/.test(s)) score += 8;
    if (/^\/services\/(plumbing|heating|heating-services|air-conditioning|electrical|drain|sewer|water-heater|indoor-air-quality)\/?$/.test(s)) score += 8;
    if (/^\/(garage-doors?|garage-door-repair|garage-door-spring-repair|garage-door-openers?|garage-door-opener-repair|gallery)\/?$/.test(s)) score += 8;
    if (/\/(contact|contact-us|estimate|book|schedule|quote)(\/|$)/.test(s)) score += 6;
    if (/^\/(about|about-us|pricing)\/?$/.test(s)) score += 3;
    if (/^\/locations\/[^/]+\/?$/.test(s)) score += 2;
    if (score && s.includes("/page")) score -= 1;
    return score;
  };

  const home = new URL(url).href;
  const norm = (u) => u.replace(/\/+$/, "");
  const rest = [...found]
    .filter((u) => norm(u) !== norm(home))
    .sort((a, b) => priority(b) - priority(a))
    .slice(0, Math.max(0, maxPages - 1));
  // Always include a contact/estimate/book page; it carries NAP and the form.
  const contactRank = (u) => {
    const p = new URL(u).pathname.toLowerCase().replace(/\.(?:html?|php|aspx?)$/, "");
    if (/^\/contact(-us)?\/?$/.test(p)) return 0;
    if (/free-quote/.test(p)) return 1;
    if (/quote|estimate/.test(p)) return 2;
    return 3;
  };
  const contactUrl = found
    .filter((u) => {
      try {
        const pathname = new URL(u).pathname.toLowerCase().replace(/\.(?:html?|php|aspx?)$/, "");
        return /\/(contact|contact-us|estimate|book|schedule|quote|free-quote)(\/|$)/i.test(pathname) && norm(u) !== norm(home);
      } catch { return false; }
    })
    .sort((a, b) => contactRank(a) - contactRank(b))[0];
  if (contactUrl && !rest.some((u) => norm(u) === norm(contactUrl))) {
    if (rest.length) rest[rest.length - 1] = contactUrl;
    else rest.push(contactUrl);
  }
  return [home, ...rest];
}

async function capture(send, file, fullPage) {
  if (!fullPage) {
    const r = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(file, Buffer.from(r.data, "base64"));
    return;
  }
  const metrics = await send("Page.getLayoutMetrics");
  const size = metrics.cssContentSize || metrics.contentSize;
  const width = Math.min(Math.ceil(size.width), 2000);
  const height = Math.min(Math.ceil(size.height), MAX_HEIGHT);
  const r = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  });
  fs.writeFileSync(file, Buffer.from(r.data, "base64"));
}

async function runLighthouse(url, outDir, runs) {
  const results = [];
  for (let i = 1; i <= runs; i++) {
    const outFile = path.join(outDir, `lighthouse-mobile-${i}.json`);
    const base = [
      url,
      "--only-categories=performance,seo,accessibility,best-practices",
      "--form-factor=mobile",
      "--screenEmulation.mobile",
      "--throttling-method=simulate",
      "--chrome-flags=--headless=new --no-sandbox",
      "--output=json",
      `--output-path=${outFile}`,
      "--quiet",
    ];
    let report = null;
    for (const cmd of [["npx", ["--no-install", "lighthouse", ...base]], ["npx", ["lighthouse", ...base]]]) {
      try {
        execFileSync(cmd[0], cmd[1], { stdio: "ignore", timeout: 240000 });
        report = JSON.parse(fs.readFileSync(outFile, "utf8"));
        break;
      } catch {}
    }
    if (report) {
      results.push({
        run: i,
        path: path.basename(outFile),
        lcp_ms: report.audits?.["largest-contentful-paint"]?.numericValue ?? null,
        cls: report.audits?.["cumulative-layout-shift"]?.numericValue ?? null,
        ttfb_ms: report.audits?.["server-response-time"]?.numericValue ?? null,
        tbt_ms: report.audits?.["total-blocking-time"]?.numericValue ?? null,
        inp_ms: report.audits?.["interaction-to-next-paint"]?.numericValue ?? null,
        performance: Math.round((report.categories?.performance?.score || 0) * 100),
      });
    }
  }
  const lcps = results.map((r) => r.lcp_ms).filter((n) => typeof n === "number").sort((a, b) => a - b);
  const median = lcps.length
    ? lcps.length % 2
      ? lcps[(lcps.length - 1) / 2]
      : (lcps[lcps.length / 2 - 1] + lcps[lcps.length / 2]) / 2
    : null;
  return { runs: results, lcp_ms: median, raw_lcps: lcps };
}

function isApplicable(item) {
  const level = item.applicability || "required";
  if (level === "required") return { applicable: true, reason: "" };
  if (level === "recommended") {
    if ((CONFIG.excludedChecks || []).includes(item.id)) {
      return { applicable: false, reason: "excluded by configuration.excludedChecks" };
    }
    return { applicable: true, reason: "" };
  }
  const module = item.module;
  if (module === "language_access") {
    const languages = CONFIG.preferredLanguages || ["en"];
    const enabled = typeof CONFIG.optionalChecks?.[module] === "boolean"
      ? CONFIG.optionalChecks[module]
      : languages.length > 1;
    return enabled
      ? { applicable: true, reason: "" }
      : { applicable: false, reason: "multilingual access not configured for this market" };
  }
  const enabled = typeof CONFIG.optionalChecks?.[module] === "boolean"
    ? CONFIG.optionalChecks[module]
    : Boolean(item.defaultApplicable);
  return enabled
    ? { applicable: true, reason: "" }
    : { applicable: false, reason: `optional module disabled: ${module || "conditional"}` };
}

function scoreAuto(rubric, mobile, desktop, lcpMs, sitemapOk) {
  const checks = {};
  for (const item of rubric.items) {
    const { applicable, reason } = isApplicable(item);
    checks[item.id] = applicable
      ? { score: null, evidence: [], confidence: null, applicable: true, needs_review: true }
      : {
          score: null,
          evidence: [],
          confidence: "not_applicable",
          applicable: false,
          na_reason: reason,
          needs_review: false,
        };
  }
  const set = (id, score, evidence, confidence = "verified") => {
    if (!checks[id] || !checks[id].applicable) return;
    checks[id] = { score, evidence, confidence, applicable: true, needs_review: false };
  };

  const stickyCall = mobile.fixed.some((f) => f.links.some((l) => l.h.startsWith("tel:")));
  const stickyBook = mobile.fixed.some((f) => f.links.some((l) => /book|estimate|schedule/i.test(l.t + " " + l.h)));
  const telAboveFold = mobile.tel.some((l) => l.y < 900);

  if (telAboveFold) set("RL-CON-02", 3, ["M-01: tel: link visible above the fold"]);
  else if (mobile.tel.length) set("RL-CON-02", 1, ["tel: link exists but is not above the fold on mobile"]);
  else set("RL-CON-02", 0, ["M-01: no tel: link found on mobile"]);

  if (mobile.sms.length) set("RL-CON-03", 1, ["sms: link found on mobile"]);
  else set("RL-CON-03", 0, ["no sms: link found on mobile"]);

  const forms = mobile.forms || [];
  const leadForms = forms.filter((f) =>
    (f.fields || []).some((x) =>
      x.visible &&
      !["hidden", "submit"].includes(x.type) &&
      (/name|phone|email|zip|postal|service|message|problem/i.test(`${x.name || ""} ${x.placeholder || ""}`) ||
        ["tel", "email"].includes(x.type))
    )
  );
  const visibleFields = leadForms.reduce(
    (sum, f) => sum + f.fields.filter((x) => x.visible && !["hidden", "submit"].includes(x.type)).length,
    0
  );
  if (leadForms.length) {
    const friction = visibleFields <= 5 ? 3 : visibleFields <= 8 ? 2 : 1;
    set("RL-CON-05", friction, [`mobile form: ${visibleFields} visible fields`]);
    const issues = [];
    if ((mobile.labelCount || 0) < visibleFields) issues.push("missing labels");
    if (!leadForms.some((f) => f.submitVisible)) issues.push("submit not visible");
    if ((mobile.autocompleteCount || 0) === 0 && visibleFields >= 2) issues.push("no autocomplete");
    if (!(mobile.inputTypes || []).some((t) => ["tel", "email"].includes(t)) && visibleFields >= 2) issues.push("no tel/email input type");
    set("RL-CON-06", issues.length === 0 ? 3 : issues.length === 1 ? 1 : 0,
      [`form usability: ${issues.join("; ") || "labels, input types, autocomplete, submit present"}`]);
  }

  if (mobile.chatWidgets && mobile.chatWidgets.length) {
    set("RL-CON-09", 1, [`chat/widget detected: ${mobile.chatWidgets.join(", ")}`]);
  } else {
    set("RL-CON-09", 0, ["no chat or callback widget detected"]);
  }

  if (typeof lcpMs === "number") {
    set("RL-MOB-01", lcpMs <= 2500 ? 4 : lcpMs <= 4000 ? 2 : 0, [
      `Lighthouse mobile LCP ${Math.round(lcpMs)} ms (median)`,
    ]);
  }

  let mobileFails = 0;
  const failNotes = [];
  const vw = Number((mobile.viewportMeta.match(/width\s*=\s*(\d+)/i) || [])[1] || 0);
  if (vw && vw < 360) { mobileFails++; failNotes.push(`viewport width=${vw}`); }
  if (parseFloat(mobile.bodyFont) && parseFloat(mobile.bodyFont) < 16) { mobileFails++; failNotes.push(`body font ${mobile.bodyFont}`); }
  if (mobile.scrollWidth > mobile.innerWidth + 2) { mobileFails++; failNotes.push(`horizontal scroll ${mobile.scrollWidth}>${mobile.innerWidth}`); }
  if (mobile.smallTargets > 2) { mobileFails++; failNotes.push(`${mobile.smallTargets} small tap targets`); }
  if ((mobile.clipped || []).length >= 2) { mobileFails++; failNotes.push(`${mobile.clipped.length} clipped elements`); }
  set("RL-MOB-02", mobileFails === 0 ? 4 : mobileFails === 1 ? 2 : mobileFails === 2 ? 1 : 0,
    [failNotes.join("; ") || "no mobile layout failures"]);

  const tapScore = mobile.smallTargets <= 2 && (stickyCall || stickyBook) ? 3
    : mobile.smallTargets <= 2 || (stickyCall || stickyBook) ? 2
    : 1;
  set("RL-MOB-03", tapScore, [
    `sticky call ${stickyCall}, sticky book ${stickyBook}, small targets ${mobile.smallTargets}`,
  ]);

  set("RL-MOB-04", URL_.startsWith("https://") && String(mobile.url).startsWith("https://") ? 1 : 0, [
    `page URL ${mobile.url}`,
  ]);

  const languageCodes = (CONFIG.preferredLanguages || ["en"]).filter((l) => l !== "en");
  if (languageCodes.length) {
    const found = languageCodes.some((code) =>
      (mobile.hreflang || []).includes(code) ||
      (mobile.links || []).some((l) => new RegExp(`/${code}(/|$)`, "i").test(l.h)) ||
      (code === "es" && mobile.spanishText)
    );
    const notice = /espa[nñ]ol|se habla|hablamos/i.test(mobile.bodyText || "");
    set("RL-UND-08", found ? 2 : notice ? 1 : 0, [
      `preferred languages: ${languageCodes.join(", ")}; path found ${found}; notice ${notice}`,
    ]);
  }

  if (CITY) {
    const stem = SERVICE ? SERVICE.replace(/(ing|ers?|s)$/i, "") : "";
    const serviceRe = SERVICE ? new RegExp(stem || SERVICE, "i") : /roof|hvac|plumb|pest|garage|landscap|clean|restor|mov/i;
    const cityStem = CITY.split(",")[0].trim();
    const cityRe = new RegExp(cityStem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const hits = [
      serviceRe.test(mobile.title) && cityRe.test(mobile.title),
      serviceRe.test(mobile.meta) && cityRe.test(mobile.meta),
      (mobile.h1 || []).some((h) => serviceRe.test(h) && cityRe.test(h)),
    ].filter(Boolean).length;
    set("RL-FND-01", hits === 3 ? 3 : hits === 2 ? 2 : hits === 1 ? 1 : 0, [
      `title: ${mobile.title}`,
      `meta: ${mobile.meta}`,
      `h1: ${(mobile.h1 || []).join(" | ")}`,
    ]);
  }

  const robotsBlocked = /noindex/i.test(mobile.robotsMeta || "");
  const indexSignals = [Boolean(mobile.canonical), !robotsBlocked, Boolean(sitemapOk)].filter(Boolean).length;
  set("RL-FND-02", robotsBlocked ? 0 : indexSignals === 3 ? 2 : indexSignals >= 1 ? 1 : 0, [
    `canonical ${Boolean(mobile.canonical)}, robots ${mobile.robotsMeta || "none"}, sitemap ${Boolean(sitemapOk)}`,
  ]);

  const localSchema = (mobile.schema || []).some((t) => /LocalBusiness|Service|Contractor|RoofingContractor|Plumber|HVACBusiness/i.test(t));
  const nap = (mobile.phoneHits || []).length > 0;
  set("RL-FND-03", localSchema && nap ? 2 : localSchema || nap ? 1 : 0, [
    `local schema ${localSchema}, visible phone ${nap}`,
  ]);

  const analytics = mobile.analytics || [];
  const hasGeneralAnalytics = analytics.includes("ga4") || analytics.includes("gtm");
  set("RL-MSR-01", hasGeneralAnalytics ? 2 : analytics.length ? 1 : 0, [
    `analytics: ${analytics.join(", ") || "none"}`,
  ]);
  const paidSignals = analytics.includes("google_ads") || analytics.includes("meta_pixel");
  set("RL-MSR-02", paidSignals && hasGeneralAnalytics ? 2 : paidSignals || hasGeneralAnalytics ? 1 : 0, [
    `conversion/ads signals: ${analytics.join(", ") || "none"}`,
  ]);

  if (mobile.hasHours && mobile.hasEmergency) {
    set("RL-RSP-02", 2, ["hours and emergency/after-hours language visible"]);
  } else if (mobile.hasHours || mobile.hasEmergency) {
    set("RL-RSP-02", 1, ["hours or emergency language visible, not both"]);
  } else {
    set("RL-RSP-02", 0, ["no hours or after-hours path detected"]);
  }

  if (mobile.hasLicensing) {
    set("RL-TRU-04", 1, ["license, insurance, or certification language visible; count and specificity need review"]);
  } else {
    set("RL-TRU-04", 0, ["no license, insurance, or certification language visible"]);
  }

  return checks;
}

function pageType(url) {
  const p = new URL(url).pathname.toLowerCase().replace(/\.(?:html?|php|aspx?)$/, "");
  if (!p || p === "/") return "home";
  if (/\/(contact|contact-us|estimate|book|schedule|quote|free-quote|scorecard)(\/|$)/.test(p)) return "contact";
  if (/financ/.test(p)) return "financing";
  if (/review|testimonial/.test(p)) return "reviews";
  if (/family-plan|membership/.test(p)) return "plan";
  if (/offer|coupon/.test(p)) return "offers";
  if (/about|team|story|why-lloyd/.test(p)) return "about";
  if (/gallery|project|photo/.test(p)) return "gallery";
  if (/gallery|project|before-after/.test(p)) return "gallery";
  if (/roof|repair|install|replacement|re-roof|service|plumb|hvac|heat|cool|electric|drain|sewer|water-heater|air-quality|areas-served|locations|garage|door|opener|pest|termite|ant|roach|rodent|mosquito|spider|bee|wasp|flea/.test(p)) return "service";
  return "other";
}

// ---- run ----

const port = 9300 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-audit-"));
let chrome;
try {
  chrome = spawn(findChrome(), [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-sync",
    "--mute-audio",
    "--hide-scrollbars",
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    "--window-size=1440,900",
    "about:blank",
  ], { stdio: "ignore" });
} catch (error) {
  console.error(`error: ${error.message}`);
  console.error("Install Chrome/Chromium or set CHROME_PATH, then retry.");
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(1);
}

let cdp;
try {
  await waitForChrome(port);
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = tabs.find((t) => t.type === "page");
  if (!page) throw new Error("no page target");
  cdp = await connect(page.webSocketDebuggerUrl);
  const { send } = cdp;

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  try {
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: "window.__auditErrors=[];window.addEventListener('error',e=>window.__auditErrors.push(String(e.message||e.error||'script error')));window.addEventListener('unhandledrejection',e=>window.__auditErrors.push(String(e.reason||'unhandled rejection')));",
    });
  } catch {}

  const pages = await discoverPages(URL_, MAX_PAGES);
  const manifest = {
    run_id: RUN_ID,
    schema_version: "2.0",
    framework: "revenue-leak",
    rubric_version: RUBRIC.version,
    collector_version: COLLECTOR_VERSION,
    url: URL_,
    started_at: new Date().toISOString(),
    run_timestamp: new Date().toISOString(),
    city: CITY,
    trade: TRADE,
    service: SERVICE,
    max_pages: MAX_PAGES,
    configuration: CONFIG,
    pages,
    viewports: { desktop: "1440x900", mobile: "390x844 (mobile UA)" },
  };

  const passes = {};
  for (const vp of [
    { name: "mobile", w: 390, h: 844, ua: MOBILE_UA, mobile: true, prefix: "m" },
    { name: "desktop", w: 1440, h: 900, ua: DESKTOP_UA, mobile: false, prefix: "d" },
  ]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.mobile,
      screenWidth: vp.w, screenHeight: vp.h,
    });
    await send("Emulation.setTouchEmulationEnabled", { enabled: vp.mobile, maxTouchPoints: 5 });
    await send("Network.setUserAgentOverride", { userAgent: vp.ua });

    const collected = [];
    for (let i = 0; i < pages.length; i++) {
      const shot = `${vp.prefix.toUpperCase()}-${pad(i + 1)}`;
      const base = path.join(EVIDENCE, `${vp.prefix}-${pad(i + 1)}-${slug(pages[i])}`);
      let sig;
      try {
        await send("Page.navigate", { url: pages[i] });
        await sleep(WAIT_MS);
        sig = await evaluate(send, SIGNALS);
        await capture(send, `${base}.png`, false);
        if (i === 0) await capture(send, `${base}-full.png`, true);
      } catch (error) {
        sig = {
          url: pages[i],
          error: String(error).slice(0, 400),
          title: "",
          meta: "",
          h1: [],
          h2: [],
          bodyText: "",
          links: [],
          tel: [],
          sms: [],
          book: [],
          bookAll: [],
          forms: [],
          fixed: [],
          schema: [],
          analytics: [],
          chatWidgets: [],
          clipped: [],
          phoneHits: [],
          jsErrors: [],
          innerWidth: vp.w,
          scrollWidth: vp.w,
          smallTargets: 0,
          headerOverlaps: 0,
        };
      }
      sig.index = i + 1;
      sig.shot = shot;
      collected.push(sig);
    }
    passes[vp.name] = collected;
  }

  // Scheduler / primary CTA health (mobile home).
  const mobileHome = passes.mobile[0];
  const bookCandidates = mobileHome.bookAll || mobileHome.book || [];
  const book =
    bookCandidates.find((b) => /book now|book online|schedule/i.test(b.t || "")) ||
    bookCandidates.find((b) => b.h && !b.h.startsWith("#") && /book|schedule|appointment/i.test(b.h)) ||
    bookCandidates.find((b) => b.h && !b.h.startsWith("#"));

  const readSchedulerState = async () => {
    const s = await evaluate(send, `(() => ({
      text: document.body.innerText.replace(/\\s+/g, " ").slice(-1200),
      forms: document.forms.length,
      iframes: [...document.querySelectorAll("iframe")].map((i) => i.src).filter(Boolean).slice(0, 8)
    }))()`);
    const frame = s.iframes.find((f) => /calendly|jobber|housecall|servicetitan|scheduler|booking|acuity|square|podium|a2o-static|street2fleet|ws-widget/i.test(f));
    const empty = /nothing to book|no availability|check back soon|no services|no appointments/i.test(s.text);
    return {
      state: empty ? "empty" : frame ? "scheduler" : s.forms > 0 ? "form" : "unknown",
      url: frame || null,
      text: s.text.slice(0, 400),
      forms: s.forms,
      iframes: s.iframes,
    };
  };

  let scheduler = { url: null, state: "none", text: "" };
  if (book) {
    try {
      if (book.h && !book.h.startsWith("#") && !book.h.startsWith("javascript")) {
        const bookUrl = new URL(book.h, URL_).href;
        await send("Page.navigate", { url: bookUrl });
        await sleep(WAIT_MS);
        const s = await readSchedulerState();
        scheduler = { ...s, url: s.url || bookUrl };
      } else {
        // Book Now is a JS control (href="#"); open it and look for a scheduler iframe.
        await send("Page.navigate", { url: URL_ });
        await sleep(WAIT_MS);
        const clicked = await evaluate(send, `(() => {
          const el = [...document.querySelectorAll("a,button")].find((e) =>
            /book now|book online|schedule/i.test((e.innerText || "").trim()) && e.offsetParent
          );
          if (!el) return null;
          el.click();
          return (el.innerText || "").trim();
        })()`);
        await sleep(3000);
        const s = await readSchedulerState();
        scheduler = { ...s, clicked, url: s.url || URL_ };
      }
      await capture(send, path.join(EVIDENCE, "m-book.png"), false);
    } catch (e) {
      scheduler = { url: book.h || URL_, state: "error", text: String(e).slice(0, 200) };
    }
  }

  // Lighthouse mobile: run several times and use the median LCP.
  let lh = null;
  if (!SKIP_LH) {
    lh = await runLighthouse(URL_, OUT_DIR, LH_RUNS);
  }
  const lcpMs = lh?.lcp_ms;

  let sitemapOk = false;
  for (const candidate of ["/sitemap.xml", "/sitemap_index.xml", "/pages-sitemap.xml"]) {
    try {
      const response = await fetch(new URL(candidate, URL_));
      if (response.ok) {
        sitemapOk = true;
        break;
      }
    } catch {}
  }
  manifest.sitemap_ok = sitemapOk;

  const checks = scoreAuto(RUBRIC, passes.mobile[0], passes.desktop[0], lcpMs, sitemapOk);

  const anyTel = passes.mobile.some((p) => p.tel.length) || passes.desktop.some((p) => p.tel.length);
  const anyForm = passes.mobile.some((p) => p.forms.length) || passes.desktop.some((p) => p.forms.length);
  const anyChat = passes.mobile.some((p) => (p.chatWidgets || []).length) || passes.desktop.some((p) => (p.chatWidgets || []).length);
  const formUnusable = passes.mobile.some((p) =>
    p.forms.length > 0 && !p.forms.some((f) => f.submitVisible)
  );
  const mobileHomeScroll = (passes.mobile[0].scrollWidth || 0) > (passes.mobile[0].innerWidth || 0) + 2;
  const mobileHomeClipped = (passes.mobile[0].clipped || []).length >= 2;
  const caps = {
    no_contact: !anyTel && !anyForm && !anyChat && !["form", "scheduler"].includes(scheduler.state),
    primary_contact_broken: formUnusable && !anyTel,
    form_unusable: formUnusable,
    booking_failure: scheduler.state === "empty" || scheduler.state === "error",
    mobile_unusable: mobileHomeScroll && (mobileHomeClipped || (passes.mobile[0].headerOverlaps || 0) > 3),
    https_failure: URL_.startsWith("http://") || String(passes.mobile[0].url || "").startsWith("http://"),
    malicious_redirect: false,
    unclear_offer: false,
  };

  const mobilePages = passes.mobile;
  const desktopPages = passes.desktop;
  const financingPage = [...mobilePages, ...desktopPages].find((p) => /financ|monthly payment|payment plan/i.test(p.bodyText || ""));
  const reviewsPage = mobilePages.find((p) => p.reviewWidget || pageType(p.url) === "reviews" || /review|testimonial/i.test(p.bodyText || ""));
  const visibleFields = (p) => (p.forms[0]?.fields || []).filter((f) => !["hidden", "submit"].includes(f.type)).length;
  const formScore = (p) => visibleFields(p) * 2 + (/\/(contact|contact-us|free-quote|quote|estimate)(\/|$)/i.test(p.url) ? 3 : 0);
  const formPage = mobilePages.filter((p) => p.forms.length > 0).sort((a, b) => formScore(b) - formScore(a))[0];
  const shotFor = (p) => (p?.shot ? p.shot : null);

  const siteMap = {
    canonical_url: URL_,
    run_id: RUN_ID,
    generated_at: new Date().toISOString(),
    pages: pages.map((u, i) => ({
      url: u,
      type: pageType(u),
      h1: mobilePages[i]?.h1?.[0] || "",
      screenshot: `M-${pad(i + 1)}`,
    })),
    conversion_paths: [
      { id: "call", label: "Call", selector: "a[href^='tel:']", expected: "tel: link" },
      { id: "text", label: "Text", selector: "a[href^='sms:']", expected: "sms: link" },
      { id: "form", label: "Form", selector: "form", expected: "form with fields" },
      { id: "book", label: "Book / quote", selector: "a[href*='book'], a[href*='estimate'], a[href*='schedule'], a[href*='quote']", expected: "scheduler or form" },
      { id: "estimate", label: "Estimate", selector: "a[href*='estimate'], a[href*='quote']", expected: "estimate request path" },
      { id: "chat", label: "Chat / callback", selector: "chat widget or callback link", expected: "human-backed widget or none" },
      { id: "financing", label: "Financing", selector: "text=/financ|monthly payment|payment plan/i", expected: "financing block or none" },
      { id: "reviews", label: "Reviews", selector: "text=/review|testimonial/i", expected: "reviews page or section" },
    ],
    viewport_notes: {
      mobile: mobileHome.viewportMeta || "390x844",
      desktop: "1440x900",
    },
    page_count: pages.length,
  };

  const pathTraces = [
    {
      id: "call", label: "Call", url: URL_, viewport: "mobile",
      action: "scan for tel: link",
      observed_state: mobileHome.tel.length ? "present" : "absent",
      screenshot: "M-01", submitted: false,
    },
    {
      id: "text", label: "Text", url: URL_, viewport: "mobile",
      action: "scan for sms: link",
      observed_state: mobileHome.sms.length ? "present" : "absent",
      screenshot: "M-01", submitted: false,
    },
    {
      id: "form", label: "Form", url: formPage?.url || URL_, viewport: "mobile",
      action: "load contact/quote page and count visible fields; no submit",
      observed_state: formPage
        ? `form (${(formPage.forms[0]?.fields || []).filter((f) => !["hidden", "submit"].includes(f.type)).length} visible fields)`
        : "none",
      screenshot: shotFor(formPage) || "M-01", submitted: false,
    },
    {
      id: "book", label: "Book / quote", url: scheduler.url || URL_, viewport: "mobile",
      action: "navigate to book/quote path and read state; no submit",
      observed_state: scheduler.state,
      screenshot: scheduler.url ? "m-book.png" : "M-01", submitted: false,
    },
    {
      id: "estimate", label: "Estimate", url: formPage?.url || URL_, viewport: "mobile",
      action: "find estimate/quote request path; no submit",
      observed_state: formPage ? "form" : scheduler.state === "scheduler" ? "scheduler" : "none",
      screenshot: shotFor(formPage) || "M-01", submitted: false,
    },
    {
      id: "chat", label: "Chat / callback", url: URL_, viewport: "mobile",
      action: "detect chat or callback widget; no message sent",
      observed_state: (mobileHome.chatWidgets || []).length ? "present" : "absent",
      screenshot: "M-01", submitted: false,
    },
    {
      id: "financing", label: "Financing", url: financingPage?.url || URL_, viewport: "mobile",
      action: "scan all pages for financing text",
      observed_state: financingPage ? "present" : "none",
      screenshot: shotFor(financingPage) || "M-01", submitted: false,
    },
    {
      id: "reviews", label: "Reviews", url: reviewsPage?.url || URL_, viewport: "mobile",
      action: "find reviews page or testimonial section",
      observed_state: reviewsPage ? (pageType(reviewsPage.url) === "reviews" ? "reviews page" : reviewsPage.reviewWidget ? "widget" : "section") : "none",
      screenshot: shotFor(reviewsPage) || "M-01", submitted: false,
    },
  ];

  const audit = {
    schema_version: "2.0",
    framework: "revenue-leak",
    meta: {
      client: arg("client", new URL(URL_).hostname.replace(/^www\./, "")),
      slug: arg("slug", new URL(URL_).hostname.replace(/^www\./, "").replace(/\./g, "-")),
      url: URL_,
      date: arg("date", localDate()),
      city: CITY,
      trade: TRADE,
      service: SERVICE,
      generated_at: new Date().toISOString(),
      run_timestamp: manifest.started_at,
      run_id: RUN_ID,
      rubric_version: RUBRIC.version,
      collector: "collect.mjs",
      collector_version: COLLECTOR_VERSION,
      configuration: CONFIG,
      lighthouse: lh ? `mobile x${lh.runs.length} median` : "skipped",
    },
    pages,
    scheduler,
    signals: { mobile: passes.mobile, desktop: passes.desktop },
    checks,
    caps,
    topLeaks: [],
    ownerData: [],
  };

  fs.writeFileSync(path.join(OUT_DIR, "audit.json"), JSON.stringify(audit, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "site-map.json"), JSON.stringify(siteMap, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "paths.json"), JSON.stringify({ run_id: RUN_ID, paths: pathTraces }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "run.json"), JSON.stringify({
    ...manifest,
    finished_at: new Date().toISOString(),
    lighthouse: lh ? { lcp_ms: lcpMs, raw_lcps: lh.raw_lcps, runs: lh.runs } : null,
    scheduler,
    site_map: "site-map.json",
    path_traces: "paths.json",
  }, null, 2));

  const complete = Object.values(checks).filter((c) => c.score !== null).length;
  console.log(JSON.stringify({
    out: OUT_DIR,
    pages: pages.length,
    screenshots: pages.length * 2 + 1,
    auto_scored: `${complete}/${RUBRIC.items.length}`,
    scheduler: scheduler.state,
    lcp_ms: lcpMs ? Math.round(lcpMs) : null,
    caps: Object.entries(caps).filter(([, v]) => v).map(([k]) => k),
  }, null, 2));
} catch (error) {
  console.error(`error: collection failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  try { cdp?.ws.close(); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 }); } catch {}
}
