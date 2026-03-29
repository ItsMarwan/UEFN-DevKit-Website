import { APIDocsComponent } from '../api-docs-component';

export const metadata = {
  title: 'Premium API Documentation',
  description: 'Premium API endpoints for UEFN DevKit including Island Lookup, Predictions, and Seller Management.',
};

export default function PremiumAPIDocsPage() {
  return <APIDocsComponent initialTier="premium" />;
}
