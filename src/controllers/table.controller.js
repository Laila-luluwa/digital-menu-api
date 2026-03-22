import { tableRepository } from "../repositories/table.repository.js";
import { generateTableQRCode } from "../services/qrCode.service.js";

/**
 * Get all tables for a restaurant
 */
export const getTables = async (req, res) => {
  try {
    const tables = await tableRepository.findByRestaurant(req.restaurantId);
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
};

/**
 * Get table by ID with QR code
 */
export const getTableWithQR = async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);

    const table = await tableRepository.findById(tableId, req.restaurantId);

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Generate QR code
    const qrCode = await generateTableQRCode(req.restaurantId, table.tableCode);

    res.json({
      ...table,
      qrCode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch table" });
  }
};

/**
 * Create new table
 */
export const createTable = async (req, res) => {
  try {
    const { tableCode } = req.body;

    if (!tableCode) {
      return res
        .status(400)
        .json({ error: "tableCode is required" });
    }

    // Check if table code already exists for this restaurant
    const existingTable = await tableRepository.existsByCode(String(tableCode), req.restaurantId);

    if (existingTable) {
      return res
        .status(409)
        .json({ error: "Table code already exists for this restaurant" });
    }

    const table = await tableRepository.create({
      tableCode: String(tableCode),
      restaurantId: req.restaurantId
    });

    // Generate QR code
    const qrCode = await generateTableQRCode(req.restaurantId, table.tableCode);

    res.status(201).json({
      ...table,
      qrCode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create table" });
  }
};

/**
 * Update table
 */
export const updateTable = async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const { tableCode } = req.body;

    // Check if table exists
    const existingTable = await tableRepository.findById(tableId, req.restaurantId);
    if (!existingTable) {
      return res.status(404).json({ error: "Table not found" });
    }

    const updatedTable = await tableRepository.update(tableId, {
      ...(tableCode ? { tableCode: String(tableCode) } : {})
    });

    // Generate QR code for updated table
    const qrCode = await generateTableQRCode(
      req.restaurantId,
      updatedTable.tableCode
    );

    res.json({
      ...updatedTable,
      qrCode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update table" });
  }
};

/**
 * Delete table
 */
export const deleteTable = async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);

    // Check if table exists
    const existingTable = await tableRepository.findById(tableId, req.restaurantId);
    if (!existingTable) {
      return res.status(404).json({ error: "Table not found" });
    }

    await tableRepository.delete(tableId);
    res.json({ message: "Table deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete table" });
  }
};

/**
 * Bulk create tables
 */
export const bulkCreateTables = async (req, res) => {
  try {
    const { tableCodes } = req.body;

    if (!Array.isArray(tableCodes) || tableCodes.length === 0) {
      return res
        .status(400)
        .json({ error: "tableCodes array is required" });
    }

    const tables = await Promise.all(
      tableCodes.map(async (code) => {
        const existingTable = await tableRepository.existsByCode(String(code), req.restaurantId);

        if (existingTable) {
          return null;
        }

        const table = await tableRepository.create({
          tableCode: String(code),
          restaurantId: req.restaurantId
        });

        const qrCode = await generateTableQRCode(req.restaurantId, table.tableCode);
        return { ...table, qrCode };
      })
    );

    res.status(201).json(tables.filter((t) => t !== null));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to bulk create tables" });
  }
};
