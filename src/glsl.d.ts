declare module '*.glsl?raw' {
  const src: string;
  export default src;
}

declare module '*.glsl' {
  const src: string;
  export default src;
}
