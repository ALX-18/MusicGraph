// Service MusicBrainz : client + rate limiting + retry logic.
// Policy : User-Agent OBLIGATOIRE, ~1 req/s (1100ms mini entre appels), JSON fmt.
import neo4j from 'neo4j-driver';

const BASE_URL = process.env.MUSICBRAINZ_BASE_URL || 'https://musicbrainz.org/ws/2';
const USER_AGENT = process.env.MUSICBRAINZ_USER_AGENT || 'MusicGraph/1.0 (contact@example.com)';

// ===== Rate Limiter (file d'attente + délai 1100ms) =====
let lastRequestTime = 0;
const requestQueue = [];
let processing = false;

async function enqueueRequest(fn) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (processing || requestQueue.length === 0) return;
  processing = true;

  while (requestQueue.length > 0) {
    const { fn, resolve, reject } = requestQueue.shift();
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    const delayNeeded = Math.max(0, 1100 - elapsed);

    if (delayNeeded > 0) {
      await new Promise((r) => setTimeout(r, delayNeeded));
    }

    try {
      lastRequestTime = Date.now();
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  }

  processing = false;
}

// ===== Retry Logic (backoff exponentiel) =====
async function fetchWithRetry(url, maxRetries = 3) {
  let lastErr;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (res.status === 429 || res.status === 503) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.warn(`[MB] ${res.status} — retry après ${delay}ms (tentative ${attempt}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries) break;
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.warn(`[MB] erreur (${err.message}) — retry après ${delay}ms (tentative ${attempt}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastErr;
}

// ===== Search Artist =====
export async function searchArtist(name) {
  if (!name || name.trim().length === 0) {
    throw new Error('Nom artiste vide');
  }

  return enqueueRequest(async () => {
    const q = encodeURIComponent(name);
    const url = `${BASE_URL}/artist?query=${q}&fmt=json&limit=25`;

    try {
      const data = await fetchWithRetry(url);
      const artists = data.artists || [];

      return artists.map((a) => ({
        mbid: a.id,
        name: a.name,
        country: a['country'] || null,
        type: a['type'] || null,
        beginDate: a['life-span']?.['begin-date'] || null,
        score: neo4j.isInt(a.score) ? a.score.toNumber() : (a.score || 0),
      }));
    } catch (err) {
      console.error(`[MB] Erreur search "${name}" :`, err.message);
      throw err;
    }
  });
}

// ===== Get Artist (détails + genres + area) =====
export async function getArtist(mbid) {
  if (!mbid || mbid.trim().length === 0) {
    throw new Error('MBID artiste vide');
  }

  return enqueueRequest(async () => {
    const url = `${BASE_URL}/artist/${mbid}?fmt=json&inc=genres+areas+ratings`;

    try {
      const data = await fetchWithRetry(url);

      return {
        mbid: data.id,
        name: data.name,
        type: data.type || null,
        country: data['country'] || null,
        gender: data.gender || null,
        beginDate: data['life-span']?.['begin-date'] || null,
        endDate: data['life-span']?.['end-date'] || null,
        disambiguation: data['disambiguation'] || null,
        genres: (data.genres || []).map((g) => g.name),
        area: data.area
          ? {
              mbid: data.area.id,
              name: data.area.name,
              type: data.area.type || null,
            }
          : null,
      };
    } catch (err) {
      console.error(`[MB] Erreur getArtist ${mbid} :`, err.message);
      throw err;
    }
  });
}

// ===== Get Artist Recordings (avec artist-credits pour détecter collabs) =====
export async function getArtistRecordings(mbid, limit = 100) {
  if (!mbid || mbid.trim().length === 0) {
    throw new Error('MBID artiste vide');
  }

  return enqueueRequest(async () => {
    const url = `${BASE_URL}/recording?artist=${mbid}&fmt=json&inc=artists+releases&limit=${limit}`;

    try {
      const data = await fetchWithRetry(url);
      const recordings = data.recordings || [];

      return recordings.map((r) => ({
        mbid: r.id,
        title: r.title,
        length: r.length ? neo4j.isInt(r.length) ? r.length.toNumber() : r.length : null,
        firstReleaseDate: r['first-release-date'] || null,
        artistCredits: (r['artist-credit'] || []).map((ac) => ({
          name: ac.name,
          mbid: ac.artist?.id || null,
          joinphrase: ac.joinphrase || '',
        })),
        releases: (r.releases || []).map((rel) => ({
          mbid: rel.id,
          title: rel.title,
          date: rel.date || null,
        })),
      }));
    } catch (err) {
      console.error(`[MB] Erreur getArtistRecordings ${mbid} :`, err.message);
      throw err;
    }
  });
}

// ===== Get Releases for Recording =====
export async function getReleasesForRecording(recordingMbid) {
  if (!recordingMbid || recordingMbid.trim().length === 0) {
    throw new Error('MBID recording vide');
  }

  return enqueueRequest(async () => {
    const url = `${BASE_URL}/release?recording=${recordingMbid}&fmt=json&inc=labels+areas&limit=50`;

    try {
      const data = await fetchWithRetry(url);
      const releases = data.releases || [];

      return releases.map((r) => ({
        mbid: r.id,
        title: r.title,
        date: r.date || null,
        country: r.country || null,
        status: r.status || null,
        releaseType: (r['release-group']?.['type'] || null),
        labels: (r['label-info'] || []).map((li) => ({
          name: li.label?.name || null,
          mbid: li.label?.id || null,
          country: li.label?.country || null,
        })),
        area: r.country || null,
      }));
    } catch (err) {
      console.error(`[MB] Erreur getReleasesForRecording ${recordingMbid} :`, err.message);
      throw err;
    }
  });
}

// ===== Get Releases (génériques) =====
export async function getReleases(filter = {}, limit = 50) {
  return enqueueRequest(async () => {
    let query = '';
    if (filter.artist) query += `artist:${encodeURIComponent(filter.artist)}`;
    if (filter.title) {
      if (query) query += ' ';
      query += `release:${encodeURIComponent(filter.title)}`;
    }

    if (!query) {
      return [];
    }

    const url = `${BASE_URL}/release?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`;

    try {
      const data = await fetchWithRetry(url);
      const releases = data.releases || [];

      return releases.map((r) => ({
        mbid: r.id,
        title: r.title,
        date: r.date || null,
        country: r.country || null,
        status: r.status || null,
        releaseType: (r['release-group']?.['type'] || null),
      }));
    } catch (err) {
      console.error(`[MB] Erreur getReleases :`, err.message);
      throw err;
    }
  });
}
