import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import GigForm from '../../components/gigs/GigForm.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import { useToast } from '../../components/common/useToast.js';
import { createGig } from '../../services/gigService.js';

const EMPTY_GIG_VALUES = {
  title: '',
  description: '',
  category: '',
  price: '',
  depositAmount: ''
};

function CreateGig() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // GigForm validates and builds the payload, and shows any failure
  // under the right fields. All this page does is what happens on
  // SUCCESS. (freelancerId is never sent - the backend takes it from
  // the login token.)
  async function handleSubmit(data) {
    await createGig(data);
    showToast('Gig created. It is now live on the marketplace.', 'success');
    navigate('/freelancer/gigs');
  }

  return (
    <>
      <div className="page-breadcrumbs">
        <Breadcrumbs
          items={[{ label: 'My Gigs', to: '/freelancer/gigs' }, { label: 'Create Gig' }]}
        />
      </div>

      <PageHeader
        title="Create a Gig"
        subtitle="Describe your service and set your price and deposit."
      />

      <GigForm
        initialValues={EMPTY_GIG_VALUES}
        submitLabel="Create Gig"
        cancelTo="/freelancer/gigs"
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default CreateGig;