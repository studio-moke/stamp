import crypto from 'node:crypto';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

function send(res, status, body) {
  res.status(status).setHeader('Content-Type', JSON_HEADERS['Content-Type']).setHeader('Cache-Control', 'no-store').json(body);
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getGoogleAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !privateKey) throw new Error('Google service account credentials are not configured');

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey);
  const assertion = `${unsigned}.${base64url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed: ${response.status}`);
  const data = await response.json();
  return data.access_token;
}

function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function searchConsole(accessToken, startDate, endDate) {
  const property = process.env.SEARCH_CONSOLE_PROPERTY || 'sc-domain:stamp-moke.jp';
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
  const body = {
    startDate,
    endDate,
    dimensions: ['query', 'page'],
    rowLimit: 25000,
    dataState: 'all',
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Search Console API failed: ${response.status} ${text.slice(0, 250)}`);
  }
  const data = await response.json();
  return (data.rows || []).map((row) => ({
    query: row.keys?.[0] || '',
    page: row.keys?.[1] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

async function ga4Sources(accessToken, startDate, endDate) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return { configured: false, rows: [] };
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSourceMedium' }, { name: 'landingPagePlusQueryString' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagedSessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: '500',
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GA4 Data API failed: ${response.status} ${text.slice(0, 250)}`);
  }
  const data = await response.json();
  return {
    configured: true,
    rows: (data.rows || []).map((row) => ({
      sourceMedium: row.dimensionValues?.[0]?.value || '(unknown)',
      landingPage: row.dimensionValues?.[1]?.value || '/',
      sessions: Number(row.metricValues?.[0]?.value || 0),
      users: Number(row.metricValues?.[1]?.value || 0),
      engagedSessions: Number(row.metricValues?.[2]?.value || 0),
    })),
  };
}

function aggregateQueries(rows) {
  const map = new Map();
  for (const row of rows) {
    const current = map.get(row.query) || { query: row.query, clicks: 0, impressions: 0, weightedPosition: 0, pages: new Map() };
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    current.weightedPosition += row.position * Math.max(row.impressions, 1);
    const pageStats = current.pages.get(row.page) || { page: row.page, clicks: 0, impressions: 0 };
    pageStats.clicks += row.clicks;
    pageStats.impressions += row.impressions;
    current.pages.set(row.page, pageStats);
    map.set(row.query, current);
  }
  return [...map.values()].map((item) => {
    const pages = [...item.pages.values()].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
    return {
      query: item.query,
      clicks: item.clicks,
      impressions: item.impressions,
      ctr: item.impressions ? item.clicks / item.impressions : 0,
      position: item.impressions ? item.weightedPosition / item.impressions : 0,
      page: pages[0]?.page || '',
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  const configuredToken = process.env.ANALYTICS_ADMIN_TOKEN;
  const auth = req.headers.authorization || '';
  if (!configuredToken || auth !== `Bearer ${configuredToken}`) return send(res, 401, { error: 'Unauthorized' });

  const days = Math.min(Math.max(Number(req.query?.days || 28), 2), 90);
  // Search Console data is delayed; use yesterday as the end date for stable reporting.
  const endDate = isoDate(1);
  const startDate = isoDate(days);

  try {
    const token = await getGoogleAccessToken();
    const [searchRows, ga4] = await Promise.all([
      searchConsole(token, startDate, endDate),
      ga4Sources(token, startDate, endDate),
    ]);
    const queries = aggregateQueries(searchRows).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
    const opportunities = queries
      .filter((q) => q.impressions >= 10 && q.position >= 8 && q.position <= 20)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 30);
    const lowCtr = queries
      .filter((q) => q.impressions >= 30 && q.ctr < 0.03)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 30);

    return send(res, 200, {
      range: { startDate, endDate, days },
      summary: {
        searchClicks: queries.reduce((sum, q) => sum + q.clicks, 0),
        searchImpressions: queries.reduce((sum, q) => sum + q.impressions, 0),
        queryCount: queries.length,
      },
      queries: queries.slice(0, 500),
      opportunities,
      lowCtr,
      sources: ga4,
    });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: error?.message || 'Analytics request failed' });
  }
}
