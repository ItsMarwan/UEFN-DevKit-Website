import { APIDocsComponent } from '../api-docs-component';

export const metadata = {
  title: 'Enterprise API Documentation',
  description: 'Enterprise API endpoints for UEFN DevKit including customer management, configuration, files, reports, and more.',
};

export default function EnterpriseAPIDocsPage() {
  return <APIDocsComponent initialTier="enterprise" />;
}
