import type { StoryTexts } from '../types';

/**
 * Lines alternate between the caller and the person called, starting with
 * the caller. Every name, place and event is fictional.
 */
export const stories: StoryTexts = {
  grocery: {
    title: 'The offer',
    fragments: [
      [
        'Doctor, it’s Walt Hollis. Nobody’s sick. I need a man who can keep a secret.',
        'I’ve kept thirty years of them, Walt. Go on.',
        'A fellow from the city wants to buy the store. Wants to put up one of those self-service places.',
        'And what does Mae say?',
      ],
      [
        'Mr. Hollis? Vernon Platt, room six. I’ve had the papers drawn up.',
        'I said I’d think it over, Mr. Platt.',
        'Think fast. The offer leaves on Friday’s train, and so do I.',
      ],
      [
        'Ida, you’ve been next door twenty years. If I sold, would you hate me?',
        'I’d hate the empty window more. Who’d sell me flour on credit?',
        'Nobody, I expect. They don’t do credit, these new places.',
      ],
      [
        'Walt, the Ledger hears you’re selling. Care to comment?',
        'The Ledger hears a lot through that switchboard, I’d say.',
        'Ha. So it’s true?',
        'Print that I haven’t decided. That’ll be true until Friday.',
      ],
      [
        'Walt, Mae came by for her heart pills. She told me about the money.',
        'It’s a lot of money, Doc. We could rest.',
        'You’d rest about a week. Then you’d be stocking my pantry for free, out of boredom.',
      ],
      [
        'Mr. Platt, Hollis here. I won’t be signing.',
        'There’ll be a store like mine in this town within two years. With or without you.',
        'Then let them build it. Folks know where to find me.',
      ],
      [
        'Ida, front page tomorrow: “Hollis Stays.” Thought you’d want to hear it first.',
        'Bless him. I’ll bake him a cake the size of a hubcap.',
        'Save me a slice. The mayor’s furious; he wanted the tax money.',
      ],
    ],
    epilogue:
      'Hollis Grocery stayed open eleven more years. The self-service store came anyway, out on the highway.',
  },

  looms: {
    title: 'The new looms',
    fragments: [
      [
        'Doyle, it’s the office. The new looms arrive on the first of the month.',
        'How many men do they replace?',
        'The company calls it “reorganising the floor”.',
        'That’s not a number, Mr. Kemp.',
      ],
      [
        'Sal, keep the back room free Thursday night. The men want to talk.',
        'Talk, or shout?',
        'Depends what I tell them.',
      ],
      [
        'Mr. Doyle, it’s Mrs. Abbott. Three of my lodgers asked if they should look for work elsewhere.',
        'Tell them to sit tight. Nothing’s settled.',
        'They pay their rent from that mill, Mr. Doyle. So do I, when you think about it.',
      ],
      [
        'Chief, it’s the Reverend. We’re collecting for the mill families, just in case.',
        'Put the station down for twenty dollars. The boys will carry the boxes.',
        'Bless you. Let’s hope we never have to open them.',
      ],
      [
        'Mr. Kemp, I’ve a proposal. Train the men on the new looms instead of letting them go.',
        'Training takes time, Doyle. Time is money.',
        'So is hiring strangers who don’t know the floor. Give me eight weeks.',
      ],
      [
        'Mrs. Abbott? Sal at the Lantern. Your lodger Peter’s been here since noon, celebrating.',
        'Celebrating what?',
        'Kemp said yes to Doyle. Nobody’s let go. They learn the new machines instead.',
      ],
      [
        'Doyle, the first loom’s running. Twice the cloth, half the noise.',
        'And the men?',
        'Learning faster than I did. You were right. Don’t tell anyone I said so.',
      ],
    ],
    epilogue:
      'The new looms ran at Larkfield Mill for twenty years. Doyle trained every man on them himself.',
  },

  waltz: {
    title: 'The Colonel’s waltz',
    fragments: [
      [
        'Miss Lindqvist, Colonel Haverty. I wish to take lessons. Waltzes, specifically.',
        'At your age, Colonel? I mean, of course. Any particular reason?',
        'The Mayor’s spring dance. And that is all I shall say.',
      ],
      [
        'Greta, dear, the Colonel was seen leaving your house humming. Humming!',
        'Lessons, Mrs. Pruitt. Purely lessons.',
        'Who on earth is he planning to dance with?',
        'I’m sworn to secrecy. But you might want a new dress.',
      ],
      [
        'Whitlock, about the spring dance. Is Mrs. Pruitt on the guest list?',
        'She chairs the committee, Haverty. She wrote the guest list.',
        'Then I trust I am on it.',
      ],
      [
        'Judge, a hypothetical question. Would it be improper for a widow of six years to dance?',
        'Hypothetically, Edith, I’d find it improper not to.',
      ],
      [
        'Colonel, you counted to four again. It’s a waltz. One, two, three.',
        'Forty years of marching, Miss Lindqvist. My feet are stubborn.',
        'Then let your heart count. It seems to know the way.',
      ],
      [
        'Ashford, did you see the Colonel and Mrs. Pruitt last night? Three waltzes!',
        'Four. I counted. And he only stepped on her twice.',
        'Put the town’s money on a June wedding.',
      ],
    ],
    epilogue:
      'Edith Pruitt and Colonel Haverty were married in June. Miss Lindqvist played the waltz.',
  },

  crossing: {
    title: 'The last crossing',
    fragments: [
      [
        'Amos, it’s Ned at the ferry. Heard the county voted the money.',
        'For the bridge? I heard it too. Steel, they say. Two lanes.',
        'Forty-one years I’ve pulled that rope.',
      ],
      [
        'Ned, Merriweather here. Can you take the milk truck at six tomorrow?',
        'I’ll take it at six for as long as I’m here, John.',
        'You’ll be here. Bridges take years.',
      ],
      [
        'Ned, Quill at the boatyard. When the bridge opens, what becomes of the old girl?',
        'The ferry? Scrap, I suppose. County property.',
        'Not if I buy her first. She’d make a fine excursion boat.',
      ],
      [
        'Doc Rourke? The Bluebell is planning a send-off for Ned’s ferry. Do you still play the fiddle?',
        'Only for cows and close friends.',
        'Ned’s a close friend.',
        'Then I’ll tune it.',
      ],
      [
        'Ned, they’re pouring the last span this week. You’ll see it from the landing.',
        'I’ve watched it grow like a weed, Amos.',
        'Come up to the lock after. I’ve a bottle saved.',
      ],
      [
        'Quill, the county says yes. She’s yours for a dollar, if I stay on as her captain.',
        'A dollar and a captain? Cheapest deal I ever made.',
      ],
      [
        'John, bring the whole family Saturday. Last crossing at sundown, then dancing.',
        'The children want to ride the bridge and the ferry both.',
        'Then ride them both. That’s the night for it.',
      ],
    ],
    epilogue:
      'The bridge opened in October. The old ferry carried summer picnics on the river for another twenty years.',
  },

  longDistance: {
    title: 'Long distance',
    fragments: [
      [
        'Mama? It’s Clara! I’m calling from the city!',
        'Clara! Is everything all right? This must cost a fortune.',
        'Three minutes, I promise. Mama, I’m an operator now. At the big exchange downtown.',
      ],
      [
        'Mama, there are two hundred of us on one floor. Two hundred! And the noise!',
        'Do they feed you properly?',
        'I eat a sandwich standing up. I’ve never been happier.',
      ],
      [
        'Reverend? Clara Abbott, calling from the city. Is Mama well? She sounds tired.',
        'She works too hard, Clara. But she reads your letters to the whole congregation.',
        'Every one of them? Oh, no.',
      ],
      [
        'Mama, they’re putting in machines. People will dial long distance themselves.',
        'Machines? Then what will you do?',
        'They say there’ll always be work for us. They say a lot of things.',
      ],
      [
        'Mama, my floor closes at the end of the month. Half of us are let go.',
        'Then come home, love. Your room is here. It always has been.',
        'Does Larkfield still have someone at the board? Someone real, who answers?',
        'For now. She’s listening, I expect. Say hello.',
      ],
      [
        'Mama, I’m at the station. The seven-forty. Leave the porch light on.',
        'It’s been on since you called, Clara.',
      ],
    ],
    epilogue:
      'Clara Abbott came home and kept the boarding house after her mother. She never placed a call without saying thank you.',
  },
};
