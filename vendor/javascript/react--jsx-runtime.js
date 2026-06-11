// react/jsx-runtime@19.2.7 downloaded from https://ga.jspm.io/npm:react@19.2.7/jsx-runtime.js

var e={},t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.fragment`);function r(e,n,r){var i=null;if(r!==void 0&&(i=``+r),n.key!==void 0&&(i=``+n.key),`key`in n)for(var a in r={},n)a!==`key`&&(r[a]=n[a]);else r=n;return n=r.ref,{$$typeof:t,type:e,key:i,ref:n===void 0?null:n,props:r}}e.Fragment=n,e.jsx=r,e.jsxs=r;const i=e.Fragment,a=e.jsx,o=e.jsxs;export{i as Fragment,e as default,a as jsx,o as jsxs};

