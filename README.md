## Mini CSS Extract Minimal Repro

This repository servers as a minimal reproduction of an error that occurs in Next that occurs around loading stylesheets with `next/dyanmic`.

### Background

The bug occurs under the following conditions on a production build (using the pages router)

1. User loads a page that contains a stylesheet which is loaded with a `data-n-p` tag because it is included for a component that was server side rendered. The style shows up correctly.
1. User clicks on a `Link` component from `next/link` which will use client-side navigation to load a second page.
1. The second page includes a component which is rendered via `next/dynamic` which also has a dependency on the stylesheet that is loaded from the first page.
1. The lazy component on the second page is missing the styles from the stylesheet 

### Repro Steps

```sh
$ npm run build && npm run start
```

1. Go to http://localhost:3000. Observe that the main component has `border` and `background-color` styles.
<img width="1499" alt="0826cf5b-ab21-4d48-8a95-775a6cef2d9e" src="https://github.com/copperwall/mini-css-nextjs-repro/assets/2539016/441b81ab-b567-4584-8766-5520699730af">

2. Click the `To other page` link to client-side navigate to http://localhost:3000/client-side-navigation. Observe that the styles on the page are no longer applied. The component on this page is a lazy version of the one on the previous page, so it should have the styles associated with its CSS Module applied to it.
<img width="1499" alt="35b3f760-0bba-4fd2-b649-1d10603eb545" src="https://github.com/copperwall/mini-css-nextjs-repro/assets/2539016/a4c2bb35-e5f3-4a19-9836-e046beb40b1c">

3. Navigate to http://localhost:3000/client-side-navigation directly, observe that the styles are showing up now.
<img width="1499" alt="05f202c9-b28e-4293-9543-cde0998d36e5" src="https://github.com/copperwall/mini-css-nextjs-repro/assets/2539016/3658913c-d939-474e-9f7c-db3f093d034f">


### Explanation

The __index__ page includes a component called `StyledBox`, which has a dependency on a CSS Module. The __client-side-navigation__ page has a dependency on `StyledBoxLazy`, which is `StyledBox` wrapped within `next/dyanmic`.

The stylesheet is initially included when loading the server-side rendered version of the __index__ page. Because the StyledBox component is not using `next/dyanmic` on the __index__ page, the stylesheet link tag has a `data-n-p` attribute.

When the user navigates to __client-side-navigation__ via clicking the `Link` component, the __client-side-navigation__ page renders `StyledBoxLazy`, which attempts to load the CSS chunk associated with `StyledBoxLazy`. In the webpack runtime chunk, `mini-css-extract-plugin` looks up the file path via the chunk/module id and first checks to see if there is a `link` tag with a `rel=stylesheet` and an `href` that matches the filepath for the stylesheet it needs to load. In this case it finds the stylesheet that was loaded via SSR on the initial __index__ pageload, and does not add an additional link tag for that stylesheet (because one already exists in the document). This happens in this section of the plugin https://github.com/webpack-contrib/mini-css-extract-plugin/blob/master/src/index.js#L924.

After the render phase for __client-side-navigation__ finishes, the [`onHeadCommit`](https://github.com/vercel/next.js/blob/9de7705c9919aae57b7e79794bf0c9c9e67636e0/packages/next/src/client/index.tsx#L706) method runs in a `useLayoutEffect` which cleans up all elements that match the `link[data-n-p]` selector here https://github.com/vercel/next.js/blob/9de7705c9919aae57b7e79794bf0c9c9e67636e0/packages/next/src/client/index.tsx#L760. This removes the stylesheet element that `mini-css-extract` had just assumed was going to be in the document, which results in the component that uses that stylesheet to be unstyled when the client-side navigation completes.

### Possible Fixes

1. `mini-css-extract-plugin` could be patched to not look for `link` tags with the `data-n-p` tag. This means that `mini-css-extract-plugin` would include another `link` tag, which would not be cleaned up via `onHeadCommit` when client-side navigation completes.
2. `mini-css-extract-plugin` could be patched to remove the `data-n-p` tag for any stylesheets that it looks up, which would stop the stylesheet from being removed by `onHeadCommit` when client-side navigation completes.
