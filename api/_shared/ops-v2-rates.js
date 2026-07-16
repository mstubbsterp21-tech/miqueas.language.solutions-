import { audit } from "./ops-v2-core.js";

export async function adminUpdateInterpreterRates(db, user, payload) {
  if (!user.isAdmin) return { status: 403, payload: { error: "Admin access required." } };
  if (!payload.interpreterId) return { status: 400, payload: { error: "Interpreter ID is required." } };

  const before = await db.from("interpreters").select("id,first_name,last_name,email,onsite_rate,vri_rate").eq("id", payload.interpreterId).maybeSingle();
  if (before.error) throw before.error;
  if (!before.data) return { status: 404, payload: { error: "Interpreter not found." } };

  const result = await db.rpc("mls_admin_update_interpreter_rates", {
    p_interpreter_id: payload.interpreterId,
    p_onsite_rate: String(payload.onsiteRate || ""),
    p_vri_rate: String(payload.vriRate || ""),
  });
  if (result.error) throw result.error;
  const interpreter = Array.isArray(result.data) ? result.data[0] : result.data;

  await audit(db, user, {
    action: "interpreter.rates_updated",
    entityType: "interpreter",
    entityId: payload.interpreterId,
    summary: `Updated negotiated rates for ${[before.data.first_name, before.data.last_name].filter(Boolean).join(" ") || before.data.email}`,
    before: { onsite_rate: before.data.onsite_rate, vri_rate: before.data.vri_rate },
    after: { onsite_rate: interpreter?.onsite_rate || null, vri_rate: interpreter?.vri_rate || null },
  });

  return { status: 200, payload: { interpreter } };
}
