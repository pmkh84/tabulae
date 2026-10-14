import fa from "./fa.js";

export const locale = "fa-IR";
export const language = "fa";
export const direction = "rtl";

// Missing keys/placeholders stay visible to make incomplete translations discoverable.
// Returns plain text; React remains responsible for escaping rendered values.
export function t(key, parameters = {}) {
  const message = key.split(".").reduce(
    (resource, segment) =>
      resource && Object.hasOwn(resource, segment) ? resource[segment] : undefined,
    fa
  );

  if (typeof message !== "string") return key;

  return message.replace(/\{(\w+)\}/g, (placeholder, name) =>
    Object.hasOwn(parameters, name) ? String(parameters[name]) : placeholder
  );
}
