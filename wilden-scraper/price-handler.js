function getPriceFromString(string) {
  const numberRegex = /(\d+[.|,])?\d+[.|,]\d+/g;
  return string.match(numberRegex)[0];
}

module.exports = { getPriceFromString };
