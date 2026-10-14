/** Help-centre content that is not part of the general marketing FAQ. */

export const FAQS = [
  {
    category: "Getting started",
    question: "Do I need an account to send a parcel?",
    answer:
      "Yes. An account keeps your order history, receipts and addresses in one place. Recipients can still follow a delivery publicly with the order ID.",
  },
  {
    category: "Getting started",
    question: "What do I need before booking?",
    answer:
      "A pickup address, a dropoff address, a description of the parcel (size, weight and type) and a way to pay. Saving addresses in advance makes repeat bookings much faster.",
  },
  {
    category: "Getting started",
    question: "How do I find my order ID?",
    answer:
      "Order IDs look like GRX123456 and appear in your confirmation message, on your demo receipt and at the top of the order screen after signing in.",
  },
] as const;

export const TROUBLESHOOTING_STEPS = [
  "Confirm the order status on the order screen — the timeline shows every status change with a timestamp.",
  "Refresh tracking; the courier's position is shared while a delivery is active.",
  "Check whether a delay flag or failed pickup attempt is shown, and what the new ETA is.",
  "Contact support with the order ID if the delivery is outside the promised window.",
] as const;
