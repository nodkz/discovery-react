import React, {
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef
} from 'react';
import type { MutableRefObject } from 'react';
import { Widget } from '@discoveryjs/discovery/dist/discovery.js';

// TODO: fix when discovery will have typescript definitions
interface DiscoveryWidget {
  disposeDom: Function;
  setData(dta: any): void;
}; 

export interface Props {
  data: any;
  context?: Record<string, any>;
  containerProps?: Record<string, any>;
  options: Record<string, any>;
}

export interface RefMethods {
  discovery: DiscoveryWidget | undefined;
  containerRef: MutableRefObject<HTMLDivElement>;
}

// React currently throws a warning when using `useLayoutEffect` on the server.
// To get around it, we can conditionally `useEffect` on the server (no-op) and
// `useLayoutEffect` in the browser. We need `useLayoutEffect` to ensure the
// `Discovery` ref is available in the layout phase. This makes it available
// in a parent component's `componentDidMount`.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const DiscoveryWidgetReact = forwardRef<RefMethods, Props>(
  function DiscoveryWidgetReact(props, ref) {
    const containerRef = useRef() as React.MutableRefObject<HTMLDivElement>;
    const discoveryRef = useRef<DiscoveryWidget>();

    // Create Discovery widget or update existed
    useIsomorphicLayoutEffect(() => {
      const discoveryContext = props.context || {
        name: 'Discovery report',
        settings: {},
        createdAt: new Date().toISOString()
    };

      if (!discoveryRef.current) {
        const opts = {
          container: containerRef.current,
          inspector: true,
          darkmode: "auto",
          styles: [{ type: "link", href: "https://cdn.jsdelivr.net/npm/@discoveryjs/discovery@1.0.0-beta.70/dist/discovery.css" }],
          ...props.options,
        };

        console.log("Create discovery");
        const discovery = new Widget(opts);
        discovery.setData(props.data, discoveryContext );
        discoveryRef.current = discovery;
      }  else {
        const discovery = discoveryRef.current;
        discovery.setData(props.data, discoveryContext);
        // TODO: put here options updates for existed discovery instance
      }
    }); 

    // Destroy DiscoveryJS instance if unmounting.
    useIsomorphicLayoutEffect(() => {
      console.log('unmount discovery');

      return () => {
        if (discoveryRef.current) {
          discoveryRef.current.disposeDom?.();
          discoveryRef.current = undefined;
        }
      };
    }, []);

    // Provide discovery methods via ref in the parent component 
    useImperativeHandle(
      ref,
      () => ({
        get discovery() {
          return discoveryRef.current;
        },
        containerRef,
      }), 
      []
    );

    console.log("render discovery container");

    // Create container for the DiscoveryJS
    return <div { ...props.containerProps } ref={ containerRef } />;
  }
);

export default memo(DiscoveryWidgetReact);