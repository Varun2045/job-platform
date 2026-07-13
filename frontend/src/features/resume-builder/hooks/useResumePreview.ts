import { useState, useEffect, useRef } from "react";
import type { ResumeData } from "../ResumeBuilder";

interface UseResumePreviewProps {
  resumeData: ResumeData;
  generateLatex: () => string;
  debounceMs?: number;
}

export function useResumePreview({
  resumeData,
  generateLatex,
  debounceMs = 500,
}: UseResumePreviewProps) {
  const [previewData, setPreviewData] = useState<ResumeData>(resumeData);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simple LaTeX validator to simulate compiler checks
  const validateLatex = (latex: string): string | null => {
    // Check for unmatched curly braces
    let braceCount = 0;
    for (let i = 0; i < latex.length; i++) {
      if (latex[i] === "{" && (i === 0 || latex[i - 1] !== "\\")) {
        braceCount++;
      } else if (latex[i] === "}" && (i === 0 || latex[i - 1] !== "\\")) {
        braceCount--;
      }
      if (braceCount < 0) {
        return "Unmatched closing brace '}' found in document.";
      }
    }
    if (braceCount !== 0) {
      return "Unmatched opening brace '{' found in document.";
    }

    // Check for common LaTeX command errors, e.g. a backslash at the end
    if (latex.endsWith("\\")) {
      return "Trailing backslash found at the end of the document.";
    }

    return null;
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsCompiling(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const latex = generateLatex();
        const error = validateLatex(latex);
        if (error) {
          setCompileError(error);
        } else {
          setCompileError(null);
          setPreviewData(resumeData);
        }
      } catch (err: any) {
        setCompileError(err?.message || "LaTeX compilation failed.");
      } finally {
        setIsCompiling(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resumeData, generateLatex, debounceMs]);

  return {
    previewData,
    isCompiling,
    compileError,
  };
}
