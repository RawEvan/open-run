/**
 * Thin ORP client (no dependencies).
 * @param {string} baseUrl
 */
export function createOpenRunClient(baseUrl) {
  const base = String(baseUrl || "").replace(/\/$/, "");
  if (!base) throw new Error("baseUrl required");

  async function req(method, path, body) {
    const res = await fetch(base + path, {
      method,
      headers: body
        ? { "content-type": "application/json", accept: "application/vnd.open-run+json" }
        : { accept: "application/vnd.open-run+json, application/problem+json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("json") ? await res.json() : null;
    if (!res.ok) {
      const err = new Error(data?.title || data?.code || res.statusText);
      err.code = data?.code || `HTTP_${res.status}`;
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  return {
    baseUrl: base,
    discovery: () => req("GET", "/v1/discovery"),
    createRun: (body) => req("POST", "/v1/runs", body),
    getRun: (id) => req("GET", `/v1/runs/${encodeURIComponent(id)}`),
    cancelRun: (id) => req("POST", `/v1/runs/${encodeURIComponent(id)}/cancel`),
  };
}
