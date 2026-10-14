/**
 * Static marketing content for the public site.
 *
 * All figures are illustrative demo values — this deployment has no backend,
 * so nothing here is derived from live data. Financial copy must always stay
 * paired with a demo disclosure.
 */
import {
  Bike,
  Building2,
  Clock3,
  FileSignature,
  Headphones,
  MapPin,
  Package,
  ReceiptIndianRupee,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";

/** Illustrative count shown in the "live right now" copy. */
export const LIVE_DELIVERY_COUNT = 37;

export const MARKETING_STATS = [
  { label: "Deliveries completed", value: "128k+", hint: "Since launch" },
  { label: "Average pickup time", value: "24 min", hint: "Metro areas" },
  { label: "Verified couriers", value: "1,240", hint: "Across 25 districts" },
  { label: "Customer rating", value: "4.8/5", hint: "12k+ reviews" },
] as const;

export const MARKETING_SERVICES = [
  {
    icon: Package,
    slug: "parcel",
    title: "Parcel delivery",
    tagline: "Documents, parcels and gifts, door to door.",
    description:
      "The everyday option: choose a pickup window, add package details and let a verified courier handle the rest. Every parcel is tracked from pickup to proof of delivery.",
    price: "$4.99",
    priceNote: "starting",
    eta: "From 45 min",
    popular: true,
    includes: [
      "Live GPS tracking",
      "Pickup and dropoff photos",
      "Proof of delivery record",
      "Optional insurance",
    ],
    bestFor: "Personal parcels, gifts and documents",
  },
  {
    icon: Bike,
    slug: "on-demand",
    title: "On-demand errands",
    tagline: "A rider for small, urgent tasks.",
    description:
      "Queue at the bank, pick up groceries or collect a pharmacy order. Same-day riders are assigned to the nearest available courier and head straight to you.",
    price: "$3.49",
    priceNote: "starting",
    eta: "From 30 min",
    popular: false,
    includes: [
      "30-minute average pickup",
      "Small and medium errand sizes",
      "Live ETA updates",
      "Contactless handover",
    ],
    bestFor: "Urgent errands around town",
  },
  {
    icon: Truck,
    slug: "same-day",
    title: "Same-day express",
    tagline: "Priority routing for time-critical items.",
    description:
      "For items that cannot wait: priority dispatch, a narrower pickup window and a courier whose first job is yours. Includes expedited handling at both ends.",
    price: "$8.99",
    priceNote: "starting",
    eta: "From 90 min",
    popular: false,
    includes: [
      "Priority courier assignment",
      "90-minute express window",
      "Expedited pickup and dropoff",
      "Priority support line",
    ],
    bestFor: "Contracts, samples and forgotten items",
  },
  {
    icon: Building2,
    slug: "business",
    title: "Business & bulk",
    tagline: "Scheduled routes for teams.",
    description:
      "Recurring collections and deliveries with monthly invoicing, team seats, analytics and a dedicated account contact — priced per route or per parcel.",
    price: "Custom",
    priceNote: "monthly",
    eta: "Daily or weekly",
    popular: false,
    includes: [
      "Scheduled and recurring routes",
      "Multiple team members",
      "Monthly invoicing",
      "Analytics and export",
    ],
    bestFor: "Retail, e-commerce and workshop teams",
  },
] as const;

export const MARKETING_STEPS = [
  {
    icon: MapPin,
    title: "Add your addresses",
    description:
      "Save a pickup address and a dropoff address, then describe the parcel: size, weight and anything the courier should know.",
  },
  {
    icon: ReceiptIndianRupee,
    title: "Compare and confirm",
    description:
      "See available couriers, the exact quote and delivery window. Apply a promo code or demo wallet balance before confirming.",
  },
  {
    icon: Clock3,
    title: "Courier dispatched",
    description:
      "A verified courier accepts the job, travels to your pickup address and captures a pickup photo to start the trail.",
  },
  {
    icon: FileSignature,
    title: "Track to the door",
    description:
      "Follow live location and status updates, then receive a digital proof of delivery with a signature or photo.",
  },
] as const;

export const MARKETING_FEATURES = [
  {
    icon: MapPin,
    title: "Live GPS tracking",
    description:
      "Watch your courier move on the map with status updates pushed in real time — no phone calls needed.",
  },
  {
    icon: Wallet,
    title: "Flexible payments",
    description:
      "Pay with a simulated card, mobile wallet, cash on delivery or spend your demo wallet balance.",
  },
  {
    icon: ShieldCheck,
    title: "Verified couriers",
    description:
      "Identity-checked riders with ratings, in-app contact and proof of pickup and delivery photos.",
  },
  {
    icon: Headphones,
    title: "Human support",
    description:
      "Reach the support team any time through the help centre, live chat or a tracked support ticket.",
  },
] as const;

export const MARKETING_BENEFITS = [
  {
    icon: Clock3,
    title: "Minutes, not days",
    description:
      "Bookings are matched to the nearest available courier, so most parcels are collected within half an hour.",
  },
  {
    icon: ShieldCheck,
    title: "Accountability built in",
    description:
      "Every handoff is recorded with timestamps, photos and a named courier you can contact directly.",
  },
  {
    icon: ReceiptIndianRupee,
    title: "One fixed price",
    description:
      "The quote you confirm includes distance, service level and extras. Nothing is added at dropoff.",
  },
  {
    icon: FileSignature,
    title: "Paperwork ready",
    description:
      "Downloadable receipts and delivery records keep finance and operations teams happy.",
  },
  {
    icon: MapPin,
    title: "Coverage where you need it",
    description:
      "Dense metro coverage in the city core with scheduled routes for the outer districts.",
  },
  {
    icon: Truck,
    title: "Room for larger items",
    description:
      "From envelopes to multi-box shipments, package size drives the vehicle class assigned to the job.",
  },
] as const;

export const MARKETING_TESTIMONIALS = [
  {
    quote:
      "I send documents across the city every week and the live map removes all the guesswork. Quotes are instant and the final price never changes.",
    name: "Amaya Perera",
    role: "Operations lead, Nivara Retail",
    rating: 5,
  },
  {
    quote:
      "The proof-of-delivery photos settled a dispute with a supplier in a day. Support replied within minutes on both occasions.",
    name: "Daniel Fernando",
    role: "E-commerce manager",
    rating: 5,
  },
  {
    quote:
      "Bulk bookings used to take an afternoon of spreadsheets. Now the business dashboard and scheduled routes do it for us.",
    name: "Shanika Wijesinghe",
    role: "Founder, Craftline Studio",
    rating: 4,
  },
] as const;

export const MARKETING_FAQS: readonly { question: string; answer: string; category: string }[] = [
  {
    category: "Booking",
    question: "How fast can a courier be dispatched?",
    answer:
      "Most bookings in metro areas are accepted within 30 minutes. Express and same-day options show a narrower pickup window and a courier is assigned as soon as you confirm.",
  },
  {
    category: "Booking",
    question: "Do I need an account to send a parcel?",
    answer:
      "You need an account to place and manage deliveries so you always have an order history and receipts. You can still follow any delivery publicly with just its order ID, which is handy for recipients.",
  },
  {
    category: "Pricing",
    question: "How are prices calculated?",
    answer:
      "Your quote is built from the service level, distance, package size and optional extras such as insurance or a scheduled window. The price you confirm is the price you pay — no surge surprises at dropoff.",
  },
  {
    category: "Pricing",
    question: "Are the payments real?",
    answer:
      "No. This is a demo platform: card, wallet and mobile payments are simulated and no real money ever moves. Every receipt is clearly marked as a demo transaction.",
  },
  {
    category: "Tracking",
    question: "Can I track without an account?",
    answer:
      "Yes. Public tracking works with your order ID alone, so recipients and colleagues can follow a delivery without signing in. Signing in additionally shows the full order history and invoices.",
  },
  {
    category: "Tracking",
    question: "How accurate is the live location?",
    answer:
      "Couriers share location while a delivery is active, typically updating every few seconds. The trail is stored with timestamps so you can review the whole route afterwards.",
  },
  {
    category: "Deliveries",
    question: "What can I send?",
    answer:
      "Most everyday items are fine: parcels, documents, groceries, gifts and pharmacy runs. Prohibited items include hazardous materials, perishables without insulation, cash and counterfeit goods.",
  },
  {
    category: "Deliveries",
    question: "What if something is damaged or missing?",
    answer:
      "Report the issue from the order screen or the support centre. Photos captured at pickup and dropoff are attached to the record so claims can be reviewed quickly.",
  },
  {
    category: "Couriers",
    question: "How are couriers verified?",
    answer:
      "Every courier completes identity verification, a background check and a vehicle inspection before taking deliveries, and each job is rated by the sender afterwards.",
  },
  {
    category: "Couriers",
    question: "Can I contact my courier?",
    answer:
      "Yes — the order screen has an in-app call and chat action, and your courier sees the same notes you added at booking.",
  },
  {
    category: "Business",
    question: "Do you support scheduled and recurring deliveries?",
    answer:
      "Business plans include scheduled windows, recurring routes, multiple team members, monthly invoicing and analytics exports. Contact the business team to set up a plan.",
  },
  {
    category: "Business",
    question: "Is there an API?",
    answer:
      "An API and webhooks are planned for the next release. Business accounts on the demo deployment use the dashboard and CSV exports in the meantime.",
  },
];

export const BUSINESS_BENEFITS = [
  {
    title: "Scheduled routes",
    description:
      "Set recurring pickup and delivery windows once and let operations run on autopilot.",
  },
  {
    title: "Team seats",
    description: "Invite colleagues, share the address book and keep a single delivery history.",
  },
  {
    title: "Monthly invoicing",
    description: "Consolidated statements with cost centres and CSV exports for your finance team.",
  },
  {
    title: "Analytics",
    description: "Volume, spend, failure and turnaround trends across every delivery your team makes.",
  },
  {
    title: "Priority support",
    description: "A dedicated contact who knows your account and your regular routes.",
  },
  {
    title: "API and webhooks",
    description: "Planned for the next release — join the business waitlist for early access.",
  },
] as const;
