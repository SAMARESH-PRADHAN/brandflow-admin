// frontend/src/lib/catalog-taxonomy.ts
// Mirrors src/data/catalog.ts category/subcategory names exactly.
// Keep in sync manually, or better: move catalog.ts to a shared package later.

export type Tier = "Regular" | "Premium";

export type TaxCategory = {
  name: string;
  hasTiers: boolean;
  regular?: string[];
  premium?: string[];
  items?: string[]; // used when hasTiers = false
};
// Exact B2B subName values the storefront filters against (src/data/catalog.ts → B2B_SUBCATEGORIES)
export const B2B_SUBCATEGORY_NAMES = [
  "Oversized T-Shirt",
  "Dry Fit Collar Neck T-Shirt",
  "American Fleece Hoodies",
  "Solid Collar Neck T-Shirt",
  "Dry Fit Solid Collar Neck T-Shirt",
  "Round Neck T-Shirt",
] as const;
export const CATALOG_TAXONOMY: TaxCategory[] = [
  {
    name: "Oversized T-Shirts",
    hasTiers: true,
    regular: ["Polycotton Oversized T-Shirts"],
    premium: ["Cotton Oversized T-Shirts", "Terry / Loopnet Oversized T-Shirts"],
  },
  {
    name: "Hoodies",
    hasTiers: true,
    regular: ["Spun Fleece Hoodies"],
    premium: ["Polycotton Hoodies", "American Fleece Hoodies", "Cotton Hoodies"],
  },
  {
    name: "Jersey",
    hasTiers: true,
    regular: ["All Over Printed Jersey", "Front Printed Jersey", "Front & Back Printed Jersey"],
    premium: ["All Over Printed Jersey", "Front Printed Jersey", "Front & Back Printed Jersey"],
  },
  {
    name: "Custom Premium Polo T-Shirt",
    hasTiers: true,
    regular: [
      "Spun Matty 240 GSM", "Spun Matty 220 GSM", "Dotnet Polyester 180 GSM",
      "Dotnet Polyester 160 GSM", "Dotnet Polyester 120 GSM",
      "Nirmal Net Polyester 120 GSM", "Kohili Net Polyester 120 GSM",
    ],
    premium: [
      "240 GSM Cotton Polo T-Shirts", "240 GSM Polycotton Polo T-Shirts", "240 GSM CP Polo T-Shirts",
      "240 GSM Spun Polo T-Shirts (Polyester)", "240 GSM Honeycomb Polo T-Shirts (Polyester)",
      "180 GSM SAP Matty Polo T-Shirts (Premium Polyester)", "180 GSM Dotnet Polo T-Shirts (Polyester)",
      "170 GSM Nirmal Net Polo T-Shirts (Polyester)",
    ],
  },
  {
    name: "Corporate Wear",
    hasTiers: true,
    regular: [
      "Spun Collar Neck T-Shirts", "Cut & Sew Collar Neck T-Shirts", "Corporate Economy Collar Neck T-Shirts",
      "Construction Grey Collar Neck T-Shirts", "Marketing Collar Neck T-Shirts", "Petrol Pump Collar Neck T-Shirts",
      "Conference Collar Neck T-Shirts", "Gym Collar Neck T-Shirts", "Hotel Collar Neck T-Shirts",
      "NGO Collar Neck T-Shirts", "Dotnet Yoga White Collar Neck T-Shirts", "Festival Group Collar Neck T-Shirts",
      "Ranglan Collar Neck T-Shirts", "220 GSM Spun Matty Reflective Collar Neck T-shirts",
    ],
    premium: [
      "Cotton Conference Collar Neck T-Shirts", "Logistic Collar Neck T-Shirts", "Drifit SAP Matty Collar Neck T-Shirts",
      "College Team Collar Neck T-Shirts", "IT Team Collar Neck T-Shirts", "Reunion Collar Neck T-Shirts",
      "Architech Collar Neck T-Shirts", "Youth Group Red Collar Neck T-Shirts", "Alumini Group Collar Neck T-Shirts",
      "Trade House Collar Neck T-Shirts", "SAP Matty White Collar Neck T-Shirts", "Cut & Sew Chain Collar Neck T-Shirts",
      "Festival Group Collar Neck T-Shirts", "SAP Matty Ranglan Collar Neck T-Shirts", "240 GSM PC Matty Reflective Collar Neck T-shirts",
    ],
  },
  {
    name: "Custom Round Neck T-Shirts",
    hasTiers: true,
    regular: [
      "Spun Round Neck T-Shirts", "Corporate Polyester Round Neck T-Shirts (160 GSM)",
      "Dotnet White Round Neck T-Shirts (120 GSM)", "Corporate Polyster Round Neck T-Shirts (120 GSM)",
    ],
    premium: [
      "Cotton Round Neck T-Shirts", "Polycotton Round Neck T-Shirts",
      "Corporate SAP Matty Round Neck T-Shirts", "SAP Matty White Round Neck T-Shirts",
      "Cotton Gym Round Neck T-Shirts",
    ],
  },
  {
    name: "Aprons",
    hasTiers: true,
    regular: ["University Apron", "Nurse Apron", "Medical Apron"],
    premium: ["University Apron", "Nurse Apron", "Medical Apron"],
  },
  {
    name: "Customize School Uniform",
    hasTiers: false,
    items: [
      "Spun Matty 220 GSM", "PC Matty 220 GSM",
      "Track Pant Super Poly Polyester", "Track Pant Cotton PC Loop Knit", "House T-shirts Spun Matty 220 GSM", "House T-shirts PC Matty 220 GSM",
      "Hoodies Spun Fleece 300 GSM", "Hoodies PC Fleece 300 GSM"
    ],
  },
  {
    name: "Custom Accessories",
    hasTiers: false,
    items: [
      "Canvas Tote", "Mug", "Safety Goggle", "Cap", "Premium Backpack",
      "Umbrella", "Pen", "Badge", "Event Lanyard", "Bottle",
    ],
  },
  {
    name: "Corporate Welcome Kit",
    hasTiers: false,
    items: ["Classic Welcome Kit"],
  },
  {
    name: "ARRHENIUX T-Shirts",
    hasTiers: false,
    items: [
      "ARRHENIUX Cotton Round Neck T-Shirts", "ARRHENIUX Cotton Collar Neck T-Shirts",
      "ARRHENIUX Blend Collar Neck T-Shirts", "ARRHENIUX Drifit Collar Neck T-Shirts",
      "ARRHENIUX Allover Oversized T-Shirts", "ARRHENIUX Allover Hoodie", "ARRHENIUX Allover Drift Polo T-Shirts",
    ],
  },
];

export const CATEGORY_NAMES = CATALOG_TAXONOMY.map((c) => c.name);

export function findTaxCategory(name: string) {
  return CATALOG_TAXONOMY.find((c) => c.name === name);
}

/** Sub-category options for a given category + tier ("Regular"/"Premium"/undefined). */
export function getSubOptions(categoryName: string, tier?: Tier): string[] {
  const cat = findTaxCategory(categoryName);
  if (!cat) return [];
  if (!cat.hasTiers) return cat.items ?? [];
  return (tier === "Premium" ? cat.premium : cat.regular) ?? [];
}