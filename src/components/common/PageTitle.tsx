import { Helmet } from 'react-helmet-async';

/** Sets the browser tab title to "<title> | Social Media App". One per page; the last mounted wins. */
export function PageTitle({ title }: { title: string }) {
  return (
    <Helmet>
      <title>{`${title} | Social Media App`}</title>
    </Helmet>
  );
}
