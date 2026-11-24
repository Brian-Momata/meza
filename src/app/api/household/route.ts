import { BadRequest, createHousehold, validateWrite } from "@/lib/server/households";

const MAX_BODY = 200_000;

/** Create a household from this phone's current plan. Body: { set: { field: value } } */
export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return Response.json({ error: "Too large" }, { status: 413 });
    const { set } = validateWrite(JSON.parse(text));
    const created = await createHousehold(set);
    return Response.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof BadRequest || e instanceof SyntaxError) return Response.json({ error: e.message }, { status: 400 });
    console.error("create household failed", e);
    return Response.json({ error: "Could not create a household right now" }, { status: 500 });
  }
}
