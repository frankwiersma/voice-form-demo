/**
 * Node 25 ships a non-functional global `localStorage`/`sessionStorage`
 * (Web Storage without a backing file), which breaks SSR for any code that
 * guards with `typeof localStorage !== "undefined"`. Remove it on the server
 * so those guards behave as they did on older Node versions.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      delete (globalThis as { localStorage?: unknown }).localStorage
    } catch {}
    try {
      delete (globalThis as { sessionStorage?: unknown }).sessionStorage
    } catch {}
  }
}
