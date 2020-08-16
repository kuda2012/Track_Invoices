const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    next(e);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      [code, name, description]
    );
    return res.json({ company: results.rows[0] });
  } catch (e) {
    next(e);
  }
});
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(`SELECT * FROM companies WHERE code = $1`, [
      code,
    ]);
    const invoices = await db.query(
      `SELECT id, comp_code, amt, paid, to_char(add_date, 'dd-MM-yy') as add_date, to_char(paid_date, 'dd-MM-yy') as paid_date FROM invoices WHERE comp_code='${results.rows[0].code}'`
    );
    if (invoices != {}) {
      results.rows[0]["invoices"] = invoices.rows;
    }

    if (!results.rows[0]) {
      throw new ExpressError("Could not find company with that code", 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (e) {
    next(e);
  }
});
router.put("/:code", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { code } = req.params;
    const results = await db.query(
      `UPDATE companies set name = $1, description = $2 WHERE code = $3 RETURNING code, name, description`,
      [name, description, code]
    );
    if (!results.rows[0]) {
      throw new ExpressError("Could not find company with that code", 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (e) {
    next(e);
  }
});
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      `DELETE FROM companies WHERE code = $1 RETURNING code`,
      [code]
    );
    if (!results.rows[0]) {
      throw new ExpressError("Could not find company with that code", 404);
    }
    return res.json({ status: `${results.rows[0].code} deleted` });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
