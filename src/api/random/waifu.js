const axios = require('axios');

module.exports = function (app) {
    async function getWaifu() {
        try {
            const { data } = await axios.get('https://api.waifu.pics/sfw/waifu');
            const response = await axios.get(data.url, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        } catch (error) {
            throw error;
        }
    }

    app.get('/random/waifu', async (req, res) => {
        try {
            const waifuImage = await getWaifu();
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': waifuImage.length,
            });
            res.end(waifuImage);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};
