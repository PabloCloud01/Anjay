const axios = require('axios');

module.exports = function (app) {
    async function downloadYTMP4(url) {
        try {
            const headers = {
                "accept": "*/*",
                "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": "\"Android\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "Referer": "https://id.ytmp3.mobi/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            };

            const initial = await axios.get(`https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`, { headers });
            const init = initial.data;

            const id = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?/]+)/)?.[1];
            if (!id) throw new Error('Gagal mendapatkan ID video.');

            let convertURL = init.convertURL + `&v=${id}&f=mp4&_=${Math.random()}`;
            const convert = await axios.get(convertURL, { headers });
            const convertData = convert.data;

            let info = {};
            for (let i = 0; i < 3; i++) {
                let progress = await axios.get(convertData.progressURL, { headers });
                info = progress.data;
                if (info.progress === 3) break;
                await new Promise(resolve => setTimeout(resolve, 3000)); // Tunggu 3 detik sebelum cek ulang
            }

            return {
                title: info.title,
                download_url: convertData.downloadURL
            };

        } catch (error) {
            console.error("Error fetching YTMP4:", error);
            throw error;
        }
    }

    app.get('/downloader/ytmp4', async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) {
                return res.status(400).json({ status: false, error: 'URL YouTube diperlukan' });
            }

            const result = await downloadYTMP4(url);
            res.status(200).json({ status: true, result });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
