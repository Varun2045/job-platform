import { HttpClient } from './HttpClient.js';
import { Logger } from './Logger.js';

export interface Flashcard {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  answer: string; // detailed technical explanation / back of card
  userAnswer?: number | null;
  masteryStatus: 'unstudied' | 'needs_practice' | 'mastered';
  difficulty: 'easy' | 'medium' | 'hard' | 'super_hard';
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  cards: Flashcard[];
  updatedAt: string;
}

// Pre-baked high-quality question bank for common computer science and engineering topics
const PREBAKED_QUESTIONS: Record<string, Omit<Flashcard, 'id' | 'masteryStatus' | 'difficulty'>[]> = {
  react: [
    {
      question: 'Which of the following is true regarding React Server Components (RSC)?',
      options: [
        'They run on the client and are hydrated server-side.',
        'They execute exclusively on the server and their code is not included in the client bundle.',
        'They cannot accept props or hold local state.',
        'They are completely incompatible with client components in the same application.',
      ],
      correctOptionIndex: 1,
      answer:
        "React Server Components (RSC) execute only on the server. Their dependencies are not shipped to the client bundle, which reduces bundle size. Client Components can still be imported and rendered within RSCs (using the 'use client' directive at boundary files).",
    },
    {
      question: 'What is the primary benefit of useMemo in React?',
      options: [
        'It triggers component re-renders when dependencies change.',
        'It caches the return value of a computation between renders unless dependencies change.',
        'It asynchronously schedules state updates to prevent UI blocking.',
        'It automatically memoizes all functions declared within the component body.',
      ],
      correctOptionIndex: 1,
      answer:
        'useMemo is used to cache (memoize) the result of an expensive calculation. It will only re-evaluate the calculation when one of its dependency values changes, saving CPU cycles on re-renders.',
    },
    {
      question: 'In React 18, what does automatic batching do?',
      options: [
        'It bundles multiple compilation steps into a single build output.',
        'It batches network fetch requests to reduce server roundtrips.',
        'It groups state updates from promises, timeouts, and native events into a single render pass.',
        'It runs all useEffect hooks concurrently rather than sequentially.',
      ],
      correctOptionIndex: 2,
      answer:
        'React 18 introduces automatic batching, which groups state updates from promises, setTimeout calls, or native event handlers into a single render. Previously, batching only occurred in React event handlers.',
    },
    {
      question: 'How does the useId hook help in Server-Side Rendering (SSR)?',
      options: [
        'It generates unique IDs that are guaranteed to match on both server and client, avoiding hydration mismatches.',
        'It assigns unique cryptographic keys to session cookies.',
        'It serves as a fast hashing function for component render trees.',
        'It tracks the active route state during navigation transitions.',
      ],
      correctOptionIndex: 0,
      answer:
        'useId generates unique, stable identifiers that prevent hydration mismatches in SSR apps by ensuring the IDs generated on the server align perfectly with the IDs generated on the client.',
    },
  ],
  nodejs: [
    {
      question: 'What is the execution order of phases in the Node.js event loop?',
      options: [
        'Timers -> Pending Callbacks -> Poll -> Check -> Close Callbacks',
        'Poll -> Timers -> Check -> Pending Callbacks -> Close Callbacks',
        'Pending Callbacks -> Timers -> Poll -> Close Callbacks -> Check',
        'Check -> Timers -> Poll -> Pending Callbacks -> Close Callbacks',
      ],
      correctOptionIndex: 0,
      answer:
        'The Node.js event loop executes in this sequence: 1) Timers (setTimeout/setInterval), 2) Pending Callbacks, 3) Idle/Prepare (internals), 4) Poll (I/O callbacks), 5) Check (setImmediate), 6) Close Callbacks.',
    },
    {
      question: 'What is the primary difference between setImmediate() and process.nextTick()?',
      options: [
        'process.nextTick() executes at the end of the current phase of the event loop; setImmediate() fires on the check phase.',
        'setImmediate() runs before process.nextTick() in all scenarios.',
        'process.nextTick() uses a separate thread pool; setImmediate() runs on the main thread loop.',
        'setImmediate() is only supported in browser environments.',
      ],
      correctOptionIndex: 0,
      answer:
        "process.nextTick() is not technically part of the event loop. Instead, the nextTickQueue is processed immediately after the current operation completes, regardless of the current phase. setImmediate() executes on the 'Check' phase of the loop.",
    },
    {
      question: 'How does Node.js handle cluster module communications?',
      options: [
        'Through shared memory access channels directly in V8.',
        'Through IPC (Inter-Process Communication) message channels managed by the master process.',
        'Via local TCP loopback sockets on port 80.',
        'Workers do not communicate and run completely isolated.',
      ],
      correctOptionIndex: 1,
      answer:
        "The cluster module spawns child processes using child_process.fork(). Communication is achieved through built-in Inter-Process Communication (IPC) message channels using the process.send() and process.on('message') protocols.",
    },
  ],
  typescript: [
    {
      question: "What does the 'unknown' type represent in TypeScript?",
      options: [
        "It behaves exactly like the 'any' type with no type safety checks.",
        'It represents a type that is type-safe because you must perform type checks/casting before performing actions on it.',
        'It represents a value that can never be returned or instantiated.',
        'It acts as a placeholder for deprecated values.',
      ],
      correctOptionIndex: 1,
      answer:
        "The 'unknown' type is a type-safe counterpart to 'any'. While you can assign anything to an 'unknown' variable, you cannot call methods or access properties on it without first performing type narrowing (e.g., typeof checks, instanceof checks, or type assertions).",
    },
    {
      question: 'Which of the following is the correct syntax for a conditional type in TypeScript?',
      options: [
        "type MyType<T> = T implements string ? 'yes' : 'no';",
        "type MyType<T> = T extends string ? 'yes' : 'no';",
        "type MyType<T> = if (T === string) { 'yes' } else { 'no' };",
        "type MyType<T> = T is string ? 'yes' : 'no';",
      ],
      correctOptionIndex: 1,
      answer:
        'Conditional types use the syntax: `T extends U ? X : Y`. This allows types to resolve dynamically based on type relationships.',
    },
    {
      question: "What does the 'Omit<T, K>' utility type do?",
      options: [
        'It removes properties specified by key list K from object type T.',
        'It creates a new type containing only the properties in K.',
        'It makes all properties of T optional except those in K.',
        'It blocks type verification for key list K.',
      ],
      correctOptionIndex: 0,
      answer:
        'Omit<T, K> constructs a type by picking all properties from T and then removing keys K. It is the opposite of Pick<T, K>.',
    },
  ],
  system_design: [
    {
      question: 'What is the primary trade-off highlighted by the CAP Theorem?',
      options: [
        'You can choose either Consistency or Availability when a Network Partition occurs.',
        'You must trade off Capacity and Performance for Cache Coherence.',
        'You must trade off Availability and Partition Tolerance during database migrations.',
        'Consistency is only possible in single-server environments.',
      ],
      correctOptionIndex: 0,
      answer:
        'The CAP Theorem states that in the event of a network partition (P), a distributed system can guarantee either Consistency (C - all nodes see the same data at the same time) or Availability (A - every request receives a non-error response), but not both.',
    },
    {
      question: "In load balancing, what does the 'Least Connections' algorithm do?",
      options: [
        'It routes traffic to the server with the lowest network latency.',
        'It distributes requests in a circular order across the server pool.',
        'It routes requests to the server currently handling the fewest active sessions.',
        'It sends traffic to servers with the lowest disk space utilisation.',
      ],
      correctOptionIndex: 2,
      answer:
        'The Least Connections algorithm directs traffic to the server with the fewest active connection sessions. It is highly effective when requests have varying execution times and servers have similar capacities.',
    },
    {
      question: 'What is the purpose of Consistent Hashing?',
      options: [
        'It guarantees that database hashes are computed in logarithmic time.',
        'It minimizes key relocation when servers are added or removed from a caching cluster.',
        'It encrypts passwords consistently across all authentication microservices.',
        'It stores duplicate cache items in a circular buffer.',
      ],
      correctOptionIndex: 1,
      answer:
        'Consistent Hashing maps both keys and servers to a circular ring. When servers are added or removed, only a fraction (K/N) of keys need to be rehashed or moved, preventing cache stampedes and server overloading.',
    },
  ],
  databases: [
    {
      question: "What does the 'Isolation' property in ACID guarantees prevent?",
      options: [
        'It prevents data from being lost during system power crashes.',
        'It prevents concurrent transactions from seeing uncommitted/partial changes made by one another.',
        'It prevents database indices from being corrupted during mass inserts.',
        'It prevents single points of failure by enforcing replica synchronisation.',
      ],
      correctOptionIndex: 1,
      answer:
        'Isolation ensures that concurrent transactions execute independently without interference. It dictates the visibility of data changes to other concurrent operations (e.g. Read Committed, Serializable).',
    },
    {
      question: 'Which index type is best suited for range-based queries (e.g., WHERE age BETWEEN 20 AND 30)?',
      options: ['Hash Index', 'B-Tree Index', 'GIN Index', 'Bitmap Index'],
      correctOptionIndex: 1,
      answer:
        'B-Tree indexes maintain data in a sorted, balanced tree structure. This makes them highly efficient for range queries, sorting operations, and equality lookups. Hash indexes only support equality lookups.',
    },
    {
      question: 'What is database sharding?',
      options: [
        'Creating read-only replicas to offload query processing workloads.',
        'Horizontal partitioning of a database table across multiple independent servers/instances.',
        'Vertical segmentation of database columns into separate schemas.',
        'Compressing transaction logs to save physical storage space.',
      ],
      correctOptionIndex: 1,
      answer:
        'Database sharding is horizontal partitioning. Individual rows of a single database table are split across multiple physical database nodes according to a shard key (e.g. hash of user_id).',
    },
  ],
};

export class FlashcardGenerator {
  /**
   * Generates MCQ questions dynamically based on a topic, count, and difficulty.
   * Leverages Groq API if configured, otherwise falls back to pre-baked database / dynamic templates.
   */
  public static async generate(
    topic: string,
    count: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' | 'super_hard' = 'medium',
  ): Promise<Flashcard[]> {
    const groqKey = process.env.GROQ_API_KEY;
    const cleanTopic = topic.trim().toLowerCase();

    // 1. Online Groq Generation
    if (groqKey) {
      try {
        Logger.info(`Using Groq API key to generate flashcards for topic: "${topic}"`);
        const client = new HttpClient();
        const url = 'https://api.groq.com/openai/v1/chat/completions';

        const prompt = `Generate exactly ${count} multiple-choice questions (MCQs) for the topic: "${topic}".
The target difficulty is ${difficulty}.
Return ONLY a JSON object containing a top-level key "questions" which contains the array of questions.
Each question MUST have these fields:
- "question" (string): The detailed multiple-choice question.
- "options" (array of exactly 4 strings): Plausible distractors and one correct option.
- "correctOptionIndex" (number, 0 to 3): The index of the correct answer in the "options" array.
- "answer" (string): A detailed, high-quality technical explanation of why the correct option is right and others are wrong. Include code snippets in markdown code blocks if helpful.

Format the output strictly as a JSON object, e.g.:
{
  "questions": [
    {
      "question": "Example?",
      "options": ["A", "B", "C", "D"],
      "correctOptionIndex": 2,
      "answer": "Explanation here..."
    }
  ]
}
No pre-amble, no post-amble, no conversational text.`;

        const response = await client.request(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: {
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content:
                  'You are an advanced software engineering interviewer and computer science tutor. You output strictly structured JSON arrays of MCQs.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          },
          timeoutMs: 15000,
          retries: 2,
        });

        const responseData = response.data;
        let parsed: any = null;

        if (typeof responseData === 'object' && responseData !== null) {
          const content = responseData.choices?.[0]?.message?.content;
          if (content) {
            parsed = JSON.parse(content);
          }
        } else if (typeof responseData === 'string') {
          const jsonVal = JSON.parse(responseData);
          const content = jsonVal.choices?.[0]?.message?.content;
          if (content) {
            parsed = JSON.parse(content);
          }
        }

        if (parsed && Array.isArray(parsed.questions)) {
          const cards: Flashcard[] = parsed.questions.map((q: any) => ({
            id: `card-dynamic-${Math.random().toString(36).substring(2, 11)}`,
            question: q.question || 'Unknown question',
            options:
              Array.isArray(q.options) && q.options.length === 4
                ? q.options
                : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctOptionIndex:
              typeof q.correctOptionIndex === 'number' && q.correctOptionIndex >= 0 && q.correctOptionIndex < 4
                ? q.correctOptionIndex
                : 0,
            answer: q.answer || 'No explanation provided.',
            masteryStatus: 'unstudied',
            difficulty,
          }));
          return cards.slice(0, count);
        }

        Logger.warn('Invalid JSON structure returned by Groq. Falling back to offline generation.');
      } catch (err: any) {
        Logger.error(`Groq flashcard generation failed: ${err.message}. Falling back to offline generator.`);
      }
    }

    // 2. Offline Library Matching
    // Check if we have pre-baked questions matching or partially matching the topic name
    let matchedQuestions: Omit<Flashcard, 'id' | 'masteryStatus' | 'difficulty'>[] = [];

    // Look for exact or partial key match
    const matchingKey = Object.keys(PREBAKED_QUESTIONS).find(
      (key) => cleanTopic.includes(key) || key.includes(cleanTopic),
    );

    if (matchingKey) {
      matchedQuestions = PREBAKED_QUESTIONS[matchingKey];
    }

    if (matchedQuestions.length > 0) {
      // Map to full Flashcard schema
      const cards: Flashcard[] = matchedQuestions.map((q) => ({
        ...q,
        id: `card-baked-${Math.random().toString(36).substring(2, 11)}`,
        masteryStatus: 'unstudied',
        difficulty,
      }));

      // Shuffle copy of cards to randomize question order and prevent repetition
      const shuffledCards = [...cards].sort(() => Math.random() - 0.5);

      if (shuffledCards.length >= count) {
        return shuffledCards.slice(0, count);
      } else {
        const remainingCount = count - shuffledCards.length;
        const fallbackCards = this.generateHeuristicTemplates(topic, remainingCount, difficulty);
        return [...shuffledCards, ...fallbackCards];
      }
    }

    // 3. Fallback Dynamic Heuristic Generator (if offline and no pre-baked topic matches)
    Logger.info(`Using offline heuristic template generator for topic: "${topic}"`);
    return this.generateHeuristicTemplates(topic, count, difficulty);
  }

  /**
   * Simple rules engine to produce clean, readable, grammatically-correct technical MCQs
   * for any custom topic when offline.
   */
  private static generateHeuristicTemplates(
    topic: string,
    count: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'super_hard',
  ): Flashcard[] {
    const formattedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

    const templates = [
      {
        question: `When designing a production architecture utilizing ${formattedTopic}, what is the primary architectural trade-off?`,
        options: [
          `Trading execution isolation for reduced runtime container overhead.`,
          `Increasing network packet fragmentation rate in service layers.`,
          `Guaranteeing write-once consistency across replication threads.`,
          `Restricting developer access to system config parameters.`,
        ],
        correctOptionIndex: 0,
        answer: `In ${formattedTopic} systems, isolating execution context protects applications from cascading thread locks, but incurs startup overhead. Finding the sweet spot between full isolation and execution density is key for scaling.`,
      },
      {
        question: `Which of the following is considered a core best practice when optimizing performance for ${formattedTopic} operations?`,
        options: [
          `Forcing periodic garbage collection sweeps in loop cycles.`,
          `Implementing connection pool reuse and distributed cache layers.`,
          `Storing all session metadata inside base-64 encoded URL parameters.`,
          `Disabling logging outputs during intensive read-write threads.`,
        ],
        correctOptionIndex: 1,
        answer: `Optimizing ${formattedTopic} requires connection pool configurations to avoid query creation overhead and caching to deflect repeated requests from reaching storage layers.`,
      },
      {
        question: `How does ${formattedTopic} typically manage synchronization and race conditions under concurrent requests?`,
        options: [
          `By blocking all network ports until the active lock thread completes.`,
          `Through read-write locks, semaphores, or event-driven concurrency loop scheduling.`,
          `By writing execution logs to disk logs and replaying them sequentially.`,
          `By duplicating the application process for every active TCP transaction.`,
        ],
        correctOptionIndex: 1,
        answer: `${formattedTopic} handles concurrency using standard synchronization primitives (e.g., locks, queues, or mutexes) or event-driven single-threaded loop dispatch models to keep operations safe and high-throughput.`,
      },
      {
        question: `What is a common symptom of resource leakage in a system running ${formattedTopic}?`,
        options: [
          `A gradual, steady increase in RAM usage leading to an Out-Of-Memory (OOM) crash.`,
          `Immediate termination of the physical router switch port.`,
          `Automatic decryption of archived database tables.`,
          `Sub-millisecond API response latency values.`,
        ],
        correctOptionIndex: 0,
        answer: `Memory or resource leaks in ${formattedTopic} manifest as monotonic increases in resource usage (like heap size or open file descriptors) over time, eventually causing the runtime to crash.`,
      },
      {
        question: `What is the primary difference between development and production configurations in a ${formattedTopic} setup?`,
        options: [
          `Development runs in isolation; production disables security and logging controls.`,
          `Development prioritizes hot-reloading and source maps; production prioritizes minification, caching, and hardening.`,
          `Development uses SQL storage; production strictly uses local files.`,
          `There are no differences; configuration files must be identical.`,
        ],
        correctOptionIndex: 1,
        answer: `In development, debugging tools (like hot-module replacement and verbose logs) are active. In production, performance optimizations (like code compression, strict environment variables, and CDN assets) are utilized to guarantee scale and speed.`,
      },
      {
        question: `What is the role of caching in a system architecture that heavily relies on ${formattedTopic}?`,
        options: [
          `To temporarily hold data and reduce retrieval latencies for repeated queries.`,
          `To permanently secure databases using blockchain encryption keys.`,
          `To compile source files into native binary machine executables.`,
          `To monitor runtime processes for unused system resources.`,
        ],
        correctOptionIndex: 0,
        answer: `Caching stores frequently-accessed ${formattedTopic} datasets in high-speed memory (like Redis or Memcached), avoiding redundant expensive computations or database lookups.`,
      },
      {
        question: `When configuring horizontal scaling for a service running ${formattedTopic}, which pattern is recommended?`,
        options: [
          `Placing instances behind a load balancer with stateless session tracking.`,
          `Increasing the physical CPU frequency on a single hosting server.`,
          `Forcing all users to authenticate through the same static TCP port.`,
          `Restricting service execution to single-core computing threads.`,
        ],
        correctOptionIndex: 0,
        answer: `Stateless horizontal scaling allows any active instance of ${formattedTopic} to process incoming requests, leveraging load balancers to distribute load without single-point failures.`,
      },
      {
        question: `How can you best protect a public API endpoint integrated with ${formattedTopic} from Denial of Service (DoS) attacks?`,
        options: [
          `Implementing rate limiting, IP throttling, and API gateway validation.`,
          `Converting all response messages into raw markdown text formats.`,
          `Removing transport layer encryption (TLS/SSL) to speed up packets.`,
          `Restarting the primary host machine every hour automatically.`,
        ],
        correctOptionIndex: 0,
        answer: `Rate limiting restricts request volumes in a given timeframe, protecting downstream ${formattedTopic} worker threads from resource exhaustion.`,
      },
      {
        question: `In software testing, what is the best practice when writing unit tests for functions that interact with ${formattedTopic}?`,
        options: [
          `Mocking external dependencies and testing isolated logical paths.`,
          `Directly rewriting source code files inside the test suite container.`,
          `Running intensive load tests against production databases.`,
          `Disabling code coverage metrics to accelerate build processes.`,
        ],
        correctOptionIndex: 0,
        answer: `When testing logic dependent on ${formattedTopic}, mocking external calls keeps tests fast, isolated, deterministic, and free from external network failures.`,
      },
      {
        question: `Which data format is preferred for serialization when exchanging data between frontend apps and a ${formattedTopic} backend?`,
        options: [
          `JSON (JavaScript Object Notation) due to its light weight and ease of parsing.`,
          `Raw uncompressed machine binary assembly instructions.`,
          `Nested XML code blocks formatted with custom dynamic schemas.`,
          `Plain text files separated by multiple tabs and semicolons.`,
        ],
        correctOptionIndex: 0,
        answer: `JSON is standard in modern web communication, providing a readable, widely-supported, and lightweight format for serializing data between clients and ${formattedTopic} endpoints.`,
      },
      {
        question: `When handling error exceptions within a production deployment of ${formattedTopic}, what is the best practice?`,
        options: [
          `Catching specific exceptions, logging details with stack traces, and returning sanitized errors.`,
          `Terminating the server process immediately on every minor warnings event.`,
          `Ignoring errors completely and letting threads fail silently in the background.`,
          `Writing exception dumps to public frontend landing page views.`,
        ],
        correctOptionIndex: 0,
        answer: `Proper exception management in ${formattedTopic} prevents stack trace leakage to clients, logs diagnostic info for developers, and allows graceful degradation under stress.`,
      },
      {
        question: `Which of the following describes a potential security vulnerability in a default configuration of ${formattedTopic}?`,
        options: [
          `Using default credentials, exposed admin ports, or unvalidated user inputs.`,
          `Writing clean code comments explaining runtime variable names.`,
          `Utilizing strongly-typed parameters in internal class interfaces.`,
          `Limiting concurrent connections in network configuration profiles.`,
        ],
        correctOptionIndex: 0,
        answer: `Security in ${formattedTopic} deployments requires hardening default settings, shutting down unused ports, disabling debug modes, and strictly sanitizing input fields.`,
      },
      {
        question: `What is the primary role of a container (like Docker) when packaging a ${formattedTopic} application?`,
        options: [
          `To bundle the application and its dependencies into a consistent, portable runtime environment.`,
          `To automatically optimize code execution using machine learning algorithms.`,
          `To convert high-level source files into low-level assembly syntax.`,
          `To prevent developers from making changes to source file layouts.`,
        ],
        correctOptionIndex: 0,
        answer: `Containers solve the "it works on my machine" problem by encapsulating the ${formattedTopic} app with its specific runtime libraries and operating system dependencies.`,
      },
      {
        question: `When optimizing the response latency of queries database-bound from a ${formattedTopic} app, what is recommended?`,
        options: [
          `Adding indexes on frequently queried columns and optimization of queries.`,
          `Removing primary key constraints from all relational database tables.`,
          `Increasing the character length of text columns inside database schemas.`,
          `Executing queries inside nested recursive loops in application threads.`,
        ],
        correctOptionIndex: 0,
        answer: `Database indexing helps the query planner locate records rapidly, minimizing query execution time and optimizing overall ${formattedTopic} app performance.`,
      },
      {
        question: `What is a core benefit of continuous integration (CI) pipelines for a project using ${formattedTopic}?`,
        options: [
          `Automating testing and build verification for every code check-in.`,
          `Eliminating the need to write unit or integration tests completely.`,
          `Encrypting all project files before developers commit them to git.`,
          `Automatically deploying untested changes directly to production clusters.`,
        ],
        correctOptionIndex: 0,
        answer: `CI ensures code quality for ${formattedTopic} projects by automatically building and testing changes, catching regressions early in the lifecycle.`,
      },
    ];

    const shuffledTemplates = [...templates].sort(() => Math.random() - 0.5);

    const cards: Flashcard[] = shuffledTemplates.slice(0, count).map((t, index) => ({
      id: `card-heuristic-${index}-${Math.random().toString(36).substring(2, 11)}`,
      question: t.question,
      options: t.options,
      correctOptionIndex: t.correctOptionIndex,
      answer: t.answer,
      masteryStatus: 'unstudied',
      difficulty,
    }));

    return cards;
  }
}
