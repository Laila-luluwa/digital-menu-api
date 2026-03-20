import express from "express";
import {
  getTables,
  getTableWithQR,
  createTable,
  updateTable,
  deleteTable,
  bulkCreateTables
} from "../controllers/table.controller.js";
import { authorizeOwnerOrManager } from "../middleware/authorizeRole.js";

const router = express.Router();

// All table operations require OWNER or MANAGER role
router.use(authorizeOwnerOrManager);

// Get all tables
router.get("/tables", getTables);

// Get single table with QR code
router.get("/tables/:id", getTableWithQR);

// Create single table
router.post("/tables", createTable);

// Bulk create tables
router.post("/tables/bulk", bulkCreateTables);

// Update table
router.patch("/tables/:id", updateTable);

// Delete table
router.delete("/tables/:id", deleteTable);

export default router;
