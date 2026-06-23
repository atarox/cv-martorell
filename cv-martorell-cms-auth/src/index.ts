const GITHUB_CLIENT_ID = GITHUB_CLIENT_ID as string;
const GITHUB_CLIENT_SECRET = GITHUB_CLIENT_SECRET as string;

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // =========================
    // START AUTH
    // =========================
    if (url.pathname === "/api/auth") {
      const state = crypto.randomUUID();

      const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        scope: "repo",
        state,
      });

      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params.toString()}`,
        302
      );
    }

    // =========================
    // CALLBACK
    // =========================
    if (url.pathname === "/api/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing code", { status: 400 });

      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
          }),
        }
      );

      const data = await tokenRes.json() as {
        access_token?: string;
      };

      if (!data.access_token) {
        return new Response("OAuth error", { status: 400 });
      }

      const html = `
<!doctype html>
<html>
  <body>
    <script>
      (function () {
        const msg =
          "authorization:github:success:" +
          JSON.stringify({
            token: "${data.access_token}",
            provider: "github"
          });

        window.opener.postMessage(msg, "*");
        window.close();
      })();
    </script>
    Autenticando...
  </body>
</html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};