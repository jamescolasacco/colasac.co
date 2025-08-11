export type Project = {
  title: string;
  blurb: string;
  href?: string;
  tags?: string[];
};

export const projects: Project[] = [
  {
    title: "scatter sync — stealth radio protocol",
    blurb: "custom fhss digital voice experiments using teensy + si446x",
    href: "https://github.com/yourname/scattersync",
    tags: ["radio", "embedded", "dsp"],
  },
  {
    title: "msg‑rt: response time analytics",
    blurb: "time-based conversation segmentation + metrics pipeline",
    tags: ["python", "nlp", "metrics"],
  },
];