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

type DiscoveryTemplate = {
  view: string;
  content: any;
};

interface DiscoveryWidget {
  disposeDom: Function;
  setData(data: any, context: any): void;
  apply(extension: ExtendDiscoveryFn | Record<string, ExtendDiscoveryFn>): void;
  setPrepare(fn: PrepareFn): void;
  page: {
    define(name: string, content: Array<DiscoveryTemplate>): void,
  };
}; 

export interface Props {
  data: any;
  context?: Record<string, any>;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  options: DiscoveryOptions;
}

type PrepareFn = (data: any, helpers: PrepareHelpers) => unknown;
type ExtendDiscoveryFn = (discovery: DiscoveryWidget) => void;

type DiscoveryMarker = any;
type PrepareHelpers = {
  defineObjectMarker: (title: string, opts: Record<string, any>) => DiscoveryMarker,
  addQueryHelpers: (helpers: Record<string, (current: unknown, ...args: any) => unknown>) => void,
  addValueAnnotation: (expression: string) => void,
  query: (expression: string, data: unknown) => unknown
};

export type DiscoveryOptions = {
  inspector?: boolean;
  darkmode?: "auto" | string,
  darkmodePersistent?: boolean,
  styles?: Array<{ type: 'link', href: string }>,
  apply?: ExtendDiscoveryFn | Record<string, ExtendDiscoveryFn>,
  prepare?: PrepareFn;
  [key: string]: any,
};

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
      const context = props.context || {
        name: 'Discovery report',
        settings: {},
        createdAt: new Date().toISOString()
      };

      let discovery = discoveryRef.current;

      if (!discovery) {
        const opts = {
          container: containerRef.current,
          inspector: true,
          darkmode: "auto",
          darkmodePersistent: false,
          styles: [{ type: "link", href: "https://cdn.jsdelivr.net/npm/@discoveryjs/discovery@1.0.0-beta.70/dist/discovery.css" }],
          ...props.options,
        };

        discovery = new Widget(opts) as DiscoveryWidget;
        discoveryRef.current = discovery;
      } 
      
      if (props.options.apply) {
        discovery.apply(props.options.apply);
      }
      if (props.options.prepare) {
        discovery.setPrepare(props.options.prepare);
      }
      discovery.setData(props.data, context);
    }); 

    // Destroy DiscoveryJS instance if unmounting.
    useIsomorphicLayoutEffect(() => {
      return () => {
        if (discoveryRef.current) {
          discoveryRef.current.disposeDom?.();
          discoveryRef.current = undefined;
        }
      };
    }, []);

    // Provide discovery methods via ref to the parent component 
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

    // Create container for the DiscoveryJS
    return <div { ...props.containerProps } ref={ containerRef } />;
  }
);

export default memo(DiscoveryWidgetReact, (prevProps, nextProps) => {
  if (
    JSON.stringify(prevProps.containerProps) !== JSON.stringify(nextProps.containerProps) ||
    prevProps.data !== nextProps.data || 
    prevProps.context !== nextProps.context ||
    prevProps.options !== nextProps.options 
  ) {
    return false;
  }
  return true;
});
