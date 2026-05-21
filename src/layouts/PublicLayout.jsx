import { Outlet } from 'react-router-dom';

const PublicLayout = () => (
  <main className="min-h-screen">
    <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center px-4 py-10">
      <Outlet />
    </div>
  </main>
);

export default PublicLayout;
