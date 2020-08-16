const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const industries = await db.query("SELECT * FROM industries");
    const industriesCompanyCodes = await db.query(
      `SELECT industry_code, company_code FROM industries_companies`
    );

    for (let industry of industries.rows) {
      let companyArray = [];
      for (let companyCode of industriesCompanyCodes.rows) {
        if (companyCode.industry_code == industry.code) {
          if (!companyArray.includes(companyCode.company_code)) {
            companyArray.push(companyCode.company_code);
          }
        }
      }
      industry.companies = companyArray;
    }
    return res.json({ industries: industries.rows });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    if (!industry || !code)
      throw new ExpressError("Check the format of your entered industry", 400);
    const checkIndustry = await db.query(
      `SELECT industry from industries where code = $1`,
      [code]
    );
    if (checkIndustry.rows.length != 0) {
      throw new ExpressError("Industry already exists", 409);
    }
    const addIndustry = await db.query(
      `INSERT INTO industries VALUES ($1,$2) RETURNING code, industry`,
      [code, industry]
    );

    return res.json({ industry: addIndustry.rows[0] });
  } catch (e) {
    return next(e);
  }
});
router.post("/associations", async (req, res, next) => {
  try {
    const { company_code, industry_code } = req.body;
    if (!company_code || !industry_code)
      throw new ExpressError(
        "Check the format of your new industry_company association",
        400
      );
    const checkAssociation = await db.query(
      `SELECT company_code, industry_code FROM industries_companies where company_code = $1 AND industry_code = $2`,
      [company_code, industry_code]
    );
    if (checkAssociation.rows.length != 0) {
      throw new ExpressError("Association already exists", 409);
    }
    const associationResults = await db.query(
      `INSERT INTO industries_companies VALUES ($1,$2) RETURNING company_code, industry_code`,
      [company_code, industry_code]
    );
    return res.json({ association: associationResults.rows[0] });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
