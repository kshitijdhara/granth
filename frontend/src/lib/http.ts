export class ApiError extends Error {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
		this.name = "ApiError";
	}
}

type TokenFn = () => string | null;
type RefreshFn = () => Promise<string>;
type LogoutFn = () => void;

let _getToken: TokenFn | null = null;
let _onRefresh: RefreshFn | null = null;
let _onLogout: LogoutFn | null = null;

export function configureHttp(opts: {
	getToken: TokenFn;
	onRefresh: RefreshFn;
	onLogout: LogoutFn;
}) {
	_getToken = opts.getToken;
	_onRefresh = opts.onRefresh;
	_onLogout = opts.onLogout;
}

const BASE_URL = (import.meta.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

let isRefreshing = false;
type QueueEntry = { resolve: () => void; reject: (e: unknown) => void };
let refreshQueue: QueueEntry[] = [];

function drainQueue(err?: unknown) {
	const q = refreshQueue;
	refreshQueue = [];
	for (const entry of q) {
		err ? entry.reject(err) : entry.resolve();
	}
}

async function request<T>(method: string, path: string, body?: unknown, retry = false): Promise<T> {
	const token = _getToken?.() ?? null;

	const res = await fetch(`${BASE_URL}${path}`, {
		method,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});

	if (res.status === 401 && !retry && _onRefresh) {
		if (isRefreshing) {
			await new Promise<void>((resolve, reject) => {
				refreshQueue.push({ resolve, reject });
			});
			return request(method, path, body, true);
		}

		isRefreshing = true;
		try {
			await _onRefresh();
			drainQueue();
			return request(method, path, body, true);
		} catch (err) {
			drainQueue(err);
			_onLogout?.();
			throw new ApiError(401, "Session expired");
		} finally {
			isRefreshing = false;
		}
	}

	if (!res.ok) {
		const msg = await res.text().catch(() => res.statusText);
		throw new ApiError(res.status, msg);
	}

	const text = await res.text();
	return (text ? JSON.parse(text) : undefined) as T;
}

export const http = {
	get: <T>(path: string) => request<T>("GET", path),
	post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
	put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
	patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
	delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};
