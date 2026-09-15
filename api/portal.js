/*************************************************
 * api/portal.js
 * Vercel → Portal GAS Proxy
 *************************************************/

const PORTAL_GAS_URL =
  "https://script.google.com/macros/s/AKfycbwphhIdSMHpTWHuFrRFTC3lEZe-QQCaZr2cebxb22cE9ph1eYPscyrxdw29T44DaUT9/exec";


export default async function handler(req, res) {

  /*
   * CORS
   */
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  /*
   * OPTIONS
   */
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }


  /*
   * Browser → Vercel ต้องเป็น POST
   */
  if (req.method !== "POST") {

    return res.status(405).json({
      status: "error",
      message: "Method not allowed"
    });
  }


  try {

    /*
     * รับ JSON จาก index.html
     */
    const payload =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});


    console.log(
      "Portal Request:",
      payload
    );


    /*
     * Encode payload
     */
    const json =
      JSON.stringify(payload);

    const base64 =
      Buffer
        .from(json, "utf8")
        .toString("base64");


    /*
     * เรียก Portal GAS ด้วย GET
     */
    const url =
      PORTAL_GAS_URL +
      "?action=" +
      encodeURIComponent(
        String(payload.action || "")
      ) +
      "&payload=" +
      encodeURIComponent(base64);


    console.log(
      "Portal GAS URL:",
      PORTAL_GAS_URL
    );


    const response =
      await fetch(url, {
        method: "GET",
        redirect: "follow"
      });


    const text =
      await response.text();


    console.log(
      "Portal GAS HTTP:",
      response.status
    );


    console.log(
      "Portal GAS Response:",
      text.substring(0, 2000)
    );


    if (!response.ok) {

      return res.status(502).json({

        status: "error",

        message:
          "Portal GAS HTTP error",

        httpStatus:
          response.status,

        raw:
          text.substring(0, 2000)

      });
    }


    /*
     * Parse JSON
     */
    let result;

    try {

      result =
        JSON.parse(text);

    } catch (err) {

      return res.status(502).json({

        status: "error",

        message:
          "Portal GAS returned invalid JSON",

        httpStatus:
          response.status,

        raw:
          text.substring(0, 2000)

      });
    }


    /*
     * ส่งกลับ Browser
     */
    return res
      .status(200)
      .json(result);


  } catch (error) {

    console.error(
      "Portal Proxy Error:",
      error
    );


    return res.status(502).json({

      status: "error",

      message:
        "Cannot connect to Portal API",

      detail:
        error.message

    });
  }
}