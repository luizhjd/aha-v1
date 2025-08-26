/**
 * PREVENT Calculator - Official AHA Equations
 * 
 * Implementation of the AHA PREVENT equations for cardiovascular risk prediction
 * Based on the official R package AHAprevent v1.0.0
 * 
 * Reference: Khan et al. (2024) - AHA PREVENT equations
 */

// Helper Functions

/**
 * Converts SDI decile (1-10) to tertile (0,1,2)
 * @param sdi - Social Deprivation Index decile (1-10)
 * @returns SDI tertile (0, 1, 2)
 */
export function sdicat(sdi: number): number {
  if (sdi >= 1 && sdi < 4) {
    return 0;
  } else if (sdi >= 4 && sdi < 7) {
    return 1;
  } else if (sdi >= 7 && sdi <= 10) {
    return 2;
  }
  return 0; // fallback
}

/**
 * Converts cholesterol from mg/dL to mmol/L
 * @param cholesterol - Cholesterol in mg/dL
 * @returns Cholesterol in mmol/L
 */
export function mmol_conversion(cholesterol: number): number {
  return 0.02586 * cholesterol;
}

/**
 * Adjusts UACR values: any 0 <= UACR < 0.1 becomes 0.1
 * @param uacr - Urine albumin-creatinine ratio (>=0 mg/g)
 * @returns Adjusted UACR value
 */
export function adjust(uacr: number): number {
  if (uacr >= 0.1) {
    return uacr;
  } else if (uacr >= 0 && uacr < 0.1) {
    return 0.1;
  }
  return uacr;
}

// PREVENT Risk Calculation Results Interface
export interface PreventResults {
  prevent_10yr_CVD: number | null;
  prevent_30yr_CVD: number | null;
  prevent_10yr_ASCVD: number | null;
  prevent_30yr_ASCVD: number | null;
  prevent_10yr_HF: number | null;
  prevent_30yr_HF: number | null;
  model: 'base' | 'uacr' | 'hba1c' | 'sdi' | 'full';
}

// PREVENT Input Parameters Interface
export interface PreventInputs {
  sex: number; // 0 = male, 1 = female
  age: number; // 30-79 years
  tc?: number; // Total cholesterol 130-320 mg/dL
  hdl?: number; // HDL cholesterol 20-100 mg/dL
  sbp: number; // Systolic BP 90-200 mmHg
  dm: number; // Diabetes 0 or 1
  smoking: number; // Smoking 0 or 1
  bmi?: number; // BMI 18.5-39.9 kg/m²
  egfr: number; // eGFR >0 mL/min/1.73m²
  bptreat: number; // BP treatment 0 or 1
  statin?: number; // Statin use 0 or 1
  uacr?: number; // UACR >=0 mg/g (optional)
  hba1c?: number; // HbA1c >0 % (optional)
  sdi?: number; // SDI decile 1-10 (optional)
}

/**
 * PREVENT Base Model Risk Calculation
 * Implements the official AHA PREVENT base equation
 */
export function preventBase(params: PreventInputs): PreventResults {
  const { sex, age, tc, hdl, sbp, dm, smoking, bmi, egfr, bptreat, statin } = params;

  let prevent_10yr_CVD: number | null = null;
  let prevent_30yr_CVD: number | null = null;
  let prevent_10yr_ASCVD: number | null = null;
  let prevent_30yr_ASCVD: number | null = null;
  let prevent_10yr_HF: number | null = null;
  let prevent_30yr_HF: number | null = null;

  // Validate required inputs
  if (sex !== 0 && sex !== 1) {
    return {
      prevent_10yr_CVD: null,
      prevent_30yr_CVD: null,
      prevent_10yr_ASCVD: null,
      prevent_30yr_ASCVD: null,
      prevent_10yr_HF: null,
      prevent_30yr_HF: null,
      model: 'base'
    };
  }

  // Age validation
  if (age < 30 || age > 79) {
    return {
      prevent_10yr_CVD: null,
      prevent_30yr_CVD: null,
      prevent_10yr_ASCVD: null,
      prevent_30yr_ASCVD: null,
      prevent_10yr_HF: null,
      prevent_30yr_HF: null,
      model: 'base'
    };
  }

  // 30-year risks not calculated for age > 59
  const calculate30yr = age <= 59;

  let logor_10yr_CVD: number;
  let logor_30yr_CVD: number = 0;
  let logor_10yr_ASCVD: number;
  let logor_30yr_ASCVD: number = 0;
  let logor_10yr_HF: number;
  let logor_30yr_HF: number = 0;

  if (sex === 1) { // Female
    // 10-year CVD risk - Female
    logor_10yr_CVD = -3.307728 +
      0.7939329 * (age - 55) / 10 +
      0.0305239 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
      0.1606857 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.2394003 * (Math.min(sbp, 110) - 110) / 20 +
      0.360078 * (Math.max(sbp, 110) - 130) / 20 +
      0.8667604 * dm +
      0.5360739 * smoking +
      0.6045917 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0433769 * (Math.max(egfr, 60) - 90) / (-15) +
      0.3151672 * bptreat -
      0.1477655 * (statin || 0) -
      0.0663612 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
      0.1197879 * (statin || 0) * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
      0.0819715 * (age - 55) / 10 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
      0.0306769 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.0946348 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.27057 * (age - 55) / 10 * dm -
      0.078715 * (age - 55) / 10 * smoking -
      0.1637806 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);

    if (calculate30yr) {
      // 30-year CVD risk - Female
      logor_30yr_CVD = -1.318827 +
        0.5503079 * (age - 55) / 10 -
        0.0928369 * Math.pow((age - 55) / 10, 2) +
        0.0409794 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
        (-0.1663306) * (mmol_conversion(hdl || 0) - 1.3) / 0.3 +
        (-0.1628654) * (Math.min(sbp, 110) - 110) / 20 +
        0.3299505 * (Math.max(sbp, 110) - 130) / 20 +
        0.6793894 * dm +
        0.3196112 * smoking +
        0.1857101 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0553528 * (Math.max(egfr, 60) - 90) / (-15) +
        0.2894 * bptreat +
        (-0.075688) * (statin || 0) +
        (-0.056367) * bptreat * (Math.max(sbp, 110) - 130) / 20 +
        0.1071019 * (statin || 0) * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
        (-0.0751438) * (age - 55) / 10 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
        0.0301786 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 +
        (-0.0998776) * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 +
        (-0.3206166) * (age - 55) / 10 * dm +
        (-0.1607862) * (age - 55) / 10 * smoking +
        (-0.1450788) * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);
    }

    // 10-year ASCVD risk - Female
    logor_10yr_ASCVD = -3.819975 +
      0.719883 * (age - 55) / 10 +
      0.1176967 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
      0.151185 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.0835358 * (Math.min(sbp, 110) - 110) / 20 +
      0.3592852 * (Math.max(sbp, 110) - 130) / 20 +
      0.8348585 * dm +
      0.4831078 * smoking +
      0.4864619 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0397779 * (Math.max(egfr, 60) - 90) / (-15) +
      0.2265309 * bptreat -
      0.0592374 * (statin || 0) -
      0.0395762 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
      0.0844423 * (statin || 0) * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
      0.0567839 * (age - 55) / 10 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) +
      0.0325692 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.1035985 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.2417542 * (age - 55) / 10 * dm -
      0.0791142 * (age - 55) / 10 * smoking -
      0.1671492 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);

    if (calculate30yr) {
      // 30-year ASCVD risk - Female
      logor_30yr_ASCVD = -1.974074 +
        0.4669202 * (age - 55) / 10 -
        0.0893118 * Math.pow((age - 55) / 10, 2) +
        0.1256901 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
        0.1542255 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.0018093 * (Math.min(sbp, 110) - 110) / 20 +
        0.322949 * (Math.max(sbp, 110) - 130) / 20 +
        0.6296707 * dm +
        0.268292 * smoking +
        0.100106 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0499663 * (Math.max(egfr, 60) - 90) / (-15) +
        0.1875292 * bptreat +
        0.0152476 * (statin || 0) -
        0.0276123 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
        0.0736147 * (statin || 0) * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
        0.0521962 * (age - 55) / 10 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) +
        0.0316918 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.1046101 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.2727793 * (age - 55) / 10 * dm -
        0.1530907 * (age - 55) / 10 * smoking -
        0.1299149 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);
    }

    // 10-year HF risk - Female
    logor_10yr_HF = -4.310409 +
      0.8998235 * (age - 55) / 10 -
      0.4559771 * (Math.min(sbp, 110) - 110) / 20 +
      0.3576505 * (Math.max(sbp, 110) - 130) / 20 +
      1.038346 * dm +
      0.583916 * smoking -
      0.0072294 * (Math.min(bmi || 25, 30) - 25) / 5 +
      0.2997706 * (Math.max(bmi || 25, 30) - 30) / 5 +
      0.7451638 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0557087 * (Math.max(egfr, 60) - 90) / (-15) +
      0.3534442 * bptreat -
      0.0981511 * bptreat * (Math.max(sbp, 110) - 130) / 20 -
      0.0946663 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.3581041 * (age - 55) / 10 * dm -
      0.1159453 * (age - 55) / 10 * smoking -
      0.003878 * (age - 55) / 10 * (Math.max(bmi || 25, 30) - 30) / 5 -
      0.1884289 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);

    if (calculate30yr) {
      // 30-year HF risk - Female
      logor_30yr_HF = -2.205379 +
        0.6254374 * (age - 55) / 10 -
        0.0983038 * Math.pow((age - 55) / 10, 2) -
        0.3919241 * (Math.min(sbp, 110) - 110) / 20 +
        0.3142295 * (Math.max(sbp, 110) - 130) / 20 +
        0.8330787 * dm +
        0.3438651 * smoking +
        0.0594874 * (Math.min(bmi || 25, 30) - 25) / 5 +
        0.2525536 * (Math.max(bmi || 25, 30) - 30) / 5 +
        0.2981642 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0667159 * (Math.max(egfr, 60) - 90) / (-15) +
        0.333921 * bptreat -
        0.0893177 * bptreat * (Math.max(sbp, 110) - 130) / 20 -
        0.0974299 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.404855 * (age - 55) / 10 * dm -
        0.1982991 * (age - 55) / 10 * smoking -
        0.0035619 * (age - 55) / 10 * (Math.max(bmi || 25, 30) - 30) / 5 -
        0.1564215 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);
    }

  } else { // Male
    // 10-year CVD risk - Male
    logor_10yr_CVD = -3.031168 +
      0.7688528 * (age - 55) / 10 +
      0.0736174 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
      0.0954431 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.4347345 * (Math.min(sbp, 110) - 110) / 20 +
      0.3362658 * (Math.max(sbp, 110) - 130) / 20 +
      0.7692857 * dm +
      0.4386871 * smoking +
      0.5378979 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0164827 * (Math.max(egfr, 60) - 90) / (-15) +
      0.288879 * bptreat -
      0.1337349 * (statin || 0) -
      0.0475924 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
      0.150273 * (statin || 0) * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
      0.0517874 * (age - 55) / 10 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
      0.0191169 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.1049477 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.2251948 * (age - 55) / 10 * dm -
      0.0895067 * (age - 55) / 10 * smoking -
      0.1543702 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);

    if (calculate30yr) {
      // 30-year CVD risk - Male
      logor_30yr_CVD = -1.148204 +
        0.4627309 * (age - 55) / 10 -
        0.0984281 * Math.pow((age - 55) / 10, 2) +
        0.0836088 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
        (-0.1029824) * (mmol_conversion(hdl || 0) - 1.3) / 0.3 +
        (-0.2140352) * (Math.min(sbp, 110) - 110) / 20 +
        0.2904325 * (Math.max(sbp, 110) - 130) / 20 +
        0.5331276 * dm +
        0.2141914 * smoking +
        0.1155556 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0603775 * (Math.max(egfr, 60) - 90) / (-15) +
        0.232714 * bptreat +
        (-0.0272112) * (statin || 0) +
        (-0.0384488) * bptreat * (Math.max(sbp, 110) - 130) / 20 +
        0.134192 * (statin || 0) * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
        (-0.0511759) * (age - 55) / 10 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
        0.0165865 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 +
        (-0.1101437) * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 +
        (-0.2585943) * (age - 55) / 10 * dm +
        (-0.1566406) * (age - 55) / 10 * smoking +
        (-0.1166776) * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);
    }

    // 10-year ASCVD risk - Male
    logor_10yr_ASCVD = -3.500655 +
      0.7099847 * (age - 55) / 10 +
      0.1658663 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
      0.1144285 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.2837212 * (Math.min(sbp, 110) - 110) / 20 +
      0.3239977 * (Math.max(sbp, 110) - 130) / 20 +
      0.7189597 * dm +
      0.3956973 * smoking +
      0.3690075 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0203619 * (Math.max(egfr, 60) - 90) / (-15) +
      0.2036522 * bptreat -
      0.0865581 * (statin || 0) -
      0.0322916 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
      0.114563 * (statin || 0) * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
      0.0300005 * (age - 55) / 10 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) +
      0.0232747 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.0927024 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.2018525 * (age - 55) / 10 * dm -
      0.0970527 * (age - 55) / 10 * smoking -
      0.1217081 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);

    if (calculate30yr) {
      // 30-year ASCVD risk - Male
      logor_30yr_ASCVD = -1.736444 +
        0.3994099 * (age - 55) / 10 -
        0.0937484 * Math.pow((age - 55) / 10, 2) +
        0.1744643 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
        0.120203 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.0665117 * (Math.min(sbp, 110) - 110) / 20 +
        0.2753037 * (Math.max(sbp, 110) - 130) / 20 +
        0.4790257 * dm +
        0.1782635 * smoking -
        0.0218789 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0602553 * (Math.max(egfr, 60) - 90) / (-15) +
        0.1421182 * bptreat +
        0.0135996 * (statin || 0) -
        0.0218265 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
        0.1013148 * (statin || 0) * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
        0.0312619 * (age - 55) / 10 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) +
        0.020673 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.0920935 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.2159947 * (age - 55) / 10 * dm -
        0.1548811 * (age - 55) / 10 * smoking -
        0.0712547 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);
    }

    // 10-year HF risk - Male
    logor_10yr_HF = -3.946391 +
      0.8972642 * (age - 55) / 10 -
      0.6811466 * (Math.min(sbp, 110) - 110) / 20 +
      0.3634461 * (Math.max(sbp, 110) - 130) / 20 +
      0.923776 * dm +
      0.5023736 * smoking -
      0.0485841 * (Math.min(bmi || 25, 30) - 25) / 5 +
      0.3726929 * (Math.max(bmi || 25, 30) - 30) / 5 +
      0.6926917 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0251827 * (Math.max(egfr, 60) - 90) / (-15) +
      0.2980922 * bptreat -
      0.0497731 * bptreat * (Math.max(sbp, 110) - 130) / 20 -
      0.1289201 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.3040924 * (age - 55) / 10 * dm -
      0.1401688 * (age - 55) / 10 * smoking +
      0.0068126 * (age - 55) / 10 * (Math.max(bmi || 25, 30) - 30) / 5 -
      0.1797778 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);

    if (calculate30yr) {
      // 30-year HF risk - Male
      logor_30yr_HF = -1.95751 +
        0.5681541 * (age - 55) / 10 -
        0.1048388 * Math.pow((age - 55) / 10, 2) -
        0.4761564 * (Math.min(sbp, 110) - 110) / 20 +
        0.30324 * (Math.max(sbp, 110) - 130) / 20 +
        0.6840338 * dm +
        0.2656273 * smoking +
        0.0833107 * (Math.min(bmi || 25, 30) - 25) / 5 +
        0.26999 * (Math.max(bmi || 25, 30) - 30) / 5 +
        0.2541805 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0638923 * (Math.max(egfr, 60) - 90) / (-15) +
        0.2583631 * bptreat -
        0.0391938 * bptreat * (Math.max(sbp, 110) - 130) / 20 -
        0.1269124 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.3273572 * (age - 55) / 10 * dm -
        0.2043019 * (age - 55) / 10 * smoking -
        0.0182831 * (age - 55) / 10 * (Math.max(bmi || 25, 30) - 30) / 5 -
        0.1342618 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15);
    }
  }

  // Convert log odds to percentages
  prevent_10yr_CVD = 100 * Math.exp(logor_10yr_CVD) / (1 + Math.exp(logor_10yr_CVD));
  prevent_10yr_ASCVD = 100 * Math.exp(logor_10yr_ASCVD) / (1 + Math.exp(logor_10yr_ASCVD));
  prevent_10yr_HF = 100 * Math.exp(logor_10yr_HF) / (1 + Math.exp(logor_10yr_HF));

  if (calculate30yr) {
    prevent_30yr_CVD = 100 * Math.exp(logor_30yr_CVD) / (1 + Math.exp(logor_30yr_CVD));
    prevent_30yr_ASCVD = 100 * Math.exp(logor_30yr_ASCVD) / (1 + Math.exp(logor_30yr_ASCVD));
    prevent_30yr_HF = 100 * Math.exp(logor_30yr_HF) / (1 + Math.exp(logor_30yr_HF));
  }

  // Additional validations based on missing variables
  if (!tc || tc < 130 || tc > 320) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
  }

  if (!hdl || hdl < 20 || hdl > 100) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
  }

  if (sbp < 90 || sbp > 200) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
    prevent_10yr_HF = null;
    prevent_30yr_HF = null;
  }

  if (egfr <= 0) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
    prevent_10yr_HF = null;
    prevent_30yr_HF = null;
  }

  if (statin === undefined) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
  }

  if (!bmi || bmi < 18.5 || bmi >= 40) {
    prevent_10yr_HF = null;
    prevent_30yr_HF = null;
  }

  return {
    prevent_10yr_CVD,
    prevent_30yr_CVD,
    prevent_10yr_ASCVD,
    prevent_30yr_ASCVD,
    prevent_10yr_HF,
    prevent_30yr_HF,
    model: 'base'
  };
}

/**
 * PREVENT Full Model Risk Calculation
 * Implements the official AHA PREVENT full equation with optional variables
 */
export function preventFull(params: PreventInputs): PreventResults {
  const { sex, age, tc, hdl, sbp, dm, smoking, bmi, egfr, bptreat, statin, uacr, hba1c, sdi } = params;

  let prevent_10yr_CVD: number | null = null;
  let prevent_30yr_CVD: number | null = null;
  let prevent_10yr_ASCVD: number | null = null;
  let prevent_30yr_ASCVD: number | null = null;
  let prevent_10yr_HF: number | null = null;
  let prevent_30yr_HF: number | null = null;

  // Validate required inputs
  if (sex !== 0 && sex !== 1) {
    return {
      prevent_10yr_CVD: null,
      prevent_30yr_CVD: null,
      prevent_10yr_ASCVD: null,
      prevent_30yr_ASCVD: null,
      prevent_10yr_HF: null,
      prevent_30yr_HF: null,
      model: 'full'
    };
  }

  // Age validation
  if (age < 30 || age > 79) {
    return {
      prevent_10yr_CVD: null,
      prevent_30yr_CVD: null,
      prevent_10yr_ASCVD: null,
      prevent_30yr_ASCVD: null,
      prevent_10yr_HF: null,
      prevent_30yr_HF: null,
      model: 'full'
    };
  }

  // 30-year risks not calculated for age > 59
  const calculate30yr = age <= 59;

  let logor_10yr_CVD: number;
  let logor_30yr_CVD: number = 0;
  let logor_10yr_ASCVD: number;
  let logor_30yr_ASCVD: number = 0;
  let logor_10yr_HF: number;
  let logor_30yr_HF: number = 0;

  // Helper function for SDI terms
  const getSdiTerm = (coef1: number, coef2: number, missingCoef: number): number => {
    if (sdi !== undefined) {
      const sdiTertile = sdicat(sdi);
      return coef1 * (2 - sdiTertile) * sdiTertile + coef2 * (sdiTertile - 1) * (0.5 * sdiTertile);
    } else {
      return missingCoef;
    }
  };

  // Helper function for UACR terms
  const getUacrTerm = (coef: number, missingCoef: number): number => {
    if (uacr !== undefined) {
      return coef * Math.log(adjust(uacr));
    } else {
      return missingCoef;
    }
  };

  // Helper function for HbA1c terms
  const getHba1cTerm = (coefDm: number, coefNoDm: number, missingCoef: number): number => {
    if (hba1c !== undefined) {
      return coefDm * (hba1c - 5.3) * dm + coefNoDm * (hba1c - 5.3) * (1 - dm);
    } else {
      return missingCoef;
    }
  };

  if (sex === 1) { // Female
    // 10-year CVD risk - Female (Full model)
    logor_10yr_CVD = -3.860385 +
      0.7716794 * (age - 55) / 10 +
      0.0062109 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
      0.1547756 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.1933123 * (Math.min(sbp, 110) - 110) / 20 +
      0.3071217 * (Math.max(sbp, 110) - 130) / 20 +
      0.496753 * dm +
      0.466605 * smoking +
      0.4780697 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0529077 * (Math.max(egfr, 60) - 90) / (-15) +
      0.3034892 * bptreat -
      0.1556524 * (statin || 0) -
      0.0667026 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
      0.1061825 * (statin || 0) * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
      0.0742271 * (age - 55) / 10 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
      0.0288245 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.0875188 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.2267102 * (age - 55) / 10 * dm -
      0.0676125 * (age - 55) / 10 * smoking -
      0.1493231 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
      getSdiTerm(0.1361989, 0.2261596, 0.1804508) +
      getUacrTerm(0.1645922, 0.0198413) +
      getHba1cTerm(0.1298513, 0.1412555, -0.0031658);

    // 10-year ASCVD risk - Female (Full model)
    logor_10yr_ASCVD = -4.291503 +
      0.7023067 * (age - 55) / 10 +
      0.0898765 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
      0.1407316 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.0256648 * (Math.min(sbp, 110) - 110) / 20 +
      0.314511 * (Math.max(sbp, 110) - 130) / 20 +
      0.4799217 * dm +
      0.4062049 * smoking +
      0.3847744 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0495174 * (Math.max(egfr, 60) - 90) / (-15) +
      0.2133861 * bptreat -
      0.0678552 * (statin || 0) -
      0.0451416 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
      0.0788187 * (statin || 0) * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
      0.0535985 * (age - 55) / 10 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) +
      0.0291762 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.0961839 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.2001466 * (age - 55) / 10 * dm -
      0.0586472 * (age - 55) / 10 * smoking -
      0.1537791 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
      getSdiTerm(0.1413965, 0.228136, 0.1588908) +
      getUacrTerm(0.1371824, 0.0061613) +
      getHba1cTerm(0.123192, 0.1410572, 0.005866);

    // 10-year HF risk - Female (Full model)
    logor_10yr_HF = -4.896524 +
      0.884209 * (age - 55) / 10 -
      0.421474 * (Math.min(sbp, 110) - 110) / 20 +
      0.3002919 * (Math.max(sbp, 110) - 130) / 20 +
      0.6170359 * dm +
      0.5380269 * smoking -
      0.0191335 * (Math.min(bmi || 25, 30) - 25) / 5 +
      0.2764302 * (Math.max(bmi || 25, 30) - 30) / 5 +
      0.5975847 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0654197 * (Math.max(egfr, 60) - 90) / (-15) +
      0.3313614 * bptreat -
      0.1002304 * bptreat * (Math.max(sbp, 110) - 130) / 20 -
      0.0845363 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.2989062 * (age - 55) / 10 * dm -
      0.1111354 * (age - 55) / 10 * smoking +
      0.0008104 * (age - 55) / 10 * (Math.max(bmi || 25, 30) - 30) / 5 -
      0.1666635 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
      getSdiTerm(0.1213034, 0.2314147, 0.1819138) +
      getUacrTerm(0.1948135, 0.0395368) +
      getHba1cTerm(0.176668, 0.1614911, -0.0010583);

    if (calculate30yr) {
      // 30-year CVD risk - Female (Full model)
      logor_30yr_CVD = -1.748475 +
        0.5073749 * (age - 55) / 10 -
        0.0981751 * Math.pow((age - 55) / 10, 2) +
        0.0162303 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
        0.1617147 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.1111241 * (Math.min(sbp, 110) - 110) / 20 +
        0.282946 * (Math.max(sbp, 110) - 130) / 20 +
        0.4004069 * dm +
        0.2918701 * smoking +
        0.1017102 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0622643 * (Math.max(egfr, 60) - 90) / (-15) +
        0.2872416 * bptreat -
        0.0768135 * (statin || 0) -
        0.0557282 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
        0.0917585 * (statin || 0) * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
        0.0679131 * (age - 55) / 10 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
        0.029076 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.0907755 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.2702118 * (age - 55) / 10 * dm -
        0.1373216 * (age - 55) / 10 * smoking -
        0.1255864 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
        getSdiTerm(0.1067741, 0.1853138, 0.1567115) +
        getUacrTerm(0.1028065, -0.0006181) +
        getHba1cTerm(0.0925285, 0.0975598, 0.0101713);

      // 30-year ASCVD risk - Female (Full model)
      logor_30yr_ASCVD = -2.314066 +
        0.4386739 * (age - 55) / 10 -
        0.0921956 * Math.pow((age - 55) / 10, 2) +
        0.0977728 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
        0.1453525 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 +
        0.0590925 * (Math.min(sbp, 110) - 110) / 20 +
        0.2862862 * (Math.max(sbp, 110) - 130) / 20 +
        0.3669136 * dm +
        0.2354695 * smoking +
        0.0354338 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0573093 * (Math.max(egfr, 60) - 90) / (-15) +
        0.1840085 * bptreat +
        0.0117504 * (statin || 0) -
        0.0331945 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
        0.0664311 * (statin || 0) * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
        0.0492826 * (age - 55) / 10 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) +
        0.0288888 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.0964709 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.2279648 * (age - 55) / 10 * dm -
        0.120405 * (age - 55) / 10 * smoking -
        0.1157635 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
        getSdiTerm(0.1107632, 0.1840367, 0.1308962) +
        getUacrTerm(0.0810739, -0.0147785) +
        getHba1cTerm(0.0794709, 0.1002615, 0.017301);

      // 30-year HF risk - Female (Full model)
      logor_30yr_HF = -2.642208 +
        0.5927507 * (age - 55) / 10 -
        0.1028754 * Math.pow((age - 55) / 10, 2) -
        0.3593781 * (Math.min(sbp, 110) - 110) / 20 +
        0.2628556 * (Math.max(sbp, 110) - 130) / 20 +
        0.5113472 * dm +
        0.347344 * smoking +
        0.0564656 * (Math.min(bmi || 25, 30) - 25) / 5 +
        0.2363857 * (Math.max(bmi || 25, 30) - 30) / 5 +
        0.1971295 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0735227 * (Math.max(egfr, 60) - 90) / (-15) +
        0.3219386 * bptreat -
        0.0880321 * bptreat * (Math.max(sbp, 110) - 130) / 20 -
        0.0863132 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.3425359 * (age - 55) / 10 * dm -
        0.181405 * (age - 55) / 10 * smoking +
        0.0031285 * (age - 55) / 10 * (Math.max(bmi || 25, 30) - 30) / 5 -
        0.1356989 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
        getSdiTerm(0.0847634, 0.18397, 0.1485802) +
        getUacrTerm(0.1273306, 0.0167008) +
        getHba1cTerm(0.1378342, 0.1138832, 0.0138979);
    }

  } else { // Male
    // 10-year CVD risk - Male (Full model)
    logor_10yr_CVD = -3.631387 +
      0.7847578 * (age - 55) / 10 +
      0.0534485 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
      0.0911282 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.4921973 * (Math.min(sbp, 110) - 110) / 20 +
      0.2972415 * (Math.max(sbp, 110) - 130) / 20 +
      0.4527054 * dm +
      0.3726641 * smoking +
      0.3886854 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0081661 * (Math.max(egfr, 60) - 90) / (-15) +
      0.2508052 * bptreat -
      0.1538484 * (statin || 0) -
      0.0474695 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
      0.1415382 * (statin || 0) * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
      0.0436455 * (age - 55) / 10 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
      0.0199549 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.1022686 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.1762507 * (age - 55) / 10 * dm -
      0.0715873 * (age - 55) / 10 * smoking -
      0.1428668 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
      getSdiTerm(0.0802431, 0.275073, 0.144759) +
      getUacrTerm(0.1772853, 0.1095674) +
      getHba1cTerm(0.1165698, 0.1048297, -0.0230072);

    // 10-year ASCVD risk - Male (Full model)
    logor_10yr_ASCVD = -3.969788 +
      0.7128741 * (age - 55) / 10 +
      0.1465201 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
      0.1125794 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.3387216 * (Math.min(sbp, 110) - 110) / 20 +
      0.2980252 * (Math.max(sbp, 110) - 130) / 20 +
      0.399583 * dm +
      0.3379111 * smoking +
      0.2582604 * (Math.min(egfr, 60) - 60) / (-15) +
      0.0147769 * (Math.max(egfr, 60) - 90) / (-15) +
      0.1686621 * bptreat -
      0.1073619 * (statin || 0) -
      0.0381038 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
      0.1034169 * (statin || 0) * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
      0.0228755 * (age - 55) / 10 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) +
      0.0267453 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
      0.0897449 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.1497464 * (age - 55) / 10 * dm -
      0.077206 * (age - 55) / 10 * smoking -
      0.1198368 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
      getSdiTerm(0.0651121, 0.2676683, 0.1388492) +
      getUacrTerm(0.1375837, 0.0652944) +
      getHba1cTerm(0.101282, 0.1092726, -0.0112852);

    // 10-year HF risk - Male (Full model)
    logor_10yr_HF = -4.663513 +
      0.9095703 * (age - 55) / 10 -
      0.6765184 * (Math.min(sbp, 110) - 110) / 20 +
      0.3111651 * (Math.max(sbp, 110) - 130) / 20 +
      0.5535052 * dm +
      0.4326811 * smoking -
      0.0854286 * (Math.min(bmi || 25, 30) - 25) / 5 +
      0.3551736 * (Math.max(bmi || 25, 30) - 30) / 5 +
      0.5102245 * (Math.min(egfr, 60) - 60) / (-15) +
      0.015472 * (Math.max(egfr, 60) - 90) / (-15) +
      0.2570964 * bptreat -
      0.0591177 * bptreat * (Math.max(sbp, 110) - 130) / 20 -
      0.1219056 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
      0.2437577 * (age - 55) / 10 * dm -
      0.105363 * (age - 55) / 10 * smoking +
      0.0037907 * (age - 55) / 10 * (Math.max(bmi || 25, 30) - 30) / 5 -
      0.1660207 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
      getSdiTerm(0.1106372, 0.3371204, 0.1694628) +
      getUacrTerm(0.2164607, 0.1702805) +
      getHba1cTerm(0.148297, 0.1234088, -0.0234637);

    if (calculate30yr) {
      // 30-year CVD risk - Male (Full model)
      logor_30yr_CVD = -1.504558 +
        0.4427595 * (age - 55) / 10 -
        0.1064108 * Math.pow((age - 55) / 10, 2) +
        0.0629381 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
        0.1015427 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.2542326 * (Math.min(sbp, 110) - 110) / 20 +
        0.2549679 * (Math.max(sbp, 110) - 130) / 20 +
        0.333835 * dm +
        0.1873833 * smoking +
        0.0246102 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0552014 * (Math.max(egfr, 60) - 90) / (-15) +
        0.1979729 * bptreat -
        0.0407714 * (statin || 0) -
        0.0365522 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
        0.1232822 * (statin || 0) * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) -
        0.0441334 * (age - 55) / 10 * (mmol_conversion((tc || 0) - (hdl || 0)) - 3.5) +
        0.0177865 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.1046657 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.2116113 * (age - 55) / 10 * dm -
        0.1277905 * (age - 55) / 10 * smoking -
        0.0955922 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
        getSdiTerm(0.0256704, 0.1887637, 0.089241) +
        getUacrTerm(0.0894596, 0.0710124) +
        getHba1cTerm(0.0676202, 0.063409, 0.0038783);

      // 30-year ASCVD risk - Male (Full model)
      logor_30yr_ASCVD = -1.985368 +
        0.3743566 * (age - 55) / 10 -
        0.0995499 * Math.pow((age - 55) / 10, 2) +
        0.1544808 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
        0.1215297 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.1083968 * (Math.min(sbp, 110) - 110) / 20 +
        0.2555179 * (Math.max(sbp, 110) - 130) / 20 +
        0.2696998 * dm +
        0.1628432 * smoking -
        0.077507 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0583407 * (Math.max(egfr, 60) - 90) / (-15) +
        0.1120322 * bptreat -
        0.0025063 * (statin || 0) -
        0.0256116 * bptreat * (Math.max(sbp, 110) - 130) / 20 +
        0.0886745 * (statin || 0) * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) -
        0.0254507 * (age - 55) / 10 * (mmol_conversion(tc || 0) - mmol_conversion(hdl || 0) - 3.5) +
        0.0244639 * (age - 55) / 10 * (mmol_conversion(hdl || 0) - 1.3) / 0.3 -
        0.0869146 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.165745 * (age - 55) / 10 * dm -
        0.1244714 * (age - 55) / 10 * smoking -
        0.0624552 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
        getSdiTerm(0.015675, 0.1864231, 0.0845697) +
        getUacrTerm(0.0560171, 0.0252244) +
        getHba1cTerm(0.0501422, 0.0722905, 0.0114945);

      // 30-year HF risk - Male (Full model)
      logor_30yr_HF = -2.425439 +
        0.5478829 * (age - 55) / 10 -
        0.1111928 * Math.pow((age - 55) / 10, 2) -
        0.4547346 * (Math.min(sbp, 110) - 110) / 20 +
        0.2527602 * (Math.max(sbp, 110) - 130) / 20 +
        0.4385384 * dm +
        0.2397952 * smoking +
        0.0640931 * (Math.min(bmi || 25, 30) - 25) / 5 +
        0.2643081 * (Math.max(bmi || 25, 30) - 30) / 5 +
        0.1354588 * (Math.min(egfr, 60) - 60) / (-15) +
        0.0570689 * (Math.max(egfr, 60) - 90) / (-15) +
        0.220666 * bptreat -
        0.0436769 * bptreat * (Math.max(sbp, 110) - 130) / 20 -
        0.1168376 * (age - 55) / 10 * (Math.max(sbp, 110) - 130) / 20 -
        0.2730055 * (age - 55) / 10 * dm -
        0.1573691 * (age - 55) / 10 * smoking -
        0.0174998 * (age - 55) / 10 * (Math.max(bmi || 25, 30) - 30) / 5 -
        0.1128676 * (age - 55) / 10 * (Math.min(egfr, 60) - 60) / (-15) +
        getSdiTerm(0.057746, 0.2446441, 0.1076782) +
        getUacrTerm(0.1233486, 0.1274796) +
        getHba1cTerm(0.0985062, 0.0804844, 0.0022806);
    }
  }

  // Convert log odds to percentages
  prevent_10yr_CVD = 100 * Math.exp(logor_10yr_CVD) / (1 + Math.exp(logor_10yr_CVD));
  prevent_10yr_ASCVD = 100 * Math.exp(logor_10yr_ASCVD) / (1 + Math.exp(logor_10yr_ASCVD));
  prevent_10yr_HF = 100 * Math.exp(logor_10yr_HF) / (1 + Math.exp(logor_10yr_HF));

  if (calculate30yr) {
    prevent_30yr_CVD = 100 * Math.exp(logor_30yr_CVD) / (1 + Math.exp(logor_30yr_CVD));
    prevent_30yr_ASCVD = 100 * Math.exp(logor_30yr_ASCVD) / (1 + Math.exp(logor_30yr_ASCVD));
    prevent_30yr_HF = 100 * Math.exp(logor_30yr_HF) / (1 + Math.exp(logor_30yr_HF));
  }

  // Additional validations based on missing variables
  if (!tc || tc < 130 || tc > 320) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
  }

  if (!hdl || hdl < 20 || hdl > 100) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
  }

  if (sbp < 90 || sbp > 200) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
    prevent_10yr_HF = null;
    prevent_30yr_HF = null;
  }

  if (egfr <= 0) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
    prevent_10yr_HF = null;
    prevent_30yr_HF = null;
  }

  if (statin === undefined) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
  }

  if (!bmi || bmi < 18.5 || bmi >= 40) {
    prevent_10yr_HF = null;
    prevent_30yr_HF = null;
  }

  // Additional validations for optional variables in full model
  if (uacr !== undefined && uacr < 0) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
    prevent_10yr_HF = null;
    prevent_30yr_HF = null;
  }

  if (hba1c !== undefined && hba1c <= 0) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
    prevent_10yr_HF = null;
    prevent_30yr_HF = null;
  }

  if (sdi !== undefined && (sdi < 1 || sdi > 10)) {
    prevent_10yr_CVD = null;
    prevent_30yr_CVD = null;
    prevent_10yr_ASCVD = null;
    prevent_30yr_ASCVD = null;
    prevent_10yr_HF = null;
    prevent_30yr_HF = null;
  }

  return {
    prevent_10yr_CVD,
    prevent_30yr_CVD,
    prevent_10yr_ASCVD,
    prevent_30yr_ASCVD,
    prevent_10yr_HF,
    prevent_30yr_HF,
    model: 'full'
  };
}

/**
 * Main PREVENT calculator function - automatically selects best model
 */
export function calculatePreventRisk(params: PreventInputs): PreventResults {
  // Determine which model to use based on available data
  const hasOptionalVars = params.uacr !== undefined || params.hba1c !== undefined || params.sdi !== undefined;

  if (hasOptionalVars) {
    return preventFull(params);
  } else {
    return preventBase(params);
  }
}

/**
 * Utility function to format risk percentage for display
 */
export function formatRiskPercentage(risk: number | null): string {
  if (risk === null) {
    return 'N/A';
  }
  return `${risk.toFixed(1)}%`;
}

/**
 * Risk interpretation function
 */
export function interpretRisk(risk: number | null, type: 'CVD' | 'ASCVD' | 'HF', timeframe: '10yr' | '30yr'): string {
  if (risk === null) {
    return 'Não calculável com os dados fornecidos';
  }

  if (type === 'ASCVD' && timeframe === '10yr') {
    if (risk < 5) return 'Baixo risco';
    if (risk < 7.5) return 'Risco intermediário';
    if (risk < 20) return 'Alto risco';
    return 'Muito alto risco';
  }

  // General risk categories
  if (risk < 5) return 'Baixo risco';
  if (risk < 10) return 'Risco intermediário baixo';
  if (risk < 20) return 'Risco intermediário alto';
  return 'Alto risco';
}