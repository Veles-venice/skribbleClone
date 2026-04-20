const WORDS: Record<string, string[]> = {
  animals: [
    "cat", "dog", "elephant", "giraffe", "lion", "tiger", "zebra", "monkey",
    "penguin", "dolphin", "whale", "shark", "eagle", "owl", "butterfly",
    "spider", "snake", "crocodile", "kangaroo", "panda", "koala", "bear",
    "wolf", "fox", "rabbit", "deer", "horse", "cow", "pig", "sheep",
    "chicken", "duck", "frog", "turtle", "fish", "octopus", "jellyfish",
    "unicorn", "dragon", "dinosaur", "squirrel", "raccoon", "hedgehog",
    "platypus", "flamingo", "peacock", "parrot", "hummingbird", "bat",
  ],
  food: [
    "pizza", "hamburger", "sushi", "taco", "pasta", "salad", "sandwich",
    "steak", "chicken", "soup", "ice cream", "cake", "donut", "cookie",
    "chocolate", "apple", "banana", "orange", "strawberry", "watermelon",
    "grapes", "pineapple", "mango", "lemon", "carrot", "broccoli",
    "corn", "potato", "bread", "cheese", "egg", "pancake", "waffle",
    "cereal", "popcorn", "chips", "fries", "hot dog", "burrito",
    "noodles", "ramen", "curry", "pie", "muffin", "croissant",
    "bagel", "pretzel", "candy", "lollipop", "cupcake",
  ],
  objects: [
    "chair", "table", "lamp", "book", "phone", "computer", "television",
    "refrigerator", "microwave", "bicycle", "car", "airplane", "train",
    "boat", "rocket", "umbrella", "backpack", "clock", "watch", "glasses",
    "shoe", "hat", "shirt", "pants", "dress", "jacket", "guitar", "piano",
    "drum", "violin", "camera", "scissors", "hammer", "screwdriver",
    "key", "lock", "mirror", "window", "door", "bridge", "castle",
    "robot", "toy", "balloon", "kite", "puzzle", "candle", "flower",
    "tree", "mountain", "volcano", "island",
  ],
  activities: [
    "swimming", "running", "dancing", "singing", "reading", "writing",
    "painting", "drawing", "cooking", "baking", "fishing", "hiking",
    "camping", "skiing", "skating", "surfing", "diving", "climbing",
    "cycling", "driving", "flying", "jumping", "sleeping", "eating",
    "drinking", "playing", "working", "studying", "shopping", "traveling",
    "photographing", "gardening", "knitting", "sewing", "building",
    "fixing", "cleaning", "washing", "brushing", "comb", "exercising",
    "meditating", "yoga", "boxing", "wrestling", "golf", "tennis",
    "basketball", "football", "soccer", "baseball",
  ],
  places: [
    "school", "hospital", "restaurant", "library", "museum", "park",
    "beach", "mountain", "desert", "forest", "jungle", "ocean", "river",
    "lake", "waterfall", "cave", "tunnel", "bridge", "tower", "palace",
    "temple", "church", "mosque", "synagogue", "airport", "station",
    "hotel", "house", "apartment", "castle", "zoo", "aquarium", "stadium",
    "arena", "theater", "cinema", "mall", "store", "market", "farm",
    "ranch", "factory", "office", "prison", "bank", "gym", "pool",
    "spa", "salon", "garage",
  ],
  nature: [
    "sun", "moon", "star", "cloud", "rain", "snow", "wind", "storm",
    "thunder", "lightning", "rainbow", "fog", "mist", "dew", "frost",
    "ice", "fire", "flame", "smoke", "ash", "dust", "sand", "soil",
    "rock", "stone", "pebble", "crystal", "diamond", "gold", "silver",
    "copper", "iron", "rust", "mud", "clay", "granite", "marble",
    "coal", "oil", "gas", "steam", "bubble", "wave", "tide", "current",
    "whirlpool", "geyser", "lava", "magma", "glacier",
  ],
};

export function getAllWords(): string[] {
  return Object.values(WORDS).flat();
}

export function getWordsByCategory(category: string): string[] {
  return WORDS[category] || [];
}

export function getCategories(): string[] {
  return Object.keys(WORDS);
}

export function getRandomWords(count: number, category?: string): string[] {
  const wordPool = category ? getWordsByCategory(category) : getAllWords();
  const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getWordCount(): number {
  return getAllWords().length;
}
