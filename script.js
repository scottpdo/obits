const fs = require("fs");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const baseUrl = "https://en.wikipedia.org";
const allUrls = {};

// getObitURLs(1700);
for (let i = 1751; i < 1801; i++) {
  getObitsForYear(i);
}

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
  let i = 0;
  const obits = [];

  function handle(res) {
    console.log(urls[i]);
    const { document } = new JSDOM(res.data).window;
    const title = document.querySelector("h1").textContent;
    const headings = Array.from(document.querySelectorAll("h2, h3"));
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      if (!h.textContent.toLowerCase().includes("death")) continue;

      let output = "# " + title;
      let current = h.nextSibling;
      while (current.tagName !== "H2" && current.tagName !== "H3") {
        output += current.textContent + "\n";
        current = current.nextSibling;
      }
      output = output.replace(/\[\d*\]/g, "");
      output = output.trim() + "\n";
      obits.push(output);

      break;
    }
    fs.writeFileSync(`./obits/${year}.txt`, obits.join("\n"), "utf-8");

    if (i < urls.length - 1) {
      i++;
      axios(urls[i]).then(handle);
    }
  }

  axios(urls[i]).then(handle);
}
