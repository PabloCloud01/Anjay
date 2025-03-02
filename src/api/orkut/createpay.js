const axios = require("axios");
const QRCode = require("qrcode");
const FormData = require("form-data");
const stream = require("stream");

function convertCRC16(str) {
    let crc = 0xffff;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

function generateTransactionId() {
    return `TRX${Date.now()}`;
}

function generateExpirationTime() {
    return new Date(Date.now() + 30 * 60 * 1000).toISOString();
}

async function uploadBufferToUguu(buffer, filename = "qrcode.png") {
    try {
        const form = new FormData();
        const passthrough = new stream.PassThrough();
        passthrough.end(buffer);
        form.append("files[]", passthrough, { filename });

        const response = await axios.post("https://uguu.se/upload.php", form, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
                ...form.getHeaders(),
            },
        });

        if (response.data?.files?.[0]) {
            return response.data.files[0];
        } else {
            throw new Error("Uguu upload failed");
        }
    } catch (error) {
        throw new Error(`Uguu upload failed: ${error.message}`);
    }
}

async function createQRIS(amount, codeqr) {
    try {
        let qrisData = codeqr.slice(0, -4).replace("010211", "010212");
        const [part1, part2] = qrisData.split("5802ID");
        amount = amount.toString();
        const uang = `54${amount.length.toString().padStart(2, "0")}${amount}5802ID`;

        const finalQRIS = `${part1}${uang}${part2}${convertCRC16(part1 + uang + part2)}`;
        const buffer = await QRCode.toBuffer(finalQRIS);
        const uploadedFile = await uploadBufferToUguu(buffer);

        return {
            transactionId: generateTransactionId(),
            amount,
            expirationTime: generateExpirationTime(),
            qrImageUrl: uploadedFile.url,
        };
    } catch (error) {
        console.error("Error generating and uploading QR code:", error);
        throw error;
    }
}

module.exports = function (app) {
    app.get("/orkut/createpayment", async (req, res) => {
        try {
            let { amount, codeqr } = req.query;
            if (!amount || !codeqr) return res.status(400).json({ status: false, message: "amount dan codeqr wajib diisi" });

            amount = parseInt(amount);
            if (isNaN(amount) || amount < 1) return res.status(400).json({ status: false, message: "Minimal amount adalah 1" });

            // **Menambahkan Biaya Admin (1 - 999)**
            const adminFee = Math.floor(Math.random() * 999) + 1;
            const totalAmount = amount + adminFee;

            // **Membuat QRIS**
            const qrisData = await createQRIS(totalAmount, codeqr);

            res.json({
                status: true,
                transactionId: qrisData.transactionId,
                amount,
                adminFee,
                totalAmount,
                expirationTime: qrisData.expirationTime,
                qrImageUrl: qrisData.qrImageUrl,
            });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    });
};
