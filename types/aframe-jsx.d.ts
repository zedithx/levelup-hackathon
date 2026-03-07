import type { DetailedHTMLProps, HTMLAttributes } from "react";

type AFrameElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  [attribute: string]: unknown;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "a-scene": AFrameElementProps;
      "a-assets": AFrameElementProps;
      "a-asset-item": AFrameElementProps;
      "a-camera": AFrameElementProps;
      "a-entity": AFrameElementProps;
      "a-plane": AFrameElementProps;
      "a-text": AFrameElementProps;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "a-scene": AFrameElementProps;
      "a-assets": AFrameElementProps;
      "a-asset-item": AFrameElementProps;
      "a-camera": AFrameElementProps;
      "a-entity": AFrameElementProps;
      "a-plane": AFrameElementProps;
      "a-text": AFrameElementProps;
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "a-scene": AFrameElementProps;
      "a-assets": AFrameElementProps;
      "a-asset-item": AFrameElementProps;
      "a-camera": AFrameElementProps;
      "a-entity": AFrameElementProps;
      "a-plane": AFrameElementProps;
      "a-text": AFrameElementProps;
    }
  }
}

export {};
