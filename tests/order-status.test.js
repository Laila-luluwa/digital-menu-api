import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionOrderStatus,
  parseKitchenStatusFilter
} from "../src/domain/orderStatus.js";

test("parseKitchenStatusFilter maps alias 'new' to QUEUED", () => {
  const parsed = parseKitchenStatusFilter("new");
  assert.deepEqual(parsed, { statuses: ["QUEUED"] });
});

test("parseKitchenStatusFilter handles csv with dedupe", () => {
  const parsed = parseKitchenStatusFilter("queued, cooking,queued");
  assert.deepEqual(parsed, { statuses: ["QUEUED", "COOKING"] });
});

test("parseKitchenStatusFilter returns validation error for invalid status", () => {
  const parsed = parseKitchenStatusFilter("burning");
  assert.equal(parsed.error, "Invalid status filter: BURNING");
});

test("canTransitionOrderStatus enforces forward kitchen flow", () => {
  assert.equal(canTransitionOrderStatus("QUEUED", "COOKING"), true);
  assert.equal(canTransitionOrderStatus("COOKING", "READY"), true);
  assert.equal(canTransitionOrderStatus("READY", "SERVED"), true);
  assert.equal(canTransitionOrderStatus("READY", "COOKING"), false);
  assert.equal(canTransitionOrderStatus("SERVED", "QUEUED"), false);
});
