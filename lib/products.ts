// This would normally be fetched from a database
export const products = [
  {
    id: "advanced-react-components",
    title: "Advanced React Component Library",
    description: "50+ custom React components with TypeScript support and comprehensive documentation",
    longDescription:
      "This premium React component library includes 50+ fully customizable components built with TypeScript, styled with Tailwind CSS, and designed for maximum flexibility. Each component comes with comprehensive documentation, usage examples, and accessibility features built-in. Perfect for developers looking to speed up their workflow without sacrificing quality or customization options.",
    price: 79.99,
    bid: null, // Fixed price product
    category: "Code",
    seller: {
      id: "dev123",
      name: "DevMaster",
      handle: "@devmaster",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
      joinDate: "May 2021",
      sales: 87,
      rating: 4.8,
    },
    stats: {
      sales: 24,
      lastSold: "2 days ago",
    },
  },
  {
    id: "cyberpunk-icon-set",
    title: "Cyberpunk Icon Set",
    description: "A collection of 200+ cyberpunk-themed icons for your digital projects",
    longDescription:
      "Immerse your projects in the neon-lit world of cyberpunk with this extensive icon collection. Each icon is meticulously crafted with attention to detail, available in multiple formats including SVG, PNG, and AI. Perfect for websites, apps, or any digital creation that needs that futuristic cyberpunk aesthetic.",
    price: 29.99,
    bid: null, // Fixed price product
    category: "Design",
    seller: {
      id: "design101",
      name: "NeonDesigner",
      handle: "@neondesigner",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
      joinDate: "January 2022",
      sales: 156,
      rating: 4.9,
    },
    stats: {
      sales: 87,
      lastSold: "5 hours ago",
    },
  },
  {
    id: "digital-marketing-playbook",
    title: "Digital Marketing Playbook",
    description: "Strategic guide to modern digital marketing tactics",
    longDescription:
      "A comprehensive guide to digital marketing in today's fast-paced online environment. This playbook covers everything from SEO and content marketing to social media strategy and paid advertising. Includes case studies, templates, and actionable worksheets to implement strategies immediately.",
    price: 34.99,
    bid: 38.5, // Auction product
    startingBid: 34.99,
    currentBid: 38.5,
    category: "eBooks",
    seller: {
      id: "marketing123",
      name: "MarketingPro",
      handle: "@marketingpro",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
      joinDate: "March 2021",
      sales: 215,
      rating: 4.7,
    },
    stats: {
      sales: 215,
      lastSold: "1 day ago",
    },
    auctionLog: [
      { username: "@user8821", amount: 38.5, timestamp: "2 mins ago", isLeading: true },
      { username: "@geniusID", amount: 36.0, timestamp: "1 hour ago" },
      { username: "@handleX", amount: 35.0, timestamp: "2 hours ago" },
      { username: "@digital99", amount: 34.99, timestamp: "3 hours ago" },
    ],
  },
  {
    id: "ux-design-principles",
    title: "UX Design Principles",
    description: "In-depth guide to modern user experience design",
    longDescription:
      "Master the art and science of user experience design with this comprehensive guide. Learn how to create intuitive, engaging, and accessible digital experiences that users love. Covers research methods, wireframing, prototyping, usability testing, and implementing feedback loops.",
    price: 39.99,
    bid: 42.0, // Auction product
    startingBid: 39.99,
    currentBid: 42.0,
    category: "eBooks",
    seller: {
      id: "ux456",
      name: "UXMaster",
      handle: "@uxmaster",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
      joinDate: "August 2020",
      sales: 178,
      rating: 4.9,
    },
    stats: {
      sales: 178,
      lastSold: "3 days ago",
    },
    auctionLog: [
      { username: "@design_pro", amount: 42.0, timestamp: "30 mins ago", isLeading: true },
      { username: "@ux_lover", amount: 41.5, timestamp: "45 mins ago" },
      { username: "@webdev22", amount: 40.75, timestamp: "1 hour ago" },
      { username: "@creative_mind", amount: 40.0, timestamp: "2 hours ago" },
    ],
  },
  {
    id: "financial-freedom-blueprint",
    title: "Financial Freedom Blueprint",
    description: "Step-by-step guide to personal finance and investing",
    longDescription:
      "Take control of your financial future with this practical guide to personal finance and investing. Learn how to budget effectively, eliminate debt, build emergency savings, and create passive income streams. Includes investment strategies for beginners and advanced investors alike.",
    price: 24.99,
    bid: null, // Fixed price product
    category: "eBooks",
    seller: {
      id: "finance789",
      name: "WealthAdvisor",
      handle: "@wealthadvisor",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
      joinDate: "February 2021",
      sales: 342,
      rating: 4.8,
    },
    stats: {
      sales: 342,
      lastSold: "12 hours ago",
    },
  },
  {
    id: "blockchain-fundamentals",
    title: "Blockchain Fundamentals",
    description: "Technical introduction to blockchain technology",
    longDescription:
      "Demystify blockchain technology with this technical yet accessible guide. Understand the core concepts behind distributed ledgers, consensus mechanisms, smart contracts, and cryptocurrencies. Includes practical examples and code snippets to help you start building on blockchain platforms.",
    price: 49.99,
    bid: 55.0, // Auction product
    startingBid: 49.99,
    currentBid: 55.0,
    category: "eBooks",
    seller: {
      id: "blockchain101",
      name: "BlockchainDev",
      handle: "@blockchaindev",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: false,
      joinDate: "April 2022",
      sales: 89,
      rating: 4.6,
    },
    stats: {
      sales: 89,
      lastSold: "2 days ago",
    },
    auctionLog: [
      { username: "@crypto_whale", amount: 55.0, timestamp: "15 mins ago", isLeading: true },
      { username: "@blockchain_fan", amount: 53.25, timestamp: "1 hour ago" },
      { username: "@eth_trader", amount: 52.0, timestamp: "3 hours ago" },
      { username: "@btc_hodler", amount: 50.5, timestamp: "5 hours ago" },
    ],
  },
  {
    id: "ai-prompt-engineering",
    title: "AI Prompt Engineering Mastery",
    description: "Learn to craft effective prompts for AI models like GPT-4 and DALL-E",
    longDescription:
      "Unlock the full potential of AI models through expert prompt engineering. This comprehensive guide teaches you how to craft precise, effective prompts that generate exactly the outputs you need. Covers techniques for text generation, image creation, code assistance, and more across various AI platforms.",
    price: 59.99,
    bid: null, // Fixed price product
    category: "AI",
    seller: {
      id: "ai_expert",
      name: "AIPromptGuru",
      handle: "@aipromptguru",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
      joinDate: "January 2023",
      sales: 127,
      rating: 4.9,
    },
    stats: {
      sales: 127,
      lastSold: "1 hour ago",
    },
  },
  {
    id: "3d-character-models-bundle",
    title: "3D Character Models Bundle",
    description: "Collection of 15 high-quality rigged 3D character models for games and animation",
    longDescription:
      "Elevate your games and animations with this premium collection of 15 fully rigged 3D character models. Each character features high-resolution textures, optimized topology, and complete rigging for immediate use in your projects. Compatible with major 3D software including Blender, Maya, and Unity.",
    price: 89.99,
    bid: 95.0, // Auction product
    startingBid: 89.99,
    currentBid: 95.0,
    category: "3D Models",
    seller: {
      id: "3d_artist",
      name: "PolyMaster",
      handle: "@polymaster",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
      joinDate: "June 2021",
      sales: 203,
      rating: 4.8,
    },
    stats: {
      sales: 203,
      lastSold: "6 hours ago",
    },
    auctionLog: [
      { username: "@game_dev", amount: 95.0, timestamp: "45 mins ago", isLeading: true },
      { username: "@3d_enthusiast", amount: 93.5, timestamp: "2 hours ago" },
      { username: "@animator", amount: 92.0, timestamp: "3 hours ago" },
      { username: "@indie_studio", amount: 90.25, timestamp: "5 hours ago" },
    ],
  },
]

export function getProductById(id) {
  return products.find((product) => product.id === id) || null
}

export function getRelatedProducts(id, limit = 4) {
  // Get the current product
  const currentProduct = getProductById(id)

  // If product is not found or is a fixed-price product, return empty array
  if (!currentProduct || currentProduct.bid === null) return []

  // Find products in the same category, excluding the current product
  const relatedByCategory = products.filter(
    (product) => product.id !== id && product.category === currentProduct.category,
  )

  // If we don't have enough related products by category, add some random products
  let result = [...relatedByCategory]

  if (result.length < limit) {
    const randomProducts = products
      .filter((product) => product.id !== id && !relatedByCategory.some((p) => p.id === product.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, limit - result.length)

    result = [...result, ...randomProducts]
  }

  // Return only the requested number of products
  return result.slice(0, limit)
}

