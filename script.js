const fs = require("fs");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const year = 1899;

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
