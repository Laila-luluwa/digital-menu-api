export const ORDER_STATUSES = ["QUEUED", "COOKING", "READY", "SERVED"];
export const DEFAULT_KITCHEN_STATUSES = ["QUEUED", "COOKING", "READY"];

const STATUS_ALIAS = {
  NEW: "QUEUED"
};

const TRANSITIONS = {
  QUEUED: new Set(["QUEUED", "COOKING"]),
  COOKING: new Set(["COOKING", "READY"]),
  READY: new Set(["READY", "SERVED"]),
  SERVED: new Set(["SERVED"])
};

export const parseKitchenStatusFilter = (rawStatus) => {
  if (!rawStatus) {
    return { statuses: DEFAULT_KITCHEN_STATUSES };
  }

  const requested = String(rawStatus)
    .split(",")
    .map((status) => STATUS_ALIAS[status.trim().toUpperCase()] || status.trim().toUpperCase())
    .filter(Boolean);

  if (requested.length === 0) {
    return { statuses: DEFAULT_KITCHEN_STATUSES };
  }

  const invalid = requested.filter((status) => !ORDER_STATUSES.includes(status));
  if (invalid.length > 0) {
    return { error: `Invalid status filter: ${invalid.join(", ")}` };
  }

  return { statuses: [...new Set(requested)] };
};

export const canTransitionOrderStatus = (currentStatus, nextStatus) => {
  const current = String(currentStatus || "").toUpperCase();
  const next = String(nextStatus || "").toUpperCase();
  return TRANSITIONS[current]?.has(next) === true;
};
