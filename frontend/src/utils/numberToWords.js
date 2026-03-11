const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const twoDigitWords = (num) => {
  if (num < 20) {
    return ONES[num];
  }

  const ten = Math.floor(num / 10);
  const rest = num % 10;
  return [TENS[ten], ONES[rest]].filter(Boolean).join(" ");
};

const threeDigitWords = (num) => {
  const hundred = Math.floor(num / 100);
  const rest = num % 100;

  const parts = [];
  if (hundred) {
    parts.push(`${ONES[hundred]} Hundred`);
  }
  if (rest) {
    parts.push(twoDigitWords(rest));
  }

  return parts.join(" ");
};

const integerToIndianWords = (num) => {
  if (num === 0) {
    return "Zero";
  }

  const parts = [];
  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundredPart = num;

  if (crore) {
    parts.push(`${integerToIndianWords(crore)} Crore${crore > 1 ? "s" : ""}`);
  }
  if (lakh) {
    parts.push(`${twoDigitWords(lakh)} Lakh${lakh > 1 ? "s" : ""}`);
  }
  if (thousand) {
    parts.push(`${twoDigitWords(thousand)} Thousand`);
  }
  if (hundredPart) {
    parts.push(threeDigitWords(hundredPart));
  }

  return parts.join(" ").trim();
};

export const numberToWords = (amount) => {
  const roundedAmount = Math.round(Number(amount || 0));
  const safeAmount = Number.isFinite(roundedAmount) && roundedAmount > 0 ? roundedAmount : 0;
  return `${integerToIndianWords(safeAmount)} Rupees Only`;
};
