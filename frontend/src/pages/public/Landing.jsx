import { useEffect, useState } from 'react';
import {
  Search,
  MousePointerClick,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Receipt
} from 'lucide-react';
import PublicShell from '../../components/layout/PublicShell.jsx';
import GigCard from '../../components/gigs/GigCard.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import Button from '../../components/common/Button.jsx';
import { getGigs } from '../../services/gigService.js';
import './Landing.css';

// Static copy per the build reference - no backend data behind these.
const HOW_IT_WORKS_STEPS = [
  {
    icon: Search,
    title: 'Browse',
    description: 'Explore gigs across 8 categories from freelancers ready to help.'
  },
  {
    icon: MousePointerClick,
    title: 'Choose',
    description: 'Pick the service and freelancer that fits what you need.'
  },
  {
    icon: CreditCard,
    title: 'Book & Pay Deposit',
    description: 'Lock in your booking with a deposit, recorded as paid instantly.'
  },
  {
    icon: CheckCircle2,
    title: 'Get the Work Done',
    description: 'The remaining payment releases once the freelancer marks it complete.'
  }
];

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Secure Authentication',
    description: 'Passwords are hashed, and every session is protected by a signed token.'
  },
  {
    icon: Lock,
    title: 'Protected Bookings',
    description: 'Every booking is only ever visible to the client, freelancer, and admin involved.'
  },
  {
    icon: Receipt,
    title: 'Transparent Payments',
    description: 'Deposits and remaining payments are tracked as clear, auditable records.'
  }
];

function Landing() {
  const [featuredGigs, setFeaturedGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFeatured() {
      try {
        const gigs = await getGigs();
        if (!cancelled) {
          setFeaturedGigs(gigs.slice(0, 6));
        }
      } catch {
        // The featured section is a nice-to-have on the homepage, not
        // a critical path - if it fails to load, it's simply omitted
        // rather than showing a scary error state to an anonymous
        // visitor who hasn't even tried to do anything yet.
        if (!cancelled) {
          setFeaturedGigs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFeatured();

    if (window.location.hash === '#how-it-works') {
      const target = document.getElementById('how-it-works');
      target?.scrollIntoView({ behavior: 'smooth' });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicShell>
      <section className="landing-hero">
        <div className="container landing-hero-inner">
          <div className="landing-hero-copy">
            <h1>FIND TALENT. GET WORK DONE.</h1>
            <p>
              HustleHub+ connects clients with freelancers across software, design, writing, and
              more - with secure bookings and transparent payments.
            </p>
            <div className="landing-hero-actions">
              <Button to="/marketplace">Browse Gigs</Button>
              <Button to="/register" variant="secondary">
                Offer Your Services
              </Button>
            </div>
          </div>
          <div className="landing-hero-visual" aria-hidden="true">
            <div className="landing-hero-card landing-hero-card-1" />
            <div className="landing-hero-card landing-hero-card-2" />
            <div className="landing-hero-card landing-hero-card-3" />
          </div>
        </div>
      </section>

      <section className="container landing-section">
        <h2>Popular Services</h2>
        {loading && <LoadingSkeleton count={3} height={220} />}
        {!loading && featuredGigs.length > 0 && (
          <div className="landing-featured-grid">
            {featuredGigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}
      </section>

      <section id="how-it-works" className="container landing-section">
        <h2>How It Works</h2>
        <div className="landing-steps-grid">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div key={step.title} className="landing-step">
              <span className="landing-step-number">{index + 1}</span>
              <step.icon size={28} className="landing-step-icon" aria-hidden="true" />
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-trust">
        <div className="container landing-trust-inner">
          <h2>Built on a Secure Foundation</h2>
          <div className="landing-trust-grid">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="landing-trust-item">
                <point.icon size={24} className="landing-trust-icon" aria-hidden="true" />
                <h3>{point.title}</h3>
                <p>{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-final-cta">
        <div className="container landing-final-cta-inner">
          <h2>Ready to get started?</h2>
          <p>Join as a client to hire talent, or as a freelancer to offer your services.</p>
          <div className="landing-hero-actions">
            <Button to="/register">Create an Account</Button>
            <Button to="/marketplace" variant="secondary">
              Browse the Marketplace
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export default Landing;