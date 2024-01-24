import StyledBoxLazy from "../components/StyledBoxLazy";

// SSR page needs to have stylesheet A on it
// CSR page needs to have stylesheet A used by a lazy component

export default function ClientSideNavigation() {
  return (
    <main>
      <StyledBoxLazy />
    </main>
  );
}
