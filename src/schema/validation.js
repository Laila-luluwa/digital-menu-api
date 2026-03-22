import { z } from "zod";

// ========== AUTH SCHEMAS ==========
export const registerSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  name: z.string().min(1, "Name is required").max(100),
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and number"
  ),
  role: z.enum(["PLATFORM_ADMIN", "OWNER", "MANAGER", "KITCHEN"]),
  restaurantId: z.number().int().positive("Invalid restaurant ID")
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  password: z.string().min(1, "Password is required")
});

// ========== MENU SCHEMAS ==========
export const createMenuItemSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive("Price must be positive"),
  categoryId: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().nonnegative("Quantity cannot be negative").default(0)
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createMenuCategorySchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().nonnegative().default(0)
});

export const updateMenuCategorySchema = createMenuCategorySchema.partial();

// ========== TABLE SCHEMAS ==========
export const createTableSchema = z.object({
  tableCode: z.string().min(1, "Table code required").max(50),
  quantity: z.number().int().positive().default(1)
});

export const bulkCreateTablesSchema = z.object({
  prefix: z.string().min(1).max(20),
  count: z.number().int().min(1).max(100)
});

// ========== ORDER SCHEMAS ==========
export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      item_id: z.number().int().positive().optional(),
      menuItemId: z.number().int().positive().optional(),
      qty: z.number().int().positive("Quantity must be positive"),
      quantity: z.number().int().positive().optional()
    }).refine(
      (item) => item.item_id || item.menuItemId,
      "Either item_id or menuItemId is required"
    )
  ).nonempty("At least one item required")
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["QUEUED", "COOKING", "READY", "SERVED"])
});

// ========== SESSION SCHEMAS ==========
export const startSessionSchema = z.object({
  table_code: z.string().min(1, "Table code required").optional(),
  tableCode: z.string().min(1, "Table code required").optional(),
  restaurant_id: z.coerce.number().int().positive().optional(),
  restaurantId: z.coerce.number().int().positive().optional()
}).refine(
  (data) => data.table_code || data.tableCode,
  "Table code is required"
);

// ========== TAG SCHEMAS ==========
export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name required").max(50),
  description: z.string().max(200).optional()
});

export const addTagsToItemSchema = z.object({
  tags: z.array(z.string().min(1)).nonempty("At least one tag required")
});

// ========== PAGINATION ==========
export const paginationSchema = z.object({
  skip: z.coerce.number().int().nonnegative().default(0),
  take: z.coerce.number().int().positive().max(100).default(20),
  page: z.coerce.number().int().positive().optional()
});

// ========== UTILS ==========
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        ...req.body,
        ...req.params,
        ...req.query
      });
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: "VALIDATION_ERROR",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};
