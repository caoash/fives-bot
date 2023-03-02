const puppeteer = require('puppeteer');

const getLinks = async () => {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]
    });
    const page = await browser.newPage();
    await page.goto("http://prodraft.leagueoflegends.com/");

    await page.type('#blue_team_name', 'Blue Side');
    await page.type('#red_team_name', 'Red Side');
    await page.type('#match_name', 'Fives Fridays');

    const button = await page.$('.confirm');
    await button.click();

    // wait two seconds for it to load, because the actual HTML selectors don't change so can't use waitForSelector
    await new Promise(r => setTimeout(r, 2000)); 

    let blueElement = await page.$('#blue_team_name');
    let redElement = await page.$('#red_team_name');
    let specElement = await page.$('#match_name');

    let blueLink = await page.evaluate(link => link.value, blueElement);
    let redLink = await page.evaluate(link => link.value, redElement);
    let specLink = await page.evaluate(link => link.value, specElement);

    await browser.close();

    return {blueLink, redLink, specLink};
}

module.exports = {
    getLinks
}
