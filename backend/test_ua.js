const UAParser = require("ua-parser-js");
const parser = new UAParser("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
console.log(parser.getResult().os.name);
