/** Dev query-flag gate. Off unless ?debug=1 (or true). Production default: off. */
export function isDebugFlag(search = "") {
  const q = new URLSearchParams(
    typeof search === "string" ? search.replace(/^\?/, "") : "",
  );
  const v = q.get("debug");
  return v === "1" || v === "true";
}
