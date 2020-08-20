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
    if (!code || !name)
      throw new ExpressError("Check the format of entered company", 400);
    const checkCompanies = await db.query(
      `SELECT code from companies where code = $1`,
      [code]
    );
    if (checkCompanies.rows.length != 0) {
      throw new ExpressError("Company already exists", 409);
    }
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
    const companyResults = await db.query(
      `SELECT * FROM companies WHERE code = $1`,
      [code]
    );
    if (!companyResults.rows[0]) {
      throw new ExpressError("Could not find company with that code", 404);
    }
    const invoices = await db.query(
      `SELECT id, comp_code, amt, paid, to_char(add_date, 'dd-MM-yy') as add_date, to_char(paid_date, 'dd-MM-yy') as paid_date FROM invoices WHERE comp_code='${companyResults.rows[0].code}'`
    );
    const companiesIndustries = await db.query(
      `SELECT industries.industry FROM industries_companies 
                                                JOIN industries
                                                ON industries_companies.industry_code = industries.code
                                                WHERE industries_companies.company_code = $1`,
      [code]
    );
    if (invoices.rows.length != 0) {
      companyResults.rows[0].invoices = invoices.rows.map((inv) => inv.id);
    }
    if (companiesIndustries.rows.length != 0) {
      companyResults.rows[0].industries = companiesIndustries.rows.map(
        (industry) => industry.industry
      );
    }

    return res.json({ company: companyResults.rows[0] });
  } catch (e) {
    next(e);
  }
});
router.put("/:code", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { code } = req.params;
    if (!name || !description)
      throw new ExpressError("Check the format of entered company", 400);
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
