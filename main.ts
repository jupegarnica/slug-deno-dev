const kv = await Deno.openKv();

const html = `
  <style>
    input {
      font-size: 1.4rem;
      padding: 0.5rem;
      border: 0;
      border-bottom: 1px solid #ccc;
      min-width: 300px;
      max-width: 600px;
    }
    form {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }
    * {
      font-family: monospace;

    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .error {
      background: tomato;
    }
    .success {
      background: limegreen;
    }
    h2 {
      color: white;
      padding: 0.5rem 1em;
    }
  </style>
  <form action="/" method="POST">
    <input name="slug" placeholder="slug" />
    <input name="url" placeholder="url" />
    <input type="submit" value="SAVE" />
  </form>
`


Deno.serve(async (request: Request) => {

  // Create short links
  if (request.method == "POST") {

    const body = await request.formData();
    const slug = body.get("slug") as string;
    const url = body.get("url") as string;
    if (!slug || !url) {
      const m = html + `<h2 class="error">Error: slug and url are required</h2>`;
      console.log(`Error: slug and url are required`);

      return new Response(m, {
        status: 400,
        headers: { "content-type": "text/html" },
      });
    }
    const result = await kv.set(["links", slug], url);
    if (result.ok) {
      const m = html + `<h2 class="success">Short link created: <a href="/${slug}">/${slug}</a></h2>`;
      console.log(`Short link created: /${slug}`);

      return new Response(m, {
        headers: { "content-type": "text/html" },
      });
    } else {
      const m = html + `<h2 class="error">Error: ${result}</h2>`;
      console.log(`Error: ${result}`);

      return new Response(m,
        { status: 404, headers: { "content-type": "text/html" } });
    }
  }

  // Redirect short links


  const slug = request.url.split("/").pop() || "";
  const url = (await kv.get(["links", slug])).value as string;
  if (url) {
    console.log(`Redirecting to ${url}`);
    return Response.redirect(url, 301);
  } else {
    const m = !slug ? html : html + `<h2 class="error">Slug "${slug}" not found</h2>`;
    return new Response(m, {
      status: 404,
      headers: { "content-type": "text/html" },
    });
  }

});