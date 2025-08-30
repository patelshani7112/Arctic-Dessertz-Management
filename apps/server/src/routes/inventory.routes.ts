// server/routes/inventory.routes.ts
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";

// controllers (to be created soon)
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/suppliersController";

import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoriesController";

import {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/itemsController";

import {
  listItemSuppliers,
  createItemSupplier,
  updateItemSupplier,
  deleteItemSupplier,
} from "../controllers/itemSuppliersController";

import {
  getOrCreateBasket,
  listBasketLines,
  addBasketLine,
  updateBasketLine,
  deleteBasketLine,
  finalizeBasketLine,
} from "../controllers/basketController";

import { placeOrderFromBasket } from "../controllers/ordersController";

import {
  listPOs,
  getPO,
  createGRN,
  addGRNLine,
  approveGRN,
  addInvoice,
} from "../controllers/receivingController";

import {
  listArchivePOs,
  generateCarryOver,
} from "../controllers/archiveController";


const r = Router();

console.log("[inventory] routes file loaded"); // should appear on server start

// ping FIRST, before any controller imports
r.get("/v1/_inventory_ping", (_req, res) =>
  res.json({ ok: true, scope: "inventory" })
);
/* ───────── Suppliers ───────── */
r.get("/v1/suppliers", asyncHandler(listSuppliers));
r.get("/v1/suppliers/:id", asyncHandler(getSupplier));
r.post("/v1/suppliers", asyncHandler(createSupplier));
r.patch("/v1/suppliers/:id", asyncHandler(updateSupplier));
r.delete("/v1/suppliers/:id", asyncHandler(deleteSupplier));

/* ───────── Categories ───────── */
r.get("/v1/categories", asyncHandler(listCategories));
r.get("/v1/categories/:id", asyncHandler(getCategory));
r.post("/v1/categories", asyncHandler(createCategory));
r.patch("/v1/categories/:id", asyncHandler(updateCategory));
r.delete("/v1/categories/:id", asyncHandler(deleteCategory));

/* ───────── Items ───────── */
r.get("/v1/items", asyncHandler(listItems));
r.get("/v1/items/:id", asyncHandler(getItem));
r.post("/v1/items", asyncHandler(createItem));
r.patch("/v1/items/:id", asyncHandler(updateItem));
r.delete("/v1/items/:id", asyncHandler(deleteItem));

/* ───────── Item ↔ Supplier links ───────── */
r.get("/v1/item-suppliers", asyncHandler(listItemSuppliers));
r.post("/v1/item-suppliers", asyncHandler(createItemSupplier));
r.patch("/v1/item-suppliers/:id", asyncHandler(updateItemSupplier));
r.delete("/v1/item-suppliers/:id", asyncHandler(deleteItemSupplier));

/* ───────── Cart 1: Baskets ───────── */
r.get("/v1/baskets/current", asyncHandler(getOrCreateBasket));     // ?location_id=
r.get("/v1/baskets/:id/lines", asyncHandler(listBasketLines));
r.post("/v1/baskets/:id/lines", asyncHandler(addBasketLine));
r.patch("/v1/basket-lines/:lineId", asyncHandler(updateBasketLine));
r.delete("/v1/basket-lines/:lineId", asyncHandler(deleteBasketLine));
r.post("/v1/basket-lines/:lineId/finalize", asyncHandler(finalizeBasketLine));

/* ───────── Cart 2: Place orders ───────── */
r.post("/v1/orders/place", asyncHandler(placeOrderFromBasket));

/* ───────── Cart 3: Placed & Receiving ───────── */
r.get("/v1/pos", asyncHandler(listPOs));                           // ?location_id=&status=placed
r.get("/v1/pos/:poId", asyncHandler(getPO));
r.post("/v1/grns", asyncHandler(createGRN));                        // { po_id }
r.post("/v1/grns/:grnId/lines", asyncHandler(addGRNLine));          // { item_id, qty_received_each, unit_cost }
r.post("/v1/grns/:grnId/approve", asyncHandler(approveGRN));
r.post("/v1/invoices", asyncHandler(addInvoice));                   // { po_id, file_url, ... }

/* ───────── Cart 4: Archive & Carry-over ───────── */
r.get("/v1/archive/pos", asyncHandler(listArchivePOs));             // ?location_id=
r.post("/v1/pos/:poId/carryover", asyncHandler(generateCarryOver));



export default r;
