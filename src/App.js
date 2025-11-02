import React from 'react';
import SuperAdminDashboard from './SuperAdminDashboard';
import SuperAdminLogin from './SuperAdminLogin';

function App() {
  const [route, setRoute] = React.useState(window.location.hash || '#/su/login');

  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/su/login');
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) window.location.hash = '#/sukwekurhwelgh/login';
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route === '#/su/login') return <SuperAdminLogin />;
  return <SuperAdminDashboard />;
}

export default App;
