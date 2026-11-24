import { BadRequest, CODE_RE, readHousehold, validateWrite, writeHousehold } from "@/lib/server/households";

const MAX_BODY = 200_000;
const noStore = { "Cache-Control": "no-store" };

async function codeFrom(ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  return CODE_RE.test(code) ? code : null;
}

/** Everything the household shares, plus its version. */
export async function GET(_request: Request, ctx: { params: Promise<{ code: string }> }) {
  const code = await codeFrom(ctx);
  if (!code) return Response.json({ error: "Not a household code" }, { status: 400, headers: noStore });
  try {
    const data = await readHousehold(code);
    if (!data) return Response.json({ error: "No household with that code" }, { status: 404, headers: noStore });
    return Response.json(data, { headers: noStore });
  } catch (e) {
    console.error("read household failed", e);
    return Response.json({ error: "Could not reach the household right now" }, { status: 500, headers: noStore });
  }
}

/** Apply field-level changes. Body: { set: { field: value }, del: [field] } */
export async function PUT(request: Request, ctx: { params: Promise<{ code: string }> }) {
  const code = await codeFrom(ctx);
  if (!code) return Response.json({ error: "Not a household code" }, { status: 400 });
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return Response.json({ error: "Too large" }, { status: 413 });
    const { set, del } = validateWrite(JSON.parse(text));
    const result = await writeHousehold(code, set, del);
    if (!result) return Response.json({ error: "No household with that code" }, { status: 404 });
    return Response.json(result);
  } catch (e) {
    if (e instanceof BadRequest || e instanceof SyntaxError) return Response.json({ error: e.message }, { status: 400 });
    console.error("write household failed", e);
    return Response.json({ error: "Could not save to the household right now" }, { status: 500 });
  }
}
