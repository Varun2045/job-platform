import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Undo, Redo, Save } from "lucide-react";

import { LivePreview } from "./components/LivePreview";
import { PreviewHeader } from "./components/PreviewHeader";
import { useResumePreview } from "./hooks/useResumePreview";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAutosave } from "./hooks/useAutosave";

export type ResumeType = "backend" | "fullstack" | "ai-ml" | "data" | "custom";

export interface ResumeData {
  name: string;
  type: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    current: boolean;
    location: string;
    description: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
    location: string;
    coursework: string[];
  }>;
  skills: string[];
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    startDate: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
  }>;
  publications: Array<{
    id: string;
    title: string;
    description: string;
    technologies: string[];
    date: string;
  }>;
  awards: Array<{
    id: string;
    title: string;
    date: string;
  }>;
  volunteering: Array<{
    id: string;
    organization: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
  }>;
  customSections?: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
    }>;
  }>;
  sectionOrder?: string[];
}

const DEFAULT_LATEX = `%------------------------
% Resume Template
% Author : Anubhav Singh
% Github : https://github.com/xprilion
% License : MIT
%------------------------

\\documentclass[a4paper,20pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[pdftex]{hyperref}
\\usepackage{fancyhdr}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.530in}
\\addtolength{\\evensidemargin}{-0.375in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.45in}
\\addtolength{\\textheight}{1in}

\\urlstyle{rm}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-10pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titrule \\vspace{-6pt}]

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[2]{
  \\item\\small{
    \\textbf{#1}{: #2 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeItemWithoutTitle}[1]{
  \\item\\small{
    {\\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{#3} & \\textit{#4} \\\\
    \\end{tabular*}\\vspace{-5pt}
}


\\newcommand{\\resumeSubItem}[2]{\\resumeItem{#1}{#2}\\vspace{-3pt}}

\\renewcommand{\\labelitemii}{$\\circ$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=*]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-----------------------------
%%%%%%  CV STARTS HERE  %%%%%%

\\begin{document}

%----------HEADING-----------------
\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
  \\textbf{{\\LARGE Anubhav Singh}} & Email: \\href{mailto:}{xprilion@gmail.com}\\\\
  \\href{https://xprilion.com}{Portfolio: xprilion.com} & Mobile:~~~+91-XXX-XXXX-XXX \\\\
  \\href{https://github.com/xprilion}{Github: ~~github.com/xprilion} \\\\
\\end{tabular*}

%-----------EDUCATION-----------------
\\section{~~Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Netaji Subhash Engineering College}{Kolkata, India}
      {Bachelor of Technology - Information Technology;  GPA: 7.27}{July 2016 - June 2020}
      {\\scriptsize \\textit{ \\footnotesize{\\newline{}\\textbf{Courses:} Operating Systems, Data Structures, Analysis Of Algorithms, Artificial Intelligence, Machine Learning, Networking, Databases}}}
    \\resumeSubHeadingListEnd
	    
\\vspace{-5pt}
\\section{Skills Summary}
	\\resumeSubHeadingListStart
	\\resumeSubItem{Languages}{~~~~~~Python, PHP, C++, JavaScript, SQL, Bash, JAVA}
	\\resumeSubItem{Frameworks}{~~~~Scikit, NLTK, SpaCy, TensorFlow, Keras, Django, Flask, NodeJS, LAMP}
	\\resumeSubItem{Tools}{~~~~~~~~~~~~~~Kubernetes, Docker, GIT, PostgreSQL, MySQL, SQLite}
	\\resumeSubItem{Platforms}{~~~~~~~Linux, Web, Windows, Arduino, Raspberry, AWS, GCP, Alibaba Cloud, IBM Cloud}
	\\resumeSubItem{Soft Skills}{~~~~~~~Leadership, Event Management, Writing, Public Speaking, Time Management}

\\resumeSubHeadingListEnd
\\vspace{-5pt}
\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading{Google Summer of Code - Submitty}{Remote}
    {Student Developer (Full-time)}{May 2019 - Sep 2019}
    \\resumeItemListStart
        \\resumeItem{Discussion Forum Upgrades}
          {Refactor forum for performance to handle large databases.}
          \\resumeItem{REST API for Discussion Forum}
          {Symphony \\& Twig based Forum parts converted to API-first interface.}
          \\resumeItem{Ratchet PHP WebSocket}{Implemented a WebSocket for low-latency real time exchange of posts and thread updates.}
      \\resumeItemListEnd
\\vspace{-5pt}
    \\resumeSubheading
		{DataCamp Inc.}{Remote}
		{Instructor (Part-time, Contractual)}{Dec 2018 -  Present}
		\\resumeItemListStart
        \\resumeItem{Project Course - Find Movie Similarity from Plot Summaries}
          {Created project based course using Unsupervised learning and natural language processing.}
        \\resumeItem{Tutorial - Introduction to Reinforcement Learning}
          {Created tutorial for Q-learning RL algorithm and  concepts.}
        \\resumeItem{Impact}{Course has been taken by 250+ students so far with 4.65 average rating.}
		\\resumeItemListEnd

\\resumeSubHeadingListEnd

%-----------PROJECTS-----------------
\\vspace{-5pt}
\\section{Projects}
\\resumeSubHeadingListStart
\\resumeSubItem{Vison - multimedia search engine (NLP, Search Engine, Web Crawlers, Multimedia Processing)}{(Work in progress) Research oriented, open source, search engine for bringing reverse multimedia search to small \\& mid scale enterprises. Tech: Python, NodeJS, Intel OpenVino Toolkit, Selenium, TensorFlow (October '18)}
\\vspace{2pt}
\\resumeSubItem{Reinforcement Learning based Traffic Control System (Reinforcement Learning, Computer Vision)}{AI model to resolve city traffic around 50\\%
faster. Tech: Python, Alibaba Cloud, Raspberry Pi, Arduino, SUMO \\& OpenCV. (August '18)}
\\vspace{2pt}
\\resumeSubItem{Panorama from Satellite Imagery using Distributed Computing (Distributed Computing, Image Processing)}{Images clicked using drones, provided by ISRO were stitched together using distributed public compute nodes, effectively bringing down processing time exponentially. Tech: PHP, C++, Java, Python (March '18)}
\\vspace{2pt}
\\resumeSubItem{Drag-n-drop machine learning learning environment (Web Development, Machine Learning)}{Scratch like tool for implementing machine learning pipelines along with built in tutorial for each concept. Tech: Python, JavaScript (September '18)}
\\vspace{2pt}
\\resumeSubItem{Search Engine and Social Network(Web Development, Web Crawler, Search)}{Created from scratch a social network and a search engine based on the idea of integrating Facebook and Google. The launched website was among top 1000 websites in India during 2012-2013. Tech: PHP, MySQL, HTML, CSS, WebSockets, JavaScript, RSS, XML ( May '12)}
\\resumeSubHeadingListEnd
\\vspace{-5pt}
\\section{Publications}
\\resumeSubHeadingListStart
\\resumeSubItem{Book: Deep Learning on Web (Web Development, Deep Learning)}{Work in Progress book to be published by Packt Publishing in late 2019. Tech: Django, Python, AWS, GCP, Azure (November '18)}
\\vspace{2pt}
\\resumeSubItem{Book: Deep Learning on Mobile Devices (Flutter App Development, Deep Learning)}{Work in Progress book to be published by Packt Publishing in late 2019. Tech: Flutter, Android, Firebase, TensorFlow, Python, Dart (December '18)}
\\resumeSubHeadingListEnd
\\vspace{-5pt}
%-----------Awards-----------------
\\section{Honors and Awards}
\\begin{description}[font=$\\bullet$]
\\item {Awarded title of Intel Software Innovator - May, 2019}
\\vspace{-5pt}
\\item {Second Runner's Up at TCS EngiNx Engineering Project Innovation Content - September, 2018 }
\\vspace{-5pt}
\\item {Runner's Up at Facebook Developers Circle Hackathon - August, 2017}

\\end{description}

\\vspace{-5pt}
\\section{Volunteer Experience}
  \\resumeSubHeadingListStart
	\\resumeSubheading
    {Community Lead at Developer Student Clubs NSEC}{Kolkata, India}
    {Conducted online and offline technical \\& soft-skills training impacting over 3000 students.}{Jan 2019 - Present}
\\vspace{5pt}
    % \\vspace{10pt}\\textbf{\\large{Community Experience}}
    \\resumeSubheading
    {Event Organizer at Google Developers Group Kolkata}{Kolkata, India}
    {Organized events, conducted workshops and delivered workshops reaching over 7000 developers.}{Jan 2018 - Present}

\\resumeSubHeadingListEnd

\\end{document}`;


function parseLatexToResumeData(latex: string): ResumeData {
  // Helper to extract content inside curly braces
  function extractBracesContent(text: string, startIndex: number): { content: string; endIndex: number } | null {
    let i = text.indexOf("{", startIndex);
    if (i === -1) return null;
    let depth = 1;
    let content = "";
    let j = i + 1;
    while (j < text.length) {
      if (text[j] === "{" && text[j - 1] !== "\\") {
        depth++;
      } else if (text[j] === "}" && text[j - 1] !== "\\") {
        depth--;
        if (depth === 0) {
          return { content, endIndex: j };
        }
      }
      content += text[j];
      j++;
    }
    return null;
  }

  // Helper to get subheading arguments
  function getSubheadingArgs(text: string, startIdx: number) {
    const args: string[] = [];
    let curIdx = startIdx;
    for (let k = 0; k < 4; k++) {
      const match = extractBracesContent(text, curIdx);
      if (!match) break;
      args.push(match.content.trim());
      curIdx = match.endIndex + 1;
    }
    return { args, endIdx: curIdx };
  }

  // 1. Personal Info
  const nameMatch = latex.match(/\\textbf{\s*{\s*\\LARGE\s*([^\}]+?)\s*}\s*}/);
  let firstName = "";
  let lastName = "";
  if (nameMatch) {
    const fullName = nameMatch[1].trim();
    const parts = fullName.split(/\s+/);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ");
  }

  const emailMatch = latex.match(/Email:\s*\\href{mailto:([^\}]+?)}{([^\}]+?)}/i) 
    || latex.match(/Email:\s*\\href{mailto:}{([^\}]+?)}/i)
    || latex.match(/Email:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  const email = emailMatch ? (emailMatch[1] || emailMatch[2] || "").trim() : "";

  const phoneMatch = latex.match(/Mobile:~~~\s*([^\s\\&]+)/i) || latex.match(/Mobile:\s*([^\s\\&]+)/i);
  const phone = phoneMatch ? phoneMatch[1].trim() : "";

  const websiteMatch = latex.match(/\\href{[^\}]+}{Portfolio:\s*([^\}]+)}/i);
  const website = websiteMatch ? websiteMatch[1].trim() : "";

  const linkedinMatch = latex.match(/\\href{[^\}]+}{LinkedIn:\s*([^\}]+)}/i);
  const linkedin = linkedinMatch ? linkedinMatch[1].trim() : "";

  const githubMatch = latex.match(/\\href{[^\}]+}{Github:\s*(?:~~)?\s*([^\}]+)}/i);
  const github = githubMatch ? githubMatch[1].trim() : "";

  const personalInfo = { firstName, lastName, email, phone, location: "", linkedin, github, website };

  // Parse Sections Sequentially
  const sections: Array<{ id: string; title: string; body: string }> = [];
  const sectionRegex = /\\section\s*\{\s*(.*?)\s*\}/g;
  let match;
  const indices: number[] = [];
  const titles: string[] = [];

  while ((match = sectionRegex.exec(latex)) !== null) {
    indices.push(match.index);
    titles.push(match[1].trim());
  }

  for (let k = 0; k < indices.length; k++) {
    const start = indices[k];
    const end = k + 1 < indices.length ? indices[k + 1] : latex.indexOf("\\end{document}");
    const sectionText = latex.slice(start, end);
    let bodyStart = sectionText.indexOf("}");
    if (bodyStart !== -1) {
      bodyStart += 1;
      const body = sectionText.slice(bodyStart).trim();
      const title = titles[k];
      let id = "";
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("education")) id = "education";
      else if (lowerTitle.includes("skills summary")) id = "skills";
      else if (lowerTitle.includes("experience")) id = "experience";
      else if (lowerTitle.includes("projects")) id = "projects";
      else if (lowerTitle.includes("publications")) id = "publications";
      else if (lowerTitle.includes("awards") || lowerTitle.includes("honors")) id = "awards";
      else if (lowerTitle.includes("volunteer")) id = "volunteering";
      else id = `custom_${k}_${title.replace(/\s+/g, "_").toLowerCase()}`;

      sections.push({ id, title, body });
    }
  }

  const education: any[] = [];
  const skills: string[] = [];
  const experience: any[] = [];
  const projects: any[] = [];
  const publications: any[] = [];
  const awards: any[] = [];
  const volunteering: any[] = [];
  const customSections: any[] = [];

  sections.forEach((sec) => {
    const body = sec.body;
    if (sec.id === "education") {
      let pos = 0;
      while (true) {
        const idx = body.indexOf("\\resumeSubheading", pos);
        if (idx === -1) break;
        const { args, endIdx } = getSubheadingArgs(body, idx);
        if (args.length >= 4) {
          const degreeInfo = args[2];
          const gpaMatch = degreeInfo.match(/GPA:\s*([^\s;]+)/i);
          const gpa = gpaMatch ? gpaMatch[1].trim() : "";
          let degreePart = degreeInfo.split(";")[0] || "";
          degreePart = degreePart.replace(/GPA:\s*.*/i, "");
          const degreeSplit = degreePart.split("-");
          const degree = (degreeSplit[0] || "").trim();
          const field = (degreeSplit.slice(1).join("-") || "").trim();

          const datesSplit = args[3].split("-");
          const startDate = (datesSplit[0] || "").trim();
          const endDate = (datesSplit[1] || "").trim();

          let coursework: string[] = [];
          const courseworkMatch = body.slice(endIdx).split("\\resumeSubheading")[0].split("\\resumeSubHeadingListEnd")[0].match(/Courses:}\s*([^\}]+)/i)
            || body.slice(endIdx).split("\\resumeSubheading")[0].split("\\resumeSubHeadingListEnd")[0].match(/Courses:}\s*([^\n]+)/i);
          if (courseworkMatch) {
            coursework = courseworkMatch[1].split(",").map(c => c.trim()).filter(Boolean);
          }

          education.push({
            id: `edu_${education.length}_${Date.now()}`,
            institution: args[0],
            location: args[1],
            degree,
            field,
            startDate,
            endDate,
            gpa,
            coursework
          });
        }
        pos = idx + 17;
      }
    } else if (sec.id === "skills") {
      let pos = 0;
      while (true) {
        const idx = body.indexOf("\\resumeSubItem", pos);
        if (idx === -1) break;
        const match1 = extractBracesContent(body, idx);
        if (match1) {
          const match2 = extractBracesContent(body, match1.endIndex + 1);
          if (match2) {
            skills.push(`${match1.content.trim()}: ${match2.content.trim()}`);
            pos = match2.endIndex + 1;
            continue;
          }
        }
        pos = idx + 14;
      }
    } else if (sec.id === "experience") {
      let pos = 0;
      while (true) {
        const idx = body.indexOf("\\resumeSubheading", pos);
        if (idx === -1) break;
        const { args, endIdx } = getSubheadingArgs(body, idx);
        if (args.length >= 4) {
          const datesSplit = args[3].split("-");
          const startDate = (datesSplit[0] || "").trim();
          const endDate = (datesSplit[1] || "").trim();
          const current = endDate.toLowerCase().includes("present");

          const description: string[] = [];
          const blockAfter = body.slice(endIdx).split("\\resumeSubheading")[0].split("\\resumeSubHeadingListEnd")[0];
          let itemPos = 0;
          while (true) {
            const itemIdx = blockAfter.indexOf("\\resumeItem", itemPos);
            if (itemIdx === -1) break;
            const match1 = extractBracesContent(blockAfter, itemIdx);
            if (match1) {
              const match2 = extractBracesContent(blockAfter, match1.endIndex + 1);
              if (match2) {
                description.push(`${match1.content.trim()}: ${match2.content.trim()}`);
                itemPos = match2.endIndex + 1;
                continue;
              }
            }
            itemPos = itemIdx + 11;
          }

          experience.push({
            id: `exp_${experience.length}_${Date.now()}`,
            company: args[0],
            location: args[1],
            role: args[2],
            startDate,
            endDate,
            current,
            description
          });
        }
        pos = idx + 17;
      }
    } else if (sec.id === "projects") {
      let pos = 0;
      while (true) {
        const idx = body.indexOf("\\resumeSubItem", pos);
        if (idx === -1) break;
        const match1 = extractBracesContent(body, idx);
        if (match1) {
          const match2 = extractBracesContent(body, match1.endIndex + 1);
          if (match2) {
            const titleBlock = match1.content.trim();
            const descBlock = match2.content.trim();

            const techMatch = titleBlock.match(/\(([^)]+)\)$/);
            const technologies = techMatch ? techMatch[1].split(",").map(t => t.trim()) : [];
            const name = titleBlock.replace(/\(([^)]+)\)$/, "").trim();

            const dateMatch = descBlock.match(/\(([^)]+)\)$/);
            const startDate = dateMatch ? dateMatch[1].trim() : "";
            let description = descBlock.replace(/\(([^)]+)\)$/, "").trim();

            const linkMatch = description.match(/\\href{([^}]+)}{(Link)}/i)
              || description.match(/\\href{([^}]+)}{\(Link\)}/i);
            const link = linkMatch ? linkMatch[1].trim() : "";
            description = description.replace(/\\href{[^}]+}{(?:Link|\(Link\))}/gi, "").trim();

            projects.push({
              id: `proj_${projects.length}_${Date.now()}`,
              name,
              description,
              technologies,
              startDate,
              link
            });
            pos = match2.endIndex + 1;
            continue;
          }
        }
        pos = idx + 14;
      }
    } else if (sec.id === "publications") {
      let pos = 0;
      while (true) {
        const idx = body.indexOf("\\resumeSubItem", pos);
        if (idx === -1) break;
        const match1 = extractBracesContent(body, idx);
        if (match1) {
          const match2 = extractBracesContent(body, match1.endIndex + 1);
          if (match2) {
            const titleBlock = match1.content.trim();
            const descBlock = match2.content.trim();

            const techMatch = titleBlock.match(/\(([^)]+)\)$/);
            const technologies = techMatch ? techMatch[1].split(",").map(t => t.trim()) : [];
            const title = titleBlock.replace(/\(([^)]+)\)$/, "").trim();

            const dateMatch = descBlock.match(/\(([^)]+)\)$/);
            const date = dateMatch ? dateMatch[1].trim() : "";
            const description = descBlock.replace(/\(([^)]+)\)$/, "").trim();

            publications.push({
              id: `pub_${publications.length}_${Date.now()}`,
              title,
              description,
              technologies,
              date
            });
            pos = match2.endIndex + 1;
            continue;
          }
        }
        pos = idx + 14;
      }
    } else if (sec.id === "awards") {
      const itemRegex = /\\item\s*{\s*([^-}]+?)\s*-\s*([^\}]+?)\s*}/g;
      let matchItem;
      while ((matchItem = itemRegex.exec(body)) !== null) {
        awards.push({
          id: `award_${awards.length}_${Date.now()}`,
          title: matchItem[1].trim(),
          date: matchItem[2].trim()
        });
      }
    } else if (sec.id === "volunteering") {
      let pos = 0;
      while (true) {
        const idx = body.indexOf("\\resumeSubheading", pos);
        if (idx === -1) break;
        const { args } = getSubheadingArgs(body, idx);
        if (args.length >= 4) {
          volunteering.push({
            id: `vol_${volunteering.length}_${Date.now()}`,
            organization: args[0],
            location: args[1],
            description: args[2],
            startDate: args[3].split("-")[0]?.trim() || "",
            endDate: args[3].split("-")[1]?.trim() || "",
          });
        }
        pos = idx + 17;
      }
    } else if (sec.id.startsWith("custom_")) {
      const items: any[] = [];
      let pos = 0;
      while (true) {
        const idx = body.indexOf("\\resumeSubheading", pos);
        if (idx === -1) break;
        const { args } = getSubheadingArgs(body, idx);
        if (args.length >= 4) {
          items.push({
            id: `custom_item_${items.length}_${Date.now()}`,
            title: `${args[0]} - ${args[2]}`,
            description: `${args[1]} (${args[3]})`
          });
        }
        pos = idx + 17;
      }
      if (items.length === 0) {
        pos = 0;
        while (true) {
          const idx = body.indexOf("\\resumeSubItem", pos);
          if (idx === -1) break;
          const match1 = extractBracesContent(body, idx);
          if (match1) {
            const match2 = extractBracesContent(body, match1.endIndex + 1);
            if (match2) {
              items.push({
                id: `custom_item_${items.length}_${Date.now()}`,
                title: match1.content.trim(),
                description: match2.content.replace(/~/g, "").trim()
              });
              pos = match2.endIndex + 1;
              continue;
            }
          }
          pos = idx + 14;
        }
      }
      if (items.length === 0) {
        const itemRegex = /\\item\s*{\s*([^-}]+?)\s*-\s*([^\}]+?)\s*}/g;
        let matchItem;
        while ((matchItem = itemRegex.exec(body)) !== null) {
          items.push({
            id: `custom_item_${items.length}_${Date.now()}`,
            title: matchItem[1].trim(),
            description: matchItem[2].trim()
          });
        }
      }
      customSections.push({
        id: sec.id,
        name: sec.title,
        items
      });
    }
  });

  const sectionOrder = ["personal", ...sections.map((s) => s.id)];

  return {
    name: "My Resume",
    type: "custom",
    personalInfo,
    summary: "",
    experience,
    education,
    skills,
    projects,
    certifications: [],
    publications,
    awards,
    volunteering,
    customSections,
    sectionOrder,
  };
}

export const ResumeBuilder: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1200);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const [latexCode, setLatexCode] = useState<string>(DEFAULT_LATEX);
  const [resumeData, setResumeData] = useState<ResumeData>(() => parseLatexToResumeData(DEFAULT_LATEX));

  // Undo/Redo stack state
  const [history, setHistory] = useState<string[]>([DEFAULT_LATEX]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isHistoryAction = useRef(false);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEditorChange = (newVal: string) => {
    setLatexCode(newVal);

    if (isHistoryAction.current) {
      isHistoryAction.current = false;
      return;
    }

    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        const nextHist = prev.slice(0, historyIndex + 1);
        if (nextHist[nextHist.length - 1] === newVal) return prev;
        if (nextHist.length >= 50) {
          nextHist.shift();
        }
        const updated = [...nextHist, newVal];
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    }, 800);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isHistoryAction.current = true;
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setLatexCode(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isHistoryAction.current = true;
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setLatexCode(history[nextIndex]);
    }
  };

  const { isCompiling, compileError } = useResumePreview({
    resumeData,
    generateLatex: () => latexCode,
    debounceMs: 300,
  });

  const [zoom, setZoom] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("resume-builder:zoom");
      return saved ? JSON.parse(saved) : 100;
    } catch {
      return 100;
    }
  });

  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  // Keep localStorage updated when states change
  useEffect(() => {
    localStorage.setItem("resume-builder:zoom", JSON.stringify(zoom));
  }, [zoom]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1200);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPresentationMode(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // --- Parse LaTeX to ResumeData whenever LaTeX code changes ---
  useEffect(() => {
    try {
      const parsed = parseLatexToResumeData(latexCode);
      setResumeData(parsed);
    } catch (e) {
      console.error("Failed to parse LaTeX code", e);
    }
  }, [latexCode]);

  // --- Fetch Resumes ---
  const { data: serverResumes, isLoading: isFetchingResumes, refetch: refetchResumes } = useQuery({
    queryKey: ["resumes-list"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/resumes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch resumes");
      return res.json();
    }
  });

  // Load corresponding resume when serverResumes is fetched
  useEffect(() => {
    if (serverResumes && serverResumes.length > 0) {
      const matched = serverResumes.find((r: any) => r.name === "LaTeX Resume");
      if (matched && matched.content) {
        try {
          const parsed = JSON.parse(matched.content);
          if (parsed.latex) {
            setLatexCode(parsed.latex);
            setHistory([parsed.latex]);
            setHistoryIndex(0);
          }
        } catch (e) {
          console.error("Failed to parse loaded resume content", e);
        }
      }
    }
  }, [serverResumes]);

  // --- Save Mutation ---
  const saveMutation = useMutation({
    mutationFn: async (latexStr: string) => {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "LaTeX Resume",
          content: JSON.stringify({ latex: latexStr }),
        }),
      });
      if (!res.ok) throw new Error("Failed to save resume");
      return res.json();
    },
    onError: () => alert("Failed to save resume"),
  });

  // Autosave configuration
  const { status: saveStatus, forceSave: autosaveForceSave } = useAutosave({
    data: latexCode,
    onSave: async (currentLatex) => {
      await saveMutation.mutateAsync(currentLatex);
    },
    debounceMs: 2000,
  });

  const forceSave = async () => {
    await autosaveForceSave();
  };

  // --- Fit Width Calculation ---
  function handleFitWidth() {
    if (previewContainerRef.current) {
      const containerWidth = previewContainerRef.current.clientWidth;
      const calculatedZoom = Math.floor(((containerWidth - 48) / 794) * 100);
      setZoom(Math.max(40, Math.min(200, calculatedZoom)));
    }
  }

  function handleFitHeight() {
    if (previewContainerRef.current) {
      const containerHeight = previewContainerRef.current.clientHeight;
      const calculatedZoom = Math.floor(((containerHeight - 48) / 1122) * 100);
      setZoom(Math.max(40, Math.min(400, calculatedZoom)));
    }
  }

  // Auto-fit to width on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitWidth();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Add Ctrl+Mousewheel support to the preview container
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom((prev) => Math.max(40, Math.min(200, prev + delta)));
    }
  };

  useEffect(() => {
    const container = previewContainerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, []);

  // --- Keyboard Shortcuts hook ---
  useKeyboardShortcuts({
    onSave: autosaveForceSave,
    onResetZoom: handleFitWidth,
    onZoomIn: () => setZoom((prev) => Math.min(400, prev + 10)),
    onZoomOut: () => setZoom((prev) => Math.max(40, prev - 10)),
    onFitHeight: handleFitHeight,
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  const handleRefresh = async () => {
    await forceSave();
    refetchResumes();
  };

  const exportPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Resume",
          format: "PDF",
          data: { latex: latexCode },
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `LaTeX_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      alert("Failed to export PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const exportLatex = async () => {
    const blob = new Blob([latexCode], { type: "application/x-tex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LaTeX_Resume.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTextareaScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lines = latexCode.split("\n");
  const lineNumbers = Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1);

  const renderCodeEditor = () => (
    <div className="flex-1 flex overflow-hidden min-h-0 bg-[#0f141d]">
      {/* Line Numbers Column */}
      <div
        ref={lineNumbersRef}
        className="w-12 bg-[#090d14] text-right pr-3 py-4 font-mono text-xs text-gray-600 select-none overflow-hidden border-r border-[#1a2333] leading-relaxed"
      >
        {lineNumbers.map((num) => (
          <div key={num} className="h-5">
            {num}
          </div>
        ))}
      </div>

      {/* Code Textarea Area */}
      <textarea
        ref={textareaRef}
        value={latexCode}
        onChange={(e) => handleEditorChange(e.target.value)}
        onScroll={handleTextareaScroll}
        spellCheck={false}
        className="flex-1 bg-transparent text-gray-200 font-mono text-sm leading-relaxed p-4 outline-none resize-none overflow-y-auto whitespace-pre leading-[20px]"
        style={{
          lineHeight: "20px",
          fontFamily: "Fira Code, Consolas, Monaco, monospace",
        }}
        placeholder="Enter your LaTeX source code here..."
      />
    </div>
  );

  if (isFetchingResumes) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse bg-[#0b0f19] min-h-screen text-[#94a3b8]">
        <div className="h-8 bg-[#131a26] rounded w-1/4"></div>
        <div className="h-4 bg-[#131a26] rounded w-1/3 mt-2"></div>
        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="h-[500px] bg-[#131a26] rounded-2xl"></div>
          <div className="h-[500px] bg-[#131a26] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] overflow-hidden select-none">
      {/* Header Panel */}
      <header className="bg-[#0b0f19] px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1b2535]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 rounded-xl">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">LaTeX Editor</h1>
            <p className="text-xs text-[#94a3b8] mt-1">Live LaTeX Resume Previewer & Exporter</p>
          </div>
        </div>

        {/* Template Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLatexCode(DEFAULT_LATEX)}
            className="px-3 py-1.5 bg-[#2d3748] hover:bg-[#374151] rounded-lg text-xs font-semibold text-white transition-colors border border-[#3d4655] cursor-pointer"
          >
            Reset Template
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-h-0 relative px-4 pb-4 md:px-8 md:pb-8 pt-0">
        {isMobile ? (
          /* Mobile / Switchable Tab Layout */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-[#131a26] border-b border-[#2d3748] flex p-1 gap-1 flex-shrink-0">
              <button
                onClick={() => setActiveTab("editor")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "editor"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                LaTeX Source
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Live Preview
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative bg-[#131a26]">
              {activeTab === "editor" ? (
                renderCodeEditor()
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <PreviewHeader
                    zoom={zoom}
                    onZoomChange={setZoom}
                    onFitWidth={handleFitWidth}
                    onFitHeight={handleFitHeight}
                    onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
                    onDownloadLatex={exportLatex}
                    onRefresh={handleRefresh}
                    isSaving={saveMutation.isPending}
                    onSave={forceSave}
                    onDownloadPdf={exportPdf}
                    isDownloadingPdf={isDownloadingPdf}
                  />
                  <LivePreview
                    previewData={resumeData}
                    sectionOrder={resumeData.sectionOrder || [
                      "personal",
                      "education",
                      "skills",
                      "experience",
                      "projects",
                      "publications",
                      "awards",
                      "volunteering"
                    ]}
                    sectionVisibility={{
                      personal: true,
                      experience: true,
                      education: true,
                      skills: true,
                      projects: true,
                      publications: true,
                      awards: true,
                      volunteering: true,
                    }}
                    zoom={zoom}
                    isCompiling={isCompiling}
                    compileError={compileError}
                    containerRef={previewContainerRef}
                    contentRef={previewContentRef}
                    onZoomChange={setZoom}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Side-by-Side Fixed Layout */
          <div className="flex-1 flex gap-6 min-h-0 mt-4">
            {/* Left Panel: Raw Code Editor */}
            <div className={`${isPresentationMode ? "hidden" : "w-[48%]"} h-full bg-[#131a26] border border-[#232d3f] rounded-2xl shadow-xl overflow-hidden flex flex-col`}>
              <div className="h-10 bg-[#171f2d] border-b border-[#232d3f] px-4 flex items-center justify-between text-xs text-gray-400 font-semibold select-none flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span>latex_resume.tex</span>
                  <span className="text-[10px] text-gray-500 font-mono">UTF-8</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] ${
                    saveStatus === 'saved' ? 'text-emerald-400' : saveStatus === 'saving' ? 'text-indigo-400 animate-pulse' : 'text-amber-400'
                  }`}>
                    {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved Changes'}
                  </span>
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1 hover:bg-[#1b2535] rounded disabled:opacity-30 disabled:hover:bg-transparent text-gray-400 hover:text-white transition cursor-pointer"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1 hover:bg-[#1b2535] rounded disabled:opacity-30 disabled:hover:bg-transparent text-gray-400 hover:text-white transition cursor-pointer"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={autosaveForceSave}
                    className="p-1 hover:bg-[#1b2535] rounded text-gray-400 hover:text-white transition cursor-pointer"
                    title="Save (Ctrl+S)"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {renderCodeEditor()}
            </div>

            {/* Right Panel: Live Preview */}
            <div className="flex-1 h-full bg-[#131a26] border border-[#232d3f] rounded-2xl shadow-xl overflow-hidden flex flex-col">
              <PreviewHeader
                zoom={zoom}
                onZoomChange={setZoom}
                onFitWidth={handleFitWidth}
                onFitHeight={handleFitHeight}
                onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
                onDownloadLatex={exportLatex}
                onRefresh={handleRefresh}
                isSaving={saveMutation.isPending}
                onSave={forceSave}
                onDownloadPdf={exportPdf}
                isDownloadingPdf={isDownloadingPdf}
              />
              <LivePreview
                previewData={resumeData}
                sectionOrder={resumeData.sectionOrder || [
                  "personal",
                  "education",
                  "skills",
                  "experience",
                  "projects",
                  "publications",
                  "awards",
                  "volunteering"
                ]}
                sectionVisibility={{
                  personal: true,
                  experience: true,
                  education: true,
                  skills: true,
                  projects: true,
                  publications: true,
                  awards: true,
                  volunteering: true,
                }}
                zoom={zoom}
                isCompiling={isCompiling}
                compileError={compileError}
                containerRef={previewContainerRef}
                contentRef={previewContentRef}
                onZoomChange={setZoom}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ResumeBuilder;
