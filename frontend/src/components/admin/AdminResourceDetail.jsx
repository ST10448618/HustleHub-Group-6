import { SearchX } from 'lucide-react';
import PageHeader from '../layout/PageHeader.jsx';
import Breadcrumbs from '../common/Breadcrumbs.jsx';
import MetricCard from '../common/MetricCard.jsx';
import Button from '../common/Button.jsx';
import LoadingSkeleton from '../common/LoadingSkeleton.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import './AdminResourceDetail.css';

/**
 * ONE configurable detail page for every admin resource - the
 * counterpart of AdminResourceTable. It owns the loading / not-found
 * / error handling and the page frame; the page supplies the content
 * as configuration.
 *
 *   entityName   'User', 'Gig' ... used in the not-found text
 *   backTo / backLabel   where "not found" and the first breadcrumb go
 *   breadcrumbs  items for <Breadcrumbs />
 *   loading, error ({ message, status }), onRetry
 *   title, subtitle, actions     the page header
 *   tiles        [{ label, value }] - a row of big-number cards
 *   fields       [{ label, value }] - a labelled facts list
 *   children     anything extra, rendered below
 *
 * 404 / 400 (no such record) and 403 get a friendly page with a way
 * back; any other failure gets a Retry.
 */
function AdminResourceDetail({
  entityName,
  backTo,
  backLabel,
  breadcrumbs,
  loading,
  error,
  onRetry,
  title,
  subtitle,
  actions,
  tiles = [],
  fields = [],
  children
}) {
  if (loading) {
    return <LoadingSkeleton count={2} height={200} />;
  }

  if (error && [400, 403, 404].includes(error.status)) {
    return (
      <div className="card">
        <EmptyState
          icon={SearchX}
          title={`${entityName} not found`}
          description={
            error.status === 403
              ? `You don't have access to this ${entityName.toLowerCase()}.`
              : `This ${entityName.toLowerCase()} doesn't exist.`
          }
          action={<Button to={backTo}>{backLabel}</Button>}
        />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={onRetry} />;
  }

  return (
    <>
      <div className="page-breadcrumbs">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <PageHeader title={title} subtitle={subtitle} actions={actions} />

      <div className="admin-detail">
        {tiles.length > 0 && (
          <div className="admin-detail-tiles">
            {tiles.map((tile) => (
              <MetricCard key={tile.label} label={tile.label} value={tile.value} />
            ))}
          </div>
        )}

        {fields.length > 0 && (
          <section className="card admin-detail-card">
            <dl className="admin-detail-fields">
              {fields.map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {children}
      </div>
    </>
  );
}

export default AdminResourceDetail;