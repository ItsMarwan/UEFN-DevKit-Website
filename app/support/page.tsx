import { redirect } from 'next/navigation';

export default function SupportPage() {
  // Seamlessly redirect to the contact page with the technical support subject pre-selected
  redirect('/contact?subject=Technical+Support');
}