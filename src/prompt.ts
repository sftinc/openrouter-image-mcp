export const promptDescription = `
Detailed text description of the image to generate or edit. Be specific about style, dimensions, colors, composition, and purpose.

## USE CASE 1: Logo Generation
Create logos from text/brand names. Always specify:
- The text/brand name to include
- Style (minimalist, modern, vintage, playful, corporate, hand-drawn)
- Color scheme (specific colors or "monochrome", "gradient")
- Background (transparent, white, dark, specific color)
- Icon/symbol if needed

Examples:
- "Create a minimalist logo for 'Apex Tech' with a geometric mountain peak icon, modern sans-serif font, blue (#0066CC) on transparent background, clean vector style"
- "Design a vintage coffee shop logo for 'Morning Brew' with a steaming cup icon, hand-drawn style, warm brown and cream colors, circular badge format"
- "Corporate logo for 'Nexus Financial' using the letter N as an abstract symbol, gradient from navy to teal, professional and trustworthy feel"

## USE CASE 2: Image Editing (requires input_image)
Transform or modify an existing image. Always specify:
- The exact change you want (style transfer, color adjustment, add/remove elements, recompose)
- Preserve what should stay the same
- Target style or effect

Examples:
- "Convert this photo to a professional pencil sketch, preserve the facial details and expression, high contrast black and white"
- "Remove the background and replace with a soft gradient from light blue to white, keep the product sharp and centered"
- "Apply a warm vintage film look with slight grain, boost the orange and teal tones, maintain the original composition"
- "Add dramatic storm clouds to the sky, darken the mood, keep the foreground subject well-lit"

## USE CASE 3: Stock Photos (Banners, Heroes, Social Media)
Create marketing/web images. Always specify:
- Exact dimensions or aspect ratio (16:9 hero, 1:1 square, 9:16 story, 1200x630 social)
- Purpose (website hero, social media post, email banner, ad creative)
- Subject and composition (left-aligned for text overlay, centered, rule of thirds)
- Mood and color palette
- Space for text overlay if needed

Examples:
- "Website hero banner, 16:9 aspect ratio, abstract tech background with flowing blue and purple gradients, dark theme, leave right side empty for headline text overlay"
- "Instagram square post, 1:1, flat lay of office supplies on marble surface, bright and airy, pastel colors, centered composition for text overlay"
- "Email banner 600x200, professional business team in modern office, warm lighting, friendly mood, blurred background, space on left for headline"
- "LinkedIn post 1200x627, minimalist geometric pattern in corporate blue, subtle texture, clean space in center for quote text"

## USE CASE 4: Website Layout Generation (requires input_image of existing website)
Generate new website designs inspired by a reference. Always specify:
- What to keep from the reference (layout structure, color scheme, style)
- What to change (content, imagery, branding)
- Target industry/purpose
- Specific sections needed (hero, features, testimonials, footer)

Examples:
- "Using this website layout as reference, create a new design for a fitness app: keep the hero section structure and card layout, change colors to energetic orange and dark gray, replace imagery with gym/workout photos, modern and motivational feel"
- "Redesign this e-commerce layout for a luxury jewelry brand: maintain the grid product layout, change to elegant black and gold color scheme, add more whitespace, sophisticated serif typography, high-end minimalist aesthetic"
- "Based on this SaaS website structure, create a design for a project management tool: keep the feature comparison section layout, use professional blue and white colors, add dashboard screenshot mockups, clean and trustworthy corporate style"

## USE CASE 5: Multi-Image Operations (requires input_images array)
Combine, compare, or reference multiple images. Always specify:
- The relationship between images (combine, compare, transfer style from one to another)
- What to extract or use from each image
- The desired output format

Examples:
- "Combine these two product photos into a single lifestyle image, place the first product on the left and the second on the right, unified lighting and background"
- "Transfer the color palette and mood from the first image to the composition of the second image"
- "Create a comparison image showing these design variations side by side with labels"
- "Use the first image as a style reference and apply that artistic style to the scene in the second image"
`.trim()
