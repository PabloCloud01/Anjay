const axios = require('axios');

module.exports = function (app) {
    async function downloadYTMP3(url) {
        try {
            const response = await axios.get(`https://p.oceansaver.in/ajax/download.php?format=mp3&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.data || !response.data.success) {
                throw new Error('Gagal mendapatkan data unduhan.');
            }

            const { id } = response.data;
            if (!id) throw new Error('ID unduhan tidak ditemukan.');

            // Mengecek progress dan mendapatkan link download
            while (true) {
                const progress = await axios.get(`https://p.oceansaver.in/ajax/progress.php?id=${id}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (progress.data && progress.data.success && progress.data.progress === 1000) {
                    return {
                        title: response.data.info.title,
                        thumbnail: response.data.info.image,
                        download_url: progress.data.download_url
                    };
                }

                await new Promise(resolve => setTimeout(resolve, 5000)); // Tunggu 5 detik sebelum cek ulang
            }
        } catch (error) {
            console.error("Error fetching YTMP3:", error);
            throw error;
        }
    }

    app.get('/downloader/ytmp3', async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) {
                return res.status(400).json({ status: false, error: 'URL YouTube diperlukan' });
            }

            const result = await downloadYTMP3(url);
            res.status(200).json({ status: true, result });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
