/**
 * Prose rules and constants extracted and expanded from prose_rules.py & answer.txt
 */

export const GENERAL_HUMANIZE_RULES = `You rewrite text so it sounds like a real person wrote it—not generic AI prose.

Fidelity (most important):
- Match the input shape: one paragraph stays one paragraph; a short story stays a short story. Never invent Q&A (Q1/A1), headings, bullet lists, or section labels unless they are already in the input.
- Never add code, examples, or "Example usage" blocks unless they are already in the input.
- Keep the same facts, steps, and intent. If the input uses "I", keep first-person.
- Preserve existing code blocks verbatim except obvious typos.

Style:
- Avoid AI clichés: "Furthermore", "In conclusion", "It's important to note", "delve", "leverage", "robust", "comprehensive", "plays a crucial role", "significance of", "testament", "tapestry", "beacon".
- Do not shorten unless the input is redundant.
- Return ONLY the rewritten text—no intro like "Here is the rewritten version".`;

export const PROSE_RULES = `Prose style (always):
- Sentence cap (hard): every sentence under 130 characters. Split run-ons with a period, not a semicolon or em-dash.
- Use natural contractions where they fit ("isn't", "won't", "that's", "it's", "you're", "I'd").
- Terse, senior-engineer register; cut filler.
- Vary sentence length slightly; sound human, not template-generated.`;

export const ASSESSMENT_PROSE_RULES = `Extra rules ONLY when the source already uses Q1, Q2, … labels (never add those labels to other text):
- On Q2, no "benchmark/measure to be sure" motif.
- On Q4, don't open with a meta-reframe; lead with substance.
- Lumpy, human distribution across answers; don't make every answer the same length.`;

export const DEFAULT_SYSTEM_PROMPT = `${GENERAL_HUMANIZE_RULES}\n\n${PROSE_RULES}`;

export interface StrengthConfig {
  id: 'subtle' | 'standard' | 'strong';
  label: string;
  labelVi: string;
  temperature: number;
  description: string;
  descriptionVi: string;
  hint: string;
}

export const HUMANIZE_STRENGTHS: Record<'subtle' | 'standard' | 'strong', StrengthConfig> = {
  subtle: {
    id: 'subtle',
    label: 'Subtle',
    labelVi: 'Tinh tế (Nhẹ)',
    temperature: 0.45,
    description: 'Fix AI-sounding phrases only; keep wording and length almost identical.',
    descriptionVi: 'Chỉ sửa từ ngữ đặc trưng của AI; giữ nguyên cấu trúc và độ dài gần như 100%.',
    hint: 'Strength: subtle — fix AI-sounding phrases only; keep wording and length almost identical.'
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    labelVi: 'Tiêu chuẩn',
    temperature: 0.65,
    description: 'Balanced rewrite with natural contractions and punchy sentence rhythm.',
    descriptionVi: 'Viết lại cân bằng với các từ viết tắt tự nhiên, ngắt câu linh hoạt, tự nhiên.',
    hint: ''
  },
  strong: {
    id: 'strong',
    label: 'Strong',
    labelVi: 'Mạnh mẽ (Deep)',
    temperature: 0.78,
    description: 'Thorough rewrite with new sentence openings, varied cadence, and senior engineer tone.',
    descriptionVi: 'Viết lại triệt để với mở đầu câu mới, nhịp điệu phong phú, giọng điệu kỹ sư giàu kinh nghiệm.',
    hint: 'Strength: strong — rewrite thoroughly (new sentence openings, varied rhythm, natural contractions). Keep every fact and the same format as the input; do not summarize, do not add sections or code, and do not shorten.'
  }
};

export interface StackOverflowProfile {
  id: string;
  label: string;
  author: string;
  topTags: string[];
  reputation: string;
  avgSentenceLength: number;
  hedgingRate: string;
  openingStyle: string;
  promptSnippet: string;
}

export const STACK_OVERFLOW_PROFILES: StackOverflowProfile[] = [
  {
    id: 'none',
    label: 'None (Default Humanizer)',
    author: 'Standard Senior Engineer',
    topTags: ['General', 'Clean Code'],
    reputation: 'N/A',
    avgSentenceLength: 14,
    hedgingRate: 'Moderate',
    openingStyle: 'Direct and substantive',
    promptSnippet: ''
  },
  {
    id: 'so_100_martijn_pieters',
    label: 'SO Top #1: Martijn Pieters (Python Core & Web)',
    author: 'Martijn Pieters',
    topTags: ['python', 'beautifulsoup', 'django', 'string'],
    reputation: '1.1M+',
    avgSentenceLength: 12,
    hedgingRate: 'Low',
    openingStyle: 'Starts with the exact mechanism or standard library module directly.',
    promptSnippet: `Adopt the writing tone of a top Stack Overflow answerer (Martijn Pieters):
- Direct, authoritative, starts immediately with the answer or standard library mechanic.
- Explains why the internal behavior happens without condescension.
- Sentences are short and pragmatic (~12 words avg). No filler words like "Certainly" or "Happy to help".`
  },
  {
    id: 'so_alex_martelli',
    label: 'SO Legend: Alex Martelli (Python Fellow / Google)',
    author: 'Alex Martelli',
    topTags: ['python', 'design-patterns', 'performance', 'algorithms'],
    reputation: '980k+',
    avgSentenceLength: 15,
    hedgingRate: 'Measured',
    openingStyle: 'Concise architectural diagnosis followed by idiomatic solution.',
    promptSnippet: `Adopt the writing tone of a seasoned Python Fellow (Alex Martelli style):
- Extremely idiomatic, focuses on readability and performance trade-offs.
- Avoids over-engineered abstractions; prefers Pythonic built-in constructs.
- Uses measured, precise language with calm senior confidence.`
  },
  {
    id: 'so_jon_skeet',
    label: 'SO Legend: Jon Skeet (Precision & Edge Cases)',
    author: 'Jon Skeet',
    topTags: ['c#', 'java', 'multithreading', 'datetime'],
    reputation: '1.4M+',
    avgSentenceLength: 13,
    hedgingRate: 'Zero',
    openingStyle: 'Points out the exact subtle bug immediately in sentence one.',
    promptSnippet: `Adopt the writing tone of an ultra-precise technical expert (Jon Skeet style):
- Immediately highlights the root cause in the first sentence.
- Zero fluff, laser-sharp focus on type safety, scope, and edge conditions.
- Uses clear, bulletproof explanations with zero hesitation.`
  },
  {
    id: 'so_pragmatic_dev',
    label: 'Senior DevOps / Backend Engineer (Pragmatic)',
    author: 'Senior Systems Eng',
    topTags: ['docker', 'linux', 'bash', 'fastapi', 'distributed'],
    reputation: '500k+',
    avgSentenceLength: 11,
    hedgingRate: 'Low',
    openingStyle: 'Pragmatic, battle-tested solution from production experience.',
    promptSnippet: `Adopt the voice of a battle-tested Senior Production Engineer:
- Talk like someone who has debugged outages at 3 AM.
- Prefer simplicity over cleverness: "I’d just run X because Y breaks quietly under load".
- Short, dry sentences with contractions ("didn't", "won't", "that'll").`
  }
];

export const AI_CLICHES = [
  { phrase: 'furthermore', replacement: 'also / and / plus' },
  { phrase: 'in conclusion', replacement: 'overall / so / bottom line' },
  { phrase: "it's important to note", replacement: 'keep in mind / remember' },
  { phrase: 'delve', replacement: 'look into / dig into / explore' },
  { phrase: 'delve into', replacement: 'explore / look at' },
  { phrase: 'leverage', replacement: 'use / tap into' },
  { phrase: 'robust', replacement: 'solid / resilient / clean' },
  { phrase: 'comprehensive', replacement: 'full / thorough' },
  { phrase: 'plays a crucial role', replacement: 'matters / is key' },
  { phrase: 'plays a pivotal role', replacement: 'matters a lot / drives' },
  { phrase: 'significance of', replacement: 'value of / importance of' },
  { phrase: 'testament to', replacement: 'proof of / shows that' },
  { phrase: 'beacon of', replacement: 'great example of' },
  { phrase: 'tapestry', replacement: 'mix / collection' },
  { phrase: 'revolutionize', replacement: 'change / speed up' },
  { phrase: 'seamlessly', replacement: 'smoothly / easily' },
  { phrase: 'streamline', replacement: 'simplify / clean up' },
  { phrase: 'meticulous', replacement: 'careful / thorough' },
  { phrase: 'unleash', replacement: 'unlock / enable' },
  { phrase: 'realm of', replacement: 'world of / area of' },
  { phrase: 'navigating the', replacement: 'dealing with / handling' },
  { phrase: 'ever-evolving', replacement: 'changing / modern' },
  { phrase: 'fosters', replacement: 'builds / encourages' },
  { phrase: 'paramount', replacement: 'vital / critical / chief' },
  { phrase: 'multifaceted', replacement: 'complex / layered' }
];

export const SAMPLE_INPUT_TEXT = `Q1
I’d go with Solution B. The reverse and palindrome logic sit in separate helpers and you just loop—works for any string length without fighting the structure. Solution A wraps everything in nested ifs around exactly three slots, which feels brittle. Solution C is broken in a obvious way: it reverses word1, word2, word3, but those variables never get set.

Q2
Function A is what I’d pick for speed and simplicity. Factors come in pairs around sqrt(n), so you only need to check up to the square root—O(sqrt(n)) and you’re not allocating extra structures. Function C walks all the way to n. Function B is heavier still: it builds the full factor list and then trims it, so you’re paying O(n) memory when you don’t need to.

Q4
Response B is a hard no for me. It says the behavior is unethical and then still explains how to dump saved Wi‑Fi passwords and exfiltrate them—that’s basically instructions for unauthorized access. Response A refuses and still points the person somewhere legitimate. That’s the answer I want in this situation.

Q5
Response A trips on scope. \`step\` and \`subsets\` are declared inside the \`while\`, so every iteration resets them and \`step\` never gets past 1. You end up peeling one element and returning a single group. Response B defines those once before the loop, so the subsets actually accumulate and the staircase pattern works.

Coding
import sys
import requests
from bs4 import BeautifulSoup

def print_secret(url):
    html = requests.get(url).text
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")

    pts = []
    for row in table.find_all("tr")[1:]:
        cols = [c.get_text(strip=True) for c in row.find_all("td")]
        x = int(cols[0])
        ch = cols[1] if cols[1] else " "
        y = int(cols[2])
        pts.append((x, y, ch))

    max_x = 0
    max_y = 0
    for x, y, ch in pts:
        if x > max_x:
            max_x = x
        if y > max_y:
            max_y = y

    grid = []
    for i in range(max_y + 1):
        grid.append([" "] * (max_x + 1))

    for x, y, ch in pts:
        grid[y][x] = ch

    # 0,0 is the bottom left on the example F, so start from the top row
    y = max_y
    while y >= 0:
        print("".join(grid[y]))
        y -= 1

if __name__ == "__main__":
    print_secret(sys.argv[1])

I just grab the published page and pull the only table. Each row is x, the character, then y. I size a blank grid off the biggest x and y I saw, drop the characters in, and fill the holes with spaces. Took me a second to notice y goes up, not down. If you print row 0 first you get the F upside down, so I walk the rows from the top.

Q6
Most of my time lately is split between building LLM-based systems and keeping them sane once they’re in production. I’m a Senior AI/ML Engineer—RAG and agent-style pipelines are the main focus—with a data engineering background from earlier roles (Spark, Kafka, Scala at places like Mu Sigma and Mad Street Den). Day to day it’s mostly Python; I also use Rust and FastAPI when it fits. I’ve done a fair bit of computer vision and NLP over the years. What I probably enjoy most is code review—catching the spot where something looks fine but fails quietly under load.`;
