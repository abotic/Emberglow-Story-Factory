export const STORY_TYPES = [
  { value: "history_learning", label: "History learning" },
  { value: "paranormal", label: "Paranormal" },
  { value: "horror", label: "Horror story" },
  { value: "mystery", label: "Mystery / Unsolved" },
  { value: "survival", label: "Survival retelling" },
  { value: "romance", label: "Romantic story" },
  { value: "adventure", label: "Adventure story" },
  { value: "sci_fi", label: "Science fiction" },
  { value: "fantasy", label: "Fantasy" },
  { value: "dystopia", label: "Dystopian futures" },
] as const;

export const CRYPTID_SUBJECTS = [
  { value: "bigfoot", label: "Bigfoot" },
  { value: "lochness", label: "Loch Ness Monster" },
  { value: "ufo", label: "UFO" },
  { value: "mothman", label: "Mothman" },
  { value: "skinwalker_ranch", label: "Skinwalker Ranch" },
  { value: "bermuda_triangle", label: "Bermuda Triangle" },
  { value: "chupacabra", label: "Chupacabra" },
  { value: "wendigo", label: "Wendigo" },
  { value: "jersey_devil", label: "Jersey Devil" },
  { value: "men_in_black", label: "Men in Black" },
  { value: "yeti", label: "Yeti" },
  { value: "thunderbird", label: "Thunderbird" },
];

export const HISTORY_TOPICS = [
  "How humanity started: from early hominins to Homo sapiens",
  "Rise of Ancient Egypt: Narmer to the Pyramid Age",
  "The Roman Empire: Pax Romana to crisis and reform",
  "The Viking Age: raids, trade, and settlement",
  "The Mongol Empire: Genghis to Kublai",
  "The Renaissance: from Florence to the north",
  "The Age of Exploration: oceans, maps, and empires",
  "The Industrial Revolution: steam, factories, and cities",
  "World War I: from Sarajevo to the Armistice",
  "World War II: global war and its aftermath",
];

export const CRYPTIC_TYPES = new Set(["paranormal", "horror", "mystery", "survival"]);