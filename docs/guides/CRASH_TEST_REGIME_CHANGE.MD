Since this is an MVP, let's keep it simple and not worry about proxy map and caching.

Quick read on your stack (what’s great / what to watch)
	•	✅ Good fit: FastAPI + pandas/numpy is ideal for event-window analytics; Next.js 15 UI can render charts and gated PDFs easily.
	•	⚠️ Add now: a thin price cache (disk or Redis) to avoid Yahoo/AV rate limits; proxy map for mutual funds/illiquid tickers; currency normalization if you ingest non-USD.
	•	⚠️ Decide: total-return proxy = use Adjusted Close (includes splits/dividends on Yahoo) and document limits.
	•	✅ Security: keep session-only by default; persist only lead info + optional snapshot hash when a user opts into email/PDF.

⸻

1) Feature definition

User value: “How would my portfolio have behaved during major stress regimes?”
Core outputs per scenario:
	•	Cumulative return (%), Max Drawdown (peak→trough %), Time to Recovery (days to get back to prior peak), Worst Day/Month, Volatility (ann.), Sharpe-lite (annual excess vs 0% RF by default), and an Underwater chart (peak-to-trough equity curve).
Scenarios (initial set):
	•	Dot-Com Bust (2000-03-24 → 2002-10-09)
	•	GFC (2007-10-09 → 2009-03-09)
	•	Pandemic Crash (2020-02-19 → 2020-03-23)
	•	2022 Rate Shock (2022-01-01 → 2022-10-14)
	•	User-defined custom window (date pickers)

Optional comparators: SPY, AGG, 60/40.

⸻

2) Data flow

Inputs: portfolio [{ticker, weight}], date windows, options (rebalance=none|monthly|quarterly, driftHandling=“freeze”|“renormDaily”).
Fetching: Prefer Yahoo Adjusted Close (pandas_datareader/yfinance). Store normalized daily returns in a local persistent cache keyed by (ticker, span, source_version).
Coverage gaps:
	•	If a ticker lacks full history for a scenario, use daily renormalization (exclude missing, re-scale weights that day) and surface a Coverage % metric per scenario.
	•	Add a proxy map (e.g., VTSAX→VTI; SWTSX→VTI; IXUS→VEA/EEM mix; private/unknown→category ETF). Keep in a JSON next to the service.

⸻

3) Metrics (server)
	•	Daily simple return: r_{i,t} = P_{t}/P_{t-1} - 1 using Adjusted Close.
	•	Portfolio return: r_{p,t} = \sum w_{i,t} \cdot r_{i,t} with daily renorm when some assets missing.
	•	Equity curve: E_t = \prod (1+r_{p,t}).
	•	Max drawdown: track rolling peak of E_t, record min E_t/\text{peak}-1.
	•	Time to recovery: days from trough date to first day E_t ≥ prior peak.
	•	Vol (ann.): \sigma_{ann} = \text{stdev}(r_{p}) \cdot \sqrt{252}.
	•	Worst day/month: min of daily and resampled monthly returns.
	•	Sharpe-lite: \frac{\text{mean}(r_p)\cdot252}{\sigma_{ann}} (RF=0 by default; parameterize later).

⸻

4) FastAPI endpoint

Route: POST /api/crash_test
Request (JSON):

{
  "portfolio": [{"ticker":"VTI","weight":0.5},{"ticker":"VXUS","weight":0.2},{"ticker":"BND","weight":0.3}],
  "scenarios": [
    {"id":"gfc","label":"Global Financial Crisis","start":"2007-10-09","end":"2009-03-09"}
  ],
  "options": {
    "rebalance": "none",
    "driftHandling": "renormDaily",
    "currency": "USD",
    "benchmarks": ["SPY","AGG","60_40"]
  }
}

Response (JSON):

{
  "portfolioCoverage": {"overall": 0.98, "byTicker": {"VXUS": 0.95, "BND": 1.0}},
  "scenarios": [
    {
      "id":"gfc",
      "metrics":{
        "cumReturnPct": -38.4,
        "maxDrawdownPct": -45.2,
        "timeToRecoveryDays": 410,
        "worstDayPct": -7.3,
        "worstMonthPct": -16.9,
        "annVolPct": 22.1,
        "sharpeLite": -0.7
      },
      "series":{
        "dates":["2007-10-09", "..."],
        "equity":[1.0, 0.997, "..."],           // normalized to 1.0
        "drawdown":[0.0, -0.3, "..."]           // underwater curve
      },
      "coveragePct": 0.97
    }
  ],
  "benchmarks": { "SPY": {...}, "AGG": {...}, "60_40": {...} }
}

Server structure (Python 3.13 / FastAPI):
	•	services/prices.py → fetch + cache adjusted closes; simple local SQLite/parquet cache via fastparquet or pyarrow.
	•	services/portfolio.py → align & compute portfolio returns, renorm logic, optional calendar rebalancing.
	•	services/metrics.py → drawdown, recovery, worst day/month, vol, sharpe.
	•	routers/crash_test.py → request validation (Pydantic v2), orchestration, response DTO.

Skeleton (key bits):

# services/metrics.py
import numpy as np
import pandas as pd

def equity_curve(returns: pd.Series) -> pd.Series:
    return (1 + returns.fillna(0)).cumprod()

def max_drawdown(equity: pd.Series):
    peaks = equity.cummax()
    dd = equity / peaks - 1.0
    mdd = dd.min()
    trough_date = dd.idxmin()
    peak_before = peaks.loc[:trough_date].idxmax()
    # recovery
    rec_idx = equity.loc[trough_date:].ge(peaks.loc[peak_before]).idxmax()
    recovered = equity.loc[rec_idx] >= peaks.loc[peak_before]
    rec_days = int((rec_idx - trough_date).days) if recovered else None
    return float(mdd), rec_days, dd

def worst_periods(returns: pd.Series):
    worst_day = float(returns.min())
    worst_month = float(returns.resample('M').apply(lambda x: (1+x).prod()-1).min())
    return worst_day, worst_month


⸻

5) Frontend (Next.js 15) wiring

Components:
	•	CrashTestPanel (new) under your PortfolioResults area.
	•	Scenario cards (GFC, Pandemic, 2022, Dot-Com) with metrics badges.
	•	Underwater chart (line chart of drawdown); Equity curve toggle.
	•	Coverage chip (e.g., “97% history coverage”).
	•	CTA: “Email me the full Crash Test PDF” → lead gate.

Types (TS):

export type CrashMetrics = {
  cumReturnPct:number; maxDrawdownPct:number; timeToRecoveryDays:number|null;
  worstDayPct:number; worstMonthPct:number; annVolPct:number; sharpeLite:number;
};
export type CrashScenarioResult = {
  id:string; metrics:CrashMetrics;
  series:{ dates:string[]; equity:number[]; drawdown:number[] };
  coveragePct:number;
};

API call (client):

const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crash_test`, {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify(payload)
});
const data: { scenarios: CrashScenarioResult[]; benchmarks: Record<string,CrashScenarioResult> } = await res.json();

Charts: Use your existing chart lib (e.g., Recharts/Visx). One chart per view. Add a small “?” tooltip explaining each metric.

⸻

6) Lead magnet + PDF
	•	Gate the full per-scenario breakdown + benchmark comparison table + monthly returns heatmap behind name/email.
	•	PDF generation:
	•	Easiest: HTML page → server print (Puppeteer) on the Next.js server; or use @react-pdf/renderer.
	•	Include: scenario summary grid, underwater charts (sparklines), benchmark compare, coverage notes, simple glossary.
	•	Submission flow:
	•	POST /api/leads (Next.js route or Supabase Edge Function) stores {email, name, snapshot_id, consent}.
	•	Send email with attached PDF (Resend/SendGrid).
	•	Snapshot ID: hash of {portfolio, scenarios, options, timestamp} so you can regenerate or reference later.

⸻

7) Performance & caching
	•	Warm cache: prefetch SPY/AGG/VTI/VXUS/BND for 25y daily.
	•	Parquet store keyed by ticker; append daily.
	•	Concurrency: use async fetches; bound with a semaphore to avoid hitting provider limits.
	•	Memoize scenario results by (portfolio hash, scenario id, options).

⸻

8) Edge cases to handle
	•	Tickers with inception after scenario start → renorm daily, flag lower coverage.
	•	Leveraged/inverse ETFs → label as such and warn; still compute.
	•	Non-trading days/timezones → left-join to a standard US trading calendar.
	•	SnapTrade holdings with fractional shares → convert to weights on the fly.

⸻

9) QA & acceptance
	•	Golden tests: verify SPY GFC max drawdown ballpark (~-55%) and recovery length is sensible; verify underwater curve monotonicity logic.
	•	Contract tests for the API.
	•	UI tests: scenario selection, coverage badges, and PDF download.