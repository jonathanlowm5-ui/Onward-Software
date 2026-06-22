import { HeroH, HeroSub, Card } from '../components/ui.jsx';

// Mirrors the original goView() fallback for views without a builder yet.
export default function ComingSoon({ title = 'Module' }) {
  return (
    <>
      <HeroH>{title}</HeroH>
      <HeroSub>This module is ready for build-out.</HeroSub>
      <Card>Coming in next version.</Card>
    </>
  );
}
