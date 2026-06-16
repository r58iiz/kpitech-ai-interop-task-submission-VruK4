# NewsVerify: Live Claim Verification Agent

Project-based hiring assessment for `AI Interop Engineer`.

TOC:

1. [Assignment](#assignment)
2. [Implementation](#implementation)
    1. [News API Used](#question-news-api-used)
    2. [Relevance Assessment](#question-relevance-assessment)
    3. [LLM Used](#question-llm-used)
    4. [Grounding Prompt](#question-grounding-prompt)

## Assignment

> Build an AI-powered agent that takes a user's plain-English claim, retrieves
> live or recent news articles relevant to it, synthesizes a grounded answer
> based only on those articles, and evaluates its own answers using a second
> LLM acting as a judge — all through a working UI

> [!IMPORTANT]
> Stack: You must use Node.js as your primary backend language. LangChain JS is
> permitted. For news retrieval, use SerpAPI or NewsAPI — your choice. For the
> LLM, use any provider (OpenAI, Gemini, or equivalent).

### Components

1. Claim Input & News Retrieval
    - [x] User enters a plain-English claim or question into the UI
    - [x] System queries SerpAPI or NewsAPI to retrieve the top 5 most relevant recent news articles
    - [x] Each article must be fetched with: title, source name, publication date, URL, and a content snippet or full text
    - [x] Retrieval must be scoped to recent articles — avoid results older than 90 days where possible

2. Source Report (UI)

    - [x] After retrieval, the UI must display a Source Report on screen before the answer is shown
    - [x] The Source Report must show all 5 retrieved articles with their relevance assessment — see Section 3 for the exact format required
    - [x] Relevance must be assessed programmatically — pass each article snippet and the user's claim to the LLM and ask it to rate relevance as: High / Medium / Low with a one-line reason
    - [x] This panel must remain visible on screen alongside the answer during the demo

3. Grounded Answer Generation

    - [x] Pass the retrieved article snippets as context to the LLM
    - [x] The prompt must instruct the LLM to answer only from the provided articles — no external knowledge, no fabrication
    - [x] Every sentence in the answer must be tagged to its source article — e.g. [Article 2] or [Reuters, Apr 10]
    - [x] If no retrieved article supports a part of the answer, the system must say so explicitly rather than fill the gap
    - [x] Final answer displayed prominently in the UI below the Source Report

4. Evaluation Layer

    - [x] Prepare a ground truth file with 10 claims and their expected verdicts before running the system
    - [x] Expected verdict options: True / False / Partially True / Cannot Determine from Sources
    - [x] Run all 10 claims automatically through the pipeline
    - [x] For each claim, pass the system answer and the expected verdict to a second LLM call acting as a judge
    - [x] Judge output must be: Match / Partial Match / No Match with a one-line reason
    - [x] Display the full evaluation summary table in the UI

5. UI (Mandatory)

    - [x] A proper web interface is required — Express + EJS, Next.js, or equivalent
    - [x] Terminal-only output will not be accepted during the demo
    - [x] The UI must include at minimum: claim input field, Source Report panel, answer panel with source tags, and evaluation summary panel
    - [x] The UI will be live on your machine and shared via Teams screen share during the demo

## Implementation

<a name="question-news-api-used"></a>
> [!NOTE]
> **News API used**\
> News API used is [NewsAPI](https://newsapi.org/). [SerpAPI](https://serpapi.com/) does not provide article content.

<a name="question-relevance-assessment"></a>
> [!NOTE]
> **Relevance assessment**\
> Relevance is assessed via the [relevance prompt](./src/prompts/relevancePrompt.ts)
> This prompt gives the model all the context and instructions as well as limits its output to json so it is easier to parse. It defines the criteria for High/Medium/Low relevance clearly.

<a name="question-llm-used"></a>
> [!NOTE]
> **LLM used**\
> This project uses nvidia/nemotron-3-ultra-550b-a55b for query generation, relevance classification, and answer generation due to its strong instruction-following capabilities and performance on retrieval-augmented tasks.

<a name="question-grounding-prompt"></a>
> [!NOTE]
> **Grounding Prompt**\
> [Ground prompt](./src/prompts/answerPrompt.ts) forces the model to use only the provided context to answer.
> This prevents the model from hallucinating or using it's internal data. It forces the answer to have citations so it can be cross-checked. This also means each line must be related to the provided context. The model is allowed to combine information across multiple articles; the citations prevent hallucination. The model is also forced to be explicit when the claim can't be supported by the supplied articles. Strict labels are forced at the start of the answer so the judge model can easily answer whether the answer matches or not.
