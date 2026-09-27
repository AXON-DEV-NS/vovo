export interface ResearchFinding {
  title: string;
  description: string;
  source: string;
}

export interface ResearchResult {
  bestPractices: ResearchFinding[];
  thingsToAvoid: ResearchFinding[];
}

export interface ResearchProvider {
  name: string;
  research(nicheName: string, mode: "initial" | "daily"): Promise<ResearchResult>;
}

interface CuratedNiche {
  bestPractices: { core: ResearchFinding[]; daily: ResearchFinding[] };
  thingsToAvoid: { core: ResearchFinding[]; daily: ResearchFinding[] };
}

const S = (title: string, description: string, source: string): ResearchFinding => ({
  title,
  description,
  source,
});

const CURATED_RESEARCH: Record<string, CuratedNiche> = {
  technology: {
    bestPractices: {
      core: [
        S(
          "Open with the payoff, then explain",
          "Top tech videos state the result viewers will get in the first 15 seconds, then walk through the how. Retention peaks when the value is front-loaded.",
          "initial research"
        ),
        S(
          "Use concrete demos over abstract explanations",
          "Screen recordings, benchmarks, and side-by-side comparisons consistently outperform talking-head explanations in technology content.",
          "initial research"
        ),
        S(
          "Keep videos between 8 and 14 minutes",
          "Mid-length deep dives hold attention better than both short clips and hour-long streams for educational tech content.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Cover releases within 48 hours",
          "Channels that publish on a new tool or update within two days capture disproportionate search and browse traffic.",
          "daily research"
        ),
      ],
    },
    thingsToAvoid: {
      core: [
        S(
          "Don't bury the conclusion",
          "Videos that build suspense for the verdict see drop-off — state the outcome early and justify it afterwards.",
          "initial research"
        ),
        S(
          "Avoid outdated specs and version claims",
          "Audiences flag stale version numbers immediately, which damages credibility and comment quality.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Don't chase every trend",
          "Hopping on unrelated viral topics dilutes channel identity; trend picks must fit the niche.",
          "daily research"
        ),
      ],
    },
  },
  gaming: {
    bestPractices: {
      core: [
        S(
          "Lead with the best moment",
          "Gaming videos that open with a highlight clip or big reaction keep early retention far above cold intros.",
          "initial research"
        ),
        S(
          "Consistent upload cadence matters more than volume",
          "Viewers subscribe to predictable schedules; 2–3 reliable uploads per week outperform irregular daily posts.",
          "initial research"
        ),
        S(
          "Weave in personality during quiet sections",
          "Commentary during lulls keeps watch time high — dead air is the biggest retention killer in gameplay.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Cover updates and patches the day they drop",
          "Patch notes and new-content videos spike within hours of release; timing is the ranking factor.",
          "daily research"
        ),
      ],
    },
    thingsToAvoid: {
      core: [
        S(
          "Don't pad run time with unedited footage",
          "Uncut segments without commentary produce steep drop-off curves and lower session watch time.",
          "initial research"
        ),
        S(
          "Avoid misleading thumbnails",
          "Clickbait that doesn't match the content triggers dislikes and early exits, which the algorithm reads as poor quality.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Don't ignore community patches and memes",
          "Missing the community's current conversation makes content feel disconnected from the audience.",
          "daily research"
        ),
      ],
    },
  },
  cooking: {
    bestPractices: {
      core: [
        S(
          "Show the finished dish in the first 5 seconds",
          "Food content converts on visual payoff — a beauty shot up front lifts click-through and retention together.",
          "initial research"
        ),
        S(
          "List ingredients on screen as you go",
          "On-screen ingredient callouts reduce pausing and improve completion rates versus voice-only recipes.",
          "initial research"
        ),
        S(
          "Keep recipes under 12 minutes",
          "Viewers follow along at their own pace; concise, well-edited recipes get rewatched and saved more often.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Tie recipes to seasons and holidays",
          "Seasonal dishes (fall bakes, summer grills) capture search demand weeks before the occasion.",
          "daily research"
        ),
      ],
    },
    thingsToAvoid: {
      core: [
        S(
          "Don't skip prep mise en place",
          "Videos that start with unmeasured ingredients look disorganized and lose trust immediately.",
          "initial research"
        ),
        S(
          "Avoid overly niche substitutions",
          "Requiring rare ingredients raises the barrier for viewers and hurts recipe completion.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Don't overdo camera movement",
          "Shaky close-ups during critical technique steps make the video harder to follow and cause rewind fatigue.",
          "daily research"
        ),
      ],
    },
  },
  motivation: {
    bestPractices: {
      core: [
        S(
          "Pair every claim with a story",
          "Abstract motivation underperforms; specific personal stories with stakes keep viewers watching to the end.",
          "initial research"
        ),
        S(
          "Keep videos under 8 minutes and end with one action",
          "Short, punchy videos with a single call to action drive the highest completion and share rates.",
          "initial research"
        ),
        S(
          "Use restrained, high-quality audio",
          "Calm, well-mixed voiceover with deliberate pauses outperforms loud, energetic delivery in this niche.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Reference current challenges and seasons",
          "Content tied to New Year goals, exam periods, or career seasons resonates more than evergreen abstraction.",
          "daily research"
        ),
      ],
    },
    thingsToAvoid: {
      core: [
        S(
          "Don't make unrealistic promises",
          "Overpromising results damages credibility and invites backlash in the comments.",
          "initial research"
        ),
        S(
          "Avoid recycled quotes without context",
          "Generic quote compilations read as low effort and are heavily re-uploaded by competitors.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Don't ignore audience struggles",
          "Ignoring the practical obstacles viewers face makes advice feel detached and preachy.",
          "daily research"
        ),
      ],
    },
  },
  business: {
    bestPractices: {
      core: [
        S(
          "Ground every point in numbers",
          "Revenue figures, growth rates, and timelines make business advice credible — data-backed videos outperform opinion pieces.",
          "initial research"
        ),
        S(
          "Use case studies over theory",
          "Real company breakdowns and founder stories hold attention longer than abstract frameworks.",
          "initial research"
        ),
        S(
          "Structure with clear chapters",
          "Viewers use chapters to jump to relevant sections; well-structured videos get longer session watch time.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Cover breaking business news fast",
          "Analysis of funding rounds, IPOs, and layoffs within 24 hours captures high-intent search traffic.",
          "daily research"
        ),
      ],
    },
    thingsToAvoid: {
      core: [
        S(
          "Don't present speculation as fact",
          "Unverified claims about companies or markets erode trust and attract corrections in the comments.",
          "initial research"
        ),
        S(
          "Avoid jargon-heavy explanations",
          "Overusing finance terminology excludes new viewers and shortens watch time.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Don't reuse outdated statistics",
          "Stale metrics get called out quickly; refresh data points before publishing.",
          "daily research"
        ),
      ],
    },
  },
  education: {
    bestPractices: {
      core: [
        S(
          "Teach one concept per video",
          "Focused single-topic videos outperform broad overviews in search and completion rate.",
          "initial research"
        ),
        S(
          "Use visual step-by-step breakdowns",
          "Diagrams, animations, and worked examples improve understanding and encourage saving the video.",
          "initial research"
        ),
        S(
          "End with a practice exercise",
          "Videos that close with a challenge or exercise build engagement and return viewership.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Align with curriculum seasons",
          "Exam seasons and course schedules drive predictable search spikes — plan content around them.",
          "daily research"
        ),
      ],
    },
    thingsToAvoid: {
      core: [
        S(
          "Don't assume prior knowledge",
          "Skipping foundational steps loses beginners and generates clarifying comments instead of engagement.",
          "initial research"
        ),
        S(
          "Avoid walls of text on screen",
          "Dense slides overwhelm viewers; break information into progressive visuals.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Don't skip examples",
          "Theory without worked examples has markedly lower retention and completion.",
          "daily research"
        ),
      ],
    },
  },
  entertainment: {
    bestPractices: {
      core: [
        S(
          "Hook within the first 3 seconds",
          "Entertainment content is decided instantly — a cold open or visual hook is mandatory.",
          "initial research"
        ),
        S(
          "Keep pacing tight",
          "Aggressive editing with cutaways every 3–5 seconds holds entertainment audiences far better than long takes.",
          "initial research"
        ),
        S(
          "Build recurring segments",
          "Recognizable recurring formats (rankings, reactions, challenges) create habitual viewership.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Ride pop-culture moments immediately",
          "Reactions and commentary on breaking entertainment news capture massive short-term traffic.",
          "daily research"
        ),
      ],
    },
    thingsToAvoid: {
      core: [
        S(
          "Don't start with channel updates",
          "Housekeeping intros kill entertainment retention; jump straight into the content.",
          "initial research"
        ),
        S(
          "Avoid derivative formats without a twist",
          "Copying a trending format with no unique angle gets lost among identical uploads.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Don't over-edit reaction segments",
          "Heavily scripted reactions read as fake; audiences reward genuine responses.",
          "daily research"
        ),
      ],
    },
  },
  health: {
    bestPractices: {
      core: [
        S(
          "Cite credible sources on screen",
          "Health content that references studies and guidelines earns trust and ranks better on sensitive topics.",
          "initial research"
        ),
        S(
          "Give actionable routines",
          "Step-by-step routines (workouts, meals, habits) outperform general advice in saves and completion.",
          "initial research"
        ),
        S(
          "State disclaimers briefly and naturally",
          "A short, calm disclaimer builds credibility without hurting retention.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Cover new studies with caution",
          "Early coverage of new research performs well when the findings are explained responsibly.",
          "daily research"
        ),
      ],
    },
    thingsToAvoid: {
      core: [
        S(
          "Never give medical advice for conditions",
          "Personalized medical claims violate platform guidelines and can get content demonetized or removed.",
          "initial research"
        ),
        S(
          "Avoid fad-diet absolutism",
          "Extreme claims attract backlash and get flagged by fact-checking systems.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Don't skip warm-up/cooldown segments",
          "Workout videos without safety framing generate complaints and reduce trust.",
          "daily research"
        ),
      ],
    },
  },
  creative: {
    bestPractices: {
      core: [
        S(
          "Show the process, not just the result",
          "Time-lapses and behind-the-scenes process footage drive the highest watch time in creative niches.",
          "initial research"
        ),
        S(
          "Explain tools and settings as you go",
          "Listing the tools, brushes, or settings used answers the audience's most common question and boosts saves.",
          "initial research"
        ),
        S(
          "End with a before/after reveal",
          "The transformation moment at the end keeps viewers through the full video.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Participate in creative challenges",
          "Community challenges and prompt trends bring new audiences during their active window.",
          "daily research"
        ),
      ],
    },
    thingsToAvoid: {
      core: [
        S(
          "Don't skip the supply list",
          "Missing materials lists frustrate viewers and reduce rewatch value.",
          "initial research"
        ),
        S(
          "Avoid rushed final reveals",
          "Rushing past the finished piece undervalues the payoff and shortens watch time.",
          "initial research"
        ),
      ],
      daily: [
        S(
          "Don't over-promise perfect results",
          "Hiding the imperfect steps makes tutorials feel unattainable and less helpful.",
          "daily research"
        ),
      ],
    },
  },
};

const GENERIC_RESEARCH: CuratedNiche = {
  bestPractices: {
    core: [
      S(
        "Front-load the value proposition",
        "State what the viewer will get within the first 15 seconds — early payoff predicts retention across niches.",
        "initial research"
      ),
      S(
        "Maintain a consistent upload schedule",
        "Predictable publishing builds habitual viewership and improves channel-level signals.",
        "initial research"
      ),
      S(
        "End every video with one clear action",
        "A single subscribe/watch-next call to action outperforms multiple competing asks.",
        "initial research"
      ),
    ],
    daily: [
      S(
        "Monitor trending topics weekly",
        "Regular trend reviews surface timely opportunities that fit the channel's core topics.",
        "daily research"
      ),
    ],
  },
  thingsToAvoid: {
    core: [
      S(
        "Don't open with housekeeping",
        "Long intros and channel updates cause early drop-off; start with the content itself.",
        "initial research"
      ),
      S(
        "Avoid inconsistent audio quality",
        "Poor or varying audio levels hurt retention more than imperfect visuals.",
        "initial research"
      ),
    ],
    daily: [
      S(
        "Don't neglect thumbnail-text consistency",
        "Thumbnails that overpromise against the actual content reduce session watch time.",
        "daily research"
      ),
    ],
  },
};

/**
 * Research provider used while no external search API is configured.
 * It returns a curated corpus per niche — structured so a real
 * web-search provider (Tavily / Brave / Serper) can be swapped in
 * behind the same interface once SEARCH_API_KEY is set.
 */
class MockResearchProvider implements ResearchProvider {
  name = "mock-curated";

  async research(nicheName: string, mode: "initial" | "daily"): Promise<ResearchResult> {
    const curated = CURATED_RESEARCH[nicheName] ?? GENERIC_RESEARCH;

    if (mode === "initial") {
      return {
        bestPractices: curated.bestPractices.core,
        thingsToAvoid: curated.thingsToAvoid.core,
      };
    }

    return {
      bestPractices: [...curated.bestPractices.core, ...curated.bestPractices.daily],
      thingsToAvoid: [...curated.thingsToAvoid.core, ...curated.thingsToAvoid.daily],
    };
  }
}

let provider: ResearchProvider | null = null;

export function getResearchProvider(): ResearchProvider {
  if (provider) return provider;

  // TODO: when SEARCH_API_KEY is configured, return a real search-backed
  // provider here (e.g. Tavily or Brave Search) behind the same interface.
  provider = new MockResearchProvider();
  return provider;
}
