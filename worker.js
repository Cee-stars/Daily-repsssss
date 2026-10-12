/* Workers の入口。
 * 静的ファイルが先に配られ、そこに無いものだけがここに来る。
 * 記録のやりとりは functions/api/state.js に渡す。Pages で動かすときも
 * 同じファイルがそのまま使われるので、置き場の作りは1つで済む。 */
import { onRequest } from "./functions/api/state.js";

export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);
    if(url.pathname === "/api/state") return onRequest({ request, env, ctx });
    return new Response("Not found", { status: 404 });
  }
};
