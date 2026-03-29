import { APIDocsComponent } from '../api-docs-component';

export const metadata = {
  title: 'API Documentation',
  description: 'Complete API documentation for UEFN DevKit with all endpoints across Enterprise and Premium tiers.',
};

export default function APIDocsPage() {
  return <APIDocsComponent initialTier="all" />;
}
