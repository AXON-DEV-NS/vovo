// Smoke check: verifies the app boots and key routes behave.
// Usage: `npm run smoke` (expects dev server on http://localhost:3000,
// or set BASE_URL env var). Exits non-zero on any failure.
const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = [
  { name: "home", path: "/", want: [200] },
  { name: "login", path: "/login", want: [200] },
  { name: "pricing", path: "/pricing", want: [200] },
  { name: "plans api (public)", path: "/api/plans", want: [200] },
  { name: "onboarding state (unauth -> 401)", path: "/api/onboarding/state", want: [401] },
  { name: "analytics api (unauth -> 401)", path: "/api/analytics?channelId=x", want: [401] },
  { name: "scheduling plan (unauth -> 401)", path: "/api/scheduling/plan", want: [401] },
  { name: "knowledge (unauth -> 401)", path: "/api/niche/knowledge?niche=technology", want: [401] },
];

let failed = 0;
for (const c of checks) {
  try {
    const res = await fetch(base + c.path, { redirect: "manual" });
    const ok = c.want.includes(res.status) || (res.status >= 300 && res.status < 400);
    console.log(`${ok ? "PASS" : "FAIL"} ${c.name}: ${res.status}`);
    if (!ok) failed++;
  } catch (err) {
    console.log(`FAIL ${c.name}: ${err.message}`);
    failed++;
  }
}
if (failed > 0) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("All smoke checks passed");
