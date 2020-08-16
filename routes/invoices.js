const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT id, comp_code, amt, paid, to_char(add_date, 'dd-MM-yy') as add_date, to_char(paid_date, 'dd-MM-yy') as paid_date FROM invoices`
    );
    return res.json({ invoices: results.rows });
  } catch (e) {
    next(e);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    if (!comp_code || !amt)
      throw new ExpressError("Check the format of entered invoice", 400);
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, to_char(add_date, 'dd-MM-yy') as add_date, to_char(paid_date, 'dd-MM-yy') as paid_date`,
      [comp_code, amt]
    );
    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    next(e);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(`SELECT * FROM invoices WHERE id = $1`, [
      id,
    ]);
    if (!results.rows[0]) {
      throw new ExpressError("Could not find an invoice with that id", 404);
    }
    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    next(e);
  }
});
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    if (!amt)
      throw new ExpressError("Check the format of entered invoice", 400);
    const results = await db.query(
      `UPDATE invoices set amt = $1 WHERE id = $2 RETURNING id, comp_code, amt, paid, to_char(add_date, 'dd-MM-yy') as add_date, to_char(paid_date, 'dd-MM-yy') as paid_date`,
      [amt, id]
    );
    if (!results.rows[0]) {
      throw new ExpressError("Could not find an invoice with that id", 404);
    }
    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    next(e);
  }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id, comp_code`,
      [id]
    );
    if (!results.rows[0]) {
      throw new ExpressError("Could not find an invoice with that id", 404);
    }
    return res.json({
      status: `Invoice for company ${results.rows[0].comp_code} with id:${results.rows[0].id} deleted`,
    });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
