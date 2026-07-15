import { createClerkClient } from "@clerk/backend";
import {
  audit,
  clientFor,
  database,
  interpreterFor,
  readBody,
  send,
  signedInUser,
} from "./_shared/ops-v2-core.js";

const clerkKey = process.env["CLERK_" + "SECRET_KEY"];
const allowedRoles = new Set(["client", "interpreter"]);

function resolvedRole(user, client, interpreter) {
  if (allowedRoles.has(user.metadataRole)) return user.metadataRole;
  if (client && !interpreter) return "client";
  if (interpreter && !client) return "interpreter";
  return "";
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    if (user.isAdmin) {
      return send(res, 200, {
        role: "admin",
        selectionRequired: false,
        locked: true,
      });
    }

    const db = database();
    const [client, interpreter] = await Promise.all([
      clientFor(db, user.id),
      interpreterFor(db, user.id),
    ]);
    const role = resolvedRole(user, client, interpreter);

    if (req.method === "GET") {
      return send(res, 200, {
        role: role || null,
        selectionRequired: !role && !client && !interpreter,
        locked: Boolean(role || client || interpreter),
      });
    }

    if (req.method !== "POST") {
      return send(res, 405, { error: "Use GET to check the role or POST to choose one." });
    }

    const body = readBody(req);
    const requestedRole = String(body.role || "").trim().toLowerCase();
    if (!allowedRoles.has(requestedRole)) {
      return send(res, 400, { error: "Choose either Client or Interpreter." });
    }
    if (!clerkKey) {
      return send(res, 500, { error: "Clerk server settings are incomplete." });
    }

    if (client && requestedRole !== "client") {
      return send(res, 409, { error: "This account already has a client profile. Contact MLS Portal Support to change the account type." });
    }
    if (interpreter && requestedRole !== "interpreter") {
      return send(res, 409, { error: "This account already has an interpreter profile. Contact MLS Portal Support to change the account type." });
    }
    if (role && role !== requestedRole) {
      return send(res, 409, { error: `This account is already registered as ${role}. Contact MLS Portal Support to change it.` });
    }

    const clerk = createClerkClient({ secretKey: clerkKey });
    await clerk.users.updateUserMetadata(user.id, {
      publicMetadata: { portalRole: requestedRole },
    });

    const preference = await db.from("portal_preferences").upsert({
      clerk_user_id: user.id,
      default_portal: requestedRole,
      updated_at: new Date().toISOString(),
    }, { onConflict: "clerk_user_id" });
    if (preference.error) throw preference.error;

    await audit(db, { ...user, metadataRole: requestedRole }, {
      action: "portal.role_selected",
      entityType: "portal_user",
      summary: `Selected ${requestedRole} portal`,
      after: { role: requestedRole, source: "first_login" },
    });

    return send(res, 200, {
      role: requestedRole,
      selectionRequired: false,
      locked: true,
    });
  } catch (error) {
    console.error("MLS portal role error", error);
    return send(res, 500, { error: error.message || "The account type could not be saved." });
  }
}
