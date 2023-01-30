import { useMemo, useState } from 'react';
import DiscoveryWidgetReact, { DiscoveryOptions } from 'discovery-react/lib/DiscoveryWidgetReact';
import './App.css';

function App() {
  const [cnt, setCnt] = useState(0);
  const [version, doRerender] = useState(0);
  const [isMounted, toggleMount] = useState(true);

  const data = useMemo(() => ({ok: 123, cnt, code: () => { console.log ('code!'); }}), [cnt]);
  const options = useMemo<DiscoveryOptions>(() => ({
    apply: {
      defaultPage: (discovery) => {
        discovery.page.define("default", [
          {
            view: "page-header",
            content: [ 
              'h1:"ADO pipeline viewer prototype"',
              { view: 'table' }
            ],
          }
        ]);
      },
    },
    prepare: (data) => ({ ...data, afterPrepare: 333 }),
  }), []);

  return (
    <div className="App">
      <button onClick={() => setCnt(s => s+1)}>Cnt: {cnt}</button>
      <button onClick={() => doRerender(s => s+1)}>Rerender {version}</button>
      <button onClick={() => toggleMount(s => !s)}>{ isMounted? 'Unmount' : 'Mount'}</button>
      {isMounted &&
      (<DiscoveryWidgetReact data={data} options={options} containerProps={{ style: { border: Math.round(version / 10) +'px solid red'} }} />)}
    </div>
  );
}

export default App;
