import app from "./src/index.ts";

if (import.meta.main) {
  Deno.serve(app.fetch);
}
