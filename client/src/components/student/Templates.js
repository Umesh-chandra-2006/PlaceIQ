import JakesTemplate from './JakesTemplate';
import ModernMinimalist from './ModernMinimalist';

export const templates = {
  jakes: {
    id: 'jakes',
    name: "Jake's Resume Design",
    component: JakesTemplate,
    description: "Classic CS-style serif single-column template optimized for technical recruiters.",
    thumbnail: "🎓"
  },
  modern: {
    id: 'modern',
    name: "Modern Minimalist",
    component: ModernMinimalist,
    description: "Sleek sans-serif layout with blue accents, ideal for general software/web dev roles.",
    thumbnail: "✨"
  }
};
