/**
 * Viral hook templates parsed from the "1000 Viral Hooks" PDF by Personal Brand Launch.
 * Each template is a fill-in-the-blank pattern proven to perform on Instagram Reels and YouTube Shorts.
 *
 * Categories map to content intent — the LLM picks the best-fit category based on the user's idea
 * and uses templates as structural inspiration (not copy-paste).
 */

export type HookCategory =
  | "educational"
  | "comparison"
  | "myth_busting"
  | "storytelling"
  | "authority"
  | "day_in_the_life"
  | "random";

export interface HookTemplate {
  template: string;
  category: HookCategory;
}

const HOOK_TEMPLATES: HookTemplate[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // EDUCATIONAL (Pages 1–29)
  // ═══════════════════════════════════════════════════════════════════════════
  { category: "educational", template: "This represents your X before, during, and after X" },
  { category: "educational", template: "Here's exactly how much (action/item) you need to (result)" },
  { category: "educational", template: "Can you tell us how to (result) in 60 seconds?" },
  { category: "educational", template: "This is what (thing) looks like when you're (action). And this is what they look like when you're not (action)." },
  { category: "educational", template: "I'm going to tell you how to get (result), (mind blowing method)." },
  { category: "educational", template: "It took me 10 years to learn this but I'll teach it to you in less than 1 minute." },
  { category: "educational", template: "When you get (item/result) here are the # things you got to do right away." },
  { category: "educational", template: "If you don't have (item/action), do (item/action)." },
  { category: "educational", template: "My money rules as a (description) working towards financial independence." },
  { category: "educational", template: "Money can buy you (item) but it can not buy you (result)." },
  { category: "educational", template: "Here's how to develop a (skill) so strong that you physically can't stop (doing skill)." },
  { category: "educational", template: "This is what (number) of (item) looks like." },
  { category: "educational", template: "If I woke up (pain point) tomorrow, and wanted to (dream result) by (time) here's exactly what I would do." },
  { category: "educational", template: "If you're a (target audience) and you want (dream result) by (avenue) then listen to this video." },
  { category: "educational", template: "If you are (age group or range) do not do (action)." },
  { category: "educational", template: "As an (trait) responsible (age) year old with a goal to (goal) here are 3 things I will never regret doing." },
  { category: "educational", template: "Not to flex, but I'm pretty f*cking good at (skill/niche)." },
  { category: "educational", template: "This is what (object/item) looks like when you are using/doing (product/service)." },
  { category: "educational", template: "Are you still (action)? I've got (result) in (time frame) and I have never (action)." },
  { category: "educational", template: "3 Youtube channels that will teach you more than any (industry/niche) degree." },
  { category: "educational", template: "I think I just found the biggest (niche/industry) cheat code." },
  { category: "educational", template: "Here are 3 people who will make you a better (title)." },
  { category: "educational", template: "(trait) Guy vs (trait) Guy." },
  { category: "educational", template: "I see you doing nothing but (action) after (event) so follow this agenda to avoid that." },
  { category: "educational", template: "Want to be the first (dream result) in your family?" },
  { category: "educational", template: "This is how many (item) you need to (result)." },
  { category: "educational", template: "Everyone tells you to (action) but nobody actually tells you how to do it. Here is a # second step by step tutorial that you can save." },
  { category: "educational", template: "If you're (age range) these are the # things you need to do so you don't end up (pain point) by (age)." },
  { category: "educational", template: "If I were starting over in my (age range) with no (item) here are the top # things I would do to (dream result)." },
  { category: "educational", template: "Here are some slightly unethical (industry/niche) hacks that you should know if you're (target audience)." },
  { category: "educational", template: "Here's exactly how you're gonna lock in if you want to (dream result)." },
  { category: "educational", template: "This is the same exact (thing) but the first is/got (result) and the second is/got X." },
  { category: "educational", template: "If you want to end up (pain point) then skip this video." },
  { category: "educational", template: "We have never used (noun) in our home because we have found it to be generally (trait/traits)." },
  { category: "educational", template: "(action) for (period of time) and you will get (dream result)." },
  { category: "educational", template: "If you're between the ages of (age) to (age) and you feel like (pain point)." },
  { category: "educational", template: "(before state) to (after state) in # simple steps in under # of seconds." },
  { category: "educational", template: "If you're trying to (dream results) then here is the one (thing) you should do." },
  { category: "educational", template: "How long do you think you have to (action) to (result)." },
  { category: "educational", template: "If you want to do this, first do this." },
  { category: "educational", template: "If you're trying to (dream result) and you haven't got a clue what to (action) on a daily basis I am going to show you an example." },
  { category: "educational", template: "I'm gonna save you # of minutes off your next workout with # of simple tips." },
  { category: "educational", template: "If I only had (time frame) in the (location/place) this is exactly what I would do to get (dream result)." },
  { category: "educational", template: "How long can you skip (action) before losing (result)." },
  { category: "educational", template: "If you want to (dream result) a week for the next (weeks) without (pain point) then listen up." },
  { category: "educational", template: "If you just turned (age) and you don't want to (pain point) then you should do the following # things immediately." },
  { category: "educational", template: "You can have a perfect (dream result) by simply dumbing it down." },
  { category: "educational", template: "Did you know that this, this, this, and this get (dream result)." },
  { category: "educational", template: "Don't start doing (action) until you learn how to do this." },
  { category: "educational", template: "(industry) tier list for (year)." },
  { category: "educational", template: "In 60 seconds I'm going to teach you more about (thing) than you have ever learned in your entire life." },
  { category: "educational", template: "If you're in your (20's, 30's, 40's, 50's, 60's, etc) then these are the # of things you need to do to make sure you don't end up (pain point) by (age)." },
  { category: "educational", template: "(Noun) loses (Noun) on this, so they can make (noun) on this." },
  { category: "educational", template: "You have (noun) tomorrow but you have no time to (action). Here's how you save your (noun)." },
  { category: "educational", template: "(Scenario) and (dream result), here are the # of steps to get (dream result)." },
  { category: "educational", template: "Everyone tells you to do (action) but you think it's too late because you are (age). I am a (occupation) and these are # of things you need to know in your (age)." },
  { category: "educational", template: "(target audience) if you're serious about playing at the next level." },
  { category: "educational", template: "You only have to be dialed in on # of things to be an elite (title)." },
  { category: "educational", template: "(Noun) for dummies." },
  { category: "educational", template: "Don't hate me but I don't really mind (noun)." },
  { category: "educational", template: "Best ways to save money while (action)." },
  { category: "educational", template: "This is every way to (action)." },
  { category: "educational", template: "What if I told you this (item) could (result)." },
  { category: "educational", template: "Did you know that if you (action), (action), (action), etc." },
  { category: "educational", template: "The (thing) you have now in your (age group) is so (noun)." },
  { category: "educational", template: "At age (age) the age that many (target audience) is when (pain point)." },
  { category: "educational", template: "Listen if you're not forcing your (person/persons) to (action) in their (current state) don't expect them to be (trait) in their (after state)." },
  { category: "educational", template: "Would you rather watch your (person/persons) (pain point) or join them in their (niche) journey to save their lives?" },
  { category: "educational", template: "This is the amount of (noun) you would lose per day in a (state)." },
  { category: "educational", template: "If your in a (dream result) journey, this is exactly what you need to do to (dream goal) in # simple steps." },
  { category: "educational", template: "If you told me # of years ago I'd be (dream result) I wouldn't have believed you." },
  { category: "educational", template: "If your getting (adjective) or know someone (adjective) there are # of incredibly important things you need to make sure you can do physically in order to (dream result)." },
  { category: "educational", template: "If you don't want to fail (life event)." },
  { category: "educational", template: "I crammed the hardest (noun) and (dream result)." },
  { category: "educational", template: "If you're cooked for your (life event) but still can't find the motivation to do (action) you're gonna want to see this." },
  { category: "educational", template: "Here's the difference between (title), (title), and (title)." },
  { category: "educational", template: "If I were in my (age range) here is exactly how I would avoid (bad result)." },
  { category: "educational", template: "Here's every (noun) that you actually need to know." },
  { category: "educational", template: "The most important things I will teach my kids as a (job title)." },
  { category: "educational", template: "If you can't solve this (problem) in under 5 seconds go back to (pre-qualifying stage)." },
  { category: "educational", template: "30 seconds of (industry) advice I give my best friend if he/she were starting from scratch." },
  { category: "educational", template: "I would do this before quitting your job." },
  { category: "educational", template: "If you do this you'll (result)." },
  { category: "educational", template: "If your a (target audience) who (pain point) and you want to (dream result) let's go over a very simple # step plan you can follow to quickly (dream result)." },
  { category: "educational", template: "Here are 5 books to (dream result) better than 99% of other people." },
  { category: "educational", template: "If you're somebody who (action) and your goal is to (dream result) and (dream result) at the same time. Then here are my # best tips." },
  { category: "educational", template: "If you can't do (action)." },
  { category: "educational", template: "If you can do # of (action), than you can do # of (action)." },
  { category: "educational", template: "If your mom didn't teach you how to make (noun) growing up, don't worry I'm your mommy now." },
  { category: "educational", template: "Never lose a game of (game) for the rest of your life." },
  { category: "educational", template: "3 levels of (noun)." },
  { category: "educational", template: "Did you know that if you… (action), (action), (action), etc." },
  { category: "educational", template: "I am a professional (industry) hacker, and here's every hack at (store/location/event/etc)." },
  { category: "educational", template: "I have a very long list of (noun) that I (action) that I gate keep from other people. But today I feel like giving back so I am going to tell you." },
  { category: "educational", template: "I am going to teach you how to identify a good (noun) to a bad (noun)." },
  { category: "educational", template: "I went to (school type) so you don't have to." },
  { category: "educational", template: "Ranking all the most popular (noun), so I can rank them from worst to best." },
  { category: "educational", template: "Here is how I (action) as a (label) (age)." },
  { category: "educational", template: "You wouldn't get (bad result) when you (action) if you (action)." },
  { category: "educational", template: "This is harder than getting into Harvard." },
  { category: "educational", template: "Now how much does it really cost to (action)." },
  { category: "educational", template: "This is why no one remembers you." },
  { category: "educational", template: "If you're a (target audience) and you want to become (dream result) by (action) then listen to this video because you have such a big advantage and I will tell you how to conquer it." },
  { category: "educational", template: "If you take (noun) it will (result)." },
  { category: "educational", template: "How to turn just one (noun) into a lifetime of free (noun)." },
  { category: "educational", template: "Things that are damaging your (noun) without you even realizing it." },
  { category: "educational", template: "I've (dream result) despite having (pain point) and this is the routine that did it." },
  { category: "educational", template: "Swap these (noun) for better (result)." },
  { category: "educational", template: "Your (noun) looks like this and you want them to look like this." },
  { category: "educational", template: "This is the program/steps I would follow if I was trying to (dream result)." },
  { category: "educational", template: "Stop (action) if you actually want to (dream result)." },
  { category: "educational", template: "What if I told you, you could (action) for only (low cost)." },
  { category: "educational", template: "Why did it take me over # years to realize you can make (result) in # minutes." },
  { category: "educational", template: "Here's exactly how much (noun) you can make with under (dollar amount)." },
  { category: "educational", template: "You'll never get (dream result) in your (age range) if you don't do these 3 things when you turn (age)." },
  { category: "educational", template: "I worked at (company) for X months/years and now I am exposing everything they keep from customers." },
  { category: "educational", template: "This is what (money amount) will get you in (location)." },
  { category: "educational", template: "There is one thing above all that sets the top (title) apart from the rest." },
  { category: "educational", template: "This is how I would (action) if I were starting from scratch." },
  { category: "educational", template: "I teach (noun) to people like they are in kindergarten, and it's time for class." },
  { category: "educational", template: "Here's a little (noun) 101 for you." },
  { category: "educational", template: "If you gave me (time frame) to get a job as a (title) this is what I would do." },
  { category: "educational", template: "# things I'd do if I were to re-start (industry/niche/occupation/hobby)." },
  { category: "educational", template: "These are the 3 most common mistakes I see when people are making (noun)." },
  { category: "educational", template: "I bought all the (noun) so you could find out which are the best in each category and which is not worth your money." },
  { category: "educational", template: "Did you know that there are # types of (noun)." },
  { category: "educational", template: "Here is how I make (noun) that lasts up to (time frame) and only costs (amount)." },
  { category: "educational", template: "After over a decade of (action) here is what I wish someone would have told me from the start." },
  { category: "educational", template: "If I had 90 days to go from being (current state) to (dream result) here's exactly how I would do it!" },
  { category: "educational", template: "If you're serious about getting (result) then this is the only video you will ever need so save it for later and watch till the end." },
  { category: "educational", template: "If I had to start over and (verb) my (noun) from scratch, these are the only (noun) I would do for someone that is new to (noun)." },
  { category: "educational", template: "How to start your (noun) from scratch." },
  { category: "educational", template: "Exposing the only (noun) you will ever need." },
  { category: "educational", template: "If you want to start a (noun) in (year) here are some things you are going to need." },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPARISON (Pages 30–32)
  // ═══════════════════════════════════════════════════════════════════════════
  { category: "comparison", template: "This is an (noun), and this is an (noun)." },
  { category: "comparison", template: "This (noun) and this (noun) have the same amount of (noun)." },
  { category: "comparison", template: "A lot of people ask me what's better (option #1) or (option #2) for (dream result). I achieved (dream result) doing one of these and it's not even close." },
  { category: "comparison", template: "For this (item) you could have all of these (item)." },
  { category: "comparison", template: "He/she always (action), and he/she does (action)." },
  { category: "comparison", template: "For this (noun), you could have all of (noun)." },
  { category: "comparison", template: "This (option #1) has (noun) in it, and (option #2) has (noun) in it." },
  { category: "comparison", template: "This group didn't (action) and this group did." },
  { category: "comparison", template: "For this (noun), you could have this whole (noun)." },
  { category: "comparison", template: "This is (metric) of (noun) for (price), and this is also (metric) of (noun) for (price)." },
  { category: "comparison", template: "How long would it take you to go from (before state) like this to (dream result) with (desire)." },
  { category: "comparison", template: "If you're between the ages # - # and you want to become (dream result) and I mean really (dream result). Then you have to do these # things." },
  { category: "comparison", template: "This (noun) has (metric) and will get you (dream result), and this (noun) has (metric) and will get you (dream result)." },
  { category: "comparison", template: "One (noun), and # of my (noun) have the same (metric)." },
  { category: "comparison", template: "This is a (noun) from (restaurant/store/place) for (metric), and this is the same (noun) from (restaurant/store/place) for (metric)." },
  { category: "comparison", template: "This is a (noun), this is also a (noun)." },
  { category: "comparison", template: "This is (noun) before you (action), this is (noun) after you (action)." },
  { category: "comparison", template: "These two groups (similar result) but this group (result)." },
  { category: "comparison", template: "The (noun) offers you a (option #1) and a (option #2) what do you choose?" },
  { category: "comparison", template: "(number) (noun) I would have this one if I was (verb), and I would have this one if I was (verb)." },
  { category: "comparison", template: "This is (noun) at (metric), and it's perfect for (verb). This is (noun) at (metric)." },
  { category: "comparison", template: "This is (metric) of (noun), this is also (metric)." },
  { category: "comparison", template: "(metric) and (metric) both sides are (adjective) and look the same. Let's see why." },
  { category: "comparison", template: "(result) (noun) vs. (result) (noun)." },
  { category: "comparison", template: "Both these (noun) are exactly the same. I have not changed a single (noun). But this one is (metric) and this one is (metric)." },
  { category: "comparison", template: "Would you feel more (trait) in this (noun) or this one?" },
  { category: "comparison", template: "Both groups gained the same amount of (noun). Except this group (action) # days a week, and this group (action) #." },
  { category: "comparison", template: "Cheap vs. Expensive (noun)." },
  { category: "comparison", template: "You will (result) a week if you (action) on a (journey). But you will only (result) this much a week if you (action) on a (journey)." },
  { category: "comparison", template: "This is what your (noun) looks like when you don't take (noun). And this is what your (noun) looks like when you take (noun)." },
  { category: "comparison", template: "This is me after (action) in the (location) with (condition). And this is me just (action) in the middle of (location)." },

  // ═══════════════════════════════════════════════════════════════════════════
  // MYTH BUSTING (Pages 32–36)
  // ═══════════════════════════════════════════════════════════════════════════
  { category: "myth_busting", template: "(item) (fact), (complete opposite item) (similar fact)." },
  { category: "myth_busting", template: "This is why doing (action) makes you (pain point)." },
  { category: "myth_busting", template: "This is how you (dream result) while (guilty pleasure)." },
  { category: "myth_busting", template: "(item) (fact), (item) (similar fact), (complete opposite item) (similar fact)." },
  { category: "myth_busting", template: "If you're really a (dream result), why aren't you doing (common belief)?" },
  { category: "myth_busting", template: "Just because you do (action) doesn't make you a good (label)." },
  { category: "myth_busting", template: "If you are (action) just once per (month/day/year) than you are f*ucked." },
  { category: "myth_busting", template: "This is me when I (action) (frequency), and this is me still (action) (frequency)." },
  { category: "myth_busting", template: "No your (noun) is not cause (result)." },
  { category: "myth_busting", template: "Let me de-influence you from (action)." },
  { category: "myth_busting", template: "More (target audience) need to hear this, (common belief) will not (result)." },
  { category: "myth_busting", template: "It's time to throw away your (item), you don't need it anymore." },
  { category: "myth_busting", template: "They said, \"(famous cliché or quote)\" That's a lie." },
  { category: "myth_busting", template: "Don't (action) until you've done this one thing." },
  { category: "myth_busting", template: "Stop using (item) for (result)." },
  { category: "myth_busting", template: "You cannot be (dream result) before you enter (age group)." },
  { category: "myth_busting", template: "Your life is boring because you don't (action)." },
  { category: "myth_busting", template: "Just because you have never (action) before, doesn't make you a (label) person." },
  { category: "myth_busting", template: "(Noun) is actually a really good (Noun) for (result)." },
  { category: "myth_busting", template: "# things I would never (action) in my (age range) if I wanted to (dream result) by (age range)." },
  { category: "myth_busting", template: "I haven't done (common action) in over # years, and it's healed (noun)." },
  { category: "myth_busting", template: "You are not (bad label), you are not (bad label), you just can't (adjective)." },
  { category: "myth_busting", template: "(action) I have never (action) before, to prove (action) is easy." },
  { category: "myth_busting", template: "For the price of this many (noun) at the (place/store/restaurant) you could make this many at home." },
  { category: "myth_busting", template: "You are (action) too many (noun) that you didn't know." },
  { category: "myth_busting", template: "(well known person or brand) is trying to get this video removed from the internet because he/she exposes their product for being (negative result). Watch this now before it's gone." },
  { category: "myth_busting", template: "There is absolutely no reason for you to be (pain point) every single day just because you are trying to (dream result)." },
  { category: "myth_busting", template: "Don't make the mistake of (action), (action), (action)." },
  { category: "myth_busting", template: "You are not bad at (action), you probably were just never taught how to (action)." },
  { category: "myth_busting", template: "You're using your (noun) wrong and I am going to show you how to use it the right way." },
  { category: "myth_busting", template: "Everyone on the internet is going to tell you making (noun) is impossible. But I am going to show you how to make them from home." },
  { category: "myth_busting", template: "If you (action) like this, then you're doing it wrong." },
  { category: "myth_busting", template: "(noun) is better for (result) than (noun). And yes I am going to back up my claim with studies." },
  { category: "myth_busting", template: "Being (result) is not just based on (noun). You may not believe this but I could have been (adjective) then this guy/girl if I had just changed a few things." },

  // ═══════════════════════════════════════════════════════════════════════════
  // STORYTELLING (Pages 36–57)
  // ═══════════════════════════════════════════════════════════════════════════
  { category: "storytelling", template: "I started my (business) when I was (age) with (amount)." },
  { category: "storytelling", template: "X years ago my (person) told me (quote)." },
  { category: "storytelling", template: "I have (time) to get my sh*t together." },
  { category: "storytelling", template: "I don't have a backup plan so this kind of needs to work." },
  { category: "storytelling", template: "This is how my (event/item/result) changed my life." },
  { category: "storytelling", template: "So about a month ago my (person) and I did (action)." },
  { category: "storytelling", template: "I have (action) over (number) in my life." },
  { category: "storytelling", template: "This is a picture of my (what picture is)." },
  { category: "storytelling", template: "X years ago I decided to (decision)." },
  { category: "storytelling", template: "Yesterday I was at (location) when I noticed something (adjective)." },
  { category: "storytelling", template: "X years ago I was (action) because I (pain point)." },
  { category: "storytelling", template: "Is it possible to (action) while (action) in X days." },
  { category: "storytelling", template: "When is it time to do (action)." },
  { category: "storytelling", template: "So I did (action) last week." },
  { category: "storytelling", template: "When I was (description) I was always (bad habit)." },
  { category: "storytelling", template: "If you are anything like me, you take your (event/item) very seriously." },
  { category: "storytelling", template: "In (time), I went from (before state) to (after state)." },
  { category: "storytelling", template: "X years ago we (action) to (result)." },
  { category: "storytelling", template: "Hi I am (first name) and I am starting (business) from scratch." },
  { category: "storytelling", template: "This is the story of how I managed to do (achievement)." },
  { category: "storytelling", template: "I am (age) having an identity crisis." },
  { category: "storytelling", template: "(# days/months/years) ago I quit (thing)." },
  { category: "storytelling", template: "This is probably the scariest thing I have ever done." },
  { category: "storytelling", template: "This girl/boy was in her/his flop era." },
  { category: "storytelling", template: "Is it possible for (description) to make (amount) a month?" },
  { category: "storytelling", template: "I did everything right." },
  { category: "storytelling", template: "So I recently started feeling \"the pressure\" everyone talks about." },
  { category: "storytelling", template: "Can you (dream result) after (shortcut)." },
  { category: "storytelling", template: "After X years of I (action) because I realized one thing: (statement)." },
  { category: "storytelling", template: "It all started when (person) (action)." },
  { category: "storytelling", template: "X years ago (people) (action)." },
  { category: "storytelling", template: "I'm (action) in (time) and I just (action)." },
  { category: "storytelling", template: "1 Year Ago today, I ___." },
  { category: "storytelling", template: "I'm (age) and I'm not ashamed to admit that >>" },
  { category: "storytelling", template: "When I (action), people said (feedback)." },
  { category: "storytelling", template: "X days/weeks/months/years into my (action), my worst nightmare became my reality." },
  { category: "storytelling", template: "It all started when this boy/girl, (action)." },
  { category: "storytelling", template: "X days/weeks/months ago my (person) and I (action), (action), and (action) this is how it's going." },
  { category: "storytelling", template: "I woke up this morning thinking about (thought)." },
  { category: "storytelling", template: "X days/months/years I (life event) and decided to quit (bad habit)." },
  { category: "storytelling", template: "X days/months/years I started (action) again after being stuck at (pain point)." },
  { category: "storytelling", template: "X days/months/years I started (action) thinking it would magically solve (pain point) but here is what ended up happening." },
  { category: "storytelling", template: "I am an X year old (occupation) from (location) and I just (action)." },
  { category: "storytelling", template: "The secret is out I am (action)." },
  { category: "storytelling", template: "I got (dream result) without (pain point/points) here's how." },
  { category: "storytelling", template: "So I (shocking action) for over (time frame)." },
  { category: "storytelling", template: "So I messed up." },
  { category: "storytelling", template: "I developed an X addiction so strong I physically can not stop (action)." },
  { category: "storytelling", template: "X years it took me from (bad situation/result) to (good situation/result)." },
  { category: "storytelling", template: "There is nothing more embarrassing than X." },
  { category: "storytelling", template: "I am a (title) by day and a (title) by night." },
  { category: "storytelling", template: "Come with me to make (object)." },
  { category: "storytelling", template: "I started (business) at (age/life event) and I had no idea I would (result/outcome)." },
  { category: "storytelling", template: "It's been (time) since we (experience)." },
  { category: "storytelling", template: "I think (belief/opinion) so I have been taking matters into my own hands." },
  { category: "storytelling", template: "I was shocked when I found out (fact)." },
  { category: "storytelling", template: "So I just turned (age)." },
  { category: "storytelling", template: "This is how I got to (cool opportunity) in my X week/month/year of doing/starting (business or job)." },
  { category: "storytelling", template: "What happens when you (action) then you end up (result) but you (challenge)." },
  { category: "storytelling", template: "What if I told you that (dream result) without (pain point)." },
  { category: "storytelling", template: "I went on # of (noun) this year, and here is the one trait I learned that you need to have to (dream result)." },
  { category: "storytelling", template: "X days/months/years ago I was (action), every waking hour because I was (trait) and I wanted (result)." },
  { category: "storytelling", template: "X days/months/years ago I was (life event), because I was (action) instead of (action)." },
  { category: "storytelling", template: "This is (person) we have known each other from X years, X days, X hours, X minutes." },
  { category: "storytelling", template: "I used to be in a super toxic relationship back in (time frame) so let me tell you about it." },
  { category: "storytelling", template: "How I married my middle school/highschool/college girlfriend/boyfriend." },
  { category: "storytelling", template: "(person) always expects you to have (result) but the problem is…." },
  { category: "storytelling", template: "My (label) (name) and I, started (business) in (year)." },
  { category: "storytelling", template: "You are not (label) is something I wish I could have told my younger self." },
  { category: "storytelling", template: "Is it possible to get (dream result) with only (action) for only 1 day." },
  { category: "storytelling", template: "I have no idea what I am doing at (place)." },
  { category: "storytelling", template: "I got (result) at (age) and (result) by (age) if you are scared about (result) this is for you." },
  { category: "storytelling", template: "(year) - I think I am going to (goal)." },
  { category: "storytelling", template: "So I bought this (noun) last week and quickly realized I have no idea how to (action)." },
  { category: "storytelling", template: "X days/months/years ago I bought a (noun) as a (age) with a full-time (job)." },
  { category: "storytelling", template: "I hate to say this but my wake up call wasn't as (scenario) no my first wake up call was (scenario)." },
  { category: "storytelling", template: "If you're new to this channel let me catch you up." },
  { category: "storytelling", template: "The worst part about being a (title) is I literally do not…" },
  { category: "storytelling", template: "Nothing could have prepared me for how it feels being in your (age group) and (situation)." },
  { category: "storytelling", template: "I tried a # hour (noun) routine, which is much harder than you think." },
  { category: "storytelling", template: "You think you're a (label)? Well let me introduce you to my life." },
  { category: "storytelling", template: "My (person) and I tried a whole (time frame) without (action)." },
  { category: "storytelling", template: "(quote) the first time I heard this I was (action), and my (person) just dropped that line out of nowhere." },
  { category: "storytelling", template: "Build a (noun) with me while I (action)." },
  { category: "storytelling", template: "When I told my (person) I was going to start doing this he/she thought it was the worst idea ever." },
  { category: "storytelling", template: "This (noun) single handedly changed my career." },
  { category: "storytelling", template: "Day # of (action) until I (dream result)." },
  { category: "storytelling", template: "Someone just (negative result) my business." },
  { category: "storytelling", template: "I am leaving my (salary) dream job at (company) to (action)." },
  { category: "storytelling", template: "X days/months/years ago I went extremely viral for (action)." },
  { category: "storytelling", template: "For those of you who don't know I have been bootstrapping a (business type) to see how big I can scale it." },
  { category: "storytelling", template: "This is day # of making fake (noun) for our dream clients until one of them starts working with us." },
  { category: "storytelling", template: "Hi my name is (name) and this was me (time frame) ago a (label) in (noun)." },
  { category: "storytelling", template: "I (action) to every (person) in the world. Here is how many people responded." },
  { category: "storytelling", template: "I am (life event) in (time frame) and I just wrote a letter that I wish my (age) self would have read." },
  { category: "storytelling", template: "I didn't realize how bad I lost myself." },
  { category: "storytelling", template: "I just left my (salary) a year new grad job, and now I am just a disappointment." },
  { category: "storytelling", template: "I've (verb) this almost every single day of my entire life." },
  { category: "storytelling", template: "A fun fact about my (person) (name) is." },
  { category: "storytelling", template: "I spent an entire (time) (verb) but was it a waste of time?" },
  { category: "storytelling", template: "I always wondered what it was like to (action)." },
  { category: "storytelling", template: "Selling (noun) at (location) has made me more money than my (person/title) and today I am going to be investing that money into (noun)." },
  { category: "storytelling", template: "This was the (noun) that changed my life forever." },
  { category: "storytelling", template: "Today I woke up and realized (realization)." },
  { category: "storytelling", template: "Okay real talk, I wasn't always this (adjective)." },
  { category: "storytelling", template: "# months/years ago my friends and I started a (business). And it turned out to be the biggest (result)." },
  { category: "storytelling", template: "I (traumatic event) at (age) but it's what happened after that, that actually changed my life." },
  { category: "storytelling", template: "I was walking past this (store) when I saw they had (noun)." },
  { category: "storytelling", template: "Yesterday I (action) in (hours) and (minutes)." },
  { category: "storytelling", template: "Nearly # years/months ago today I packed my bags and left for (location), thinking I would only be gone for (time)." },
  { category: "storytelling", template: "I am attempting to be the first person to (goal), day #." },
  { category: "storytelling", template: "My (person) told me he/she wanted a (noun) and instead of waiting around I decided to build it right now." },
  { category: "storytelling", template: "I already know I am going to get a bunch of hate for this but the (noun) is getting taken out today." },
  { category: "storytelling", template: "I am going to do it, I'm going to flip this… house." },
  { category: "storytelling", template: "Dude, it's day #. And I almost went (result)." },
  { category: "storytelling", template: "A competitor showed up at my job trying to get me fired." },
  { category: "storytelling", template: "I damaged a customer's property and here's how I handled it." },
  { category: "storytelling", template: "A customer (result) and tried to avoid paying." },
  { category: "storytelling", template: "Alright this is officially day #1, trying to make (amount) a month with (business)." },
  { category: "storytelling", template: "Did you know you can start your own (business) from home without (pain point), (pain point), and (pain point)." },
  { category: "storytelling", template: "My (noun) made me (amount) last month, and what's crazy about this is I used no money to start this business." },
  { category: "storytelling", template: "Starting a (business) at (age)." },
  { category: "storytelling", template: "Welcome to day # of starting my life over at (age)." },
  { category: "storytelling", template: "This is how I ended up taking the biggest risk of my life." },
  { category: "storytelling", template: "In 1 year I (verb) over (pounds) of (noun) in my extremely small (location)." },
  { category: "storytelling", template: "I f*cked up. I bought literally a (metric) of (noun). And for the last (time) I have been turning them into (results)." },
  { category: "storytelling", template: "I finally built it. For the last # years I've been turning (noun) into (noun)." },
  { category: "storytelling", template: "Is it possible to go from (before state) to (after state) just by (action)." },
  { category: "storytelling", template: "I did (action) everyday for one year, and here's what's different." },
  { category: "storytelling", template: "# days ago I quit (noun) as a (age) (title), and started (noun) for literally one reason." },
  { category: "storytelling", template: "Day # of trying a new hobby to recover from burnout." },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHORITY (Pages 59–62)
  // ═══════════════════════════════════════════════════════════════════════════
  { category: "authority", template: "My (before state) used to look like this and now they look like this." },
  { category: "authority", template: "10 YEARS it took me from (before state) to (after state)." },
  { category: "authority", template: "How to turn this into this in X simple steps." },
  { category: "authority", template: "(big result) from (item/thing). Here's how you can do it in X steps." },
  { category: "authority", template: "Over the past (time) I've grown my (thing) from (before) to (after)." },
  { category: "authority", template: "Just # (item/action) took my client from (before) to (after)." },
  { category: "authority", template: "My customer/client got (dream result) without (pain point)." },
  { category: "authority", template: "If I were to create a collab campaign for (big brands) here's how I would do it." },
  { category: "authority", template: "How I got my (item/thing) from this to this." },
  { category: "authority", template: "I became a (achievement) at (age) and if I could give you X pieces of advice it would be…" },
  { category: "authority", template: "Everyone is complimenting on my (noun) because of one (noun) routine that I do." },
  { category: "authority", template: "I lost over (metric) in (time frame) and here are the # of things I would do if I was to start all over." },
  { category: "authority", template: "I am in a (noun) and these # habits dramatically transformed my (noun)." },
  { category: "authority", template: "I got (dream result) on all of my (noun) with minimal (action) and here's how." },
  { category: "authority", template: "If I were to create a (noun) today this is how I would do it." },
  { category: "authority", template: "If I ever made it to the news I thought it would at least be for something illegal, turns out it's for (dream result)." },
  { category: "authority", template: "(well known brand) commented that I am their new favorite (title)." },
  { category: "authority", template: "What I (action) in a day as someone who has achieved (dream result)." },
  { category: "authority", template: "I literally used to have a (before state)." },
  { category: "authority", template: "My (noun) went from this to this in the last (time frame) and this is what I done." },
  { category: "authority", template: "I have been pretty much doing the same (noun) for the past (time frame) and they have legit (dream result)." },
  { category: "authority", template: "When I was (before state) I was constantly (pain point)." },
  { category: "authority", template: "In (year) my business made (dollar amount)." },
  { category: "authority", template: "As a (title) for several years whose (action) I often get asked (name) (question)." },
  { category: "authority", template: "I have never ended (noun) with a (result) or below." },
  { category: "authority", template: "He/she (action) for one day and got (dream result)." },
  { category: "authority", template: "I jumped my (noun) from (before state) to (dream result)." },
  { category: "authority", template: "This used to be my (noun) this is my (noun) now." },
  { category: "authority", template: "I have been able to go from this, to this." },
  { category: "authority", template: "Things I wish I knew before my (noun) that took me from this to this." },
  { category: "authority", template: "The (noun) I (action) everyday that took me from this, to this." },
  { category: "authority", template: "I went from this to this." },
  { category: "authority", template: "No because my transformation from (age) to (age) ought to be studied." },
  { category: "authority", template: "After (dream result) here is one thing I learned the hard way so you don't have to." },
  { category: "authority", template: "Okay bish you don't need to (action) to (dream result) coming from someone who (dream result)." },
  { category: "authority", template: "I (dream result) in the past (time frame), here's proof." },
  { category: "authority", template: "Here's how my student/client/customer went from (before result) to (after result) and (symptom due to result)." },
  { category: "authority", template: "% of the time when I am in (situation) I get (result), and today I will be showing you my (noun) routine so I can help you achieve (dream result)." },
  { category: "authority", template: "I (verb) for (time frame) and I got a (dream result)." },
  { category: "authority", template: "This is how I got my (noun) from this to this completely natural." },
  { category: "authority", template: "Nobody believes me if I say I went from this to this." },
  { category: "authority", template: "These are the products I use to keep (noun) (noun) and (adjective) as a (title)." },
  { category: "authority", template: "(noun) is my second (noun) and here are the # (noun) I did over, and over, and over again to improve my (noun)." },
  { category: "authority", template: "How I took this (title) from 0 to (number) of (noun) in 1 week." },
  { category: "authority", template: "I am only (metric) but I have became one of the best (title) in the world." },

  // ═══════════════════════════════════════════════════════════════════════════
  // DAY IN THE LIFE (Pages 62–63)
  // ═══════════════════════════════════════════════════════════════════════════
  { category: "day_in_the_life", template: "We all have the same 24 hours in a day so here I am putting my 24 hours to work." },
  { category: "day_in_the_life", template: "Day 1 of starting over my whole entire life." },
  { category: "day_in_the_life", template: "So okay being an (target audience), my days vary quite a lot from one another." },
  { category: "day_in_the_life", template: "Day in the life of a (adjective) person." },
  { category: "day_in_the_life", template: "Welcome back to the day in the life of two (label) trying to build the next (business)." },
  { category: "day_in_the_life", template: "(noun) day # (event about that day)." },
  { category: "day_in_the_life", template: "I am a # year old (title), and I am heading to (event/location)." },
  { category: "day_in_the_life", template: "This is a day in the life of a (title) (noun) edition." },
  { category: "day_in_the_life", template: "Come to work with me as a (title)." },
  { category: "day_in_the_life", template: "(school) day #, my last (noun)." },
  { category: "day_in_the_life", template: "Day # of turning from (before state) to (after state) and suddenly I don't want to be (after state) anymore." },
  { category: "day_in_the_life", template: "Come with me to earn $ per day, with (avenue)." },
  { category: "day_in_the_life", template: "Day # trying to make (amount) by the end of the year, by (method)." },
  { category: "day_in_the_life", template: "Day in the life of a future millionaire." },
  { category: "day_in_the_life", template: "Day in the life as a (title) (noun) edition." },
  { category: "day_in_the_life", template: "This is what an average day of a (title) looks like a week out from (event)." },
  { category: "day_in_the_life", template: "This is what my morning looks like while (situation)." },
  { category: "day_in_the_life", template: "This is what I (action) in a day as someone who is trying to (action) less and (action) more." },

  // ═══════════════════════════════════════════════════════════════════════════
  // RANDOM / ENGAGEMENT (Pages 58–59)
  // ═══════════════════════════════════════════════════════════════════════════
  { category: "random", template: "This is (large number) of (item)." },
  { category: "random", template: "This is my (item) and this is (random action) if I were (random action)." },
  { category: "random", template: "You're losing your boyfriend/girlfriend this week to (event/hobby)." },
  { category: "random", template: "What (title) says vs what they mean." },
  { category: "random", template: "(trend) is the most disgusting trend on social media." },
  { category: "random", template: "I do not believe in (common belief), I believe in (your belief)." },
  { category: "random", template: "If you like these (job title), you'll probably like my (work)." },
  { category: "random", template: "(big brand) didn't want to sponsor this video, let me show you what they're missing out on." },
  { category: "random", template: "I am trying a different (noun) for each letter of the alphabet." },
  { category: "random", template: "My (person) has never been in the (place) before let's see if she can tell who is (adjective) or not." },
  { category: "random", template: "If I get this in, then I have to (verb)." },
  { category: "random", template: "Person #1: (large number) Person #2: What are you doing? Person #1: (action) I want to get a (dream result) before (time)." },
  { category: "random", template: "Buying things I don't need because I have adult money." },
  { category: "random", template: "Remember that time you were (adjective) so you (action) but the moment (person) (verb) you (action)." },
  { category: "random", template: "Have you ever seen (number) (noun) in one place?" },
  { category: "random", template: "Can you name something more terrifying than a (person) with a (noun)." },
];


/**
 * Returns a random subset of templates from the best-matching categories for the given idea.
 * The LLM uses these as structural inspiration — not copy-paste.
 */
export function getRelevantTemplates(idea: string, count: number = 12): HookTemplate[] {
  const lower = idea.toLowerCase();

  const categoryScores: Record<HookCategory, number> = {
    educational: 0,
    comparison: 0,
    myth_busting: 0,
    storytelling: 0,
    authority: 0,
    day_in_the_life: 0,
    random: 0,
  };

  // Educational signals
  if (/\b(how to|learn|teach|tips?|steps?|guide|tutorial|hack|secret|mistake|avoid)\b/i.test(lower)) categoryScores.educational += 3;
  if (/\b(beginner|start|basics?|101|simple|easy)\b/i.test(lower)) categoryScores.educational += 2;

  // Comparison signals
  if (/\b(vs\.?|versus|compare|better|worse|difference|same|both)\b/i.test(lower)) categoryScores.comparison += 3;
  if (/\b(cheap|expensive|budget|premium|option)\b/i.test(lower)) categoryScores.comparison += 2;

  // Myth busting signals
  if (/\b(myth|wrong|lie|truth|actually|stop|don'?t|never|overrated|toxic|scam)\b/i.test(lower)) categoryScores.myth_busting += 3;
  if (/\b(believe|think|assume|supposed|should)\b/i.test(lower)) categoryScores.myth_busting += 1;

  // Storytelling signals
  if (/\b(story|journey|started|quit|failed|messed up|changed|realized|confession|scared)\b/i.test(lower)) categoryScores.storytelling += 3;
  if (/\b(years? ago|months? ago|when i|my life|grew up|experience)\b/i.test(lower)) categoryScores.storytelling += 2;

  // Authority signals
  if (/\b(result|transform|client|customer|grew|built|made \$|revenue|proof|before.?after)\b/i.test(lower)) categoryScores.authority += 3;
  if (/\b(expert|professional|years of|decade|career)\b/i.test(lower)) categoryScores.authority += 2;

  // Day in the life signals
  if (/\b(day in|routine|morning|daily|schedule|24 hours|come with me|work with me)\b/i.test(lower)) categoryScores.day_in_the_life += 3;

  // Random / engagement signals
  if (/\b(flex|money|rich|broke|viral|trend|challenge|bet|dare)\b/i.test(lower)) categoryScores.random += 2;

  // Sort categories by score descending
  const ranked = (Object.entries(categoryScores) as [HookCategory, number][])
    .sort((a, b) => b[1] - a[1]);

  // Always include top 2 categories + educational as fallback
  const selectedCategories = new Set<HookCategory>();
  selectedCategories.add(ranked[0][0]);
  selectedCategories.add(ranked[1][0]);
  selectedCategories.add("educational");

  // If no strong signal, add storytelling and random for variety
  if (ranked[0][1] === 0) {
    selectedCategories.add("storytelling");
    selectedCategories.add("random");
  }

  // Gather templates from selected categories
  const pool = HOOK_TEMPLATES.filter((t) => selectedCategories.has(t.category));

  // Shuffle and pick
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Formats templates into a string block for prompt injection.
 */
export function formatTemplatesForPrompt(templates: HookTemplate[]): string {
  const grouped: Partial<Record<HookCategory, string[]>> = {};
  for (const t of templates) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category]!.push(t.template);
  }

  const categoryLabels: Record<HookCategory, string> = {
    educational: "Educational / How-To",
    comparison: "Comparison / A vs B",
    myth_busting: "Myth Busting / Contrarian",
    storytelling: "Storytelling / Personal",
    authority: "Authority / Proof",
    day_in_the_life: "Day in the Life / Vlog",
    random: "Engagement / Pattern Break",
  };

  const lines: string[] = [];
  for (const [cat, tmpls] of Object.entries(grouped)) {
    lines.push(`[${categoryLabels[cat as HookCategory]}]`);
    for (const t of tmpls!) {
      lines.push(`• "${t}"`);
    }
  }
  return lines.join("\n");
}

export { HOOK_TEMPLATES };
