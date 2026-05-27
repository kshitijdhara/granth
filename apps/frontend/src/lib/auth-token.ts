/** Refresh slightly before expiry so in-flight requests don't hit 401. */
const REFRESH_LEEWAY_SEC = 30;

interface JwtPayload {
	exp?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
	const parts = token.split(".");
	const payloadPart = parts[1];
	if (parts.length !== 3 || !payloadPart) return null;

	try {
		const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
		const json = atob(padded);
		return JSON.parse(json) as JwtPayload;
	} catch {
		return null;
	}
}

/** True when the access token is missing, malformed, or within leeway of expiring. */
export function isAccessTokenExpired(token: string): boolean {
	const payload = decodeJwtPayload(token);
	if (payload?.exp === undefined) return true;

	const nowSec = Math.floor(Date.now() / 1000);
	return payload.exp <= nowSec + REFRESH_LEEWAY_SEC;
}
