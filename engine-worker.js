/* CardScope v11.4 — worker de calcul : tout le lourd tourne ici, hors du thread UI. */
importScripts('engine.js?v=11.4');

let latestJobId = 0;

self.onmessage = async event => {
  const data = event.data || {};
  if (data.type === 'cancel') { latestJobId = Number(data.jobId) || (latestJobId + 1); return; }
  if (data.type !== 'run') return;
  const jobId = data.jobId;
  latestJobId = jobId;
  try {
    const result = await self.CS_ENGINE.runJob(data.job, {
      onProgress: pct => {
        if (jobId === latestJobId) self.postMessage({ type: 'progress', jobId, pct });
      },
      shouldAbort: () => jobId !== latestJobId
    });
    if (result && jobId === latestJobId) self.postMessage({ type: 'result', jobId, result });
  } catch (error) {
    if (jobId === latestJobId) self.postMessage({ type: 'error', jobId, message: String(error && error.message || error) });
  }
};
