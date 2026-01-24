import type { Entry } from '../types/entry';

// Generate a date string N days ago from today
function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}

// Generate a timestamp for N days ago at a specific hour
function timestampDaysAgo(n: number, hour: number): number {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return date.getTime();
}

export const sampleEntries: Omit<Entry, 'photo' | 'thumbnail'>[] = [
  // Today and recent days (will show as individual cards)
  {
    date: daysAgo(0),
    storyworthy: "Had an unexpected conversation with a stranger at the coffee shop. They were reading the same book I just finished, and we ended up talking for an hour about the ending. Sometimes the universe just puts the right people in your path.",
    thankful: "Good coffee, good conversation, and the rare gift of spontaneous connection.",
    createdAt: timestampDaysAgo(0, 9),
  },
  {
    date: daysAgo(1),
    storyworthy: "Finally fixed that bug that's been haunting me for three days. The solution was embarrassingly simple - a typo in a variable name. But the feeling of relief when those tests turned green was worth every frustrating hour.",
    thankful: "Persistent debugging and rubber duck explanations.",
    createdAt: timestampDaysAgo(1, 21),
  },
  {
    date: daysAgo(2),
    storyworthy: "Watched the sunset from the rooftop with my roommate. We didn't say much, just sat there as the sky turned from orange to pink to purple. Some moments don't need words.",
    thankful: "Living somewhere with roof access and a friend who appreciates silence.",
    createdAt: timestampDaysAgo(2, 20),
  },
  {
    date: daysAgo(3),
    storyworthy: "Mom called to tell me she finally learned how to send voice messages. She sent me five in a row just saying 'testing testing' and laughing at herself. I've listened to them three times already.",
    thankful: "Technology that keeps families close, and parents who keep trying.",
    createdAt: timestampDaysAgo(3, 19),
  },
  {
    date: daysAgo(5),
    storyworthy: "Ran into my old professor at the farmers market. She remembered my thesis topic and asked what I'm working on now. It felt good to tell her I'm actually using what she taught me.",
    thankful: "Mentors who genuinely care about their students' journeys.",
    createdAt: timestampDaysAgo(5, 11),
  },
  {
    date: daysAgo(6),
    storyworthy: "Power went out for two hours tonight. Instead of being annoyed, I lit candles and read by flashlight like I used to do as a kid during storms. There's something peaceful about forced disconnection.",
    thankful: "Candles, physical books, and memories of simpler times.",
    createdAt: timestampDaysAgo(6, 22),
  },

  // Week 2 (8-14 days ago)
  {
    date: daysAgo(8),
    storyworthy: "Discovered a tiny used bookstore hidden in an alley I've walked past a hundred times. The owner is 82 and has run it for 50 years. Left with three books and an invitation to come back for tea.",
    thankful: "Hidden gems in familiar places.",
    createdAt: timestampDaysAgo(8, 15),
  },
  {
    date: daysAgo(9),
    storyworthy: "Made dinner from scratch without looking at a recipe. It wasn't perfect but it was mine. There's something empowering about trusting your instincts in the kitchen.",
    thankful: "A well-stocked pantry and the confidence to experiment.",
    createdAt: timestampDaysAgo(9, 20),
  },
  {
    date: daysAgo(10),
    storyworthy: "Got an email from someone I mentored two years ago. They got promoted and wanted to thank me. I barely remember what advice I gave, but apparently it stuck.",
    thankful: "The ripple effects of small kindnesses.",
    createdAt: timestampDaysAgo(10, 10),
  },
  {
    date: daysAgo(11),
    storyworthy: "Woke up early to watch the sunrise. The world is so quiet at 5am. Just me, the birds, and the slow creep of light over the hills.",
    thankful: "Alarm clocks and the discipline to actually get up when they ring.",
    createdAt: timestampDaysAgo(11, 6),
  },
  {
    date: daysAgo(13),
    storyworthy: "Had a difficult conversation I'd been avoiding for weeks. It didn't go perfectly, but I said what I needed to say. The relief of honesty outweighs the discomfort of the moment.",
    thankful: "Friends who listen even when the truth is hard to hear.",
    createdAt: timestampDaysAgo(13, 18),
  },
  {
    date: daysAgo(14),
    storyworthy: "Found my old journal from ten years ago. It's wild how much I've changed and how much I've stayed the same. Past me would be proud of some things and confused by others.",
    thankful: "Growth, perspective, and the wisdom to keep writing things down.",
    createdAt: timestampDaysAgo(14, 21),
  },

  // Week 3 (15-21 days ago)
  {
    date: daysAgo(15),
    storyworthy: "Helped a tourist with directions and ended up walking with them for ten blocks because we were going the same way. They were from Japan and told me about their grandmother's garden.",
    thankful: "Strangers who become temporary friends.",
    createdAt: timestampDaysAgo(15, 14),
  },
  {
    date: daysAgo(16),
    storyworthy: "Rain all day. Stayed in, made soup, watched old movies. Sometimes the most memorable days are the quiet ones.",
    thankful: "Cozy blankets and the sound of rain on windows.",
    createdAt: timestampDaysAgo(16, 19),
  },
  {
    date: daysAgo(17),
    storyworthy: "Tried a new hiking trail and got completely lost. But the panic turned to peace when I realized I had nowhere to be. Found my way back just before sunset.",
    thankful: "Getting lost and finding my way.",
    createdAt: timestampDaysAgo(17, 17),
  },
  {
    date: daysAgo(18),
    storyworthy: "My neighbor knocked on my door just to give me tomatoes from their garden. We've barely spoken in two years but they remembered I mentioned liking tomatoes once. People surprise you.",
    thankful: "Generous neighbors and the vegetables they share.",
    createdAt: timestampDaysAgo(18, 18),
  },
  {
    date: daysAgo(20),
    storyworthy: "Finished a book that made me cry. Good cry though - the kind that reminds you you're alive and capable of feeling deeply.",
    thankful: "Authors who can reach through pages and touch your heart.",
    createdAt: timestampDaysAgo(20, 23),
  },
  {
    date: daysAgo(21),
    storyworthy: "Video called my niece and she showed me every single one of her stuffed animals. All 47 of them. Each has a name and backstory. Her imagination is incredible.",
    thankful: "Kids who share their worlds with you.",
    createdAt: timestampDaysAgo(21, 16),
  },

  // Week 4 (22-28 days ago)
  {
    date: daysAgo(22),
    storyworthy: "Learned a new chord on guitar. Been stuck on the same songs for months, but this opens up so many new possibilities. Small progress is still progress.",
    thankful: "Patience with myself and the joy of learning.",
    createdAt: timestampDaysAgo(22, 20),
  },
  {
    date: daysAgo(23),
    storyworthy: "Had brunch with friends I hadn't seen in months. We picked up exactly where we left off. Real friendships don't need constant maintenance - they just are.",
    thankful: "Friends who feel like home no matter how long it's been.",
    createdAt: timestampDaysAgo(23, 12),
  },
  {
    date: daysAgo(24),
    storyworthy: "Saw a dog reunion at the park. Two dogs who clearly knew each other went absolutely wild with joy. Their owners had never met but laughed together watching them play.",
    thankful: "Dogs and the pure happiness they bring to the world.",
    createdAt: timestampDaysAgo(24, 10),
  },
  {
    date: daysAgo(26),
    storyworthy: "Cleaned out my closet and donated three bags of clothes. Feels like shedding old skin. Less stuff, more space, clearer mind.",
    thankful: "The freedom of letting go.",
    createdAt: timestampDaysAgo(26, 15),
  },
  {
    date: daysAgo(27),
    storyworthy: "Got stuck in traffic next to a car full of teenagers having the time of their lives. They were singing at the top of their lungs, completely unselfconscious. Made me smile.",
    thankful: "Witnessing joy, even from a distance.",
    createdAt: timestampDaysAgo(27, 18),
  },
  {
    date: daysAgo(28),
    storyworthy: "Made a mistake at work. A real one. But my team had my back and we fixed it together. That's when you know you're in the right place.",
    thankful: "Teammates who lift you up instead of tearing you down.",
    createdAt: timestampDaysAgo(28, 21),
  },

  // Week 5 (29-35 days ago)
  {
    date: daysAgo(29),
    storyworthy: "Found a letter I wrote to myself five years ago. I'd completely forgotten about it. Past me asked future me to be brave. I hope I'm making them proud.",
    thankful: "Time capsules and the conversation between versions of ourselves.",
    createdAt: timestampDaysAgo(29, 20),
  },
  {
    date: daysAgo(30),
    storyworthy: "Took a different route to work and discovered a mural I'd never seen. It's been there for years apparently. How much do we miss by always taking the same path?",
    thankful: "New perspectives hiding in plain sight.",
    createdAt: timestampDaysAgo(30, 8),
  },
  {
    date: daysAgo(32),
    storyworthy: "Made pancakes for dinner because why not. Added chocolate chips and didn't feel guilty about it. Being an adult means making your own rules sometimes.",
    thankful: "Breakfast for dinner and zero judgment.",
    createdAt: timestampDaysAgo(32, 19),
  },
  {
    date: daysAgo(33),
    storyworthy: "Overheard two elderly people on a bench talking about their first date - 60 years ago. They were still laughing about how nervous he was. Love that lasts is beautiful.",
    thankful: "Love stories that stand the test of time.",
    createdAt: timestampDaysAgo(33, 14),
  },
  {
    date: daysAgo(35),
    storyworthy: "Finally replied to an email I'd been putting off for two weeks. The response was kind and understanding. All that anxiety for nothing. Note to self: just do the thing.",
    thankful: "Grace from others and lessons about not overthinking.",
    createdAt: timestampDaysAgo(35, 11),
  },
];

export function getSampleEntries(): Entry[] {
  return sampleEntries.map((entry) => ({
    ...entry,
    photo: undefined,
    thumbnail: undefined,
  }));
}
