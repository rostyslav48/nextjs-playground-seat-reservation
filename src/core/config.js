export default {
  "title": "Workshop Seat Reservation",
  "framework": "Next.js",
  "kind": "reservation",
  "capacity": 12,
  "adminOnly": false,
  "eyebrow": "SMALL GROUP WORKSHOP",
  "headline": "Learn by making.",
  "description": "Reserve one of twelve seats at a practical workshop. One reservation per email address.",
  "details": [
    ["When", "October 24, 2026 · 10:00 UTC"],
    ["Where", "The Workshop · Room B"],
    ["Includes", "Materials, exercises, and a take-home project"]
  ],
  "button": "Reserve a seat",
  "formNote": "Your details are used only to handle this request.",
  "fields": [
    {
      "name": "name",
      "label": "Your name",
      "type": "text"
    },
    {
      "name": "email",
      "label": "Email address",
      "type": "email"
    }
  ],
  "success": "Your workshop seat is reserved."
};
