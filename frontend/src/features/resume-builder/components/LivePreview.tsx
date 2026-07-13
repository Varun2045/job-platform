import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface ResumeData {
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
}

type SectionKey = string;

interface LivePreviewProps {
  previewData: ResumeData;
  sectionOrder: SectionKey[];
  sectionVisibility: Record<SectionKey, boolean>;
  zoom: number;
  isCompiling: boolean;
  compileError: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onZoomChange?: (zoom: number) => void;
}

const cleanUrlDisplay = (url: string) => {
  if (!url) return "";
  return url.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "");
};

export const LivePreview: React.FC<LivePreviewProps> = ({
  previewData,
  sectionOrder,
  sectionVisibility,
  zoom,
  isCompiling,
  compileError,
  containerRef,
  contentRef,
  onZoomChange,
}) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if clicking on the page container, not on links or inputs
    if ((e.target as HTMLElement).closest("a, button, input, select, textarea")) {
      return;
    }

    e.preventDefault();

    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startX = e.clientX;
    const startY = e.clientY;
    const startZoom = zoom;

    const startDist = Math.sqrt((startX - centerX) ** 2 + (startY - centerY) ** 2);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const currentY = moveEvent.clientY;

      const currentDist = Math.sqrt((currentX - centerX) ** 2 + (currentY - centerY) ** 2);
      const diff = currentDist - startDist;
      
      const scaleFactor = 0.4;
      const newZoom = Math.min(200, Math.max(40, Math.round(startZoom + diff * scaleFactor)));
      
      onZoomChange?.(newZoom);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const factor = 0.25;
        const newZoom = Math.min(200, Math.max(40, Math.round(zoom - e.deltaY * factor)));
        onZoomChange?.(newZoom);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [zoom, onZoomChange, containerRef]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-[#0b0f19] relative scroll-smooth flex justify-center"
    >
      {/* LaTeX Compile Error Banner */}
      {compileError && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-red-950/80 border border-red-800 text-red-200 px-4 py-3 rounded-lg shadow-lg flex items-start gap-2.5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold">Unable to compile resume</div>
            <div className="text-xs text-red-300/90 mt-0.5">{compileError}</div>
          </div>
        </div>
      )}

      {/* Subtle Compile Indicator */}
      {isCompiling && (
        <div className="absolute top-4 right-4 z-40 bg-[#1a1f2e]/90 border border-[#2d3748] rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-sm animate-in fade-in duration-150">
          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          <span className="text-xs font-semibold text-white">Compiling...</span>
        </div>
      )}

      {/* A4 Paper Container */}
      <div
        ref={contentRef}
        onMouseDown={handleMouseDown}
        className="bg-white shadow-2xl mx-auto transition-transform duration-150 ease-out origin-top cursor-default select-none"
        style={{
          transform: `scale(${zoom / 100})`,
          width: "210mm",
          minHeight: "297mm",
        }}
      >
        <div
          className="text-gray-900 leading-normal text-[9.5pt]"
          style={{
            padding: "0.5in 0.5in 0.5in 0.5in",
            fontFamily: 'system-ui, -apple-system, "Computer Modern Roman", "Baskerville", "Georgia", "Times New Roman", serif',
            color: "#111111"
          }}
        >
          {/* Heading / Personal Info */}
          {(() => {
            const linkedinLine = previewData.personalInfo.linkedin ? (
              <a href={previewData.personalInfo.linkedin} className="text-black hover:underline text-[9.5pt]">
                LinkedIn: {cleanUrlDisplay(previewData.personalInfo.linkedin)}
              </a>
            ) : null;

            const githubLine = previewData.personalInfo.github ? (
              <a href={previewData.personalInfo.github} className="text-black hover:underline text-[9.5pt]">
                Github: {cleanUrlDisplay(previewData.personalInfo.github)}
              </a>
            ) : null;

            const websiteLine = previewData.personalInfo.website ? (
              <a href={previewData.personalInfo.website} className="text-black hover:underline text-[9.5pt]">
                Portfolio: {cleanUrlDisplay(previewData.personalInfo.website)}
              </a>
            ) : null;

            const leftLinks: React.ReactNode[] = [];
            if (websiteLine) leftLinks.push(websiteLine);
            if (linkedinLine) leftLinks.push(linkedinLine);
            if (githubLine) leftLinks.push(githubLine);

            const row2Left = leftLinks[0] || null;
            const row3Left = leftLinks[1] || null;
            const row3Right = leftLinks[2] || null;

            return (
              <div className="mb-4">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td className="text-left align-top">
                        <h1 className="text-[20pt] font-bold mb-1 leading-none tracking-tight">
                          {previewData.personalInfo.firstName} {previewData.personalInfo.lastName}
                        </h1>
                      </td>
                      <td className="text-right align-top pt-1.5">
                        {previewData.personalInfo.email && (
                          <p className="text-[9.5pt]">
                            <span>Email: </span>
                            <a href={`mailto:${previewData.personalInfo.email}`} className="text-black hover:underline text-[9.5pt]">
                              {previewData.personalInfo.email}
                            </a>
                          </p>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-left align-top py-0.5">
                        {row2Left}
                      </td>
                      <td className="text-right align-top py-0.5">
                        {previewData.personalInfo.phone && (
                          <p className="text-[9.5pt]">Mobile: {previewData.personalInfo.phone}</p>
                        )}
                      </td>
                    </tr>
                    {(row3Left || row3Right) && (
                      <tr>
                        <td className="text-left align-top py-0.5">
                          {row3Left}
                        </td>
                        <td className="text-right align-top py-0.5">
                          {row3Right}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Dynamic Sections */}
          {sectionOrder
            .filter((id) => sectionVisibility[id])
            .map((sectionId) => {
              if (sectionId === "education" && previewData.education.length > 0) {
                return (
                  <React.Fragment key="education">
                    <h2 className="text-[11.5pt] font-bold uppercase border-b border-black pb-0.5 mt-3 mb-1.5 flex items-center justify-between">
                      Education
                    </h2>
                    <div className="mb-2">
                      {previewData.education.map((edu) => (
                        <div key={edu.id} className="mb-2.5">
                          <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td className="text-left font-bold text-[9.5pt]">{edu.institution}</td>
                                <td className="text-right text-[9.5pt]">{edu.location || ""}</td>
                              </tr>
                              <tr>
                                <td className="text-left italic text-[9.5pt]">
                                  {edu.degree}{edu.field ? ` - ${edu.field}` : ""}
                                  {edu.gpa ? `; GPA: ${edu.gpa}` : ""}
                                </td>
                                <td className="text-right text-[9.5pt]">
                                  {edu.startDate} – {edu.endDate}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          {edu.coursework && edu.coursework.length > 0 && (
                            <p className="text-[9pt] italic mt-0.5 pl-4">
                              <span className="font-bold">Courses:</span> {edu.coursework.join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                );
              }

              if (sectionId === "skills" && previewData.skills.length > 0) {
                return (
                  <React.Fragment key="skills">
                    <h2 className="text-[11.5pt] font-bold uppercase border-b border-black pb-0.5 mt-3 mb-1.5 flex items-center justify-between">
                      Skills Summary
                    </h2>
                    <ul className="list-none mb-2">
                      {previewData.skills.map((skillLine, index) => {
                        const colonIndex = skillLine.indexOf(":");
                        const category = colonIndex !== -1 ? skillLine.slice(0, colonIndex).trim() : "";
                        const skillsText = colonIndex !== -1 ? skillLine.slice(colonIndex + 1) : skillLine;
                        const cleanSkillsText = skillsText.replace(/~/g, "").trim();
                        return (
                          <li key={index} className="text-[9.5pt] mb-0.5">
                            <table className="w-full" style={{ borderCollapse: "collapse" }}>
                              <tbody>
                                <tr>
                                  <td className="align-top font-bold text-left" style={{ width: "1.25in" }}>
                                    • {category}:
                                  </td>
                                  <td className="align-top text-left pl-1">
                                    {cleanSkillsText}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </li>
                        );
                      })}
                    </ul>
                  </React.Fragment>
                );
              }

              if (sectionId === "experience" && previewData.experience.length > 0) {
                return (
                  <React.Fragment key="experience">
                    <h2 className="text-[11.5pt] font-bold uppercase border-b border-black pb-0.5 mt-3 mb-1.5 flex items-center justify-between">
                      Experience
                    </h2>
                    <div className="mb-2">
                      {previewData.experience.map((exp) => (
                        <div key={exp.id} className="mb-2.5">
                          <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td className="text-left font-bold text-[9.5pt]">{exp.company}</td>
                                <td className="text-right text-[9.5pt]">{exp.location || ""}</td>
                              </tr>
                              <tr>
                                <td className="text-left italic text-[9.5pt]">{exp.role}</td>
                                <td className="text-right text-[9.5pt]">
                                  {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          {exp.description.length > 0 && (
                            <ul className="list-none mt-1 pl-4">
                              {exp.description.map((desc, idx) => {
                                const colonIndex = desc.indexOf(":");
                                if (colonIndex !== -1) {
                                  const boldPart = desc.slice(0, colonIndex);
                                  const normalPart = desc.slice(colonIndex + 1);
                                  return (
                                    <li key={idx} className="text-[9pt] text-gray-800 flex items-start gap-2 mb-0.5">
                                      <span className="text-[9pt] font-semibold mt-0.5">○</span>
                                      <span>
                                        <span className="font-bold">{boldPart}</span>: {normalPart}
                                      </span>
                                    </li>
                                  );
                                }
                                return (
                                  <li key={idx} className="text-[9pt] text-gray-800 flex items-start gap-2 mb-0.5">
                                    <span className="text-[9pt] font-semibold mt-0.5">○</span>
                                    <span>{desc}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                );
              }

              if (sectionId === "projects" && previewData.projects.length > 0) {
                return (
                  <React.Fragment key="projects">
                    <h2 className="text-[11.5pt] font-bold uppercase border-b border-black pb-0.5 mt-3 mb-1.5 flex items-center justify-between">
                      Projects
                    </h2>
                    <ul className="list-none mb-2">
                      {previewData.projects.map((proj) => (
                        <li key={proj.id} className="text-[9.5pt] mb-1.5 flex items-start gap-2">
                          <span className="font-bold">•</span>
                          <span>
                            <span className="font-bold">
                              {proj.name} {proj.technologies && proj.technologies.length > 0 ? `(${proj.technologies.join(", ")})` : ""}
                            </span>
                            <span>: {proj.description}</span>
                            {proj.link && (
                              <a href={proj.link} className="text-black hover:underline ml-1">
                                (Link)
                              </a>
                            )}
                            {proj.startDate && <span> ({proj.startDate})</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </React.Fragment>
                );
              }

              if (sectionId === "certifications" && previewData.certifications.length > 0) {
                return (
                  <React.Fragment key="certifications">
                    <h2 className="text-[11.5pt] font-bold uppercase border-b border-black pb-0.5 mt-3 mb-1.5 flex items-center justify-between">
                      Certifications
                    </h2>
                    <ul className="list-none mb-2">
                      {previewData.certifications.map((cert) => (
                        <li key={cert.id} className="text-[9.5pt] mb-1 flex items-start gap-2">
                          <span className="font-bold">•</span>
                          <span>
                            <span className="font-bold">{cert.name}</span> - {cert.issuer} ({cert.date}){" "}
                            {cert.credentialId && `| Credential ID: ${cert.credentialId}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </React.Fragment>
                );
              }

              if (sectionId === "publications" && previewData.publications.length > 0) {
                return (
                  <React.Fragment key="publications">
                    <h2 className="text-[11.5pt] font-bold uppercase border-b border-black pb-0.5 mt-3 mb-1.5 flex items-center justify-between">
                      Publications
                    </h2>
                    <ul className="list-none mb-2">
                      {previewData.publications.map((pub) => (
                        <li key={pub.id} className="text-[9.5pt] mb-1.5 flex items-start gap-2">
                          <span className="font-bold">•</span>
                          <span>
                            <span className="font-bold">
                              {pub.title} {pub.technologies && pub.technologies.length > 0 ? `(${pub.technologies.join(", ")})` : ""}
                            </span>
                            <span>: {pub.description}</span>
                            {pub.date && <span> ({pub.date})</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </React.Fragment>
                );
              }

              if (sectionId === "awards" && previewData.awards.length > 0) {
                return (
                  <React.Fragment key="awards">
                    <h2 className="text-[11.5pt] font-bold uppercase border-b border-black pb-0.5 mt-3 mb-1.5 flex items-center justify-between">
                      Honors and Awards
                    </h2>
                    <ul className="list-none mb-2">
                      {previewData.awards.map((award) => (
                        <li key={award.id} className="text-[9.5pt] mb-0.5 flex items-start gap-2">
                          <span className="font-bold">•</span>
                          <span>
                            {award.title} - {award.date}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </React.Fragment>
                );
              }

              if (sectionId === "volunteering" && previewData.volunteering.length > 0) {
                return (
                  <React.Fragment key="volunteering">
                    <h2 className="text-[11.5pt] font-bold uppercase border-b border-black pb-0.5 mt-3 mb-1.5 flex items-center justify-between">
                      Volunteer Experience
                    </h2>
                    <div className="mb-2">
                      {previewData.volunteering.map((vol) => (
                        <div key={vol.id} className="mb-2.5">
                          <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td className="text-left font-bold text-[9.5pt]">{vol.organization}</td>
                                <td className="text-right text-[9.5pt]">{vol.location || ""}</td>
                              </tr>
                              <tr>
                                <td className="text-left italic text-[9.5pt]">{vol.description}</td>
                                <td className="text-right text-[9.5pt]">
                                  {vol.startDate} - {vol.endDate}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                );
              }

              if (sectionId.startsWith("custom_")) {
                const customSec = (previewData as any).customSections?.find((cs: any) => cs.id === sectionId);
                if (customSec && customSec.items && customSec.items.length > 0) {
                  return (
                    <React.Fragment key={sectionId}>
                      <h2 className="text-[11.5pt] font-bold uppercase border-b border-black pb-0.5 mt-3 mb-1.5 flex items-center justify-between">
                        {customSec.name}
                      </h2>
                      <ul className="list-none mb-2">
                        {customSec.items.map((item: any) => (
                          <li key={item.id} className="text-[9.5pt] mb-1.5 flex items-start gap-2">
                            <span className="font-bold">•</span>
                            <span>
                              {item.title && <span className="font-bold">{item.title}</span>}
                              {item.description && `: ${item.description}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </React.Fragment>
                  );
                }
              }

              return null;
            })}
        </div>
      </div>
    </div>
  );
};
