const fs = require("fs");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const baseUrl = "https://en.wikipedia.org";
const allUrls = {};

// getObitURLs(1700);
getObitsForYear(1700);

function getObitURLs(year, fetchUrl) {
  if (!fetchUrl) fetchUrl = `${baseUrl}/wiki/Category:${year}_deaths`;
  if (!allUrls[year]) allUrls[year] = "";
  axios(fetchUrl).then(res => {
    const { window } = new JSDOM(res.data);
    const { document } = window;
    const a = Array.from(document.querySelectorAll(".mw-category li a"));
    const urls = a.map(el => baseUrl + el.href).join("\n");
    allUrls[year] += urls;

    const nextPage = Array.from(document.querySelectorAll("a")).filter(
      el => el.textContent === "next page"
    );
    if (nextPage.length === 0) {
      console.log("done!");
      fs.writeFileSync(`./sources/${year}.txt`, allUrls[year], "utf-8");
    } else {
      console.log("getting next page", nextPage[0].href);
      allUrls[year] += "\n";
      getObitURLs(year, baseUrl + nextPage[0].href);
    }
  });
}

function getObitsForYear(year) {
  const urls = fs.readFileSync(`./sources/${year}.txt`, "utf-8").split("\n");
  urls.forEach(url => {
    axios(url).then(res => {
      console.log(url);
      const { document } = new JSDOM(res.data).window;
      const title = document.querySelector("h1").textContent;
      const headings = Array.from(document.querySelectorAll("h2, h3"));
      for (let i = 0; i < headings.length; i++) {
        const h = headings[i];
        if (!h.textContent.toLowerCase().includes("death")) continue;

        let output = title + "\n\n";
        let current = h.nextSibling;
        while (current.tagName !== "H2" && current.tagName !== "H3") {
          output += current.textContent + "\n";
          current = current.nextSibling;
        }
        output = output.replace(/\[\d*\]/g, "");
        output = output.trim();
        if (!fs.existsSync(`./obits/${year}`)) fs.mkdirSync(`./obits/${year}`);
        fs.writeFileSync(
          `./obits/${year}/${title.toLowerCase().replace(/[^a-z]/g, "")}.txt`,
          output,
          "utf-8"
        );
        break;
      }
    });
  });
}
