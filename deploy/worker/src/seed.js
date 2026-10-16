// Curated starter list (checked 16 Oct 2026). p = rough monthly pay in ₹ thousand, used only for sorting.
const TJC = "https://thejobcompany.co.in/frontend/job_details.php?job_id=";
const OC = "https://offcampusjobs4u.com/";
const FO = "https://www.fresheroffcampus.com/";
const IS = "https://internshala.com/";

export default [
  { id: "sf-amts", co: "Salesforce", role: "Software Engineering AMTS (2027 batch, CGPA 7.0+, no backlogs)", cities: ["Bangalore", "Hyderabad"], pay: "Not stated", p: 0, type: "big", deadline: "2026-10-17", url: "https://salesforce.wd12.myworkdayjobs.com/en-US/External_Career_Site/job/India---Hyderabad/Software-Engineering-AMTS_JR356580?q=Amts&source=LinkedIn_Jobs" },
  { id: "rubrik", co: "Rubrik", role: "Software Engineer (CPD), Winter Intern", cities: ["Bangalore"], pay: "₹1.5–1.8L / month (exp.)", p: 180, type: "big", url: TJC + "6450" },
  { id: "ea-fs", co: "EA", role: "AI Full Stack Intern", cities: ["Hyderabad"], pay: "~₹50k / month (exp.)", p: 50, type: "big", url: OC + "ea-internship-2026-ai-full-stack-intern-hyderabad/" },
  { id: "ea-swe", co: "EA", role: "Software Engineer Intern", cities: ["Hyderabad"], pay: "~₹50k / month (exp.)", p: 50, type: "big", url: TJC + "6460" },
  { id: "honeywell", co: "Honeywell", role: "AI Engineering Intern", cities: ["Hyderabad"], pay: "₹50–60k / month (exp.)", p: 60, type: "big", url: TJC + "6505" },
  { id: "ibm", co: "IBM", role: "Associate Engineer Intern (2027)", cities: ["Bangalore"], pay: "6–7 LPA (exp.)", p: 58, type: "big", url: OC + "ibm-internship-2026-associate-engineer/" },
  { id: "pwc", co: "PwC", role: "Business AI Engineer Intern", cities: ["Bangalore", "Hyderabad"], pay: "5–7 LPA (exp.)", p: 58, type: "big", url: OC + "pwc-business-ai-engineer-internship-2027/" },
  { id: "hackerrank", co: "HackerRank", role: "SDE Intern", cities: ["Bangalore"], pay: "₹40k / month (exp.)", p: 40, type: "big", url: TJC + "6497" },
  { id: "kaleris", co: "Kaleris", role: "Associate Software Engineer Intern", cities: ["Chennai"], pay: "₹40k / month (exp.)", p: 40, type: "big", url: TJC + "6444" },
  { id: "harman", co: "Harman", role: "Trainee Intern", cities: ["Bangalore"], pay: "₹40k / month (exp.)", p: 40, type: "big", url: OC + "harman-internship-2026-trainee-intern-bangalore/" },
  { id: "amazon-int", co: "Amazon", role: "SDE Intern", cities: ["Multiple"], pay: "Not shown", p: 0, type: "big", url: FO + "amazon-off-campus-hiring-fresher-4/" },
  { id: "amazon-ft", co: "Amazon", role: "Software Development Engineer", cities: ["Chennai"], pay: "Not shown", p: 0, type: "big", url: FO + "amazon-off-campus/" },
  { id: "google", co: "Google", role: "Application Engineering Intern, Summer 2027 (Winter 2027 also open)", cities: ["Bangalore"], pay: "Not shown", p: 0, type: "big", url: OC + "google-internship-2026-application-engineering-intern/" },
  { id: "walmart", co: "Walmart", role: "Grand Intern", cities: ["Bangalore"], pay: "Not shown", p: 0, type: "big", url: FO + "walmart-off-campus/" },
  { id: "deloitte", co: "Deloitte", role: "SDET / Consultant", cities: ["Bangalore", "Hyderabad"], pay: "Not shown", p: 0, type: "big", url: FO + "deloitte-off-campus-3/" },
  { id: "cisco", co: "Cisco", role: "Associate Solutions Engineer", cities: ["Bangalore"], pay: "Not shown", p: 0, type: "big", url: FO + "cisco-off-campus-hiring-fresher/" },
  { id: "target", co: "Target", role: "Apprentice, Technology", cities: ["Bangalore"], pay: "Not shown", p: 0, type: "big", url: FO + "target-off-campus-2/" },
  { id: "hp", co: "HP", role: "College Intern, Technical", cities: ["Bangalore", "Chennai", "Delhi NCR"], pay: "Not shown", p: 0, type: "big", url: OC + "hp-internship-2026-college-intern-technical/" },
  { id: "smarsh", co: "Smarsh", role: "Software Engineer Intern (Java & AI)", cities: ["Bangalore"], pay: "Not shown", p: 0, type: "big", url: OC + "smarsh-software-engineer-intern-bangalore/" },
  { id: "enterpret", co: "Enterpret", role: "Software Engineer Intern", cities: ["Bangalore"], pay: "Not shown", p: 0, type: "startup", url: OC + "enterpret-recruitment-2026-software-engineer-intern-bengaluru/" },
  { id: "evolute", co: "Evolute", role: "Software Development Intern", cities: ["Bangalore"], pay: "Not shown", p: 0, type: "big", url: OC + "evolute-recruitment-2026-intern-software-development/" },
  { id: "siemens", co: "Siemens Gamesa", role: "Software Development & Testing Intern", cities: ["Bangalore"], pay: "Not shown", p: 0, type: "big", url: OC + "siemens-gamesa-recruitment-2026-software-development-testing-intern/" },

  { id: "routemobile", co: "Route Mobile", role: "Forward Deployed Software Engineer", cities: ["Multiple"], pay: "₹30–70k / month", note: "Job offer up to 20 LPA after the internship", p: 70, type: "startup", url: IS + "internship/detail/forward-deployed-software-engineer-internship-in-multiple-locations-at-route-mobile-limited1791288694" },
  { id: "primenumbers", co: "Primenumbers", role: "Data Engineering Intern", cities: ["Bangalore"], pay: "₹50k / month", note: "Job offer from 22 LPA after the internship", p: 50, type: "startup", url: IS + "internship/detail/data-engineering-internship-in-bangalore-at-primenumbers-technologies1791894510" },
  { id: "cleartax", co: "ClearTax", role: "Integration Engineer Intern", cities: ["Bangalore"], pay: "₹30k / month", note: "Job offer up to 8 LPA after the internship", p: 30, type: "startup", url: IS + "internship/detail/integration-engineer-internship-in-bangalore-at-cleartax1791871736" },
  { id: "creativesquad", co: "Creative Squad", role: "Full Stack Development Intern", cities: ["Multiple"], pay: "₹20–25k / month", note: "Job offer up to 6 LPA after the internship", p: 25, type: "startup", url: IS + "internship/detail/full-stack-development-internship-in-multiple-locations-at-creative-squad-private-limited1791262847" },
  { id: "sharepal", co: "SharePal", role: "Software Engineer (full-time)", cities: ["Bangalore"], pay: "4–6 LPA", p: 50, type: "startup", url: IS + "job/detail/fresher-software-engineer-job-in-bangalore-at-sharepal1791188157" },
  { id: "euphotic", co: "Euphotic Labs", role: "Full Stack Development Intern", cities: ["Bangalore"], pay: "₹18–22k / month", p: 22, type: "startup", url: IS + "internship/detail/full-stack-development-internship-in-bangalore-at-euphotic-labs-private-limited1790420869" },
  { id: "deepthought", co: "DeepThought", role: "Full Stack Development Intern", cities: ["Hyderabad"], pay: "₹15k / month", note: "Job offer up to 8 LPA after the internship", p: 15, type: "startup", url: IS + "internship/detail/full-stack-development-internship-in-multiple-locations-at-deepthought-culturetech-ventures-private-limited1790386769" },

  { id: "astrorize", co: "Astrorize", role: "Software Development, Full Stack & Mobile", cities: ["Bangalore"], pay: "₹18–20k / month", p: 20, type: "mobile", url: IS + "internship/detail/software-development--full-stack-mobile-internship-in-bangalore-at-astrorize1791196156" },
  { id: "raptee", co: "Raptee Energy", role: "Flutter Developer Intern", cities: ["Chennai"], pay: "₹15k / month", p: 15, type: "mobile", url: OC + "raptee-energy-recruitment-2026-flutter-developer-intern-chennai/" },
  { id: "passdown", co: "Pass Down (UnClaimedX)", role: "Flutter Developer Intern", cities: ["Bangalore"], pay: "₹12k / month", note: "Full-time offer possible", p: 12, type: "mobile", url: "https://jobfound.org/job/pass-down-unclaimedx-is-hiring-for-flutter-developer-intern-bengaluru-karnataka-india-india-13-october-2026" },
  { id: "attento", co: "Attento Technologies", role: "Flutter Developer (6 months)", cities: ["Pune"], pay: "₹10–12k / month", p: 12, type: "mobile", url: IS + "internships/flutter-development-internship/" }
];
