import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency.js';
import CategoryIcon from './CategoryIcon.jsx';
import './GigCard.css';

/**
 * Hierarchy per the visual spec: service image (CategoryIcon, since
 * no image field exists) -> title -> gig.freelancer.name -> category
 * -> price (dominant) -> deposit (secondary) -> View Gig action.
 * gig.freelancer.name is used directly - the backend always includes
 * this nested object on every gig response, never a separate lookup.
 */
function GigCard({ gig }) {
  return (
    <Link to={`/gigs/${gig.id}`} className="gig-card card">
      <CategoryIcon category={gig.category} size={32} />
      <div className="gig-card-body">
        <h3 className="gig-card-title">{gig.title}</h3>
        <p className="gig-card-freelancer">{gig.freelancer?.name}</p>
        <p className="gig-card-category">{gig.category}</p>
        <div className="gig-card-pricing">
          <span className="gig-card-price">{formatCurrency(gig.price)}</span>
          <span className="gig-card-deposit">{formatCurrency(gig.depositAmount)} deposit</span>
        </div>
      </div>
      <span className="gig-card-cta">View Gig</span>
    </Link>
  );
}

export default GigCard;