import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import { getStore } from "@/lib/admin/data";
import { writeAuditLog } from "@/lib/services/audit";

/**
 * AES-256-GCM encryption for secrets stored in the DB.
 */
function encryptionKey(): Buffer {
  const envHex = process.env.SECRETS_ENCRYPTION_KEY;
  if (envHex && /^[a-f0-9]{64}$/i.test(envHex)) return Buffer.from(envHex, "hex");
  const base = process.env.NEXTAUTH_SECRET || "vovo-dev-insecure-do-not-use-prod";
  return crypto.createHash("sha256").update(base).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = encryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decryptSecret(payload: string): string {
  const [iv64, tag64, data64] = payload.split(".");
  if (!iv64 || !tag64 || !data64) throw new Error("Invalid encrypted payload");
  const key = encryptionKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data64, "base64")), decipher.final()]).toString(
    "utf8"
  );
}

export function maskSecret(plaintext: string): string {
  if (!plaintext) return "";
  if (plaintext.length <= 8) return "••••••••";
  return `${plaintext.slice(0, 4)}${"•".repeat(Math.min(10, plaintext.length - 8))}${plaintext.slice(-4)}`;
}

export * from "./service-keys-def";
import { SERVICE_KEYS_DEF, ServiceKeyDef } from "./service-keys-def";
export const SERVICE_KEYS = SERVICE_KEYS_DEF;


function getEnvFilePath(): string {
  return path.join(process.cwd(), ".env.local");
}

export function readEnvLocal(): Record<string, string> {
  const filePath = getEnvFilePath();
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;
  try {
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  } catch (err) {
    console.warn("[Secrets] Failed to read .env.local:", err);
  }
  return env;
}

export function writeEnvLocalKeys(updates: Record<string, string>): void {
  const filePath = getEnvFilePath();
  let content = "";
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  }
  const lines = content.split(/\r?\n/);

  for (const [key, val] of Object.entries(updates)) {
    process.env[key] = val;

    let found = false;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const lineKey = trimmed.slice(0, eqIdx).trim();
        if (lineKey === key) {
          lines[i] = `${key}="${val}"`;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      lines.push(`${key}="${val}"`);
    }
  }

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

export interface StoredServiceKey extends ServiceKeyDef {
  value: string;
  maskedValue: string;
  configured: boolean;
  updatedAt?: string;
}

export async function listServiceKeys(): Promise<StoredServiceKey[]> {
  const envFile = readEnvLocal();
  const store = getStore();

  return SERVICE_KEYS.map((def) => {
    const val = process.env[def.envVar] || envFile[def.envVar] || store.apiKeys[def.key] || "";
    return {
      ...def,
      value: val,
      maskedValue: maskSecret(val),
      configured: Boolean(val && val.trim().length > 0),
      updatedAt: store.apiKeyUpdatedAt[def.key] || "",
    };
  });
}

export async function saveAllServiceKeys(updates: Record<string, string>, actorId = "owner") {
  const envUpdates: Record<string, string> = {};
  const store = getStore();
  const now = new Date();

  for (const [key, rawValue] of Object.entries(updates)) {
    const def = SERVICE_KEYS.find((d) => d.key === key || d.envVar === key);
    if (!def) continue;

    const trimmed = (rawValue || "").trim();
    envUpdates[def.envVar] = trimmed;
    process.env[def.envVar] = trimmed;
    store.apiKeys[def.key] = trimmed;
    store.apiKeyUpdatedAt[def.key] = now.toISOString();

    if (process.env.DATABASE_URL) {
      try {
        const encrypted = encryptSecret(trimmed);
        await prisma.apiServiceKey.upsert({
          where: { serviceKey: def.key },
          update: { encryptedValue: encrypted, updatedAt: now },
          create: {
            serviceKey: def.key,
            label: def.label,
            envVar: def.envVar,
            encryptedValue: encrypted,
            updatedAt: now,
          },
        });
      } catch (err) {
        console.warn(`[Secrets] Failed to persist ${def.key} in DB:`, err);
      }
    }
  }

  if (Object.keys(envUpdates).length > 0) {
    writeEnvLocalKeys(envUpdates);
  }

  try {
    await writeAuditLog({
      action: "admin.secrets.update",
      actorId,
      actorRole: "admin",
      metadata: {
        updatedKeys: Object.keys(envUpdates),
        count: Object.keys(envUpdates).length,
      },
    });
  } catch {
    // ignore audit logging error
  }
}

export async function getServiceKey(serviceKey: string): Promise<string | null> {
  const def = SERVICE_KEYS.find((d) => d.key === serviceKey || d.envVar === serviceKey);
  if (!def) return null;

  const envFile = readEnvLocal();
  const val = process.env[def.envVar] || envFile[def.envVar];
  if (val) return val;

  const store = getStore();
  return store.apiKeys[def.key] ?? null;
}

