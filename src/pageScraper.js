const scraperObject = {
    url: 'https://www.drogaraia.com.br/medicamentos.html',
    async scraper(browser) {
        const page = await browser.newPage();
        await page.goto(this.url);

        let scrapedData = [];
        const allResultsSelector = '.dqiTTm';
        const resultsSelector = '.products';

        async function scrapeCurrentPage() {
            await page.waitForSelector(allResultsSelector);
            let urls = await page.$$eval(resultsSelector, links => {
                links = links.map(el => el.querySelector('a').href)
                return links;
            });

            const pagePromise = (link) => new Promise(async (resolve) => {
                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link);

                try {
                    dataObj['precoProduto'] = await newPage.$eval('.rd-row .rd-col-16 .eRXZWW .hVgczD .cPpbWR .ikFziU', text => text.textContent);
                } catch (err) {
                }
                try {
                    dataObj['nomeProduto'] = await newPage.$eval('.rd-row .rd-col-16 .eRXZWW .gfVohE .title-product', text => text.textContent);
                } catch (err) {
                }
                try {
                    dataObj['codFarma'] = await newPage.$eval('.rd-container-fluid .fRTSsN .eosUuQ .cUnSAh table tbody tr .gjcTgl', text => text.textContent);
                    dataObj['ean'] = await newPage.$eval('.rd-container-fluid .fRTSsN .eosUuQ .cUnSAh table tbody', text => text.textContent.split('EAN').pop());
                    dataObj.ean = await dataObj.ean.split('P').shift();
                } catch (err) {
                }

                dataObj['farmacia'] = 'DROGA RAIA'
                resolve(dataObj);
                await newPage.close();
            });

            for (const link in urls) {
                const currentPageData = await pagePromise(urls[link]);
                const axios = require('axios');
                const config = {
                    method: 'post',
                    url: 'http://192.168.25.60:3333/util/inserirBuscaPreco',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvIjoiMDIxOTAxOTM5ODIiLCJzZW5oYSI6IlJPTkFMRE8iLCJpYXQiOjE2NzA0MjEyOTAsImV4cCI6MTY3MDQ1NzI5MH0.HF5TAplVURZsvjsMfq86BsyKTJSlAa0EPv3OGwjmQFs",
                    },
                    data: JSON.stringify(currentPageData)
                };

                await axios(config)
                    .then(function (response) {
                    })
                    .catch(function (error) {
                    });

            }

            let nextButtonExist;
            try {
                await page.$eval('.next-link > a', a => a.textContent);
                nextButtonExist = true;
            } catch (err) {
                nextButtonExist = false;
            }

            if (nextButtonExist) {
                await page.click('.next-link > a');

                return scrapeCurrentPage();
            }
            await page.close();
            return scrapedData;
        }

        return await scrapeCurrentPage();
    }
}

module.exports = scraperObject;
