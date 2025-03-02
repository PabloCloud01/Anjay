const axios = require("axios");

async function cekStatus(merchant, keyorkut) {
    try {
        const apiUrl = `https://www.gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
        const response = await axios.get(apiUrl);
        const result = response.data;

        const latestTransaction = result.data && result.data.length > 0 ? result.data[0] : null;
        return latestTransaction || { message: "No transactions found." };
    } catch (error) {
        return { error: error.message };
    }
}

module.exports = function (app) {
    app.get("/orkut/checkstatus", async (req, res) => {
        try {
            const { merchant, keyorkut } = req.query;
            if (!merchant || !keyorkut) {
                return res.status(400).json({ status: false, message: "merchant dan keyorkut wajib diisi" });
            }

            const result = await cekStatus(merchant, keyorkut);
            res.status(200).json({ status: true, result });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    });
};
