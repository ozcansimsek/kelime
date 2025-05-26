const turkishLetters = [
  "A",
  "B",
  "C",
  "Ç",
  "D",
  "E",
  "F",
  "G",
  // "Ğ",
  "H",
  "I",
  "İ",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "Ö",
  "P",
  "R",
  "S",
  "Ş",
  "T",
  "U",
  "Ü",
  "V",
  "Y",
  "Z",
];

export const getRandomTurkishLetter = () => {
  const randomIndex = Math.floor(Math.random() * turkishLetters.length);
  return turkishLetters[randomIndex];
};
