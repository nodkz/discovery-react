import { useState } from 'react';
import DiscoveryWidgetReact from 'discovery-react/lib/DiscoveryWidgetReact';
import './App.css';

function App() {
  const [cnt, setCnt] = useState(0);

  return (
    <div className="App">
      <button onClick={() => setCnt(s => s+1)}>Cnt: {cnt}</button>
      <DiscoveryWidgetReact data={{ ok: 123, cnt }} options={{}} />
    </div>
  );
}

export default App;
