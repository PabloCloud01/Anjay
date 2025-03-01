const axios = require('axios');

async function fetchVideoInfo(videoUrl) {
    const apiEndpoint = 'https://api.v02.savethevideo.com/tasks';
    const requestData = { type: 'info', url: videoUrl };

    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        Referer: `https://www.savethevideo.com/dailymotion-downloader?url=${encodeURIComponent(videoUrl)}`,
    };

    try {
        const response = await axios.post(apiEndpoint, requestData, { headers });
        return response.data.state !== 'completed' ? await fetchTask(response.data.href) : response.data;
    } catch (error) {
        throw new Error(error.response?.data || error.message);
    }
}

async function fetchTask(task) {
    if (!task) throw new Error('Mohon ulangi permintaan.');

    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        Referer: `https://www.savethevideo.com${task}`,
    };

    try {
        const response = await axios.post(`https://api.v02.savethevideo.com${task}`, {}, { headers });
        return response.data.state !== 'completed' ? await fetchTask(task) : response.data;
    } catch (error) {
        throw new Error(error.response?.data || error.message);
    }
}

module.exports = function (app) {
    app.get('/downloader/stv', async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json({ status: false, error: 'URL diperlukan' });

            const result = await fetchVideoInfo(url);
            res.status(200).json({ status: true, result });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
