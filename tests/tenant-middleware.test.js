import test from "node:test";
import assert from "node:assert/strict";
import tenantMiddleware from "../src/middleware/tenant.middleware.js";

const createRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
};

test("tenant middleware sets restaurantId from authenticated context", () => {
  const req = {
    restaurantId: 5,
    user: { restaurantId: 5 },
    headers: {}
  };
  const res = createRes();
  let called = false;

  tenantMiddleware(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.restaurantId, 5);
});

test("tenant middleware rejects header mismatch", () => {
  const req = {
    restaurantId: 5,
    user: { restaurantId: 5 },
    headers: { "x-restaurant-id": "8" }
  };
  const res = createRes();
  let called = false;

  tenantMiddleware(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    error: "x-restaurant-id does not match authenticated restaurant"
  });
});

test("tenant middleware rejects missing auth restaurant context", () => {
  const req = {
    headers: {}
  };
  const res = createRes();
  let called = false;

  tenantMiddleware(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, {
    error: "Authenticated restaurant context is missing"
  });
});
