export const QR_TYPES = [
  { value: "url", label: "Website URL", icon: "Link2", group: "Basic" },
  { value: "text", label: "Plain Text", icon: "Type", group: "Basic" },
  { value: "email", label: "Email", icon: "Mail", group: "Basic" },
  { value: "sms", label: "SMS", icon: "MessageSquare", group: "Basic" },
  { value: "phone", label: "Phone Call", icon: "Phone", group: "Basic" },
  { value: "whatsapp", label: "WhatsApp", icon: "MessageCircle", group: "Basic" },
  { value: "wifi", label: "Wi-Fi", icon: "Wifi", group: "Basic" },
  { value: "vcard", label: "vCard / Business Card", icon: "IdCard", group: "Business" },
  { value: "location", label: "Location (GPS)", icon: "MapPin", group: "Location" },
  { value: "google_maps", label: "Google Maps Link", icon: "Map", group: "Location" },
  { value: "google_review", label: "Google Review", icon: "Star", group: "Business" },
  { value: "pdf", label: "PDF", icon: "FileText", group: "Media" },
  { value: "image", label: "Image", icon: "Image", group: "Media" },
  { value: "video", label: "Video", icon: "Video", group: "Media" },
  { value: "audio", label: "Audio", icon: "Music", group: "Media" },
  { value: "app_store", label: "App Store", icon: "AppWindow", group: "Media" },
  { value: "play_store", label: "Play Store", icon: "AppWindow", group: "Media" },
  { value: "youtube", label: "YouTube", icon: "Youtube", group: "Social" },
  { value: "facebook", label: "Facebook", icon: "Facebook", group: "Social" },
  { value: "instagram", label: "Instagram", icon: "Instagram", group: "Social" },
  { value: "linkedin", label: "LinkedIn", icon: "Linkedin", group: "Social" },
  { value: "twitter", label: "Twitter / X", icon: "Twitter", group: "Social" },
  { value: "telegram", label: "Telegram", icon: "Send", group: "Social" },
  { value: "menu", label: "Restaurant Menu", icon: "UtensilsCrossed", group: "Business" },
  { value: "coupon", label: "Coupon", icon: "Ticket", group: "Business" },
  { value: "feedback", label: "Feedback Form", icon: "MessageSquareText", group: "Business" },
  { value: "multi_link", label: "Multi-Link Page", icon: "LinkIcon", group: "Business" },
  { value: "crypto", label: "Crypto Wallet", icon: "Bitcoin", group: "Advanced" },
];

export const PATTERNS = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "circle", label: "Circle" },
  { value: "gapped", label: "Gapped" },
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
];

export const GRADIENTS = [
  { value: "none", label: "Solid" },
  { value: "linear", label: "Linear (Vertical)" },
  { value: "horizontal", label: "Linear (Horizontal)" },
  { value: "radial", label: "Radial" },
  { value: "square", label: "Square Gradient" },
];

export const PRESETS = [
  { name: "Signal", fg_color: "#FF3B30", bg_color: "#FFFFFF", gradient: "none", pattern: "rounded" },
  { name: "Onyx", fg_color: "#0A0A0A", bg_color: "#FFFFFF", gradient: "none", pattern: "square" },
  { name: "Sunset", fg_color: "#FF3B30", fg_color_end: "#FF9E30", gradient: "radial", bg_color: "#FFFFFF", pattern: "dots" },
  { name: "Ocean", fg_color: "#0037A6", fg_color_end: "#00A6FF", gradient: "linear", bg_color: "#FFFFFF", pattern: "rounded" },
  { name: "Forest", fg_color: "#1A5F3F", fg_color_end: "#3FBF7F", gradient: "horizontal", bg_color: "#FFFFFF", pattern: "circle" },
  { name: "Neon Void", fg_color: "#FF3B30", bg_color: "#050505", gradient: "none", pattern: "gapped" },
];
