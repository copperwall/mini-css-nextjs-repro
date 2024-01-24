/** Add your relevant code here for the issue to reproduce */
import StyledBox from "../components/StyledBox";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <StyledBox />
      <Link href="/client_side_navigation">To other page</Link>
    </main>
  );
}
