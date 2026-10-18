import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { PageTitle } from '../../components/common/PageTitle';
import { LogoMark } from '../../components/common/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <PageTitle title="Page Not Found" />
      <LogoMark className="h-14 w-14" />
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link to="/">
        <Button>Go to home</Button>
      </Link>
    </div>
  );
}
