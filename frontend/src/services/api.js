import { CHAT_ENDPOINT } from "../utils/constants";

export class ApiError extends Error {
  constructor(message, status = 0, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError("The assistant service returned an invalid response.", response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError("The assistant service returned an invalid response.", response.status);
  }
}

export async function postChat(payload, { signal } = {}) {
  let response;

  try {
    response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError("Could not reach the assistant service. Check the connection and try again.", 0, "NETWORK_ERROR");
  }

  const body = await readJsonResponse(response);
  if (!response.ok) {
    const message = typeof body?.detail === "string"
      ? body.detail
      : "The assistant service could not complete the request.";
    throw new ApiError(message, response.status, "HTTP_ERROR");
  }

  return body;
}
