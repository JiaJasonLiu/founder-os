import type { Template } from "@/types";
import { T } from "@/styles/theme";

/**
 * Starting templates offered during onboarding.
 *
 * A template is just seed data — once adopted it's fully editable, so treat
 * these as opinionated starting points rather than fixed structures.
 *
 * To add your own: copy a template, change the ids to something unique, and
 * push it onto TEMPLATES below. Ids only need to be unique within a template.
 */

/**
 * The founder track: deepen technical and domain skill in a day job while
 * building toward founding something. Three tracks feed a fourth (Synthesis),
 * which is where judgment actually gets built.
 */
const founderTrack: Template = {
  id: "founder-track",
  name: "The founder track",
  blurb:
    "For an engineer or operator with a day job and a long-term plan to found something. Builds systems depth, domain fluency, communication, and the judgment that ties them together.",
  goal: "Found (or co-found) a company",
  horizon: "5-year horizon",
  thesis:
    "The technical layer commoditizes. The judgment layer compounds. Climb toward the decisions.",
  phases: [
    { n: 1, label: "Deepen skills & domain where you are", note: "~18 months" },
    { n: 2, label: "Optimize savings & build audience", note: "runway + network" },
    { n: 3, label: "Make the leap", note: "the leap" },
  ],
  starters: ["t1q1", "t3bq1"],
  tracks: [
    {
      id: "t1",
      name: "Technical plumbing",
      tag: "CTO-level systems",
      color: T.slate,
      intent:
        "Build the systems-level judgment a CTO carries — the thing that doesn't get automated.",
      quests: [
        {
          id: "t1q1",
          text: "Build your own mental model of how the system fits together",
          est: 60,
          done: false,
          steps: [
            { id: "t1q1s1", text: "Sketch the main components from memory", est: 30, done: false },
            { id: "t1q1s2", text: "List the parts you're unsure about", est: 15, done: false },
          ],
        },
        {
          id: "t1q2",
          text: "Check the model against the real code; note where you were wrong",
          est: 45,
          done: false,
          steps: [],
        },
        {
          id: "t1q3",
          text: "Map the data flows",
          est: 90,
          done: false,
          steps: [
            { id: "t1q3s1", text: "Trace the payments flow", est: 30, done: false },
            { id: "t1q3s2", text: "Trace the inventory flow", est: 30, done: false },
            { id: "t1q3s3", text: "Trace orders + sync", est: 30, done: false },
          ],
        },
        { id: "t1q4", text: "Ask a former senior engineer or CTO to pick their brain", est: 15, done: false, steps: [] },
        { id: "t1q5", text: "Line up 1–2 in-house people to fill the gaps", est: 20, done: false, steps: [] },
      ],
    },
    {
      id: "t2",
      name: "Domain fluency",
      tag: "anthropologist of your customers",
      color: T.moss,
      intent:
        "Study how your customers actually run their businesses — using your day job as the field site.",
      quests: [
        { id: "t2q1", text: "How do our customers run their business day-to-day?", est: 45, done: false, steps: [] },
        { id: "t2q2", text: "How does the company find leads? (the sales motion)", est: 30, done: false, steps: [] },
        { id: "t2q3", text: "What makes a customer say yes?", est: 30, done: false, steps: [] },
        { id: "t2q4", text: "Pricing logic — why this number, not half of it?", est: 45, done: false, steps: [] },
        { id: "t2q5", text: "What keeps a customer paying, month after month?", est: 30, done: false, steps: [] },
        { id: "t2q6", text: "Why do customers churn? (learn from failure)", est: 30, done: false, steps: [] },
      ],
    },
    {
      id: "t3",
      name: "Communication",
      tag: "expression · connection",
      color: T.clay,
      intent:
        "Two halves: getting ideas out with weight, and the relationships a cofounder lives on.",
      groups: [
        {
          id: "t3a",
          label: "Expression",
          quests: [
            { id: "t3aq1", text: "Share risks + implications + your intended fix, not just conclusions", est: 20, done: false, steps: [] },
            { id: "t3aq2", text: "Pre-commit to contributing N times per meeting", est: 15, done: false, steps: [] },
            { id: "t3aq3", text: "Interrupt effectively — pre-unmute, claim the floor", est: 15, done: false, steps: [] },
          ],
        },
        {
          id: "t3b",
          label: "Connection",
          quests: [
            { id: "t3bq1", text: "Message someone at work — no agenda, just curiosity", est: 10, done: false, steps: [] },
            { id: "t3bq2", text: "Be genuinely curious about a colleague; ask and follow up", est: 10, done: false, steps: [] },
            { id: "t3bq3", text: "End an exchange on an open question, not a statement", est: 10, done: false, steps: [] },
          ],
        },
      ],
    },
    {
      id: "t4",
      name: "Synthesis",
      tag: "the summit the others feed",
      color: T.gold,
      intent:
        "Translate between technical, business and human — then make the call. Form it, feed it, attack it, stress-test it.",
      quests: [
        { id: "t4q1", text: "Weekly synthesis entry in the decision journal", est: 30, done: false, steps: [] },
        { id: "t4q2", text: "Monthly: one write-up connecting all three tracks into a decision", est: 60, done: false, steps: [] },
        { id: "t4q3", text: "Revisit old entries — where was your judgment right or wrong?", est: 20, done: false, steps: [] },
        { id: "t4q4", text: "Feed it: read outside, study companies, talk to founders", est: 30, done: false, steps: [] },
        { id: "t4q5", text: "Attack it: red-team a view — hunt the strongest case against it", est: 20, done: false, steps: [] },
        { id: "t4q6", text: "Stress-test: play out the worst case and how you'd handle it", est: 20, done: false, steps: [] },
      ],
    },
  ],
  threads: [
    {
      id: "th1",
      name: "Language",
      tag: "the operating language of where you're going",
      color: T.teal,
      period: "week",
      why: "Operational infrastructure for the plan — hiring, contracts, accountants, local customers. The slow, painful stuff, done in a language you're fluent in.",
      horizon: "Pays off ~3 years out",
      cadence: "Read or listen to something real in the language",
      log: [],
    },
    {
      id: "th2",
      name: "Public presence",
      tag: "audience & network",
      color: T.plum,
      period: "month",
      why: "A public voice is surface area for a network — your future early hires and cofounders. Compounds only if you keep showing up.",
      horizon: "Pays off over years",
      cadence: "Ship one public artifact — write, post, or build in the open",
      log: [],
    },
  ],
  backlog: [
    { id: "b1", text: "Storytelling & narrative — pitch the vision", note: "moves investors and early hires" },
    { id: "b2", text: "Negotiation — raising, closing, salary", note: "the deal-making muscle" },
    { id: "b3", text: "Writing — async founder comms", note: "clear writing scales you" },
    { id: "b4", text: "Giving & taking feedback", note: "cofounder relationships live or die on it" },
  ],
};

/**
 * A deliberately thin template for people who'd rather define their own
 * structure. One track, one quest, one thread — enough to show the shape.
 */
const blank: Template = {
  id: "blank",
  name: "Start from scratch",
  blurb: "A single empty track and thread. Best if you already know how you want to structure things.",
  goal: "",
  horizon: "",
  thesis: "",
  phases: [
    { n: 1, label: "Build the foundations", note: "now" },
    { n: 2, label: "Compound and expand", note: "next" },
    { n: 3, label: "Make the leap", note: "the leap" },
  ],
  starters: [],
  tracks: [
    {
      id: "b-t1",
      name: "First track",
      tag: "rename me",
      color: T.slate,
      intent: "Describe why this lane of work matters to your goal.",
      quests: [{ id: "b-t1q1", text: "Your first task", est: 30, done: false, steps: [] }],
    },
  ],
  threads: [
    {
      id: "b-th1",
      name: "First thread",
      tag: "weekly rhythm",
      color: T.teal,
      period: "week",
      why: "A slow-compounding habit — something that only pays off after years of consistency.",
      horizon: "Long-horizon",
      cadence: "Keep the rhythm",
      log: [],
    },
  ],
  backlog: [],
};

export const TEMPLATES: Template[] = [founderTrack, blank];

export const DEFAULT_TEMPLATE_ID = founderTrack.id;

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? founderTrack;
}
