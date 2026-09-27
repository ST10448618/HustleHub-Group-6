import { Code2, Palette, Camera, PenTool, Megaphone, Video, Briefcase, Sparkles } from 'lucide-react';
import './CategoryIcon.css';

const CATEGORY_ICONS = {
  Software: Code2,
  Design: Palette,
  Photography: Camera,
  Writing: PenTool,
  Marketing: Megaphone,
  Video,
  Business: Briefcase,
  Other: Sparkles
};

/**
 * Stands in for a gig photo, since no image field exists anywhere on
 * the Gig model in this backend (see the data model reference). Maps
 * each of the 8 fixed categories to a distinct Lucide icon on a
 * primary-tinted tile - used on GigCard and Gig Details.
 */
function CategoryIcon({ category, size = 24 }) {
  const Icon = CATEGORY_ICONS[category] || Sparkles;
  return (
    <span className="category-icon" aria-hidden="true">
      <Icon size={size} />
    </span>
  );
}

export default CategoryIcon;